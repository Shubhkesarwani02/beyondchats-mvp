import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
      return NextResponse.json(
        { error: 'PDF not found' },
        { status: 404 }
      );
    }

    // Always try to serve the PDF file content first
    try {
      // Extract filename from URL (assuming URL format like /uploads/filename.pdf)
      const filename = pdf.url.split('/').pop();
      if (filename) {
        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
        const fileBuffer = await readFile(filePath);
        
        return new NextResponse(new Uint8Array(fileBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${pdf.title}.pdf"`,
          },
        });
      }
    } catch (fileError) {
      console.error('Error reading PDF file:', fileError);
      // Fall back to returning metadata if file can't be read
    }

    // Default: return PDF metadata as JSON
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