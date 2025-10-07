'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    id: string;
    pageNum: number;
    content: string;
    snippet: string;
    pdfTitle: string;
    similarity?: number;
  }>;
  timestamp: Date;
}

interface ChatPanelProps {
  pdfId: string;
  onGoToPage: (page: number) => void;
}

export default function ChatPanel({ pdfId, onGoToPage }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { show } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateMessageId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const liveRegionRef = useRef<HTMLDivElement>(null);

  const appendAssistantStreaming = async (fullText: string, sources: Message['sources']) => {
    const id = generateMessageId();
    const baseMessage: Message = { id, type: 'assistant', content: '', sources, timestamp: new Date() };
    setMessages(prev => [...prev, baseMessage]);
    const tokens = fullText.split(/(\s+)/);
    let assembled = '';
    for (let i = 0; i < tokens.length; i++) {
      assembled += tokens[i];
      await new Promise(r => setTimeout(r, Math.min(30, 10 + Math.random()*40)));
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content: assembled } : m));
      if (i % 6 === 0 && liveRegionRef.current) {
        liveRegionRef.current.textContent = assembled.slice(-140); // update live region with trailing snippet
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateMessageId(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.content,
          pdfId: pdfId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await appendAssistantStreaming(data.answer || '', data.sources);
        show({ type: 'success', message: 'Answer generated' });
      } else {
        setError(data.error || 'Failed to get response from AI');
        show({ type: 'error', message: data.error || 'AI response failed' });
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Network error. Please try again.');
      show({ type: 'error', message: 'Network error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitationClick = (pageNum: number) => {
    onGoToPage(pageNum);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
  <div className="flex flex-col h-full bg-[var(--color-bg-alt)]/60 backdrop-blur-xl border-l border-[var(--color-border)]" role="region" aria-label="Chat with AI assistant">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">AI Assistant</h2>
          <p className="text-xs text-[var(--color-text-muted)]/80">Ask questions about this PDF</p>
        </div>
      </div>

      {/* Messages */}
  <div className="flex-1 overflow-y-auto p-5 space-y-6 relative" aria-live="off">
        {messages.length === 0 && !isLoading && (
          <div className="max-w-sm mx-auto text-center mt-16 animate-fade-in-up">
            <div className="h-14 w-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-indigo-600 to-fuchsia-500 flex items-center justify-center text-white shadow shadow-indigo-500/40">
              💬
            </div>
            <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">Ask concept explanations, summaries, or clarifications. Cite pages when you can for better grounding.</p>
          </div>
        )}

        {messages.map(message => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`} role="group" aria-label={message.type === 'user' ? 'Your message' : 'Assistant response'}>
            <div className={`group relative max-w-[78%] px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed tracking-normal whitespace-pre-wrap ${message.type === 'user' ? 'bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white rounded-br-sm' : 'glass border border-[var(--color-border)]/60 text-[var(--color-text)] rounded-bl-sm'} transition-all`}>
              <div className={`prose-chat ${message.type === 'user' ? '' : 'text-[var(--color-text)]'} text-sm`}>{message.content}</div>
              {message.type === 'assistant' && message.sources && message.sources.length > 0 && (
                <details className="mt-3 group/source">
                  <summary className="cursor-pointer text-xs font-semibold opacity-70 hover:opacity-100 select-none">References ({message.sources.length})</summary>
                  <ul className="mt-2 space-y-2">
                    {message.sources.map(source => (
                      <li key={source.id}>
                        <button onClick={() => handleCitationClick(source.pageNum)} className="w-full text-left text-xs px-3 py-2 rounded-lg bg-white/70 dark:bg-white/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 border border-[var(--color-border)]/60 transition-colors">
                          <span className="font-medium">Page {source.pageNum}:</span> {source.snippet.slice(0, 110)}{source.snippet.length > 110 ? '…' : ''}
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <time className={`block mt-2 text-[10px] tracking-wide uppercase ${message.type === 'user' ? 'text-white/60' : 'text-[var(--color-text-muted)]/60'}`}>{formatTime(message.timestamp)}</time>
              {message.type === 'assistant' && (
                <div className="opacity-0 group-hover:opacity-100 transition absolute -top-2 -right-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(message.content)}
                    className="p-1 rounded-full bg-black/60 text-white text-[10px] hover:bg-black/80"
                    aria-label="Copy answer"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in-up" aria-live="polite" aria-label="Assistant is thinking">
            <div className="glass px-5 py-3 rounded-2xl text-sm shadow-sm flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse [animation-delay:120ms]" />
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse [animation-delay:240ms]" />
              </div>
              <span className="text-[var(--color-text-muted)] text-xs font-medium">AI is thinking…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        <div ref={liveRegionRef} className="sr-only" aria-live="polite" aria-atomic="false" />
      </div>

      {error && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-400/40 text-red-600 dark:text-red-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss error" className="hover:opacity-80">✕</button>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="border-t border-[var(--color-border)] p-4">
        <form onSubmit={handleSubmit} className="relative flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question (e.g., Summarize section 2)..."
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg)]/70 border border-[var(--color-border)] focus:ring-2 focus:ring-indigo-400 focus:outline-none disabled:opacity-50 pr-12 text-sm"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-[var(--color-bg-alt)]/80 border border-[var(--color-border)] px-1.5 py-0.5 rounded font-mono text-[var(--color-text-muted)]">Enter</kbd>
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="h-11 aspect-square rounded-xl bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white flex items-center justify-center shadow disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
            aria-label="Send question"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}