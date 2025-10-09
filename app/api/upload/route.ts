import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Route configuration for serverless deployment
// IMPORTANT: Vercel Hobby plan limits:
// - maxDuration: 10 seconds (cannot exceed)
// - memory: 1024MB (cannot exceed)
// - body size: 4.5MB
export const runtime = 'nodejs';
export const maxDuration = 10; // Vercel Hobby limit - DO NOT INCREASE
export const dynamic = 'force-dynamic';

// File size limit for Vercel Hobby plan
const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB - Vercel Hobby hard limit

export async function POST(request: NextRequest) {
  console.log('📤 Upload API called');
  console.log('Method:', request.method);
  console.log('URL:', request.url);
  console.log('Content-Type:', request.headers.get('content-type'));
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Validate environment variables
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not configured');
    return NextResponse.json(
      { 
        error: 'Server configuration error',
        details: 'Database connection not configured. Please check environment variables.',
      },
      { status: 500, headers: corsHeaders }
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY not configured - embeddings will be skipped');
  }
  
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
        { status: 400, headers: corsHeaders }
      );
    }
    
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('❌ No file in FormData');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`📄 File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    // Validate file type
    if (!file.type.includes('pdf')) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file size (e.g., 50MB limit to match Next.js config)
    // Note: Vercel Hobby has 4.5MB limit, Pro has 50MB limit
    if (file.size > MAX_FILE_SIZE) {
      console.error(`❌ File too large: ${file.size} bytes (max: ${MAX_FILE_SIZE})`);
      return NextResponse.json(
        { 
          error: `File too large. Maximum size is ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB for your current plan.`,
          hint: 'To increase limit, set MAX_FILE_SIZE environment variable (in bytes) or upgrade your hosting plan.'
        },
        { status: 413, headers: corsHeaders }
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
    
    // ⚠️ IMPORTANT: Do NOT process chunks inline for Vercel Hobby (10s timeout)
    // Instead, return immediately and let the client call /api/chunk endpoint
    console.log('✅ Upload complete. Client should call /api/chunk for processing.');

    return NextResponse.json({
      success: true,
      pdfId: pdfRecord.id,
      title: file.name,
      fileSize: file.size,
      message: 'File uploaded successfully. Processing chunks in next step...',
      needsProcessing: true, // Flag for client to call /api/chunk
    }, { headers: corsHeaders });
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
      { status: 500, headers: corsHeaders }
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