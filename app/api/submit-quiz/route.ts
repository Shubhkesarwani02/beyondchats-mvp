import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askGemini } from '@/lib/gemini';

interface SubmitQuizRequest {
  quizId: string;
  userId: string;
  answers: Array<{
    questionId: string;
    type: 'mcq' | 'saq' | 'laq';
    selectedIndex?: number;
    text?: string;
  }>;
}

interface QuestionScore {
  questionId: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SubmitQuizRequest = await req.json();
    const { quizId, userId, answers } = body;

    // Fetch quiz with questions and options
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            mcqOptions: true
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

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        startedAt: new Date()
      }
    });

    let totalScore = 0;
    let maxScore = 0;
    const perQuestion: QuestionScore[] = [];

    // Grade each answer
    for (const answer of answers) {
      const question = quiz.questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      maxScore += question.maxScore;
      let score = 0;
      let feedback = '';

      if (question.qtype === 'mcq') {
        // Grade MCQ deterministically
        const correctOption = question.mcqOptions.find(opt => opt.isCorrect);
        const isCorrect = answer.selectedIndex === correctOption?.optionIndex;
        score = isCorrect ? question.maxScore : 0;
        feedback = isCorrect 
          ? 'Correct!' 
          : `Incorrect. ${question.explanation || 'The correct answer was option ' + (correctOption?.optionIndex ? correctOption.optionIndex + 1 : 'unknown')}`;
        
        totalScore += score;
      } else if (question.qtype === 'saq' || question.qtype === 'laq') {
        // Grade SAQ/LAQ using combination of keyword matching and LLM
        const studentAnswer = answer.text || '';
        
        // First try keyword-based scoring
        let keywordScore = 0;
        if (question.guidance && typeof question.guidance === 'object' && 'keywords' in question.guidance) {
          const keywords = (question.guidance.keywords as string[]) || [];
          const keywordMatches = keywords.filter(keyword => 
            studentAnswer.toLowerCase().includes(keyword.toLowerCase())
          ).length;
          keywordScore = Math.round((keywordMatches / Math.max(1, keywords.length)) * question.maxScore);
        }

        // Use LLM grading for better accuracy
        try {
          const gradePrompt = `
Grade this student answer on a scale of 0 to ${question.maxScore} (integer only). 
Respond with ONLY a JSON object in this exact format: {"score": <integer>, "feedback": "<brief feedback>"}

Question: ${question.stem}
Expected Answer: ${question.expectedAnswer || 'Use your best judgment'}
Student Answer: ${studentAnswer}

Grading Guidelines:
- Award partial credit for partially correct answers
- Consider completeness, accuracy, and relevance
- For ${question.qtype.toUpperCase()}: ${question.qtype === 'saq' ? 'Expect 1-3 sentences' : 'Expect 4-6 sentences with detailed explanation'}
- Be fair but maintain academic standards
- Maximum score is ${question.maxScore}

Return only the JSON object, no other text.
          `.trim();

          const llmResponse = await askGemini(gradePrompt);
          
          // Parse LLM response
          let llmGrade;
          try {
            // Extract JSON from response
            const jsonMatch = llmResponse.match(/\{[^}]*\}/);
            if (jsonMatch) {
              llmGrade = JSON.parse(jsonMatch[0]);
              score = Math.min(question.maxScore, Math.max(0, Number(llmGrade.score)));
              feedback = llmGrade.feedback || 'Graded by AI';
            } else {
              throw new Error('No JSON found in LLM response');
            }
          } catch (parseError) {
            console.warn('Failed to parse LLM grading response:', parseError);
            // Fallback to keyword scoring
            score = keywordScore;
            feedback = `Keyword-based grading: ${keywordScore}/${question.maxScore} (AI grading failed)`;
          }
        } catch (llmError) {
          console.warn('LLM grading failed:', llmError);
          // Fallback to keyword scoring
          score = keywordScore;
          feedback = `Keyword-based grading: ${keywordScore}/${question.maxScore}`;
        }

        totalScore += score;
      }

      // Store the answer and score
      await prisma.attemptAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: question.id,
          qtype: question.qtype,
          answerJson: answer.selectedIndex !== undefined 
            ? { selectedIndex: answer.selectedIndex }
            : { text: answer.text },
          score,
          maxScore: question.maxScore,
          feedback
        }
      });

      perQuestion.push({
        questionId: question.id,
        score,
        maxScore: question.maxScore,
        feedback
      });
    }

    // Update attempt with final scores
    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        finishedAt: new Date(),
        totalScore,
        maxScore
      }
    });

    // Update user progress
    await updateUserProgress(userId, {
      quizId,
      score: totalScore,
      maxScore,
      timestamp: new Date()
    });

    const response = {
      attemptId: attempt.id,
      totalScore,
      maxScore,
      percentage: Math.round((totalScore / maxScore) * 100),
      perQuestion
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Quiz submission error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

interface QuizProgressData {
  attempts: number;
  totalScore: number;
  totalMaxScore: number;
  bestScore: number;
  bestPercentage: number;
  lastAttempt: Date;
}

interface UserProgressData {
  quizzes: Record<string, QuizProgressData>;
  overallStats: {
    totalQuizzes: number;
    totalAttempts: number;
    averageScore: number;
  };
}

// Helper function to update user progress
async function updateUserProgress(userId: string, attemptData: {
  quizId: string;
  score: number;
  maxScore: number;
  timestamp: Date;
}) {
  try {
    const existingProgress = await prisma.userProgress.findUnique({
      where: { userId }
    });

    let progressData: UserProgressData;
    if (existingProgress) {
      // Update existing progress
      const currentProgress = (existingProgress.progressJson as UserProgressData) || {
        quizzes: {},
        overallStats: { totalQuizzes: 0, totalAttempts: 0, averageScore: 0 }
      };
      
      if (!currentProgress.quizzes) {
        currentProgress.quizzes = {};
      }

      if (!currentProgress.quizzes[attemptData.quizId]) {
        currentProgress.quizzes[attemptData.quizId] = {
          attempts: 0,
          totalScore: 0,
          totalMaxScore: 0,
          bestScore: 0,
          bestPercentage: 0,
          lastAttempt: new Date()
        };
      }

      const quizProgress = currentProgress.quizzes[attemptData.quizId];
      quizProgress.attempts += 1;
      quizProgress.totalScore += attemptData.score;
      quizProgress.totalMaxScore += attemptData.maxScore;
      
      const currentPercentage = (attemptData.score / attemptData.maxScore) * 100;
      if (currentPercentage > quizProgress.bestPercentage) {
        quizProgress.bestScore = attemptData.score;
        quizProgress.bestPercentage = currentPercentage;
      }
      
      quizProgress.lastAttempt = attemptData.timestamp;
      
      // Calculate overall stats
      const quizValues = Object.values(currentProgress.quizzes);
      currentProgress.overallStats = {
        totalQuizzes: Object.keys(currentProgress.quizzes).length,
        totalAttempts: quizValues.reduce((sum: number, quiz: QuizProgressData) => sum + quiz.attempts, 0),
        averageScore: quizValues.reduce((sum: number, quiz: QuizProgressData) => sum + quiz.bestPercentage, 0) / Object.keys(currentProgress.quizzes).length
      };

      progressData = currentProgress;
    } else {
      // Create new progress
      progressData = {
        quizzes: {
          [attemptData.quizId]: {
            attempts: 1,
            totalScore: attemptData.score,
            totalMaxScore: attemptData.maxScore,
            bestScore: attemptData.score,
            bestPercentage: (attemptData.score / attemptData.maxScore) * 100,
            lastAttempt: attemptData.timestamp
          }
        },
        overallStats: {
          totalQuizzes: 1,
          totalAttempts: 1,
          averageScore: (attemptData.score / attemptData.maxScore) * 100
        }
      };
    }

    await prisma.userProgress.upsert({
      where: { userId },
      update: {
        progressJson: progressData,
        updatedAt: new Date()
      },
      create: {
        userId,
        progressJson: progressData,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to update user progress:', error);
    // Don't throw error as this is not critical for quiz submission
  }
}