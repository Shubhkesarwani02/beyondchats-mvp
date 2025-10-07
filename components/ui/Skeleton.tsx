import React from 'react';

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
  rounded?: boolean | string;
}

export function Skeleton({ className = '', shimmer = true, rounded = true }: SkeletonProps) {
  const radius = typeof rounded === 'string' ? rounded : rounded ? 'rounded-md' : '';
  return (
    <div
      className={`relative overflow-hidden bg-[linear-gradient(120deg,_rgba(0,0,0,0.05),_rgba(0,0,0,0.08))] ${radius} ${className}`}
      aria-hidden="true"
    >
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.6)_50%,rgba(255,255,255,0)_100%)]" />
      )}
    </div>
  );
}

// Global keyframes (inject once). If already present, Tailwind will merge.
// Consider moving to globals.css if duplication occurs.