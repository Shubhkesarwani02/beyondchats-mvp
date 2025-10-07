import clsx from 'clsx';
import { ReactNode } from 'react';

export function Card({ className, children, interactive }: { className?: string; children: ReactNode; interactive?: boolean }) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] shadow-sm',
        interactive && 'transition-all hover:shadow-md hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('px-5 pt-5', className)}>{children}</div>;
}
export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={clsx('text-base font-semibold tracking-tight', className)}>{children}</h3>;
}
export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx('text-xs text-[var(--color-text-muted)] mt-1', className)}>{children}</p>;
}
export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('px-5 pb-5 pt-4', className)}>{children}</div>;
}
export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('px-5 pb-5 pt-2 border-t border-[var(--color-border)]/70', className)}>{children}</div>;
}