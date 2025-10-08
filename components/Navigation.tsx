'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠', description: 'Your progress overview' },
  { href: '/upload', label: 'Upload PDF', icon: '📄', description: 'Add new documents' },
  { href: '/chat', label: 'Chat', icon: '💬', description: 'AI conversations' },
  { href: '/quiz', label: 'Generate Quiz', icon: '🧠', description: 'Test your knowledge' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    if (mobileOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Hide navigation on home page
  if (pathname === '/') return null;

  const isActive = (href: string) => href === pathname || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <>
      <nav className={`sticky top-0 z-50 backdrop-blur-xl transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 shadow-md border-b border-gray-200' 
          : 'bg-white/70 border-b border-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 gap-4 sm:gap-6">
            {/* Logo */}
            <Link href="/" className="relative flex items-center gap-2 sm:gap-3 group">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <span className="text-lg sm:text-xl">📚</span>
              </div>
              <span className="text-lg sm:text-xl font-bold gradient-text tracking-tight group-hover:scale-105 transition-transform">
                BeyondChats
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 relative overflow-x-auto no-scrollbar max-w-full">
              <div className="flex gap-1.5 p-1.5 rounded-full bg-gray-100/80 border border-gray-200 relative whitespace-nowrap shadow-sm">
                {navItems.map(item => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`relative px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        active 
                          ? 'text-white shadow-md' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-pink-600 animate-pulse" />
                      )}
                      <span className="relative z-10 text-base" aria-hidden="true">{item.icon}</span>
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden h-10 w-10 rounded-xl flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              <svg 
                className={`h-5 w-5 transition-transform duration-300 ${mobileOpen ? 'rotate-90' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in-up"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`md:hidden fixed top-16 left-0 right-0 z-50 transition-all duration-300 ${
        mobileOpen 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="mx-4 mt-2 mb-safe rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl overflow-hidden">
          <div className="p-2 space-y-1">
            {navItems.map((item, index) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 animate-fade-in-up ${
                    active 
                      ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30' 
                      : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    active 
                      ? 'bg-white/20' 
                      : 'bg-gradient-to-tr from-indigo-100 to-fuchsia-100'
                  }`}>
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{item.label}</div>
                    <div className={`text-xs ${active ? 'text-white/80' : 'text-gray-500'}`}>
                      {item.description}
                    </div>
                  </div>
                  {active && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </div>
          
          {/* Mobile Menu Footer */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-fuchsia-50 border-t border-gray-200">
            <p className="text-xs text-center text-gray-600">
              AI-Powered Learning Platform
            </p>
          </div>
        </div>
      </div>
    </>
  );
}