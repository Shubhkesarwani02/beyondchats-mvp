'use client';

import React from 'react';

interface AttemptHistoryItem {
  id: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  finishedAt: string;
  startedAt: string;
}

interface AttemptHistoryProps {
  attempts: AttemptHistoryItem[];
}

export default function AttemptHistory({ attempts }: AttemptHistoryProps) {
  if (!attempts || attempts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Quiz Attempts</h3>
        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No quiz attempts yet</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 70) return 'bg-blue-100 text-blue-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Recent Quiz Attempts</h3>
        <p className="text-sm text-gray-600">Your latest quiz performances</p>
      </div>

      <div className="space-y-4">
        {attempts.map((attempt) => (
          <div
            key={attempt.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {attempt.quizTitle}
                </h4>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Completed: {formatDate(attempt.finishedAt)}</span>
                  <span>•</span>
                  <span>
                    Duration: {Math.round(
                      (new Date(attempt.finishedAt).getTime() - 
                       new Date(attempt.startedAt).getTime()) / (1000 * 60)
                    )} min
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className={`text-lg font-semibold ${getScoreColor(attempt.percentage)}`}>
                    {attempt.score}/{attempt.maxScore}
                  </div>
                  <div className="text-sm text-gray-500">
                    {attempt.percentage}%
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreBadgeColor(attempt.percentage)}`}>
                  {attempt.percentage >= 90 && '🎉 Excellent'}
                  {attempt.percentage >= 70 && attempt.percentage < 90 && '👍 Good'}
                  {attempt.percentage >= 50 && attempt.percentage < 70 && '👌 Fair'}
                  {attempt.percentage < 50 && '📚 Keep Learning'}
                </span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    attempt.percentage >= 90 ? 'bg-green-500' :
                    attempt.percentage >= 70 ? 'bg-blue-500' :
                    attempt.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${attempt.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {attempts.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500">Start taking quizzes to see your progress here!</p>
        </div>
      )}
    </div>
  );
}