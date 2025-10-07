#!/usr/bin/env node

/**
 * Generate embeddings for all PDFs using the API
 */

const API_BASE = 'http://localhost:3000/api';

async function generateEmbeddingsForAllPDFs() {
  console.log('🚀 Generating embeddings for all PDFs...\n');
  
  try {
    // Get all PDFs
    console.log('📋 Fetching PDF list...');
    const pdfsResponse = await fetch(`${API_BASE}/pdfs`);
    const pdfsData = await pdfsResponse.json();
    
    if (!pdfsData.success || !pdfsData.pdfs || pdfsData.pdfs.length === 0) {
      console.log('❌ No PDFs found in database');
      return;
    }
    
    console.log(`✅ Found ${pdfsData.pdfs.length} PDFs`);
    
    // Generate embeddings for each PDF
    for (let i = 0; i < pdfsData.pdfs.length; i++) {
      const pdf = pdfsData.pdfs[i];
      console.log(`\n📄 Processing PDF ${i + 1}/${pdfsData.pdfs.length}: ${pdf.title}`);
      console.log(`   PDF ID: ${pdf.id}`);
      
      try {
        // Call the embed endpoint
        const embedResponse = await fetch(`${API_BASE}/embed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pdfId: pdf.id
          }),
        });
        
        if (embedResponse.ok) {
          const embedData = await embedResponse.json();
          if (embedData.success) {
            console.log(`   ✅ Generated embeddings for ${embedData.processedCount} chunks`);
          } else {
            console.log(`   ⚠️ ${embedData.message || 'Unknown response'}`);
          }
        } else {
          const errorText = await embedResponse.text();
          console.log(`   ❌ Embedding failed: HTTP ${embedResponse.status}`);
          console.log(`   Error: ${errorText}`);
        }
        
        // Small delay between PDFs to avoid overwhelming the API
        if (i < pdfsData.pdfs.length - 1) {
          console.log('   ⏳ Waiting 3 seconds before next PDF...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.log(`   ❌ Error processing PDF: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Embedding generation complete!');
    
    // Test if search works now
    console.log('\n🔍 Testing search functionality...');
    const searchResponse = await fetch(`${API_BASE}/search?q=test&k=1`);
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.success && searchData.results && searchData.results.length > 0) {
        console.log(`✅ Search is working! Found ${searchData.resultCount} results`);
        console.log(`   Sample result similarity: ${searchData.results[0].similarity?.toFixed(3) || 'N/A'}`);
      } else {
        console.log('⚠️ Search returned no results (this might be normal)');
      }
    } else {
      const searchError = await searchResponse.text();
      console.log(`❌ Search still failing: ${searchError}`);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

// Run the script
generateEmbeddingsForAllPDFs().catch(console.error);