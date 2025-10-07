"use client";
import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

export interface ToastItem { id: string; title?: string; message: string; type?: 'info'|'success'|'error'|'warning'; duration?: number; }

interface ToastContextValue { show: (toast: Omit<ToastItem,'id'>) => void; }

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((toast: Omit<ToastItem,'id'>) => {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? 3500;
    const full: ToastItem = { id, ...toast };
    setItems(prev => [...prev, full]);
    if (duration > 0) {
      setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), duration);
    }
  }, []);

  const dismiss = (id: string) => setItems(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-80 max-w-[90vw]">
        {items.map(t => {
          const color = t.type === 'success' ? 'from-emerald-500 to-emerald-600' : t.type === 'error' ? 'from-red-500 to-red-600' : t.type === 'warning' ? 'from-amber-500 to-amber-600' : 'from-indigo-500 to-fuchsia-500';
          return (
            <div key={t.id} className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] shadow-md px-4 py-3 text-sm animate-fade-in-up">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${color}`}></div>
              {t.title && <p className="font-semibold mb-0.5 pr-6">{t.title}</p>}
              <p className="text-[13px] leading-snug pr-6 text-[var(--color-text-muted)]">{t.message}</p>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss toast" className="absolute top-2 right-2 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]">✕</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}