import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile, access } from 'fs/promises';
import path from 'path';
import { constants } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const download = url.searchParams.get('download') === 'true';

    console.log(`PDF API called with ID: ${id}, download: ${download}`);

    const pdf = await prisma.pDF.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        url: true,
        createdAt: true
      }
    });

    if (!pdf) {
      console.log(`PDF not found for ID: ${id}`);
      return NextResponse.json(
        { error: 'PDF not found' },
        { status: 404 }
      );
    }

    console.log(`PDF found: ${pdf.title}, URL: ${pdf.url}`);

    // If download parameter is true, serve the PDF file
    if (download) {
      try {
        // Check if URL is already a full URL (cloud storage)
        if (pdf.url.startsWith('http://') || pdf.url.startsWith('https://')) {
          console.log(`Redirecting to external URL: ${pdf.url}`);
          // For cloud storage URLs, redirect to the actual file
          return NextResponse.redirect(pdf.url);
        }

        // Local filesystem approach (for development)
        // Extract filename from URL (assuming URL format like /uploads/filename.pdf)
        const filename = pdf.url.split('/').pop();
        console.log(`Attempting to serve file: ${filename}`);
        
        if (filename) {
          const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
          console.log(`File path: ${filePath}`);
          
          // Check if file exists
          try {
            await access(filePath, constants.R_OK);
          } catch (accessError) {
            console.error('File not accessible:', accessError);
            // In production, if file doesn't exist locally, try serving from public URL
            const publicUrl = `${url.origin}${pdf.url}`;
            console.log(`File not found locally, trying public URL: ${publicUrl}`);
            return NextResponse.redirect(publicUrl);
          }
          
          const fileBuffer = await readFile(filePath);
          console.log(`File read successfully, size: ${fileBuffer.length} bytes`);
          
          return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${encodeURIComponent(pdf.title)}.pdf"`,
              'Cache-Control': 'public, max-age=31536000',
              'Accept-Ranges': 'bytes',
            },
          });
        } else {
          throw new Error('Invalid filename in PDF URL');
        }
      } catch (fileError) {
        console.error('Error reading PDF file:', fileError);
        return NextResponse.json(
          { 
            error: 'Failed to read PDF file', 
            details: fileError instanceof Error ? fileError.message : 'Unknown error',
            hint: 'In production, consider using cloud storage (S3, Cloudflare R2, etc.)'
          },
          { status: 500 }
        );
      }
    }

    // Default: return PDF metadata as JSON
    console.log(`Returning PDF metadata for: ${pdf.title}`);
    return NextResponse.json({
      success: true,
      pdf
    });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Add explicit OPTIONS handler to prevent 405 errors
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}