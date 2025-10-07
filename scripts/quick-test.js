#!/usr/bin/env node

/**
 * Quick Test Runner for BeyondChats MVP
 * Usage: npm run test:quick or node scripts/quick-test.js
 */

const API_BASE = 'http://localhost:3000/api';

async function quickHealthCheck() {
  console.log('🏥 Running Quick Health Check...\n');
  
  const checks = [
    { name: 'Search API', url: `${API_BASE}/search?q=test&k=1` },
    { name: 'PDF List', url: `${API_BASE}/pdfs` },
    { name: 'Main App', url: 'http://localhost:3000' }
  ];
  
  for (const check of checks) {
    try {
      const response = await fetch(check.url);
      console.log(`${response.ok ? '✅' : '❌'} ${check.name}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${check.name}: ${error.message}`);
    }
  }
}

async function quickFunctionalTest() {
  console.log('\n🧪 Running Quick Functional Test...\n');
  
  // Test 1: Search
  try {
    const searchResponse = await fetch(`${API_BASE}/search?q=machine learning&k=3`);
    const searchData = await searchResponse.json();
    
    if (searchData.success && searchData.results) {
      console.log(`✅ Search: Found ${searchData.resultCount} results`);
      
      // Test 2: Chat (if we have results)
      if (searchData.results.length > 0) {
        const pdfId = searchData.results[0].pdfId;
        
        const chatResponse = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: 'What are the main concepts?',
            pdfId: pdfId,
            k: 3
          })
        });
        
        const chatData = await chatResponse.json();
        
        if (chatData.success && chatData.answer) {
          console.log(`✅ Chat: Generated answer (${chatData.answer.length} chars)`);
          
          // Test 3: Quiz Generation
          const quizResponse = await fetch(`${API_BASE}/generate-quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pdfId: pdfId,
              numMCQ: 2,
              numSAQ: 1,
              numLAQ: 1
            })
          });
          
          const quizData = await quizResponse.json();
          
          if (quizData.success && quizData.quizId) {
            console.log(`✅ Quiz: Generated quiz ${quizData.quizId}`);
          } else {
            console.log(`❌ Quiz: ${quizData.error || 'Generation failed'}`);
          }
        } else {
          console.log(`❌ Chat: ${chatData.error || 'Failed to generate answer'}`);
        }
      }
    } else {
      console.log(`❌ Search: ${searchData.error || 'No results found'}`);
    }
  } catch (error) {
    console.log(`❌ Tests failed: ${error.message}`);
  }
}

async function runQuickTest() {
  console.log('🚀 BeyondChats MVP - Quick Test Suite');
  console.log('=====================================\n');
  
  await quickHealthCheck();
  await quickFunctionalTest();
  
  console.log('\n📋 Quick Test Complete!');
  console.log('\nFor comprehensive testing:');
  console.log('- Run: npm run test:full');
  console.log('- Or open: http://localhost:3000/test-dashboard.html');
}

// Run if called directly
if (require.main === module) {
  runQuickTest().catch(console.error);
}

module.exports = { runQuickTest };