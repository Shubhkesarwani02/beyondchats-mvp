import { prisma } from './prisma';
import { askGemini, askGeminiWithRAG } from './gemini';
import { searchSimilarChunks, globalSemanticSearch } from './vector-search';

export interface RAGResult {
  answer: string;
  sources: Array<{
    content: string;
    pageNum: number;
    pdfTitle: string;
  }>;
}

export interface EnhancedRAGResult {
  answer: string;
  sources: Array<{
    id: string;
    content: string;
    pageNum: number;
    pdfTitle: string;
    snippet: string;
    similarity?: number;
  }>;
  query: string;
  pdfId?: string;
  retrievedChunks: number;
}

/**
 * Enhanced RAG function that uses the new citation-aware Gemini integration
 */
export async function performEnhancedRAG(
  query: string, 
  pdfId?: string, 
  maxChunks: number = 5,
  similarityThreshold: number = 0.3
): Promise<EnhancedRAGResult> {
  try {
    let searchResults;
    
    // Perform vector search
    if (pdfId) {
      searchResults = await searchSimilarChunks(query, pdfId, maxChunks, similarityThreshold);
    } else {
      searchResults = await globalSemanticSearch(query, maxChunks, similarityThreshold);
    }

    // If no results from vector search, try keyword fallback
    if (searchResults.length === 0) {
      const keywordResults = await prisma.chunk.findMany({
        where: {
          AND: [
            pdfId ? { pdfId } : {},
            {
              content: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        },
        include: {
          pdf: true
        },
        take: maxChunks,
        orderBy: {
          pageNum: 'asc'
        }
      });

      searchResults = keywordResults.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        pageNum: chunk.pageNum,
        pdfId: chunk.pdfId,
        similarity: 0.5, // Default similarity for keyword results
      }));
    }

    if (searchResults.length === 0) {
      return {
        answer: "No relevant documents found. Please upload a PDF first or try a different search query.",
        sources: [],
        query,
        pdfId,
        retrievedChunks: 0
      };
    }

    // Get PDF information for all chunks
    const chunkIds = searchResults.map(r => r.id);
    const chunksWithPdf = await prisma.chunk.findMany({
      where: {
        id: { in: chunkIds }
      },
      include: {
        pdf: true
      },
      orderBy: {
        pageNum: 'asc'
      }
    });

    // Prepare data for RAG
    const ragChunks = chunksWithPdf.map(chunk => ({
      content: chunk.content,
      pageNum: chunk.pageNum,
      pdfTitle: chunk.pdf.title
    }));

    // Generate answer with citations
    const answer = await askGeminiWithRAG(query, ragChunks);

    // Format sources
    const sources = chunksWithPdf.map(chunk => {
      const searchResult = searchResults.find(r => r.id === chunk.id);
      return {
        id: chunk.id,
        content: chunk.content,
        pageNum: chunk.pageNum,
        pdfTitle: chunk.pdf.title,
        snippet: chunk.content.length > 200 
          ? chunk.content.substring(0, 200) + '...' 
          : chunk.content,
        similarity: searchResult?.similarity
      };
    });

    return {
      answer,
      sources,
      query,
      pdfId,
      retrievedChunks: sources.length
    };

  } catch (error) {
    console.error('Error performing enhanced RAG:', error);
    return {
      answer: "Sorry, there was an error processing your query. Please try again.",
      sources: [],
      query,
      pdfId,
      retrievedChunks: 0
    };
  }
}

/**
 * Legacy RAG function for backward compatibility
 */
export async function performRAG(query: string, pdfId?: string): Promise<RAGResult> {
  try {
    let chunks;
    
    // Try vector search first (if embeddings are available)
    try {
      if (pdfId) {
        const vectorResults = await searchSimilarChunks(query, pdfId, 5, 0.3);
        
        // If we get good vector results, use them
        if (vectorResults.length > 0) {
          // Get full chunk data with PDF info
          chunks = await prisma.chunk.findMany({
            where: {
              id: { in: vectorResults.map(r => r.id) }
            },
            include: {
              pdf: true
            },
            orderBy: {
              pageNum: 'asc'
            }
          });
        }
      } else {
        const globalResults = await globalSemanticSearch(query, 5, 0.3);
        
        if (globalResults.length > 0) {
          chunks = await prisma.chunk.findMany({
            where: {
              id: { in: globalResults.map(r => r.id) }
            },
            include: {
              pdf: true
            },
            orderBy: {
              pageNum: 'asc'
            }
          });
        }
      }
    } catch (vectorError) {
      console.log('Vector search failed, falling back to keyword search:', vectorError);
    }
    
    // Fallback to basic keyword search if vector search failed or found no results
    if (!chunks || chunks.length === 0) {
      chunks = await prisma.chunk.findMany({
        where: {
          AND: [
            pdfId ? { pdfId } : {},
            {
              content: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        },
        include: {
          pdf: true
        },
        take: 5,
        orderBy: {
          pageNum: 'asc'
        }
      });
    }

    if (chunks.length === 0) {
      return {
        answer: "No relevant documents found. Please upload a PDF first or try a different search query.",
        sources: []
      };
    }

    // Create context from chunks
    const context = chunks.map((chunk) => 
      `From "${chunk.pdf.title}" (page ${chunk.pageNum}): ${chunk.content}`
    ).join('\n\n');

    // Generate answer using Gemini
    const prompt = `Based on the following context, answer the question: "${query}"

Context:
${context}

Please provide a comprehensive answer based only on the information provided in the context. If the context doesn't contain enough information to answer the question, please say so.`;

    const answer = await askGemini(prompt);

    return {
      answer,
      sources: chunks.map((chunk) => ({
        content: chunk.content,
        pageNum: chunk.pageNum,
        pdfTitle: chunk.pdf.title
      }))
    };
  } catch (error) {
    console.error('Error performing RAG:', error);
    return {
      answer: "Sorry, there was an error processing your query.",
      sources: []
    };
  }
}