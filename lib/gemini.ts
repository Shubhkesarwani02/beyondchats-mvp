export async function askGemini(prompt: string) {
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ 
          parts: [{ text: prompt }] 
        }] 
      }),
    });

    if (!res.ok) {
      console.error(`Gemini API error: ${res.status} - ${await res.text()}`);
      throw new Error(`Gemini API error: ${res.status}`);
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

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + process.env.GEMINI_API_KEY, {
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

    if (!res.ok) {
      console.error(`Gemini API error: ${res.status} - ${await res.text()}`);
      throw new Error(`Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";
  } catch (error) {
    console.error('Error calling Gemini RAG API:', error);
    return "Error: Could not generate response. Please try again.";
  }
}