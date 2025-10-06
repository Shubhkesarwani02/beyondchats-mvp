export async function askGemini(prompt: string) {
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ 
          parts: [{ text: prompt }] 
        }] 
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return "Error: Could not get response from Gemini";
  }
}