import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askGemini } from '@/lib/gemini';

interface GenerateQuizRequest {
  title: string;
  pdfIds: string[];
  chunks?: string[];
  num_mcq: number;
  num_saq: number;
  num_laq: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizQuestion {
  id: string;
  type: 'mcq' | 'saq' | 'laq';
  stem: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  source?: Array<{ pdfId: string; page: number; snippet: string }>;
  maxScore: number;
  expectedAnswer?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateQuizRequest = await req.json();
    const { title, pdfIds, chunks = [], num_mcq = 6, num_saq = 3, num_laq = 1, difficulty = 'medium' } = body;

    // Fetch chunks from the specified PDFs if chunks not provided
    let sourceChunks: string[] = chunks;
    if (sourceChunks.length === 0 && pdfIds.length > 0) {
      const pdfChunks = await prisma.chunk.findMany({
        where: {
          pdfId: {
            in: pdfIds
          }
        },
        select: {
          content: true,
          pageNum: true,
          pdfId: true
        },
        take: 20 // Limit chunks to avoid token limits
      });
      
      sourceChunks = pdfChunks.map(chunk => 
        `[PDF: ${chunk.pdfId}, Page: ${chunk.pageNum}]\n${chunk.content}`
      );
    }

    if (sourceChunks.length === 0) {
      return NextResponse.json(
        { error: 'No source content found for the specified PDFs' },
        { status: 400 }
      );
    }

    // Build the prompt template
    const prompt = `
You are an expert exam question generator. Given the following source chunks from educational documents,
generate a quiz with ${num_mcq} MCQs, ${num_saq} SAQs, and ${num_laq} LAQs.

Difficulty level: ${difficulty}

Return ONLY valid JSON with this exact schema:
{
  "title": "${title}",
  "questions": [
    {
      "id": "q1",
      "type": "mcq|saq|laq",
      "stem": "Question text here...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct...",
      "source": [{"pdfId": "pdf_id", "page": 12, "snippet": "relevant text..."}],
      "maxScore": 4,
      "expectedAnswer": "For SAQ/LAQ only - the expected answer"
    }
  ]
}

Rules for question generation:
- MCQs: Must have exactly 4 options with one correct answer. Set correctIndex (0-3). maxScore: 4
- SAQs: Short answer questions requiring 1-3 sentences. Include expectedAnswer. maxScore: 4  
- LAQs: Long answer questions requiring 4-6 sentences. Include expectedAnswer. maxScore: 10
- All questions must include explanation and source information
- Vary question types within each category (factual, conceptual, analytical)
- Questions should test understanding, not just memorization
- Include page references and relevant snippets in source array

Source chunks:
${sourceChunks.join('\n\n---\n\n')}

Generate the quiz now. Return ONLY the JSON, no additional text or markdown.
    `.trim();

    // Call Gemini to generate the quiz
    const geminiResponse = await askGemini(prompt);
    
    // Parse the JSON response
    let quizData: { title: string; questions: QuizQuestion[] };
    try {
      // Try direct JSON parse first
      quizData = JSON.parse(geminiResponse);
    } catch {
      // Fallback: extract JSON from markdown or mixed content
      const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quizData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse valid JSON from Gemini response');
      }
    }

    // Validate the structure
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid quiz structure returned from Gemini');
    }

    // Create quiz in database
    const quiz = await prisma.quiz.create({
      data: {
        title: quizData.title || title,
        numMcq: num_mcq,
        numSaq: num_saq,
        numLaq: num_laq,
        metadata: {
          difficulty,
          sourceIds: pdfIds
        },
        pdfs: {
          connect: pdfIds.map(id => ({ id }))
        }
      }
    });

    // Create questions and options
    const createdQuestions = [];
    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      
      const question = await prisma.question.create({
        data: {
          quizId: quiz.id,
          qtype: q.type,
          stem: q.stem,
          expectedAnswer: q.expectedAnswer,
          maxScore: q.maxScore || (q.type === 'laq' ? 10 : 4),
          source: q.source,
          explanation: q.explanation,
          guidance: q.type !== 'mcq'
            ? {
                keywords: extractKeywords(q.expectedAnswer || ''),
                difficulty: difficulty
              }
            : undefined
        }
      });

      // Create MCQ options if applicable
      if (q.type === 'mcq' && q.options && q.correctIndex !== undefined) {
        for (let j = 0; j < q.options.length; j++) {
          await prisma.mcqOption.create({
            data: {
              questionId: question.id,
              optionIndex: j,
              text: q.options[j],
              isCorrect: j === q.correctIndex
            }
          });
        }
      }

      createdQuestions.push({
        ...question,
        options: q.options,
        correctIndex: q.correctIndex
      });
    }

    const response = {
      quizId: quiz.id,
      title: quiz.title,
      questions: createdQuestions
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

// Helper function to extract keywords for grading guidance
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // Simple keyword extraction - remove common words and extract meaningful terms
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))
    .slice(0, 10); // Take top 10 keywords
}