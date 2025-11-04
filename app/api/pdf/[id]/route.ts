import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const download = url.searchParams.get('download') === 'true';

    console.log(`PDF API called with ID: ${id}, download: ${download}`);

    // If download parameter is true, fetch with file data
    if (download) {
      const pdf = await prisma.pDF.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          fileData: true,
          mimeType: true,
        }
      });

      if (!pdf) {
        console.log(`PDF not found for ID: ${id}`);
        return NextResponse.json(
          { error: 'PDF not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // Check if PDF has file data in database
      if (pdf.fileData) {
        console.log(`Serving PDF from database: ${pdf.title}, size: ${pdf.fileData.length} bytes`);
        
        // Convert Buffer to Uint8Array for NextResponse
        const uint8Array = new Uint8Array(pdf.fileData);
        
        return new NextResponse(uint8Array, {
          headers: {
            'Content-Type': pdf.mimeType || 'application/pdf',
            'Content-Disposition': `inline; filename="${encodeURIComponent(pdf.title)}"`,
            'Cache-Control': 'public, max-age=31536000',
            'Accept-Ranges': 'bytes',
            'Content-Length': pdf.fileData.length.toString(),
            ...corsHeaders,
          },
        });
      } else {
        console.error(`PDF ${id} has no file data in database`);
        return NextResponse.json(
          { 
            error: 'PDF file data not found',
            hint: 'This PDF may have been uploaded before database storage was implemented'
          },
          { status: 404, headers: corsHeaders }
        );
      }
    }

    // Default: return PDF metadata as JSON (without file data)
    const pdf = await prisma.pDF.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        url: true,
        fileSize: true,
        mimeType: true,
        createdAt: true
      }
    });

    if (!pdf) {
      console.log(`PDF not found for ID: ${id}`);
      return NextResponse.json(
        { error: 'PDF not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    console.log(`Returning PDF metadata for: ${pdf.title}`);
    return NextResponse.json({
      success: true,
      pdf
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Add explicit OPTIONS handler to prevent 405 errors
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Allow': 'GET, OPTIONS',
    },
  });
}