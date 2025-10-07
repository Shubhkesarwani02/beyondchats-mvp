import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            mcqOptions: {
              orderBy: {
                optionIndex: 'asc'
              }
            }
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Transform the data for frontend consumption
    const transformedQuiz = {
      id: quiz.id,
      title: quiz.title,
      questions: quiz.questions.map(q => ({
        id: q.id,
        type: q.qtype,
        stem: q.stem,
        maxScore: q.maxScore,
        options: q.qtype === 'mcq' ? q.mcqOptions.map(opt => opt.text) : undefined,
        explanation: q.explanation,
        source: q.source
      }))
    };

    return NextResponse.json({
      success: true,
      quiz: transformedQuiz
    });

  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}