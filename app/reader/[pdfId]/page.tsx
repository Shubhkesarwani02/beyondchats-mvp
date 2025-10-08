'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PdfViewer from '@/components/PdfViewer';
import ChatPanel from '@/components/ChatPanel';
import VideoRecommendations from '@/components/VideoRecommendations';

interface PDF {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const pdfId = params.pdfId as string;

  const [pdf, setPdf] = useState<PDF | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePdfId, setActivePdfId] = useState(pdfId);
  const [activeTab, setActiveTab] = useState<'chat' | 'videos'>('chat');

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/pdf/${activePdfId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.success) {
          setPdf(data.pdf);
        } else {
          setError(data.error || 'PDF not found');
        }
      } catch (err) {
        console.error('Error fetching PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    if (activePdfId) {
      fetchPdf();
    }
  }, [activePdfId]);

  const handleGoToPage = (page: number) => {
    setCurrentPage(page);
  };

  const handlePdfChange = (newPdfId: string) => {
    setActivePdfId(newPdfId);
    setCurrentPage(1);
    // Update URL without page reload
    window.history.pushState({}, '', `/reader/${newPdfId}`);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const goBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !pdf) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.168 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested document could not be found.'}</p>
          <button
            onClick={goBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between safe-area-inset">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
          <button
            onClick={goBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 touch-target"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate text-responsive">
              {pdf.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              Uploaded on {new Date(pdf.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-target"
            aria-label={sidebarOpen ? 'Close chat' : 'Open chat'}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'hidden lg:block lg:w-2/3' : 'w-full'}`}>
          <PdfViewer
            pdfUrl={`/api/pdf/${activePdfId}?download=true`}
            currentPage={currentPage}
            onPageChange={handleGoToPage}
          />
        </div>

        {/* Sidebar Panel */}
        <div className={`
          ${sidebarOpen ? 'w-full lg:w-1/3' : 'w-0'} 
          ${sidebarOpen ? 'block' : 'hidden'}
          transition-all duration-300 border-l border-gray-200 bg-white
          ${sidebarOpen ? 'fixed lg:relative inset-0 lg:inset-auto z-40 lg:z-auto' : ''}
          ${sidebarOpen ? 'top-[57px] sm:top-[61px] lg:top-0' : ''}
        `}>
          {sidebarOpen && (
            <div className="h-full flex flex-col">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'chat'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Chat</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === 'videos'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Videos</span>
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'chat' ? (
                  <ChatPanel
                    pdfId={activePdfId}
                    onGoToPage={handleGoToPage}
                    onPdfChange={handlePdfChange}
                  />
                ) : (
                  <VideoRecommendations
                    pdfId={activePdfId}
                    pdfTitle={pdf?.title || ''}
                    autoFetch={false}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Chat Overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 top-[57px] sm:top-[61px]"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          />
        )}
      </div>

      {/* Floating Action Button (when sidebar is closed) */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all z-30 touch-target safe-area-inset"
          aria-label="Open sidebar"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}
    </div>
  );
}