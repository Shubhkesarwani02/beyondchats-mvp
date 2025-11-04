import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pdf } from 'pdf-parse';
import { generateBatchEmbeddings, formatVectorForDB } from '@/lib/embeddings';

// Configure route segment for Vercel
export const runtime = 'nodejs';
export const maxDuration = 10; // Maximum execution time in seconds (Hobby plan limit)
export const dynamic = 'force-dynamic';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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
    console.log('📦 Chunk API called');
    console.log('Method:', request.method);
    console.log('URL:', request.url);
    
    const { pdfId } = await request.json();
    
    if (!pdfId) {
      return NextResponse.json(
        { error: 'PDF ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get PDF from database with file data
    const pdfRecord = await prisma.pDF.findUnique({
      where: { id: pdfId },
      select: {
        id: true,
        title: true,
        fileData: true,
        url: true,
      }
    });

    if (!pdfRecord) {
      return NextResponse.json(
        { error: 'PDF not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if PDF has file data in database
    if (!pdfRecord.fileData) {
      return NextResponse.json(
        { 
          error: 'PDF file data not found in database',
          hint: 'This PDF may have been uploaded before database storage was implemented. Please re-upload the PDF.'
        },
        { status: 404, headers: corsHeaders }
      );
    }

    console.log(`Processing chunks for PDF: ${pdfRecord.title}, size: ${pdfRecord.fileData.length} bytes`);
    
    // Parse PDF from database buffer
    const pdfData = await pdf(pdfRecord.fileData);
    const text = pdfData.text;
    
    if (!text.trim()) {
      return NextResponse.json(
        { error: 'No text found in PDF' },
        { status: 400, headers: corsHeaders }
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

    // Generate embeddings for chunks in smaller batches to avoid timeout
    // Vercel Hobby: 10s limit, so we limit batch processing
    try {
      console.log('Generating embeddings for chunks...');
      const chunkTexts = chunks.map(chunk => chunk.content);
      
      // Process in batches of 10 to avoid timeout
      const BATCH_SIZE = 10;
      let processedCount = 0;
      
      for (let i = 0; i < savedChunks.length; i += BATCH_SIZE) {
        const batch = savedChunks.slice(i, i + BATCH_SIZE);
        const batchTexts = chunkTexts.slice(i, i + BATCH_SIZE);
        
        try {
          const embeddings = await generateBatchEmbeddings(batchTexts);
          
          const embeddingPromises = batch.map((chunk, idx) => {
            const vectorString = formatVectorForDB(embeddings[idx]);
            return prisma.$executeRaw`
              UPDATE "Chunk" 
              SET embedding = ${vectorString}::vector 
              WHERE id = ${chunk.id}
            `;
          });

          await Promise.all(embeddingPromises);
          processedCount += batch.length;
          console.log(`Processed embeddings for ${processedCount}/${savedChunks.length} chunks`);
        } catch (batchError) {
          console.error(`Error processing batch ${i}-${i + BATCH_SIZE}:`, batchError);
          // Continue with next batch even if one fails
        }
      }
      
      console.log(`Successfully generated embeddings for ${processedCount}/${savedChunks.length} chunks`);
      
      return NextResponse.json({
        success: true,
        message: `Successfully created ${savedChunks.length} chunks (${processedCount} with embeddings)`,
        chunksCount: savedChunks.length,
        embeddingsCount: processedCount,
        pdfTitle: pdfRecord.title,
      }, { headers: corsHeaders });
    } catch (embeddingError) {
      console.error('Error generating embeddings:', embeddingError);
      // Return success anyway since chunks are created
      return NextResponse.json({
        success: true,
        message: `Successfully created ${savedChunks.length} chunks (embeddings can be generated later)`,
        chunksCount: savedChunks.length,
        embeddingsCount: 0,
        pdfTitle: pdfRecord.title,
        warning: 'Embeddings generation failed - use /api/embed to retry'
      }, { headers: corsHeaders });
    }
  } catch (error) {
    console.error('Chunking error:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF chunks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}