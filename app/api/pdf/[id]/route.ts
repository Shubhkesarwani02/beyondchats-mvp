import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import path from 'path';

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
        // Extract filename from URL (assuming URL format like /uploads/filename.pdf)
        const filename = pdf.url.split('/').pop();
        console.log(`Attempting to serve file: ${filename}`);
        
        if (filename) {
          const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
          console.log(`File path: ${filePath}`);
          
          const fileBuffer = await readFile(filePath);
          console.log(`File read successfully, size: ${fileBuffer.length} bytes`);
          
          return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${pdf.title}.pdf"`,
              'Cache-Control': 'public, max-age=31536000',
            },
          });
        }
      } catch (fileError) {
        console.error('Error reading PDF file:', fileError);
        return NextResponse.json(
          { error: 'Failed to read PDF file', details: fileError instanceof Error ? fileError.message : 'Unknown error' },
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