'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface PDF {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  hasChunks?: boolean;
  chunksCount?: number;
}

export default function SourceSelector() {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pdfs');
      const data = await response.json();
      
      if (data.success) {
        setPdfs(data.pdfs);
      } else {
        setError('Failed to load PDFs');
      }
    } catch (err) {
      setError('Error fetching PDFs');
      console.error('Error fetching PDFs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      setError('Please select a PDF file');
      return;
    }

    try {
      setUploading(true);
      setProcessing(false);
      setError(null);
      setUploadProgress('Preparing upload...');

      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress('Uploading document...');
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      setUploading(false);
      setProcessing(true);
      setUploadProgress('Processing and generating embeddings...');

      const chunkResponse = await fetch('/api/chunk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfId: uploadData.pdfId }),
      });

      const chunkData = await chunkResponse.json();

      if (!chunkData.success) {
        throw new Error(chunkData.error || 'Processing failed');
      }

      setUploadProgress('✅ Successfully processed!');
      await fetchPdfs();
      
      setTimeout(() => {
        setProcessing(false);
        setUploadProgress('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUploading(false);
      setProcessing(false);
      setUploadProgress('');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProcessPdf = async (pdfId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setProcessing(true);
      setUploadProgress('Processing document...');
      
      const response = await fetch('/api/chunk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      setUploadProgress('✅ Processing complete!');
      await fetchPdfs();
      
      setTimeout(() => {
        setProcessing(false);
        setUploadProgress('');
      }, 2000);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setProcessing(false);
      setUploadProgress('');
    }
  };

  const handlePdfSelect = (pdfId: string) => {
    router.push(`/reader/${pdfId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filteredPdfs = pdfs.filter(pdf => 
    pdf.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50">
        <div className="text-center animate-fade-in-scale">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-600 to-fuchsia-500 animate-pulse" />
            <div className="absolute inset-2 rounded-xl bg-white flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">📚</span>
            </div>
          </div>
          <p className="text-base sm:text-lg font-medium text-gray-700">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-fuchsia-200/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-200/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Header */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white shadow-xl shadow-indigo-500/30 animate-pulse-accent">
            <span className="text-3xl sm:text-4xl">📚</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 gradient-text leading-tight">
            Your Learning Hub
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Upload your PDFs and unlock AI-powered insights, interactive quizzes, and personalized video recommendations
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 animate-fade-in-up">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 shadow-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="flex-1 text-sm font-medium">{error}</span>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
          {/* Upload Section */}
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <input
              ref={fileInputRef}
              type="file"
              id="pdf-upload"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={uploading || processing}
              className="hidden"
            />
            <label htmlFor="pdf-upload" className="block cursor-pointer group">
              <div
                className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border-3 transition-all duration-300 ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50 scale-[1.02] shadow-2xl' 
                    : uploading || processing 
                    ? 'border-gray-300 bg-gray-50' 
                    : 'border-dashed border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/50 hover:scale-[1.01] hover:shadow-xl'
                } ${uploading || processing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {/* Animated gradient overlay */}
                {!uploading && !processing && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-fuchsia-500/0 to-pink-500/0 group-hover:from-indigo-500/5 group-hover:via-fuchsia-500/5 group-hover:to-pink-500/5 transition-all duration-500" />
                )}
                
                <div className="relative p-8 sm:p-12 lg:p-16 text-center">
                  {/* Icon */}
                  <div className="mb-6 sm:mb-8 mx-auto">
                    {uploading || processing ? (
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 border-r-fuchsia-600 animate-spin" />
                        <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-indigo-100 to-fuchsia-100 flex items-center justify-center">
                          <span className="text-2xl">{processing ? '⚙️' : '📤'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="max-w-md mx-auto">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                      {uploading ? 'Uploading Document...' : processing ? 'Processing Content...' : 'Upload Your PDF'}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                      {uploading ? 'Securing your document in the cloud...' : 
                       processing ? 'AI is analyzing and indexing your content...' : 
                       'Drag and drop your PDF here, or click to browse'}
                    </p>
                    
                    {/* Progress Message */}
                    {uploadProgress && (
                      <div className="mt-4 sm:mt-6 p-4 bg-gradient-to-r from-indigo-50 to-fuchsia-50 rounded-xl border border-indigo-200/50">
                        <p className="text-sm font-medium text-indigo-900 flex items-center justify-center gap-2">
                          {uploadProgress.includes('✅') ? (
                            <span className="text-green-600">✅</span>
                          ) : (
                            <span className="animate-pulse">⏳</span>
                          )}
                          {uploadProgress}
                        </p>
                      </div>
                    )}

                    {/* File Types */}
                    {!uploading && !processing && (
                      <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">PDF documents only</span>
                        <span className="text-gray-400">•</span>
                        <span>Max 50MB</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* Search Bar (shown only when there are PDFs) */}
          {pdfs.length > 0 && (
            <div className="max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search your documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm sm:text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PDF Grid */}
          {filteredPdfs.length > 0 && (
            <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {searchQuery ? `Search Results (${filteredPdfs.length})` : 'Your Documents'}
                </h2>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm">
                  <span className="text-sm font-medium text-gray-700">{filteredPdfs.length}</span>
                  <span className="text-xs text-gray-500">{filteredPdfs.length === 1 ? 'document' : 'documents'}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredPdfs.map((pdf, index) => (
                  <div
                    key={pdf.id}
                    onClick={() => handlePdfSelect(pdf.id)}
                    className="group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-indigo-300 overflow-hidden animate-fade-in-scale"
                    style={{ animationDelay: `${100 + index * 50}ms` }}
                  >
                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-fuchsia-500/0 to-transparent group-hover:from-indigo-500/5 group-hover:via-fuchsia-500/5 transition-all duration-300" />
                    
                    <div className="relative p-6">
                      {/* Icon and Badge Row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        
                        {pdf.hasChunks ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Ready
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleProcessPdf(pdf.id, e)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-200 hover:from-yellow-100 hover:to-amber-100 transition-all shadow-sm hover:shadow-md"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                            Process
                          </button>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-snug min-h-[3.5rem] group-hover:text-indigo-600 transition-colors">
                        {pdf.title}
                      </h3>

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(pdf.createdAt)}
                        </span>
                        {pdf.hasChunks && pdf.chunksCount && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              {pdf.chunksCount} chunks
                            </span>
                          </>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                          Open document
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {pdfs.length === 0 && !loading && (
            <div className="text-center py-16 sm:py-24 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8 rounded-3xl bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">No Documents Yet</h3>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
                  Start your learning journey by uploading your first PDF document. Our AI will help you understand, quiz, and master the content.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <span className="text-base">💬</span>
                    </div>
                    <span className="font-medium">AI Chat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-fuchsia-100 flex items-center justify-center">
                      <span className="text-base">🧠</span>
                    </div>
                    <span className="font-medium">Smart Quizzes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                      <span className="text-base">📺</span>
                    </div>
                    <span className="font-medium">Video Lessons</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search No Results */}
          {searchQuery && filteredPdfs.length === 0 && pdfs.length > 0 && (
            <div className="text-center py-16 animate-fade-in-up">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No matches found</h3>
                <p className="text-gray-600 mb-6">
                  We couldn&apos;t find any documents matching <strong className="text-gray-900">&ldquo;{searchQuery}&rdquo;</strong>
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-semibold hover:from-indigo-700 hover:to-fuchsia-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Clear search
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
