#!/usr/bin/env node

/**
 * Investigate the current state of chunks in the database
 */

const API_BASE = 'http://localhost:3000/api';

async function investigateChunks() {
  console.log('🕵️ Investigating chunk state in database...\n');
  
  try {
    // Get PDFs
    const pdfsResponse = await fetch(`${API_BASE}/pdfs`);
    const pdfsData = await pdfsResponse.json();
    
    console.log(`Found ${pdfsData.pdfs?.length || 0} PDFs:`);
    
    for (const pdf of pdfsData.pdfs || []) {
      console.log(`\n📄 PDF: ${pdf.title} (ID: ${pdf.id})`);
      
      // Test chunking for this PDF
      console.log('   Testing chunk generation...');
      const chunkResponse = await fetch(`${API_BASE}/chunk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfId: pdf.id })
      });
      
      if (chunkResponse.ok) {
        const chunkData = await chunkResponse.json();
        console.log(`   ✅ Chunk response: ${JSON.stringify(chunkData, null, 2)}`);
      } else {
        const chunkError = await chunkResponse.text();
        console.log(`   ❌ Chunk error: ${chunkError}`);
      }
      
      // Test embedding for this PDF
      console.log('   Testing embedding generation...');
      const embedResponse = await fetch(`${API_BASE}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfId: pdf.id })
      });
      
      if (embedResponse.ok) {
        const embedData = await embedResponse.json();
        console.log(`   ✅ Embed response: ${JSON.stringify(embedData, null, 2)}`);
      } else {
        const embedError = await embedResponse.text();
        console.log(`   ❌ Embed error: ${embedError}`);
      }
      
      // Test search specifically for this PDF
      console.log('   Testing PDF-specific search...');
      const searchResponse = await fetch(`${API_BASE}/search?q=test&pdfId=${pdf.id}&k=2`);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log(`   ✅ Search response: ${JSON.stringify(searchData, null, 2)}`);
      } else {
        const searchError = await searchResponse.text();
        console.log(`   ❌ Search error: ${searchError}`);
      }
      
      break; // Just test the first PDF for now
    }
    
    // Also test global search
    console.log('\n🌐 Testing global search...');
    const globalSearchResponse = await fetch(`${API_BASE}/search?q=test&k=5`);
    
    if (globalSearchResponse.ok) {
      const globalSearchData = await globalSearchResponse.json();
      console.log(`✅ Global search response: ${JSON.stringify(globalSearchData, null, 2)}`);
    } else {
      const globalSearchError = await globalSearchResponse.text();
      console.log(`❌ Global search error: ${globalSearchError}`);
    }
    
  } catch (error) {
    console.error(`❌ Investigation failed: ${error.message}`);
  }
}

investigateChunks().catch(console.error);