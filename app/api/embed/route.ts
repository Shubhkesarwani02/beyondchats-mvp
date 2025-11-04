import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBatchEmbeddings, formatVectorForDB } from '@/lib/embeddings';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { pdfId, chunkIds } = await request.json();
    
    if (!pdfId) {
      return NextResponse.json(
        { error: 'PDF ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get chunks that need embeddings
    let chunks;
    if (chunkIds && chunkIds.length > 0) {
      // Generate embeddings for specific chunks
      chunks = await prisma.$queryRaw<Array<{id: string, content: string}>>`
        SELECT id, content FROM "Chunk" 
        WHERE id = ANY(${chunkIds}) 
        AND "pdfId" = ${pdfId} 
        AND embedding IS NULL
      `;
    } else {
      // Generate embeddings for all chunks without embeddings for this PDF
      chunks = await prisma.$queryRaw<Array<{id: string, content: string}>>`
        SELECT id, content FROM "Chunk" 
        WHERE "pdfId" = ${pdfId} 
        AND embedding IS NULL
      `;
    }

    if (chunks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No chunks found that need embeddings',
        processedCount: 0,
      }, { headers: corsHeaders });
    }

    // Extract text content for embedding generation
    const texts = chunks.map(chunk => chunk.content);
    
    // Generate embeddings in batches
    console.log(`Generating embeddings for ${chunks.length} chunks...`);
    const embeddings = await generateBatchEmbeddings(texts);
    
    // Update chunks with embeddings in database
    const updatePromises = chunks.map((chunk, index) => {
      const vectorString = formatVectorForDB(embeddings[index]);
      
      return prisma.$executeRaw`
        UPDATE "Chunk" 
        SET embedding = ${vectorString}::vector 
        WHERE id = ${chunk.id}
      `;
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Successfully generated embeddings for ${chunks.length} chunks`,
      processedCount: chunks.length,
      pdfId: pdfId,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate embeddings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET endpoint to check embedding status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pdfId = searchParams.get('pdfId');
    
    if (!pdfId) {
      return NextResponse.json(
        { error: 'PDF ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get embedding statistics for the PDF
    const totalChunks = await prisma.chunk.count({
      where: { pdfId: pdfId },
    });

    const embeddedChunks = await prisma.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count FROM "Chunk" 
      WHERE "pdfId" = ${pdfId} 
      AND embedding IS NOT NULL
    `;

    const embeddedCount = Number(embeddedChunks[0]?.count || 0);

    const pendingChunks = totalChunks - embeddedCount;

    return NextResponse.json({
      pdfId: pdfId,
      totalChunks: totalChunks,
      embeddedChunks: embeddedCount,
      pendingChunks: pendingChunks,
      isComplete: pendingChunks === 0,
      completionPercentage: totalChunks > 0 ? Math.round((embeddedCount / totalChunks) * 100) : 0,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error checking embedding status:', error);
    return NextResponse.json(
      { error: 'Failed to check embedding status' },
      { status: 500, headers: corsHeaders }
    );
  }
}