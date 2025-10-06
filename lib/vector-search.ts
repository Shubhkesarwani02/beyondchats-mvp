import { prisma } from '@/lib/prisma';
import { generateQueryEmbedding, formatVectorForDB } from '@/lib/embeddings';

export interface SearchResult {
  id: string;
  content: string;
  pageNum: number;
  similarity: number;
  pdfId: string;
}

/**
 * Perform semantic search using vector similarity
 */
export async function searchSimilarChunks(
  query: string,
  pdfId?: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<SearchResult[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query);
    const queryVector = formatVectorForDB(queryEmbedding);

    // Build the SQL query based on whether pdfId is provided
    let sqlQuery;
    let queryParams;

    if (pdfId) {
      sqlQuery = `
        SELECT 
          id,
          content,
          "pageNum",
          "pdfId",
          1 - (embedding <=> $1::vector) as similarity
        FROM "Chunk"
        WHERE "pdfId" = $2
          AND embedding IS NOT NULL
          AND 1 - (embedding <=> $1::vector) > $3
        ORDER BY embedding <=> $1::vector
        LIMIT $4
      `;
      queryParams = [queryVector, pdfId, threshold, limit];
    } else {
      sqlQuery = `
        SELECT 
          id,
          content,
          "pageNum",
          "pdfId",
          1 - (embedding <=> $1::vector) as similarity
        FROM "Chunk"
        WHERE embedding IS NOT NULL
          AND 1 - (embedding <=> $1::vector) > $2
        ORDER BY embedding <=> $1::vector
        LIMIT $3
      `;
      queryParams = [queryVector, threshold, limit];
    }

    // Execute the search query
    const results = await prisma.$queryRawUnsafe<SearchResult[]>(
      sqlQuery,
      ...queryParams
    );

    return results;
  } catch (error) {
    console.error('Error performing vector search:', error);
    throw new Error('Failed to perform semantic search');
  }
}

/**
 * Get context chunks for a specific PDF using hybrid search (semantic + keyword)
 */
export async function getRelevantContext(
  query: string,
  pdfId: string,
  maxChunks: number = 5
): Promise<string> {
  try {
    // Perform vector search
    const semanticResults = await searchSimilarChunks(query, pdfId, maxChunks, 0.3);
    
    // If we don't have enough semantic results, fall back to keyword search
    if (semanticResults.length < maxChunks) {
      const keywordResults = await prisma.$queryRaw<SearchResult[]>`
        SELECT 
          id,
          content,
          "pageNum",
          "pdfId",
          0.5 as similarity
        FROM "Chunk"
        WHERE "pdfId" = ${pdfId}
          AND (content ILIKE ${'%' + query + '%'} OR content ILIKE ${'%' + query.toLowerCase() + '%'})
          AND id NOT IN (${semanticResults.map(r => r.id).join(',') || "''"})
        ORDER BY "pageNum"
        LIMIT ${maxChunks - semanticResults.length}
      `;
      
      semanticResults.push(...keywordResults);
    }

    // Sort by page number for better context flow
    const sortedResults = semanticResults
      .sort((a, b) => a.pageNum - b.pageNum)
      .slice(0, maxChunks);

    // Combine the content into a single context string
    const context = sortedResults
      .map((result, index) => 
        `[Chunk ${index + 1} - Page ${result.pageNum}]:\n${result.content}\n`
      )
      .join('\n---\n\n');

    return context;
  } catch (error) {
    console.error('Error getting relevant context:', error);
    // Fallback to basic text search
    const fallbackResults = await prisma.chunk.findMany({
      where: {
        pdfId: pdfId,
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: {
        pageNum: 'asc',
      },
      take: maxChunks,
    });

    return fallbackResults
      .map((result, index) => 
        `[Chunk ${index + 1} - Page ${result.pageNum}]:\n${result.content}\n`
      )
      .join('\n---\n\n');
  }
}

/**
 * Search across all PDFs with vector similarity
 */
export async function globalSemanticSearch(
  query: string,
  limit: number = 10,
  threshold: number = 0.5
): Promise<(SearchResult & { pdfTitle?: string })[]> {
  try {
    const results = await searchSimilarChunks(query, undefined, limit, threshold);
    
    // Enrich results with PDF titles
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        const pdf = await prisma.pDF.findUnique({
          where: { id: result.pdfId },
          select: { title: true },
        });
        
        return {
          ...result,
          pdfTitle: pdf?.title,
        };
      })
    );

    return enrichedResults;
  } catch (error) {
    console.error('Error performing global semantic search:', error);
    throw new Error('Failed to perform global search');
  }
}