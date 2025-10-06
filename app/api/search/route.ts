import { NextRequest, NextResponse } from 'next/server';
import { searchSimilarChunks, globalSemanticSearch, getRelevantContext } from '@/lib/vector-search';

export async function POST(request: NextRequest) {
  try {
    const { query, pdfId, searchType = 'semantic', limit = 5, threshold = 0.7 } = await request.json();
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    let results;

    switch (searchType) {
      case 'semantic':
        if (pdfId) {
          results = await searchSimilarChunks(query, pdfId, limit, threshold);
        } else {
          results = await globalSemanticSearch(query, limit, threshold);
        }
        break;
        
      case 'context':
        if (!pdfId) {
          return NextResponse.json(
            { error: 'PDF ID is required for context search' },
            { status: 400 }
          );
        }
        const context = await getRelevantContext(query, pdfId, limit);
        return NextResponse.json({
          success: true,
          context: context,
          query: query,
          pdfId: pdfId,
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid search type. Use "semantic" or "context"' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      results: results,
      query: query,
      searchType: searchType,
      resultCount: results.length,
      pdfId: pdfId || null,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing search functionality
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const pdfId = searchParams.get('pdfId');
    const limit = parseInt(searchParams.get('limit') || '5');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    let results;
    if (pdfId) {
      results = await searchSimilarChunks(query, pdfId, limit);
    } else {
      results = await globalSemanticSearch(query, limit);
    }

    return NextResponse.json({
      success: true,
      results: results,
      query: query,
      resultCount: results.length,
      pdfId: pdfId || null,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}