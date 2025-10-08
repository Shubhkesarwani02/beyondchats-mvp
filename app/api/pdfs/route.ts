import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const pdfs = await prisma.pDF.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        fileSize: true,
        mimeType: true,
        chunks: {
          select: {
            id: true
          }
        }
      }
    });

    // Transform to include processing status
    // Use database storage - construct URL to API endpoint instead of file path
    const pdfsWithStatus = pdfs.map(pdf => ({
      id: pdf.id,
      title: pdf.title,
      url: `/api/pdf/${pdf.id}?download=true`, // URL to retrieve PDF from database
      createdAt: pdf.createdAt,
      hasChunks: pdf.chunks.length > 0,
      chunksCount: pdf.chunks.length,
      fileSize: pdf.fileSize,
      mimeType: pdf.mimeType
    }));

    return NextResponse.json({
      success: true,
      pdfs: pdfsWithStatus
    });
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch PDFs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}