'use client';

import { useState, useEffect } from 'react';
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
  const router = useRouter();

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      setError('Please select a PDF file');
      return;
    }

    try {
      setUploading(true);
      setProcessing(false);
      setError(null);
      setUploadProgress('Uploading file...');
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploading(false);
        setProcessing(true);
        
        // Show processing status
        if (data.processing?.success) {
          setUploadProgress(`✅ ${data.processing.message || 'Document processed successfully!'}`);
        } else if (data.processing?.warning) {
          setUploadProgress(`⚠️ ${data.processing.message || 'Document uploaded but processing incomplete'}`);
        } else {
          setUploadProgress('❌ Document uploaded but processing failed');
        }

        // Wait a moment to show the status, then refresh and navigate
        setTimeout(async () => {
          await fetchPdfs();
          router.push(`/reader/${data.pdfId}`);
        }, 2000);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Error uploading file');
      console.error('Upload error:', err);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProcessing(false);
        setUploadProgress('');
      }, 3000);
    }
  };

  const handleProcessPdf = async (pdfId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation when clicking process button
    
    try {
      setError(null);
      const response = await fetch('/api/chunk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfId }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh the PDF list to show updated status
        await fetchPdfs();
      } else {
        setError(data.error || 'Failed to process PDF');
      }
    } catch (err) {
      setError('Error processing PDF');
      console.error('Processing error:', err);
    }
  };

  const handlePdfSelect = (pdfId: string) => {
    router.push(`/reader/${pdfId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading PDFs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Select Your Coursebook
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from your uploaded PDFs or upload a new document to start chatting with your AI assistant.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="ml-3 text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Upload New PDF Button */}
          <div className="mb-8">
            <label className="block">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={uploading || processing}
                className="hidden"
              />
              <div className={`
                bg-white rounded-xl shadow-lg p-8 border-2 border-dashed border-gray-300
                hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer
                ${uploading || processing ? 'opacity-75 cursor-not-allowed' : ''}
              `}>
                <div className="text-center">
                  <svg className="w-12 h-12 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Upload New PDF'}
                  </h3>
                  <p className="text-gray-600">
                    {uploading ? 'Uploading your document...' : 
                     processing ? 'Generating chunks and embeddings...' : 
                     'Click to select a PDF file from your computer'}
                  </p>
                  {uploadProgress && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">{uploadProgress}</p>
                    </div>
                  )}
                  {(uploading || processing) && (
                    <div className="mt-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  )}
                </div>
              </div>
            </label>
          </div>

          {/* Existing PDFs */}
          {pdfs.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    onClick={() => handlePdfSelect(pdf.id)}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300"
                  >
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                          {pdf.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Uploaded on {formatDate(pdf.createdAt)}
                        </p>
                        <div className="mt-3 flex items-center space-x-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Click to open
                          </span>
                          {pdf.hasChunks ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ Processed ({pdf.chunksCount} chunks)
                            </span>
                          ) : (
                            <button
                              onClick={(e) => handleProcessPdf(pdf.id, e)}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                            >
                              ⏳ Click to process
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pdfs.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Documents Yet</h3>
              <p className="text-gray-600">Upload your first PDF to get started with AI-powered document chat.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}