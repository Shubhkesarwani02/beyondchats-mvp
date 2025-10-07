import clsx from 'clsx';

export function ProgressBar({ value, max = 100, className, showLabel }: { value: number; max?: number; className?: string; showLabel?: boolean }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={clsx('w-full h-2 rounded-full bg-[var(--color-border)]/50 overflow-hidden', className)} aria-valuenow={value} aria-valuemax={max} aria-valuemin={0} role="progressbar">
      <div className="h-full bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-pink-500 transition-all duration-300" style={{ width: pct + '%' }} />
      {showLabel && <span className="sr-only">{Math.round(pct)}%</span>}
    </div>
  );
}

export function CircularProgress({ value, size = 56, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, value));
  const dash = (pct / 100) * circ;
  return (
    <div style={{ width: size, height: size }} className="relative" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={radius} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke="url(#grad)" strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={`${dash} ${circ - dash}`} />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="60%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[var(--color-text)]">{Math.round(pct)}%</span>
    </div>
  );
}