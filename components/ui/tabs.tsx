"use client";
import { useState } from 'react';
import clsx from 'clsx';

export interface TabItem { id: string; label: string; disabled?: boolean; }

export function Tabs({ items, defaultId, onChange, className }: { items: TabItem[]; defaultId?: string; onChange?: (id: string) => void; className?: string }) {
  const [active, setActive] = useState(defaultId || items[0]?.id);
  return (
    <div className={clsx('relative flex items-center gap-1 p-1 rounded-full bg-[var(--color-bg-alt)] border border-[var(--color-border)]', className)}>
      {items.map(it => {
        const isActive = it.id === active;
        return (
          <button
            key={it.id}
            disabled={it.disabled}
            onClick={() => { setActive(it.id); onChange?.(it.id); }}
            className={clsx('relative px-4 py-1.5 text-sm font-medium rounded-full transition-all disabled:opacity-40',
              isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]')}
          >
            {isActive && <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-500 opacity-15" />}
            <span className="relative z-10">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}