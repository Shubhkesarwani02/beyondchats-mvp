type BadgeVariant = 'default' | 'outline' | 'success' | 'warning' | 'danger';

export function Badge({ children, variant = 'default', className }: { children: React.ReactNode; variant?: BadgeVariant; className?: string }) {
  const styles: Record<BadgeVariant, string> = {
    default: 'bg-indigo-50 text-indigo-700',
    outline: 'bg-white text-[var(--color-text)] border border-[var(--color-border)]',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-600',
  };
  
  const classes = ['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide', styles[variant], className].filter(Boolean).join(' ');
  
  return (
    <span className={classes}>
      {children}
    </span>
  );
}