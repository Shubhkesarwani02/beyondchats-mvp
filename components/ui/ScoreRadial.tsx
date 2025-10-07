"use client";
import { useEffect, useState } from 'react';

interface ScoreRadialProps {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
  subtitle?: string;
  colorStops?: [string,string,string];
  durationMs?: number;
}

export function ScoreRadial({ value, size = 160, stroke = 14, label, subtitle, colorStops = ['#6366f1','#8b5cf6','#ec4899'], durationMs = 900 }: ScoreRadialProps) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    let frame: number; let start: number | null = null;
    const target = Math.min(100, Math.max(0, value));
    const animate = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / durationMs);
      setAnimated(target * progress);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const dash = (animated / 100) * circ;
  const gradientId = `grad-${Math.random().toString(36).slice(2)}`;
  const glowColor = animated >= 85 ? 'shadow-[0_0_0_4px_rgba(16,185,129,0.15)]' : animated >= 70 ? 'shadow-[0_0_0_4px_rgba(99,102,241,0.15)]' : animated >= 50 ? 'shadow-[0_0_0_4px_rgba(245,158,11,0.15)]' : 'shadow-[0_0_0_4px_rgba(239,68,68,0.15)]';
  const textColor = animated >= 85 ? 'text-emerald-600' : animated >= 70 ? 'text-indigo-600' : animated >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className={`relative flex flex-col items-center justify-center ${glowColor}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStops[0]} />
            <stop offset="60%" stopColor={colorStops[1]} />
            <stop offset="100%" stopColor={colorStops[2]} />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={radius} stroke="var(--color-border)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size/2}
            cy={size/2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${dash} ${circ - dash}`}
            style={{ transition: 'stroke-dasharray 120ms linear' }}
          />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-semibold tabular-nums leading-none ${textColor}`}>{Math.round(animated)}<span className="text-base align-top">%</span></span>
        {label && <span className="mt-1 text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">{label}</span>}
        {subtitle && <span className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{subtitle}</span>}
      </div>
    </div>
  );
}