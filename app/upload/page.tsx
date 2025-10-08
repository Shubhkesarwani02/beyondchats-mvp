'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/progress';

interface SourcePdf {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  hasChunks: boolean;
  chunksCount: number;
}

interface UploadResult {
  success?: boolean;
  pdfId?: string;
  filename?: string;
  message?: string;
  error?: string;
}

interface ChunkResult {
  success?: boolean;
  message?: string;
  chunksCount?: number;
  pdfTitle?: string;
  error?: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [chunking, setChunking] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [chunkResult, setChunkResult] = useState<ChunkResult | null>(null);
  const [pdfs, setPdfs] = useState<SourcePdf[]>([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    setLoadingPdfs(true);
    fetch('/api/pdfs')
      .then(r => r.json())
      .then(data => { if (data.success) setPdfs(data.pdfs); })
      .catch(err => console.error('Failed to load PDFs', err))
      .finally(() => setLoadingPdfs(false));
  }, [refreshFlag]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setUploadResult(null);
      setChunkResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Check if response is OK and contains JSON
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Upload failed with status ${response.status}`;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use default error
            console.error('Failed to parse error response:', e);
          }
        } else {
          // Try to get text response for non-JSON errors
          try {
            const textError = await response.text();
            if (textError) {
              errorMessage = textError.substring(0, 200); // Limit error message length
            }
          } catch (e) {
            console.error('Failed to read error response:', e);
          }
        }
        
        setUploadResult({ error: errorMessage });
        return;
      }

      // Parse successful response
      const result = await response.json();
      setUploadResult(result);
      
      if (result.success) {
        handleChunk(result.pdfId);
        setRefreshFlag(f => f + 1); // refresh list
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadResult({ 
        error: error instanceof Error ? error.message : 'Upload failed - Network or server error' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleChunk = async (pdfId: string) => {
    setChunking(true);
    
    try {
      const response = await fetch('/api/chunk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfId }),
      });

      // Check if response is OK
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Chunking failed with status ${response.status}`;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            console.error('Failed to parse error response:', e);
          }
        }
        
        setChunkResult({ error: errorMessage });
        return;
      }

      const result = await response.json();
      setChunkResult(result);
    } catch (error) {
      console.error('Chunking failed:', error);
      setChunkResult({ 
        error: error instanceof Error ? error.message : 'Chunking failed - Network or server error' 
      });
    } finally {
      setChunking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8 sm:mb-10 flex flex-col lg:flex-row gap-6 sm:gap-8">
        <Card className="flex-1" interactive>
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
            <CardDescription>Supported: single PDF per upload (up to ~25MB)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-4 sm:p-8 text-center relative">
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="fileInput" />
              <label htmlFor="fileInput" className="cursor-pointer inline-flex flex-col items-center gap-3 touch-target">
                <span className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white flex items-center justify-center shadow text-xl sm:text-2xl">📄</span>
                <span className="text-sm font-medium">{file ? 'Change File' : 'Choose PDF File'}</span>
                <span className="text-xs text-[var(--color-text-muted)]">Click to select</span>
              </label>
              {file && (
                <div className="mt-4 sm:mt-6 text-left bg-[var(--color-bg)]/60 rounded-lg p-3 sm:p-4 text-sm border border-[var(--color-border)]">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Size: {(file.size/1024/1024).toFixed(2)} MB</p>
                </div>
              )}
              <div className="mt-4 sm:mt-6 flex justify-center">
                <Button onClick={handleUpload} disabled={!file || uploading} variant="primary" className="min-w-32 sm:min-w-40">
                  {uploading ? 'Uploading…' : 'Upload PDF'}
                </Button>
              </div>
              {uploadResult && (
                <div className="mt-4 sm:mt-6 text-left text-xs">
                  {uploadResult.success ? (
                    <p className="text-green-600">{uploadResult.message}</p>
                  ) : (
                    <p className="text-red-600">{uploadResult.error}</p>
                  )}
                </div>
              )}
              {chunking && (
                <div className="mt-4">
                  <ProgressBar value={45} />
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">Processing chunks…</p>
                </div>
              )}
              {chunkResult && (
                <div className="mt-4 text-left text-xs">
                  {chunkResult.success ? (
                    <p className="text-green-600">Chunks: {chunkResult.chunksCount}</p>
                  ) : (
                    <p className="text-red-600">{chunkResult.error}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="w-full lg:w-80" interactive>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>Behind the scenes processing</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-1 text-xs text-[var(--color-text-muted)]">
              <li>Upload a PDF to the server.</li>
              <li>System parses and splits text.</li>
              <li>Creates overlapping chunks (1000 chars + 200 overlap).</li>
              <li>Stores chunks for retrieval / quizzes.</li>
              <li>Embeddings added (future vector step).</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold tracking-tight">Your PDFs</h2>
        <Button variant="subtle" size="sm" onClick={() => setRefreshFlag(f => f + 1)}>Refresh</Button>
      </div>

      {loadingPdfs ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 sm:h-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] animate-pulse" />
          ))}
        </div>
      ) : pdfs.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-gray-400 to-gray-500 flex items-center justify-center text-white text-xl sm:text-2xl">
            📁
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-2">No PDFs uploaded yet</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Upload your first PDF to get started with AI-powered learning.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {pdfs.map(pdf => (
            <Card key={pdf.id} interactive className="group overflow-hidden">
              <CardContent className="pt-4 sm:pt-5 pb-3 sm:pb-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-medium text-sm leading-snug line-clamp-2 flex-1 text-responsive">{pdf.title}</h3>
                  <Badge variant={pdf.hasChunks ? 'success' : 'warning'}>{pdf.hasChunks ? 'Ready' : 'Pending'}</Badge>
                </div>
                <div className="h-1.5 bg-[var(--color-border)]/60 rounded-full overflow-hidden mb-3">
                  <div className={`h-full transition-all ${pdf.hasChunks ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-500 w-full' : 'bg-gradient-to-r from-amber-400 to-amber-500 w-1/3 animate-pulse'}`} />
                </div>
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                  <span>{new Date(pdf.createdAt).toLocaleDateString()}</span>
                  <span>{pdf.chunksCount} chunks</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}