'use client';

import { useState } from 'react';

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

      const result = await response.json();
      setUploadResult(result);
      
      if (result.success) {
        // Auto-trigger chunking after successful upload
        handleChunk(result.pdfId);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadResult({ error: 'Upload failed' });
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

      const result = await response.json();
      setChunkResult(result);
    } catch (error) {
      console.error('Chunking failed:', error);
      setChunkResult({ error: 'Chunking failed' });
    } finally {
      setChunking(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Upload PDF</h1>
      
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
        <div className="text-center">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="mb-4"
          />
          
          {file && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">Selected: {file.name}</p>
              <p className="text-xs text-gray-500">Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
          
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </button>
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className="mb-6 p-4 rounded border">
          <h3 className="font-bold mb-2">Upload Result:</h3>
          {uploadResult.success ? (
            <div className="text-green-600">
              <p>✅ {uploadResult.message}</p>
              <p>PDF ID: {uploadResult.pdfId}</p>
              <p>Filename: {uploadResult.filename}</p>
            </div>
          ) : (
            <div className="text-red-600">
              <p>❌ {uploadResult.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Chunking Status */}
      {chunking && (
        <div className="mb-6 p-4 rounded border bg-blue-50">
          <p>🔄 Processing PDF chunks...</p>
        </div>
      )}

      {/* Chunk Result */}
      {chunkResult && (
        <div className="mb-6 p-4 rounded border">
          <h3 className="font-bold mb-2">Chunking Result:</h3>
          {chunkResult.success ? (
            <div className="text-green-600">
              <p>✅ {chunkResult.message}</p>
              <p>Chunks created: {chunkResult.chunksCount}</p>
              <p>PDF: {chunkResult.pdfTitle}</p>
            </div>
          ) : (
            <div className="text-red-600">
              <p>❌ {chunkResult.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 p-4 rounded border">
        <h3 className="font-bold mb-2">How it works:</h3>
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
          <li>Select a PDF file to upload</li>
          <li>Click &quot;Upload PDF&quot; to save it to the server</li>
          <li>The system will automatically parse and chunk the PDF</li>
          <li>Text is split into 1000-character chunks with 200-character overlap</li>
          <li>Chunks are saved to the database (embeddings will be added later)</li>
        </ol>
      </div>
    </div>
  );
}