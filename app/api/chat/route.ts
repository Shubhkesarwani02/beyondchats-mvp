import { NextRequest, NextResponse } from 'next/server';
import { performEnhancedRAG } from '@/lib/rag';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export interface ChatRequest {
  query: string;
  pdfId: string;
  k?: number; // Number of chunks to retrieve (default: 5)
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  sources: Array<{
    id: string;
    pageNum: number;
    content: string;
    snippet: string;
    pdfTitle: string;
    similarity?: number;
  }>;
  query: string;
  pdfId: string;
  retrievedChunks: number;
}

export async function POST(request: NextRequest) {
  try {
    let requestData;
    try {
      requestData = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { query, pdfId, k = 5 }: ChatRequest = requestData;

    // Validate input
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!pdfId) {
      return NextResponse.json(
        { error: 'PDF ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Perform Enhanced RAG workflow
    const ragResult = await performEnhancedRAG(query, pdfId, k, 0.3);

    const response: ChatResponse = {
      success: true,
      answer: ragResult.answer,
      sources: ragResult.sources,
      query: ragResult.query,
      pdfId: ragResult.pdfId || pdfId,
      retrievedChunks: ragResult.retrievedChunks
    };

    return NextResponse.json(response, { headers: corsHeaders });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET endpoint for testing chat functionality
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || searchParams.get('q');
    const pdfId = searchParams.get('pdfId');
    const k = parseInt(searchParams.get('k') || '5');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!pdfId) {
      return NextResponse.json(
        { error: 'pdfId parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Process as POST request
    const response = await POST(new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ query, pdfId, k })
    }));

    return response;
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}