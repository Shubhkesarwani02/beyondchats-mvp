import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      quizzes: quizzes.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        createdAt: quiz.createdAt,
        questionCount: quiz._count.questions,
        attemptCount: quiz._count.attempts,
        numMcq: quiz.numMcq,
        numSaq: quiz.numSaq,
        numLaq: quiz.numLaq,
        metadata: quiz.metadata
      }))
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch quizzes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}