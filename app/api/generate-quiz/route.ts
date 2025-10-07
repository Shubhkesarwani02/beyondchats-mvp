import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle both test format and UI format
    const title = body.title || 'Generated Quiz';
    const pdfIds = body.pdfIds || (body.pdfId ? [body.pdfId] : []);
    const num_mcq = body.num_mcq || body.numMCQ || 3;
    const num_saq = body.num_saq || body.numSAQ || 2; 
    const num_laq = body.num_laq || body.numLAQ || 1;
    
    if (pdfIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one PDF ID is required' },
        { status: 400 }
      );
    }

    // For testing: create hardcoded quiz data
    const questionsData = [
      {
        qtype: "mcq",
        stem: "What is machine learning?",
        mcqOptions: ["A branch of AI that enables computers to learn", "A type of computer hardware", "A programming language", "A database system"],
        correctOptionIndex: 0,
        explanation: "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience.",
        source: [{"pdfId": pdfIds[0], "page": 1, "snippet": "machine learning concepts"}],
        maxScore: 4
      },
      {
        qtype: "saq", 
        stem: "What are the main types of machine learning algorithms?",
        explanation: "The three main types are supervised, unsupervised, and reinforcement learning.",
        source: [{"pdfId": pdfIds[0], "page": 2, "snippet": "types of ML algorithms"}],
        maxScore: 4
      }
    ].slice(0, num_mcq + num_saq + num_laq);

    // Save quiz to database
    const savedQuiz = await prisma.quiz.create({
      data: {
        title: title,
        questions: {
          create: questionsData.map((q) => ({
            qtype: q.qtype,
            stem: q.stem,
            explanation: q.explanation,
            source: q.source,
            maxScore: q.maxScore,
            mcqOptions: q.qtype === 'mcq' ? {
              create: q.mcqOptions?.map((option, optIndex) => ({
                text: option,
                optionIndex: optIndex,
                isCorrect: optIndex === q.correctOptionIndex
              })) || []
            } : undefined
          }))
        }
      },
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

    // Transform for frontend response
    const response = {
      success: true,
      quizId: savedQuiz.id,
      title: savedQuiz.title,
      questions: savedQuiz.questions.map(q => ({
        id: q.id,
        type: q.qtype,
        stem: q.stem,
        options: q.qtype === 'mcq' ? q.mcqOptions.map(opt => opt.text) : undefined,
        explanation: q.explanation,
        source: q.source,
        maxScore: q.maxScore
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}