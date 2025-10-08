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
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitMode, setFitMode] = useState<'fit-width' | 'custom'>('fit-width');
  const lastTapRef = useRef<number>(0);
  const [showMiniMapMobile, setShowMiniMapMobile] = useState(false);
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
        
        // Configure loading task with better error handling
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          // Add CORS support
          withCredentials: false,
          // Add better error handling
          httpHeaders: {
            'Accept': 'application/pdf',
          },
          // Disable range requests for better compatibility
          disableRange: false,
          // Disable streaming for production compatibility
          disableStream: false,
        });

        // Add progress listener
        loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            console.log(`Loading PDF: ${percent}%`);
          }
        };
        
        const pdf = await loadingTask.promise;
        
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        // Kick off thumbnail generation (non-blocking)
        generateThumbnails(pdf).catch(err => console.warn('Thumbnail generation failed', err));
        setLoading(false);
      } catch (err) {
        console.error('PDF load error:', err);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to load PDF. ';
        if (err instanceof Error) {
          if (err.message.includes('404')) {
            errorMessage += 'PDF file not found.';
          } else if (err.message.includes('403')) {
            errorMessage += 'Access denied.';
          } else if (err.message.includes('CORS')) {
            errorMessage += 'Cross-origin request blocked.';
          } else if (err.message.includes('network')) {
            errorMessage += 'Network error. Check your connection.';
          } else {
            errorMessage += err.message || 'Please try again.';
          }
        } else {
          errorMessage += 'Please try again.';
        }
        
        setError(errorMessage);
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

  // Auto-fit width scaling on container resize when in fit-width mode
  useEffect(() => {
    if (fitMode !== 'fit-width') return;
    const handle = () => {
  if (!pdfDocument || !canvasRef.current || !containerRef.current) return;
      (async () => {
        try {
          const page = await pdfDocument.getPage(currentPage);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const containerEl = containerRef.current;
          if (!containerEl) return;
          const containerWidth = containerEl.clientWidth - 16; // padding allowance
            const newScale = Math.min(3, Math.max(0.5, containerWidth / unscaledViewport.width));
            setScale(prev => Math.abs(prev - newScale) > 0.01 ? newScale : prev);
        } catch {}
      })();
    };
    handle();
    const resizeObserver = new ResizeObserver(handle);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [pdfDocument, currentPage, fitMode]);

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
    setFitMode('custom');
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setFitMode('custom');
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setFitMode('fit-width');
  };

  const handleCanvasDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 450) {
      // double tap
      setFitMode('custom');
      setScale(prev => {
        const target = prev < 1.5 ? prev * 1.6 : 1.0;
        return Math.min(3, Math.max(0.5, target));
      });
    }
    lastTapRef.current = now;
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
    <div className="flex flex-col h-full bg-[var(--color-bg)] relative" ref={containerRef}>
      {/* Toolbar */}
      <div className="glass border-b border-[var(--color-border)]/70 p-2 sm:p-3 flex flex-wrap items-center gap-2 sm:gap-4 sticky top-0 z-10 rounded-none safe-area-inset">
        <div className="flex items-center space-x-2 sm:space-x-4 order-1">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="p-1.5 sm:p-2 rounded-lg bg-[var(--color-bg-alt)] border border-[var(--color-border)] hover:bg-[var(--color-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              <input type="number" value={currentPage} onChange={(e) => goToPage(parseInt(e.target.value) || 1)} className="w-12 sm:w-16 px-1 sm:px-2 py-1 text-center border border-[var(--color-border)] rounded text-xs sm:text-sm bg-[var(--color-bg-alt)] focus:outline-none focus:ring-2 focus:ring-indigo-400" min={1} max={numPages} />
              <span className="text-xs sm:text-sm text-[var(--color-text-muted)] hidden sm:inline">of</span>
              <span className="text-xs sm:text-sm text-[var(--color-text-muted)]">{numPages}</span>
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
              className="p-1.5 sm:p-2 rounded-lg bg-[var(--color-bg-alt)] border border-[var(--color-border)] hover:bg-[var(--color-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2 order-3 sm:order-2 ml-auto">
          <button
            onClick={zoomOut}
            className="p-1.5 sm:p-2 rounded-lg bg-[var(--color-bg-alt)] border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors touch-target"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <span className="text-xs sm:text-sm text-[var(--color-text-muted)] min-w-[3rem] sm:min-w-[4rem] text-center">{fitMode==='fit-width' ? 'Fit' : Math.round(scale * 100)+ '%'} </span>
          
          <button
            onClick={zoomIn}
            className="p-1.5 sm:p-2 rounded-lg bg-[var(--color-bg-alt)] border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors touch-target"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          <button
            onClick={resetZoom}
            className="px-2 sm:px-3 py-1 text-[10px] sm:text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg-alt)] hover:bg-[var(--color-bg)] transition-colors touch-target"
          >
            {fitMode==='fit-width' ? 'Fit ✓' : 'Fit'}
          </button>
        </div>

        {/* Mobile mini-map toggle */}
        {numPages > 1 && (
          <div className="flex items-center order-2 sm:order-3 ml-0 sm:ml-4">
            <button
              onClick={() => setShowMiniMapMobile(v => !v)}
              className="md:hidden px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-alt)] text-[10px] font-medium"
            >
              {showMiniMapMobile ? 'Hide pages' : 'Pages'}
            </button>
          </div>
        )}
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 mobile-scroll" onClick={handleCanvasDoubleTap}>
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="shadow-lg border border-[var(--color-border)] max-w-full bg-white touch-pan-y" />
        </div>
      </div>

      {/* Mini-map placeholder - Hide on mobile to save space */}
      {numPages > 1 && (
        <div className={`absolute right-1 sm:right-2 top-20 sm:top-24 w-16 sm:w-24 flex-col gap-1 sm:gap-2 max-h-[60%] sm:max-h-[70%] overflow-auto rounded-lg sm:rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)]/85 backdrop-blur-md p-1 sm:p-2 shadow-sm ${showMiniMapMobile ? 'flex' : 'hidden'} md:flex`}>
          {Array.from({ length: numPages }).map((_, i) => {
            const active = currentPage === i + 1;
            const dataUrl = thumbCacheRef.current[i+1];
            return (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`group relative rounded-md sm:rounded-lg overflow-hidden border ${active ? 'border-indigo-500 ring-2 ring-indigo-400/40' : 'border-[var(--color-border)] hover:border-indigo-300'} transition focus:outline-none focus:ring-2 focus:ring-indigo-400 touch-target`}
                aria-label={`Go to page ${i+1}`}
              >
                {dataUrl ? (
                  <Image src={dataUrl} alt={`Page ${i+1} thumbnail`} width={80} height={120} className="w-full h-auto block" />
                ) : (
                  <div className="w-full h-12 sm:h-16 flex items-center justify-center text-[9px] sm:text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg)]">{i+1}</div>
                )}
                <span className="absolute bottom-0 right-0 m-0.5 sm:m-1 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] rounded bg-black/50 text-white font-medium">{i+1}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}