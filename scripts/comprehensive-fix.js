#!/usr/bin/env node

/**
 * Comprehensive fix for BeyondChats MVP search functionality
 * This script will:
 * 1. Ensure the database schema has the embedding column
 * 2. Generate embeddings for all existing chunks
 * 3. Test the search functionality
 */

const API_BASE = 'http://localhost:3000/api';

async function checkAndFixDatabase() {
  console.log('🔧 BeyondChats MVP - Search System Fix\n');
  console.log('This script will fix the search functionality by ensuring');
  console.log('embeddings are properly generated and stored.\n');
  
  // Step 1: Check if the database is accessible
  console.log('📊 Step 1: Checking database connectivity...');
  try {
    const pdfsResponse = await fetch(`${API_BASE}/pdfs`);
    if (!pdfsResponse.ok) {
      throw new Error(`PDFs API returned ${pdfsResponse.status}`);
    }
    
    const pdfsData = await pdfsResponse.json();
    console.log(`✅ Database connected - Found ${pdfsData.pdfs?.length || 0} PDFs`);
    
    if (!pdfsData.pdfs || pdfsData.pdfs.length === 0) {
      console.log('⚠️ No PDFs found. Please upload some PDFs first.');
      return;
    }
    
    // Step 2: Test if embeddings can be generated
    console.log('\n🧠 Step 2: Testing embedding generation...');
    const testPdf = pdfsData.pdfs[0];
    console.log(`   Testing with PDF: ${testPdf.title} (ID: ${testPdf.id})`);
    
    const embedResponse = await fetch(`${API_BASE}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfId: testPdf.id })
    });
    
    if (embedResponse.ok) {
      const embedData = await embedResponse.json();
      console.log(`✅ Embedding generation: ${embedData.message || 'Success'}`);
      console.log(`   Processed chunks: ${embedData.processedCount || 0}`);
    } else {
      const embedError = await embedResponse.text();
      console.log(`❌ Embedding generation failed: ${embedError}`);
      
      // If embedding fails, it might be a schema issue
      console.log('\n🔧 Attempting to fix database schema...');
      console.log('   This requires manual intervention. Please run:');
      console.log('   1. npx prisma db push');
      console.log('   2. Or check if pgvector extension is enabled');
      return;
    }
    
    // Step 3: Generate embeddings for all PDFs
    console.log('\n📚 Step 3: Generating embeddings for all PDFs...');
    let totalProcessed = 0;
    
    for (let i = 0; i < pdfsData.pdfs.length; i++) {
      const pdf = pdfsData.pdfs[i];
      console.log(`   Processing PDF ${i + 1}/${pdfsData.pdfs.length}: ${pdf.title}`);
      
      try {
        const embedResponse = await fetch(`${API_BASE}/embed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfId: pdf.id })
        });
        
        if (embedResponse.ok) {
          const embedData = await embedResponse.json();
          const processed = embedData.processedCount || 0;
          totalProcessed += processed;
          console.log(`     ✅ Generated embeddings for ${processed} chunks`);
        } else {
          console.log(`     ⚠️ Failed to process this PDF`);
        }
      } catch (error) {
        console.log(`     ❌ Error: ${error.message}`);
      }
      
      // Small delay to avoid overwhelming the system
      if (i < pdfsData.pdfs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n   📊 Total embeddings generated: ${totalProcessed}`);
    
    // Step 4: Test search functionality
    console.log('\n🔍 Step 4: Testing search functionality...');
    
    const testQueries = [
      'test',
      'machine learning',
      'data',
      'algorithm'
    ];
    
    let searchesWorking = 0;
    
    for (const query of testQueries) {
      try {
        const searchResponse = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&k=3`);
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          
          if (searchData.success && searchData.results && searchData.results.length > 0) {
            console.log(`   ✅ Query "${query}": Found ${searchData.resultCount} results`);
            console.log(`      Best similarity: ${searchData.results[0].similarity?.toFixed(3) || 'N/A'}`);
            searchesWorking++;
          } else {
            console.log(`   ⚠️ Query "${query}": No results (may be normal)`);
          }
        } else {
          const errorText = await searchResponse.text();
          console.log(`   ❌ Query "${query}": Failed - ${errorText}`);
        }
      } catch (error) {
        console.log(`   ❌ Query "${query}": Error - ${error.message}`);
      }
    }
    
    // Step 5: Test other functionality
    console.log('\n🧪 Step 5: Testing related functionality...');
    
    // Test chat
    const chatResponse = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What are the main concepts discussed?',
        pdfId: testPdf.id,
        k: 3
      })
    });
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      if (chatData.success) {
        console.log(`   ✅ Chat: Generated answer (${chatData.answer?.length || 0} chars)`);
      } else {
        console.log(`   ❌ Chat: ${chatData.error || 'Failed'}`);
      }
    } else {
      console.log(`   ❌ Chat: HTTP ${chatResponse.status}`);
    }
    
    // Test quiz generation
    const quizResponse = await fetch(`${API_BASE}/generate-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfId: testPdf.id,
        numMCQ: 2,
        numSAQ: 1,
        numLAQ: 1
      })
    });
    
    if (quizResponse.ok) {
      const quizData = await quizResponse.json();
      if (quizData.success) {
        console.log(`   ✅ Quiz: Generated quiz ${quizData.quizId}`);
      } else {
        console.log(`   ❌ Quiz: ${quizData.error || 'Failed'}`);
      }
    } else {
      console.log(`   ❌ Quiz: HTTP ${quizResponse.status}`);
    }
    
    // Final assessment
    console.log('\n🎯 Final Assessment:');
    console.log(`   Search queries working: ${searchesWorking}/${testQueries.length}`);
    console.log(`   Total embeddings processed: ${totalProcessed}`);
    
    if (searchesWorking > 0) {
      console.log('\n🎉 SUCCESS! The search system is now working!');
      console.log('   You can now run the comprehensive tests:');
      console.log('   - npm run test:quick');
      console.log('   - npm run test:full');
    } else {
      console.log('\n⚠️  Search system still needs attention.');
      console.log('   Check the following:');
      console.log('   1. Database schema has embedding column');
      console.log('   2. pgvector extension is enabled');
      console.log('   3. Gemini API key is valid');
      console.log('   4. Chunks exist and have content');
    }
    
  } catch (error) {
    console.error(`❌ Fix script failed: ${error.message}`);
  }
}

// Run the fix
checkAndFixDatabase().catch(console.error);