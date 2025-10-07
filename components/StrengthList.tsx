"use client";
import React from 'react';

interface Topic {
  topic: string;
  avgScore: number;
  attempts: number;
  totalScore: number;
  maxScore: number;
}

interface StrengthListProps {
  topics: Topic[];
}

export default function StrengthList({ topics }: StrengthListProps) {
  if (!topics || topics.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-6">
        <h3 className="text-base font-semibold mb-4">Topic Performance</h3>
        <div className="flex items-center justify-center h-28 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] text-sm">No topic data available</div>
      </div>
    );
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Topic Performance</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Strengths & focus areas</p>
        </div>
      </div>
      <div className="space-y-4">
        {topics.map(t => (
          <div key={t.topic} className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-alt)] transition">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-sm leading-tight">{t.topic}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">Attempts: {t.attempts}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getPerformanceColor(t.avgScore)}`}>{getPerformanceLabel(t.avgScore)}</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--color-border)]/60 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-pink-500" style={{ width: t.avgScore + '%' }} />
            </div>
            <div className="mt-1 text-[10px] tracking-wide text-[var(--color-text-muted)] flex justify-between">
              <span>{t.totalScore}/{t.maxScore} pts</span>
              <span>{t.avgScore}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}