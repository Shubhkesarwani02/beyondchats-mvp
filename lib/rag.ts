import { prisma } from './prisma';
import { askGemini } from './gemini';

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
    // TODO: Implement vector similarity search
    // For now, we'll just return a basic response
    
    const chunks = await prisma.chunk.findMany({
      where: pdfId ? { pdfId } : {},
      include: {
        pdf: true
      },
      take: 5 // Limit to top 5 chunks for now
    });

    if (chunks.length === 0) {
      return {
        answer: "No relevant documents found. Please upload a PDF first.",
        sources: []
      };
    }

    // Create context from chunks
    const context = chunks.map((chunk: any) => 
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
      sources: chunks.map((chunk: any) => ({
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