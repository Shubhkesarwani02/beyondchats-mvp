#!/usr/bin/env node

/**
 * Simple database connection test
 */

async function testDatabaseConnection() {
  console.log('🗄️ Testing database connection and schema...\n');
  
  try {
    // Test the API endpoints one by one
    console.log('1. Testing PDFs endpoint...');
    const pdfsResponse = await fetch('http://localhost:3000/api/pdfs');
    
    if (pdfsResponse.ok) {
      const pdfsData = await pdfsResponse.json();
      console.log(`   ✅ PDFs: Found ${pdfsData.pdfs?.length || 0} PDFs`);
      
      if (pdfsData.pdfs && pdfsData.pdfs.length > 0) {
        const pdfId = pdfsData.pdfs[0].id;
        console.log(`   📄 Sample PDF ID: ${pdfId}`);
        
        // Test the search endpoint with minimal query
        console.log('\n2. Testing search endpoint...');
        const searchResponse = await fetch(`http://localhost:3000/api/search?q=a&k=1`);
        console.log(`   Search response status: ${searchResponse.status}`);
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          console.log(`   ✅ Search response:`, JSON.stringify(searchData, null, 2));
        } else {
          const errorText = await searchResponse.text();
          console.log(`   ❌ Search error:`, errorText);
        }
        
        // Test the embed endpoint
        console.log('\n3. Testing embed endpoint...');
        const embedResponse = await fetch('http://localhost:3000/api/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfId: pdfId })
        });
        
        console.log(`   Embed response status: ${embedResponse.status}`);
        
        if (embedResponse.ok) {
          const embedData = await embedResponse.json();
          console.log(`   ✅ Embed response:`, JSON.stringify(embedData, null, 2));
        } else {
          const errorText = await embedResponse.text();
          console.log(`   ❌ Embed error:`, errorText);
        }
      }
    } else {
      console.log(`   ❌ PDFs endpoint failed: ${pdfsResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testDatabaseConnection().catch(console.error);