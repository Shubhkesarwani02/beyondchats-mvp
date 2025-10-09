import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pdf } from 'pdf-parse';
import { generateBatchEmbeddings, formatVectorForDB } from '@/lib/embeddings';

// Configure route segment for Vercel
export const runtime = 'nodejs';
export const maxDuration = 60; // Maximum execution time in seconds (for Pro plan)
export const dynamic = 'force-dynamic'; // Disable static optimization
// Increase body size limit for file uploads (Vercel has 4.5MB default for Hobby, 50MB for Pro)
export const bodyParser = false; // We'll handle formData parsing manually

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

async function processChunksAndEmbeddings(pdfId: string, buffer: Buffer) {
  try {
    console.log(`Processing chunks and embeddings for PDF: ${pdfId}`);
    
    // Parse the PDF buffer directly
    const pdfData = await pdf(buffer);
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
  console.log('📤 Upload API called');
  console.log('Method:', request.method);
  console.log('URL:', request.url);
  console.log('Content-Type:', request.headers.get('content-type'));
  
  try {
    // Parse form data with error handling
    let formData: FormData;
    try {
      formData = await request.formData();
      console.log('✅ FormData parsed successfully');
    } catch (formDataError) {
      console.error('❌ Failed to parse FormData:', formDataError);
      return NextResponse.json(
        { 
          error: 'Failed to parse form data',
          details: formDataError instanceof Error ? formDataError.message : 'Unknown error',
          hint: 'This might be due to file size limits. Vercel Hobby has 4.5MB limit, Pro has 50MB limit.'
        },
        { status: 400 }
      );
    }
    
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('❌ No file in FormData');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log(`📄 File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    // Validate file type
    if (!file.type.includes('pdf')) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (e.g., 50MB limit to match Next.js config)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      console.error(`❌ File too large: ${file.size} bytes (max: ${MAX_FILE_SIZE})`);
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    console.log('🔄 Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log(`✅ Buffer created: ${buffer.length} bytes`);

    // Save PDF with file data directly to database
    console.log('💾 Saving to database...');
    const pdfRecord = await prisma.pDF.create({
      data: {
        title: file.name,
        url: '', // Empty string for DB-stored PDFs
        fileData: buffer,
        fileSize: file.size,
        mimeType: file.type || 'application/pdf',
      },
    });

    console.log(`✅ PDF saved to database with ID: ${pdfRecord.id}`);
    console.log('🔄 Starting chunk processing...');

    // Automatically process chunks and embeddings using the buffer
    const processingResult = await processChunksAndEmbeddings(pdfRecord.id, buffer);

    console.log('✅ Processing complete:', processingResult);

    return NextResponse.json({
      success: true,
      pdfId: pdfRecord.id,
      title: file.name,
      fileSize: file.size,
      message: 'File uploaded successfully to database',
      processing: processingResult,
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Add GET handler to prevent 405 errors
export async function GET() {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests with multipart/form-data'
    },
    { status: 405, headers: { 'Allow': 'POST, OPTIONS' } }
  );
}