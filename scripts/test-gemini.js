async function testGemini() {
  try {
    console.log('🤖 Testing Gemini API...');
    
    // Import using dynamic import since we're in a Node.js script
    const { askGemini } = await import('../lib/gemini.js');
    
    const response = await askGemini('What is 2+2? Respond with just the number.');
    console.log('Gemini response:', response);
    console.log('✅ Gemini API working!');
  } catch (error) {
    console.error('❌ Gemini API failed:', error);
  }
}

testGemini();