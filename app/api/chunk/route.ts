import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pdf } from 'pdf-parse';
import { readFile } from 'fs/promises';
import path from 'path';
import { generateBatchEmbeddings, formatVectorForDB } from '@/lib/embeddings';

interface ChunkData {
  content: string;
  pageNum: number;
}

// Function to split text into overlapping chunks
function createChunks(text: string, chunkSize: number = 1000, overlap: number = 200): ChunkData[] {
  const chunks: ChunkData[] = [];
  const lines = text.split('\n');
  let currentChunk = '';
  let currentPage = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line indicates a new page (simple heuristic)
    if (line.includes('Page ') || line.trim() === '' && currentChunk.length > chunkSize) {
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          pageNum: currentPage
        });
        
        // Create overlap for next chunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 5)); // Approximate overlap
        currentChunk = overlapWords.join(' ') + ' ';
        currentPage++;
      } else {
        currentChunk = '';
      }
    }
    
    currentChunk += line + '\n';
    
    // If chunk gets too large, split it
    if (currentChunk.length >= chunkSize) {
      chunks.push({
        content: currentChunk.trim(),
        pageNum: currentPage
      });
      
      // Create overlap
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(' ') + ' ';
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      pageNum: currentPage
    });
  }
  
  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    const { pdfId } = await request.json();
    
    if (!pdfId) {
      return NextResponse.json(
        { error: 'PDF ID is required' },
        { status: 400 }
      );
    }

    // Get PDF from database
    const pdfRecord = await prisma.pDF.findUnique({
      where: { id: pdfId },
    });

    if (!pdfRecord) {
      return NextResponse.json(
        { error: 'PDF not found' },
        { status: 404 }
      );
    }

    // Read the PDF file
    const filePath = path.join(process.cwd(), 'public', pdfRecord.url);
    const dataBuffer = await readFile(filePath);
    
    // Parse PDF and extract text
    const pdfData = await pdf(dataBuffer);
    const text = pdfData.text;
    
    if (!text.trim()) {
      return NextResponse.json(
        { error: 'No text found in PDF' },
        { status: 400 }
      );
    }

    // Create chunks with sliding window
    const chunks = createChunks(text, 1000, 200);
    
    // Save chunks to database first
    const savedChunks = await Promise.all(
      chunks.map((chunk) =>
        prisma.chunk.create({
          data: {
            content: chunk.content,
            pageNum: chunk.pageNum,
            pdfId: pdfId,
          },
        })
      )
    );

    // Generate embeddings for all chunks
    try {
      console.log('Generating embeddings for chunks...');
      const chunkTexts = chunks.map(chunk => chunk.content);
      const embeddings = await generateBatchEmbeddings(chunkTexts);
      
      // Update chunks with embeddings
      const embeddingPromises = savedChunks.map((chunk, index) => {
        const vectorString = formatVectorForDB(embeddings[index]);
        
        return prisma.$executeRaw`
          UPDATE "Chunk" 
          SET embedding = ${vectorString}::vector 
          WHERE id = ${chunk.id}
        `;
      });

      await Promise.all(embeddingPromises);
      console.log('Successfully generated embeddings for all chunks');
    } catch (embeddingError) {
      console.error('Error generating embeddings:', embeddingError);
      // Continue without embeddings - they can be generated later via /api/embed
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${savedChunks.length} chunks with embeddings`,
      chunksCount: savedChunks.length,
      pdfTitle: pdfRecord.title,
    });
  } catch (error) {
    console.error('Chunking error:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF chunks' },
      { status: 500 }
    );
  }
}