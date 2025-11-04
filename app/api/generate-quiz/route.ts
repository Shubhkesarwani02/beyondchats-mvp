import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askGemini } from '@/lib/gemini';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface QuizQuestion {
  type: string;
  stem: string;
  options?: string[];
  correctIndex?: number;
  expectedAnswer?: string;
  explanation: string;
  pageReference?: number;
  difficulty?: string;
}

interface DatabaseQuestion {
  qtype: string;
  stem: string;
  explanation: string;
  source: Array<{ pdfId: string; page: number; snippet: string }>;
  maxScore: number;
  mcqOptions?: string[];
  correctOptionIndex?: number;
  expectedAnswer?: string;
}

async function generateQuizFromDocuments(pdfIds: string[], numMCQ: number, numSAQ: number, numLAQ: number) {
  try {
    // Get relevant chunks from the selected PDFs
    const chunks = await prisma.chunk.findMany({
      where: {
        pdfId: {
          in: pdfIds
        }
      },
      include: {
        pdf: {
          select: {
            title: true
          }
        }
      },
      take: 20, // Limit to avoid token overflow
      orderBy: {
        pageNum: 'asc'
      }
    });

    console.log(`Found ${chunks.length} chunks from selected documents`);
    
    if (chunks.length === 0) {
      throw new Error('No content found in the selected documents. Please ensure the documents have been processed and contain text.');
    }

    // Prepare context from chunks
    const contextText = chunks.map((chunk) => 
      `[Document: ${chunk.pdf.title} - Page ${chunk.pageNum}]\n${chunk.content}`
    ).join('\n\n---\n\n');

    console.log(`Context length: ${contextText.length} characters`);

    // Create quiz generation prompt
    const totalQuestions = numMCQ + numSAQ + numLAQ;
    const quizPrompt = `You are an expert educator creating a comprehensive quiz based on the provided document content. 

CONTENT TO ANALYZE:
${contextText}

QUIZ REQUIREMENTS:
- Create exactly ${totalQuestions} questions total:
  * ${numMCQ} Multiple Choice Questions (MCQ)
  * ${numSAQ} Short Answer Questions (SAQ) 
  * ${numLAQ} Long Answer Questions (LAQ)

RESPONSE FORMAT:
Return a valid JSON object with this exact structure:
{
  "questions": [
    {
      "type": "mcq",
      "stem": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct...",
      "pageReference": 1,
      "difficulty": "medium"
    },
    {
      "type": "saq",
      "stem": "Short answer question?",
      "expectedAnswer": "Brief expected answer",
      "explanation": "Explanation of the answer...",
      "pageReference": 2,
      "difficulty": "medium"
    },
    {
      "type": "laq", 
      "stem": "Long answer question requiring detailed response?",
      "expectedAnswer": "Detailed expected answer with multiple points",
      "explanation": "Rubric for evaluating the answer...",
      "pageReference": 3,
      "difficulty": "hard"
    }
  ]
}

QUALITY GUIDELINES:
- Questions should test understanding, not just memorization
- Use varied difficulty levels (easy, medium, hard)
- Reference specific pages when possible
- MCQ options should be plausible but clearly have one best answer
- Short answers should be 1-3 sentences
- Long answers should require 1-2 paragraphs
- Explanations should help students learn

Generate the quiz now:`;

    console.log('Generating quiz with AI...');
    const aiResponse = await askGemini(quizPrompt);
    
    // Parse the AI response
    let quizData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quizData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('AI generated invalid quiz format');
    }

    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('AI response missing questions array');
    }

    // Transform AI questions to database format
    const questionsData: DatabaseQuestion[] = quizData.questions.map((q: QuizQuestion) => ({
      qtype: q.type,
      stem: q.stem,
      explanation: q.explanation || '',
      source: [{
        pdfId: pdfIds[0], // Primary source
        page: q.pageReference || 1,
        snippet: q.stem.substring(0, 100) + '...'
      }],
      maxScore: q.type === 'mcq' ? 4 : q.type === 'saq' ? 6 : 10,
      mcqOptions: q.type === 'mcq' ? q.options : undefined,
      correctOptionIndex: q.type === 'mcq' ? q.correctIndex : undefined,
      expectedAnswer: q.type !== 'mcq' ? q.expectedAnswer : undefined
    }));

    return questionsData;

  } catch (error) {
    console.error('Error generating quiz from documents:', error);
    throw error;
  }
}

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

    console.log(`Generating quiz for PDFs: ${pdfIds.join(', ')}`);

    // Generate quiz questions from actual document content
    let questionsData;
    try {
      questionsData = await generateQuizFromDocuments(pdfIds, num_mcq, num_saq, num_laq);
    } catch (error) {
      console.error('Failed to generate quiz from documents:', error);
      return NextResponse.json(
        { error: 'Failed to generate quiz from document content. Please ensure the documents are properly processed.' },
        { status: 500 }
      );
    }

    // Save quiz to database
    const savedQuiz = await prisma.quiz.create({
      data: {
        title: title,
        questions: {
          create: questionsData.map((q: DatabaseQuestion) => ({
            qtype: q.qtype,
            stem: q.stem,
            explanation: q.explanation,
            source: q.source,
            maxScore: q.maxScore,
            mcqOptions: q.qtype === 'mcq' ? {
              create: q.mcqOptions?.map((option: string, optIndex: number) => ({
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