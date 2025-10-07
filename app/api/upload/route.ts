import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';
import { pdf } from 'pdf-parse';
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

async function processChunksAndEmbeddings(pdfId: string, filePath: string) {
  try {
    console.log(`Processing chunks and embeddings for PDF: ${pdfId}`);
    
    // Read and parse the PDF file
    const dataBuffer = await readFile(filePath);
    const pdfData = await pdf(dataBuffer);
    const text = pdfData.text;
    
    if (!text.trim()) {
      console.warn('No text found in PDF');
      return { success: false, error: 'No text found in PDF' };
    }

    // Create chunks with sliding window
    const chunks = createChunks(text, 1000, 200);
    console.log(`Created ${chunks.length} chunks`);
    
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

    console.log('Chunks saved to database, generating embeddings...');

    // Generate embeddings for all chunks
    try {
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
      
      return { 
        success: true, 
        chunksCount: savedChunks.length,
        message: `Successfully created ${savedChunks.length} chunks with embeddings`
      };
    } catch (embeddingError) {
      console.error('Error generating embeddings:', embeddingError);
      return { 
        success: true, 
        chunksCount: savedChunks.length,
        message: `Created ${savedChunks.length} chunks, but failed to generate embeddings`,
        warning: 'Embeddings can be generated later'
      };
    }
  } catch (error) {
    console.error('Error processing chunks:', error);
    return { success: false, error: 'Failed to process chunks' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = path.join(process.cwd(), 'public', 'uploads', filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save PDF metadata to database
    const pdf = await prisma.pDF.create({
      data: {
        title: file.name,
        url: `/uploads/${filename}`,
      },
    });

    console.log(`PDF uploaded: ${pdf.id}, starting chunk processing...`);

    // Automatically process chunks and embeddings
    const processingResult = await processChunksAndEmbeddings(pdf.id, filepath);

    return NextResponse.json({
      success: true,
      pdfId: pdf.id,
      filename,
      title: file.name,
      message: 'File uploaded successfully',
      processing: processingResult,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}