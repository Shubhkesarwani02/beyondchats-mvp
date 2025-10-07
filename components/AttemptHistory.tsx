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
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-muted)] mb-4">Recent Quiz Attempts</h3>
        <div className="flex items-center justify-center h-32 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] text-sm">No quiz attempts yet</div>
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
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">Recent Quiz Attempts</h3>
        <p className="text-xs text-[var(--color-text-muted)]">Your latest quiz performances</p>
      </div>
      <ul className="space-y-4" role="list">
        {attempts.map(attempt => {
          const durationMin = Math.max(1, Math.round((new Date(attempt.finishedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60000));
          return (
            <li key={attempt.id} className="group border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg)] hover:bg-[var(--color-bg-alt)] transition-colors">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm leading-tight mb-1 line-clamp-1">{attempt.quizTitle}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                    <span>{formatDate(attempt.finishedAt)}</span>
                    <span className="opacity-40">•</span>
                    <span>{durationMin} min</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className={`text-sm font-semibold tabular-nums ${getScoreColor(attempt.percentage)}`}>{attempt.score}/{attempt.maxScore}</div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] tabular-nums">{attempt.percentage}%</div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getScoreBadgeColor(attempt.percentage)}`}>
                    {attempt.percentage >= 90 && 'Excellent'}
                    {attempt.percentage >= 70 && attempt.percentage < 90 && 'Good'}
                    {attempt.percentage >= 50 && attempt.percentage < 70 && 'Fair'}
                    {attempt.percentage < 50 && 'Improve'}
                  </span>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-[var(--color-border)]/60 overflow-hidden">
                <div className={`h-full transition-all duration-500 ${attempt.percentage >= 90 ? 'bg-emerald-500' : attempt.percentage >= 70 ? 'bg-indigo-500' : attempt.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: attempt.percentage + '%' }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}