'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ChatPanel from '@/components/ChatPanel';

interface PDF {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  hasChunks: boolean;
  chunksCount: number;
}

export default function ChatPage() {
  const [selectedPdfId, setSelectedPdfId] = useState('');
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const response = await fetch('/api/pdfs');
        const data = await response.json();
        
        if (data.success && data.pdfs.length > 0) {
          setPdfs(data.pdfs);
          // Select the first PDF by default
          setSelectedPdfId(data.pdfs[0].id);
        }
      } catch (error) {
        console.error('Error fetching PDFs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPdfs();
  }, []);

  const handlePdfChange = (newPdfId: string) => {
    setSelectedPdfId(newPdfId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-[var(--color-text-muted)]">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (pdfs.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-indigo-600 to-fuchsia-500 flex items-center justify-center text-white text-xl sm:text-2xl shadow shadow-indigo-500/40">
            📚
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-text)] mb-2">No PDFs Available</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">Upload some PDFs first to start chatting with the AI assistant.</p>
          <Link
            href="/upload"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Upload PDFs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <div className="bg-[var(--color-bg-alt)] border-b border-[var(--color-border)] px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-[var(--color-text)]">AI Chat Assistant</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Chat with your uploaded documents</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link
            href="/upload"
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Upload PDF
          </Link>
          <Link
            href="/"
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-alt)] transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 max-w-6xl mx-auto w-full overflow-hidden">
        <ChatPanel
          pdfId={selectedPdfId}
          onGoToPage={() => {}} // No page navigation needed in standalone chat
          onPdfChange={handlePdfChange}
        />
      </div>
    </div>
  );
}