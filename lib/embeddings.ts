// Gemini Embeddings API utility functions

export interface EmbeddingResponse {
  embedding: {
    values: number[];
  };
}

export interface BatchEmbeddingResponse {
  embeddings: Array<{
    values: number[];
  }>;
}

/**
 * Generate embedding for a single text using Gemini Embeddings API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: {
            parts: [{ text: text }]
          },
          taskType: 'RETRIEVAL_DOCUMENT',
          title: 'Document chunk'
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini Embeddings API error: ${response.status} ${response.statusText}`);
    }

    const data: EmbeddingResponse = await response.json();
    
    if (!data.embedding?.values) {
      throw new Error('Invalid embedding response format');
    }

    return data.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch using Gemini Embeddings API
 * Note: Gemini API doesn't support true batch requests, so we'll make concurrent requests
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    // Limit concurrent requests to avoid rate limiting
    const batchSize = 10;
    const results: number[][] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      // Make concurrent requests for the batch
      const batchPromises = batch.map(text => generateEmbedding(text));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw error;
  }
}

/**
 * Generate embedding for search queries
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: {
            parts: [{ text: query }]
          },
          taskType: 'RETRIEVAL_QUERY'
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini Embeddings API error: ${response.status} ${response.statusText}`);
    }

    const data: EmbeddingResponse = await response.json();
    
    if (!data.embedding?.values) {
      throw new Error('Invalid embedding response format');
    }

    return data.embedding.values;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    throw error;
  }
}

/**
 * Convert number array to pgvector format string
 */
export function formatVectorForDB(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}