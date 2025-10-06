import { prisma } from './prisma';
import { askGemini } from './gemini';
import { searchSimilarChunks, globalSemanticSearch } from './vector-search';

export interface RAGResult {
  answer: string;
  sources: Array<{
    content: string;
    pageNum: number;
    pdfTitle: string;
  }>;
}

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