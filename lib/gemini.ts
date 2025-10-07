

// Alternative model names to try if the primary fails (based on actual available models)
const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.5-pro-preview-03-25',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b-exp-0827',
  'gemini-1.5-flash-8b-exp-0924',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-001',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro-002',
  'gemini-1.5-pro-001',
  'gemini-1.5-pro-exp-0827',
  'gemini-1.0-pro-latest',
  'gemini-1.0-pro-001',
  'gemini-1.0-pro',
  'gemini-pro'
];

export async function listAvailableModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    if (response.ok) {
      const data = await response.json();
      return data.models?.map((model: { name: string }) => model.name) || [];
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
  return [];
}

export async function askGemini(prompt: string) {
  try {
    // Try different model names if the primary fails
    let res: Response | null = null;
    let lastError: string = '';
    
    for (const modelName of FALLBACK_MODELS) {
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ 
              parts: [{ text: prompt }] 
            }] 
          }),
        });

        if (res.ok) {
          console.log(`Successfully used model: ${modelName}`);
          break;
        } else {
          const errorText = await res.text();
          lastError = `${modelName}: ${res.status} - ${errorText}`;
          console.warn(`Model ${modelName} failed: ${lastError}`);
        }
      } catch (error) {
        lastError = `${modelName}: ${error}`;
        console.warn(`Model ${modelName} error:`, error);
      }
    }

    if (!res || !res.ok) {
      console.error(`All Gemini models failed. Last error: ${lastError}`);
      return "Error: Could not get response from Gemini - all models failed";
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return "Error: Could not get response from Gemini";
  }
}

/**
 * Enhanced Gemini function for RAG workflows with citation support
 */
export async function askGeminiWithRAG(
  query: string, 
  chunks: Array<{ content: string; pageNum: number; pdfTitle?: string }>,
  systemPrompt?: string
) {
  try {
    const defaultSystemPrompt = `You are an intelligent document assistant. Answer questions based only on the provided context from the document(s). 

CITATION REQUIREMENTS:
- Always include page references when citing information
- Use the format: "According to p. X: 'direct quote'" 
- Include relevant snippets when making claims
- If information spans multiple pages, reference all relevant pages
- Be precise with your citations and quotes

RESPONSE GUIDELINES:
- Answer only based on the provided context
- If the context doesn't contain enough information, state this clearly
- Be comprehensive but concise
- Structure your answer logically
- Maintain academic rigor in citations`;

    const contextText = chunks.map((chunk, index) => 
      `[Source ${index + 1}${chunk.pdfTitle ? ` from "${chunk.pdfTitle}"` : ''} - Page ${chunk.pageNum}]:\n"${chunk.content}"`
    ).join('\n\n');

    const fullPrompt = `${systemPrompt || defaultSystemPrompt}

DOCUMENT CONTEXT:
${contextText}

USER QUESTION: ${query}

ANSWER:`;

    // Try different model names if the primary fails
    let res: Response | null = null;
    let lastError: string = '';
    
    for (const modelName of FALLBACK_MODELS) {
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ 
              parts: [{ text: fullPrompt }] 
            }],
            generationConfig: {
              temperature: 0.1, // Lower temperature for more factual responses
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 2048,
            }
          }),
        });

        if (res.ok) {
          console.log(`Successfully used model: ${modelName}`);
          break;
        } else {
          const errorText = await res.text();
          lastError = `${modelName}: ${res.status} - ${errorText}`;
          console.warn(`Model ${modelName} failed: ${lastError}`);
        }
      } catch (error) {
        lastError = `${modelName}: ${error}`;
        console.warn(`Model ${modelName} error:`, error);
      }
    }

    if (!res || !res.ok) {
      console.error(`All Gemini models failed. Last error: ${lastError}`);
      throw new Error(`Gemini API error: All models failed. Last: ${lastError}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";
  } catch (error) {
    console.error('Error calling Gemini RAG API:', error);
    return "Error: Could not generate response. Please try again.";
  }
}