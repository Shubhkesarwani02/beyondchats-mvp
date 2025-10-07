import { NextRequest, NextResponse } from 'next/server';
import { askGemini } from '@/lib/gemini';

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

    // Simplified prompt for testing
    const prompt = `
Generate a quiz with ${num_mcq} MCQs, ${num_saq} SAQs, and ${num_laq} LAQs about artificial intelligence and machine learning.

Return ONLY this JSON format:
{
  "title": "${title}",
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "stem": "What is machine learning?",
      "options": ["A branch of AI", "A type of computer", "A programming language", "A database"],
      "correctIndex": 0,
      "explanation": "Machine learning is a subset of artificial intelligence.",
      "source": [{"pdfId": "${pdfIds[0]}", "page": 1, "snippet": "machine learning concepts"}],
      "maxScore": 4
    }
  ]
}

Return only the JSON, nothing else.`;

    // Call Gemini to generate the quiz
    const geminiResponse = await askGemini(prompt);
    
    // Parse the JSON response
    let quizData: { title: string; questions: any[] };
    try {
      // Clean the response - remove markdown code blocks and extra text
      let cleanResponse = geminiResponse.trim();
      
      // Remove markdown code block markers
      cleanResponse = cleanResponse.replace(/```json\s*/g, '');
      cleanResponse = cleanResponse.replace(/```\s*/g, '');
      
      // Find JSON content - look for the first { to last }
      const firstBrace = cleanResponse.indexOf('{');
      const lastBrace = cleanResponse.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1);
      }
      
      // Try to parse the JSON
      quizData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', geminiResponse);
      console.error('Parse error:', parseError);
      throw new Error(`Could not parse valid JSON from Gemini response. Raw response: ${geminiResponse.substring(0, 500)}...`);
    }

    // Return simplified response without database operations
    const response = {
      quizId: `quiz_${Date.now()}`,
      title: quizData.title || title,
      questions: quizData.questions || []
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