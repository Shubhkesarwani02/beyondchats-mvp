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

// GET endpoint: /api/search?q=&pdfId=&k=5
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const pdfId = searchParams.get('pdfId');
    const k = parseInt(searchParams.get('k') || '5'); // Changed from 'limit' to 'k' as per spec
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Embed query text with Gemini embeddings and perform vector search
    let results;
    if (pdfId) {
      results = await searchSimilarChunks(query, pdfId, k, 0.3);
    } else {
      results = await globalSemanticSearch(query, k, 0.3);
    }

    // Format results to include page numbers and snippets
    const formattedResults = results.map(result => ({
      id: result.id,
      content: result.content,
      pageNum: result.pageNum,
      similarity: result.similarity,
      pdfId: result.pdfId,
      // Add snippet preview (first 200 chars)
      snippet: result.content.length > 200 
        ? result.content.substring(0, 200) + '...' 
        : result.content
    }));

    return NextResponse.json({
      success: true,
      results: formattedResults,
      query: query,
      resultCount: formattedResults.length,
      pdfId: pdfId || null,
      k: k
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