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
        url: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      pdfs
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