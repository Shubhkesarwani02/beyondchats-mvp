import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user'; // For MVP, using default user

    // Get all quiz attempts for the user
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId: userId,
        finishedAt: { not: null }, // Only completed attempts
      },
      include: {
        quiz: {
          select: {
            title: true,
            metadata: true,
          },
        },
        answers: {
          include: {
            question: {
              select: {
                stem: true,
                source: true,
              },
            },
          },
        },
      },
      orderBy: {
        finishedAt: 'desc',
      },
    });

    // Calculate statistics
    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.totalScore || 0), 0);
    const totalMaxScore = attempts.reduce((sum, attempt) => sum + (attempt.maxScore || 0), 0);
    const avgScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

    // Extract topics from quiz metadata and calculate topic-wise performance
    const topicStats: { [key: string]: { totalScore: number; maxScore: number; attempts: number } } = {};
    
    attempts.forEach((attempt) => {
      const quizMetadata = attempt.quiz.metadata as { topics?: string[] } | null;
      const topics = quizMetadata?.topics || ['General']; // Default to 'General' if no topics
      
      topics.forEach((topic: string) => {
        if (!topicStats[topic]) {
          topicStats[topic] = { totalScore: 0, maxScore: 0, attempts: 0 };
        }
        topicStats[topic].totalScore += attempt.totalScore || 0;
        topicStats[topic].maxScore += attempt.maxScore || 0;
        topicStats[topic].attempts += 1;
      });
    });

    // Convert to array and calculate percentages
    const topics = Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      avgScore: stats.maxScore > 0 ? Math.round((stats.totalScore / stats.maxScore) * 100) : 0,
      attempts: stats.attempts,
      totalScore: stats.totalScore,
      maxScore: stats.maxScore,
    })).sort((a, b) => b.avgScore - a.avgScore);

    // Recent attempts for history
    const recentAttempts = attempts.slice(0, 10).map((attempt) => ({
      id: attempt.id,
      quizTitle: attempt.quiz.title,
      score: attempt.totalScore,
      maxScore: attempt.maxScore,
      percentage: attempt.maxScore ? Math.round((attempt.totalScore! / attempt.maxScore) * 100) : 0,
      finishedAt: attempt.finishedAt,
      startedAt: attempt.startedAt,
    }));

    // Performance data for charts
    const performanceData = attempts.map((attempt) => ({
      quizTitle: attempt.quiz.title.substring(0, 20) + (attempt.quiz.title.length > 20 ? '...' : ''),
      score: attempt.totalScore,
      maxScore: attempt.maxScore,
      percentage: attempt.maxScore ? Math.round((attempt.totalScore! / attempt.maxScore) * 100) : 0,
      date: attempt.finishedAt?.toISOString().split('T')[0],
    })).reverse(); // Most recent first for chart

    return NextResponse.json({
      success: true,
      data: {
        totalAttempts,
        avgScore,
        topics,
        recentAttempts,
        performanceData,
        summary: {
          totalScore,
          totalMaxScore,
          completionRate: attempts.length > 0 ? 100 : 0, // Simplified completion rate
        },
      },
    });
  } catch (error) {
    console.error('Error fetching progress data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress data' },
      { status: 500 }
    );
  }
}