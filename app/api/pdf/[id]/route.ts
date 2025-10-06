import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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