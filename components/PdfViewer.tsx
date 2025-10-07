'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface PdfViewerProps {
  pdfUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

// Use dynamic import to properly type PDF.js
type PDFJSLib = typeof import('pdfjs-dist');
type PDFDocumentProxy = Awaited<ReturnType<PDFJSLib['getDocument']>['promise']>;
type RenderTask = ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']>;

export default function PdfViewer({ pdfUrl, currentPage, onPageChange }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [pdfjsLib, setPdfjsLib] = useState<PDFJSLib | null>(null);
  const thumbCacheRef = useRef<Record<number,string>>({});
  // toggle state to force rerenders while thumbnails stream in
  const [, forceThumbRefresh] = useState(false);

  // Load PDF.js dynamically on client side
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
        setPdfjsLib(pdfjs);
      } catch (err) {
        console.error('Failed to load PDF.js:', err);
        setError('Failed to load PDF viewer');
      }
    };

    loadPdfJs();
  }, []);

  useEffect(() => {
    const loadDocument = async () => {
      if (!pdfjsLib) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        // Kick off thumbnail generation (non-blocking)
        generateThumbnails(pdf).catch(err => console.warn('Thumbnail generation failed', err));
        setLoading(false);
      } catch (err) {
        console.error('PDF load error:', err);
        setError('Failed to load PDF. Please try again.');
        setLoading(false);
      }
    };

    loadDocument();
  }, [pdfUrl, pdfjsLib]);

  // Generate thumbnails (first page scaled) caching data URLs
  const generateThumbnails = async (pdf: PDFDocumentProxy) => {
    const maxThumbs = Math.min(pdf.numPages, 150); // safety cap
    for (let i = 1; i <= maxThumbs; i++) {
      if (thumbCacheRef.current[i]) continue;
      try {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.15 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        thumbCacheRef.current[i] = canvas.toDataURL('image/png');
        if (i === pdf.numPages || i % 5 === 0) forceThumbRefresh(prev => !prev);
      } catch {
        // Ignore individual thumbnail failures silently
      }
    }
    forceThumbRefresh(prev => !prev);
  };

  useEffect(() => {
    const renderPage = async (pageNumber: number) => {
      if (!pdfDocument || !canvasRef.current) return;

      try {
        // Cancel any ongoing render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        // Start new render task and store reference
        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
        renderTaskRef.current = null;
      } catch (err) {
        if (err && typeof err === 'object' && 'name' in err && err.name === 'RenderingCancelledException') {
          console.log('Rendering cancelled');
        } else {
          console.error('Page render error:', err);
        }
      }
    };

    if (pdfDocument && canvasRef.current) {
      renderPage(currentPage);
    }

    // Cleanup function to cancel any ongoing render when component unmounts or dependencies change
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDocument, currentPage, scale]);

  const goToPrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      onPageChange(currentPage + 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      onPageChange(page);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.168 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] relative">
      {/* Toolbar */}
      <div className="glass border-b border-[var(--color-border)]/70 p-3 flex items-center justify-between gap-4 sticky top-0 z-10 rounded-none">
        <div className="flex items-center space-x-4">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg bg-[var(--color-bg-alt)] border border-[var(--color-border)] hover:bg-[var(--color-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-2">
              <input type="number" value={currentPage} onChange={(e) => goToPage(parseInt(e.target.value) || 1)} className="w-16 px-2 py-1 text-center border border-[var(--color-border)] rounded text-sm bg-[var(--color-bg-alt)] focus:outline-none focus:ring-2 focus:ring-indigo-400" min={1} max={numPages} />
              <span className="text-sm text-[var(--color-text-muted)]">of {numPages}</span>
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
              className="p-2 rounded-lg bg-[var(--color-bg-alt)] border border-[var(--color-border)] hover:bg-[var(--color-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="p-2 rounded-lg bg-[var(--color-bg-alt)] border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <span className="text-sm text-[var(--color-text-muted)] min-w-[4rem] text-center">{Math.round(scale * 100)}%</span>
          
          <button
            onClick={zoomIn}
            className="p-2 rounded-lg bg-[var(--color-bg-alt)] border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          <button
            onClick={resetZoom}
            className="px-3 py-1 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg-alt)] hover:bg-[var(--color-bg)] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="shadow-lg border border-[var(--color-border)] max-w-full bg-white" />
        </div>
      </div>

      {/* Mini-map placeholder (future enhancement could render thumbnails) */}
      {numPages > 1 && (
        <div className="absolute right-2 top-24 w-24 flex flex-col gap-2 max-h-[70%] overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)]/85 backdrop-blur-md p-2 shadow-sm">
          {Array.from({ length: numPages }).map((_, i) => {
            const active = currentPage === i + 1;
            const dataUrl = thumbCacheRef.current[i+1];
            return (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`group relative rounded-lg overflow-hidden border ${active ? 'border-indigo-500 ring-2 ring-indigo-400/40' : 'border-[var(--color-border)] hover:border-indigo-300'} transition focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                aria-label={`Go to page ${i+1}`}
              >
                {dataUrl ? (
                  <Image src={dataUrl} alt={`Page ${i+1} thumbnail`} width={80} height={120} className="w-full h-auto block" />
                ) : (
                  <div className="w-full h-16 flex items-center justify-center text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg)]">{i+1}</div>
                )}
                <span className="absolute bottom-0 right-0 m-1 px-1.5 py-0.5 text-[9px] rounded bg-black/50 text-white font-medium">{i+1}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}