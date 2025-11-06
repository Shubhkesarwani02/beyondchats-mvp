import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBatchEmbeddings, formatVectorForDB } from '@/lib/embeddings';

// CRITICAL: Dynamic import to avoid worker issues in serverless
// Must be done this way to prevent worker initialization

export const runtime = 'nodejs';
export const maxDuration = 60; // Increased for PDF processing - adjust based on your plan
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface ChunkData {
  content: string;
  pageNum: number;
}

/**
 * Create chunks from text with overlap for better context preservation
 * @param text - The full text to chunk
 * @param chunkSize - Target size for each chunk (in characters)
 * @param overlap - Number of characters to overlap between chunks
 */
function createChunks(text: string, chunkSize: number = 1000, overlap: number = 200): ChunkData[] {
  const chunks: ChunkData[] = [];
  const pages = text.split(/\f/); // Split by form feed character (page break)
  
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const pageText = pages[pageIndex].trim();
    if (!pageText) continue;
    
    const pageNum = pageIndex + 1;
    
    // If the page is smaller than chunk size, use it as is
    if (pageText.length <= chunkSize) {
      chunks.push({ content: pageText, pageNum });
      continue;
    }
    
    // Split large pages into chunks with overlap
    let startIndex = 0;
    while (startIndex < pageText.length) {
      const endIndex = Math.min(startIndex + chunkSize, pageText.length);
      let chunkText = pageText.slice(startIndex, endIndex);
      
      // Try to break at sentence boundary
      if (endIndex < pageText.length) {
        const lastPeriod = chunkText.lastIndexOf('. ');
        const lastNewline = chunkText.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > chunkSize * 0.5) {
          chunkText = chunkText.slice(0, breakPoint + 1).trim();
        }
      }
      
      chunks.push({ content: chunkText, pageNum });
      
      // Move start index forward, accounting for overlap
      startIndex += chunkText.length - overlap;
      if (startIndex >= pageText.length) break;
    }
  }
  
  return chunks.filter(chunk => chunk.content.length > 50); // Filter out very small chunks
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('📦 Chunk API called');

    const { pdfId } = await request.json();
    if (!pdfId) {
      return NextResponse.json({ error: 'PDF ID is required' }, { status: 400, headers: corsHeaders });
    }

    // Fetch PDF record
    const pdfRecord = await prisma.pDF.findUnique({
      where: { id: pdfId },
      select: { id: true, title: true, fileData: true, url: true },
    });

    if (!pdfRecord) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404, headers: corsHeaders });
    }

    if (!pdfRecord.fileData) {
      return NextResponse.json(
        {
          error: 'PDF file data not found in database',
          hint: 'Re-upload the PDF.',
        },
        { status: 404, headers: corsHeaders }
      );
    }

    console.log(`📄 Processing PDF: ${pdfRecord.title}`);
    console.log(`📊 File size: ${pdfRecord.fileData.length} bytes`);

    // 🔹 Extract text using pdfjs-dist (serverless-compatible)
    let fullText = '';
    let pdfDoc;
    
    try {
      // Dynamic import to avoid worker initialization at module load time
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      
      // CRITICAL: Set a dummy worker path to prevent worker loading
      // PDF.js requires workerSrc to be a string, but won't actually try to load it
      // if we configure the document to not use workers
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.mjs';
      }
      
      // Convert Buffer to Uint8Array for pdfjs-dist
      const uint8Array = new Uint8Array(pdfRecord.fileData);
      
      // Load PDF document without worker
      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        disableAutoFetch: true,
        disableStream: true,
      });
      
      pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      console.log(`📄 PDF has ${numPages} pages`);

      // Extract text from each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdfDoc.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Concatenate text items with proper spacing
          const pageText = textContent.items
            .map((item) => {
              // Type guard for TextItem
              if ('str' in item && typeof item.str === 'string') {
                return item.str;
              }
              return '';
            })
            .join(' ');
          
          // Add form feed character for page break
          fullText += pageText + '\f';
          
          console.log(`✅ Processed page ${pageNum}/${numPages} (${pageText.length} chars)`);
        } catch (pageError) {
          console.error(`⚠️ Error processing page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }

      // Clean up PDF document
      await pdfDoc.destroy();
      
    } catch (pdfError) {
      console.error('❌ PDF parsing error:', pdfError);
      throw new Error(`Failed to parse PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
    }

    // Validate extracted text
    const cleanText = fullText.trim();
    if (!cleanText || cleanText.length < 10) {
      return NextResponse.json(
        { 
          error: 'No readable text found in PDF',
          hint: 'The PDF might be image-based or corrupted. Try a text-based PDF.',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`✅ Extracted ${cleanText.length} characters of text`);

    // Create chunks with proper overlap
    const chunks = createChunks(cleanText, 1000, 200);
    console.log(`📦 Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No chunks could be created from the PDF' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Save chunks to database
    console.log('💾 Saving chunks to database...');
    const savedChunks = await Promise.all(
      chunks.map((chunk) =>
        prisma.chunk.create({
          data: { 
            content: chunk.content, 
            pageNum: chunk.pageNum, 
            pdfId 
          },
        })
      )
    );

    console.log(`✅ Saved ${savedChunks.length} chunks`);

    // Generate embeddings in batches
    const BATCH_SIZE = 5; // Reduced for better reliability
    let processedCount = 0;
    let failedCount = 0;
    
    console.log('🔮 Generating embeddings...');

    for (let i = 0; i < savedChunks.length; i += BATCH_SIZE) {
      try {
        // Check if we're approaching timeout
        const elapsed = Date.now() - startTime;
        if (elapsed > 50000) { // 50 seconds (buffer for 60s limit)
          console.warn(`⚠️ Approaching timeout. Processed ${processedCount}/${savedChunks.length}`);
          break;
        }

        const batch = savedChunks.slice(i, i + BATCH_SIZE);
        const batchTexts = chunks.slice(i, i + BATCH_SIZE).map((chunk) => chunk.content);
        
        const embeddings = await generateBatchEmbeddings(batchTexts);
        
        // Update chunks with embeddings
        await Promise.all(
          batch.map((chunk, idx) =>
            prisma.$executeRaw`
              UPDATE "Chunk"
              SET embedding = ${formatVectorForDB(embeddings[idx])}::vector
              WHERE id = ${chunk.id}
            `
          )
        );
        
        processedCount += batch.length;
        console.log(`✅ Processed embeddings ${processedCount}/${savedChunks.length}`);
        
      } catch (batchError) {
        failedCount += Math.min(BATCH_SIZE, savedChunks.length - i);
        console.error(`❌ Batch ${i / BATCH_SIZE + 1} failed:`, batchError);
        // Continue with next batch
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`⏱️ Total processing time: ${(totalTime / 1000).toFixed(2)}s`);

    return NextResponse.json(
      {
        success: true,
        message: `Created ${savedChunks.length} chunks with ${processedCount} embeddings`,
        pdfTitle: pdfRecord.title,
        stats: {
          totalChunks: savedChunks.length,
          embeddingsGenerated: processedCount,
          embeddingsFailed: failedCount,
          processingTimeMs: totalTime,
          textExtracted: cleanText.length,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('❌ Chunking error:', error);
    console.error(`⏱️ Failed after ${(totalTime / 1000).toFixed(2)}s`);
    
    return NextResponse.json(
      {
        error: 'Failed to process PDF chunks',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: totalTime,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
