/**
 * API client utilities for the RAG system
 */

export interface SearchResult {
  id: string;
  content: string;
  pageNum: number;
  similarity: number;
  pdfId: string;
  snippet: string;
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  query: string;
  resultCount: number;
  pdfId: string | null;
  k: number;
}

export interface ChatSource {
  id: string;
  pageNum: number;
  content: string;
  snippet: string;
  pdfTitle: string;
  similarity?: number;
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  sources: ChatSource[];
  query: string;
  pdfId: string;
  retrievedChunks: number;
}

export interface ApiError {
  error: string;
  details?: string;
}

/**
 * Search for documents using vector similarity
 */
export async function searchDocuments(
  query: string,
  pdfId?: string,
  k: number = 5
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    k: k.toString(),
    ...(pdfId && { pdfId })
  });

  const response = await fetch(`/api/search?${params}`);
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Search failed');
  }

  return response.json();
}

/**
 * Chat with a document using RAG
 */
export async function chatWithDocument(
  query: string,
  pdfId: string,
  k: number = 5
): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      pdfId,
      k
    }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Chat request failed');
  }

  return response.json();
}

/**
 * Extract citations from chat response
 */
export function extractCitations(answer: string): Array<{ pageNum: number; quote: string }> {
  const citationRegex = /According to p\. (\d+): ['""]([^'""]+)['"]/g;
  const citations: Array<{ pageNum: number; quote: string }> = [];
  let match;

  while ((match = citationRegex.exec(answer)) !== null) {
    citations.push({
      pageNum: parseInt(match[1]),
      quote: match[2]
    });
  }

  return citations;
}

/**
 * Format answer for display with highlighted citations
 */
export function formatAnswerWithCitations(
  answer: string,
  onCitationClick?: (pageNum: number) => void
): string {
  if (!onCitationClick) return answer;

  return answer.replace(
    /According to p\. (\d+): (['""][^'""]+['"])/g,
    (match, pageNum) => {
      return `<span class="citation" data-page="${pageNum}" style="cursor: pointer; color: blue; text-decoration: underline;">${match}</span>`;
    }
  );
}

/**
 * Helper to debounce search requests
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Stream chat responses (for future implementation)
 */
export async function* streamChatWithDocument(
  query: string,
  pdfId: string,
  k: number = 5
): AsyncGenerator<string, void, unknown> {
  // This is a placeholder for future streaming implementation
  // For now, it returns the full response
  const response = await chatWithDocument(query, pdfId, k);
  yield response.answer;
}