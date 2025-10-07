'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/upload', label: 'Upload PDF', icon: '📄' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/quiz', label: 'Generate Quiz', icon: '🧠' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === '/') return null;

  const isActive = (href: string) => href === pathname || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl glass/30 border-b border-[var(--color-border)]/50 supports-[backdrop-filter]:glass">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16 gap-6">
          <Link href="/" className="relative flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white shadow-md shadow-indigo-500/30">
              📚
            </div>
            <span className="text-lg font-semibold gradient-text tracking-tight">BeyondChats</span>
          </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2 relative">
              <div className="flex gap-1 p-1 rounded-full bg-[var(--color-bg-alt)]/80 dark:bg-white/5 border border-[var(--color-border)] relative">
                {navItems.map(item => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`relative px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 ${active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                    >
                      {active && <span className="nav-active-pill" />}
                      <span className="relative z-10" aria-hidden>{item.icon}</span>
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto md:ml-0">
              {/* Theme toggle removed (single light mode) */}

              {/* Mobile menu button */}
              <button
                className="md:hidden h-9 w-9 rounded-full flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg-alt)]/70 hover:bg-[var(--color-bg-alt)] focus-ring"
                onClick={() => setMobileOpen(o => !o)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
        </div>
      </div>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 animate-fade-in-up">
          <div className="flex flex-col gap-2 bg-[var(--color-bg-alt)]/80 backdrop-blur-xl border border-[var(--color-border)] rounded-xl p-3 shadow-lg">
            {navItems.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white shadow' : 'hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}