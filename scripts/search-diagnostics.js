#!/usr/bin/env node

/**
 * Diagnostic script for BeyondChats Search API issues
 */

const API_BASE = 'http://localhost:3000/api';

async function testGeminiAPI() {
  console.log('🔍 Testing Gemini API connectivity...\n');
  
  const GEMINI_API_KEY = 'AIzaSyD4iEmr9OQXV1zRZhBN7jW5jlSMjD7HhjE';
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: {
            parts: [{ text: 'test query' }]
          },
          taskType: 'RETRIEVAL_QUERY'
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Gemini API: Working correctly');
      console.log(`   Embedding dimension: ${data.embedding?.values?.length || 'unknown'}`);
    } else {
      console.log(`❌ Gemini API: HTTP ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Gemini API: ${error.message}`);
  }
}

async function testDatabase() {
  console.log('\n🗃️ Testing Database connectivity...\n');
  
  try {
    const response = await fetch(`${API_BASE}/pdfs`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Database: Connected');
      console.log(`   PDFs found: ${data.pdfs?.length || 0}`);
      
      if (data.pdfs && data.pdfs.length > 0) {
        const pdfId = data.pdfs[0].id;
        console.log(`   Sample PDF ID: ${pdfId}`);
        return pdfId;
      }
    } else {
      console.log(`❌ Database: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Database: ${error.message}`);
  }
  
  return null;
}

async function testSearchDirect() {
  console.log('\n🔍 Testing Search API directly...\n');
  
  try {
    console.log('Testing: GET /api/search?q=test&k=1');
    const response = await fetch(`${API_BASE}/search?q=test&k=1`);
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`Response length: ${responseText.length} chars`);
    
    try {
      const data = JSON.parse(responseText);
      console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.log('Raw response:', responseText.substring(0, 500));
    }
    
  } catch (error) {
    console.log(`❌ Search API: ${error.message}`);
  }
}

async function checkChunksInDatabase() {
  console.log('\n📊 Checking if chunks have embeddings...\n');
  
  try {
    // We'll use a simple approach - try to access the database through the API
    const response = await fetch(`${API_BASE}/pdfs`);
    if (response.ok) {
      const data = await response.json();
      console.log(`Found ${data.pdfs?.length || 0} PDFs in database`);
      
      // Check if any PDF has processed chunks by trying a simple search
      // This would fail if there are no embeddings
      console.log('Checking if embeddings exist by testing vector search...');
      
      // We need to check the actual database, but through the API
      // Let's see if there's a chunks endpoint
    }
  } catch (error) {
    console.log(`Error checking chunks: ${error.message}`);
  }
}

async function runDiagnostics() {
  console.log('🚀 BeyondChats MVP - Search API Diagnostics');
  console.log('===========================================\n');
  
  await testGeminiAPI();
  const pdfId = await testDatabase();
  await checkChunksInDatabase();
  await testSearchDirect();
  
  console.log('\n📋 Diagnostic Complete!');
  console.log('\nNext steps:');
  console.log('1. Check server logs for detailed error messages');
  console.log('2. Verify that PDFs have been processed and chunked');
  console.log('3. Ensure embeddings have been generated for chunks');
  console.log('4. Check database indexes on embedding column');
}

// Run diagnostics
runDiagnostics().catch(console.error);