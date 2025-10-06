/**
 * Simple RAG Test Runner - Works with Node.js without ES modules
 */

const API_BASE = 'http://localhost:3000/api';

// Test utilities
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    test: '🧪'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp.substr(11, 8)}] ${message}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Basic Search Functionality
async function testSearchBasic() {
  log('Testing Search Endpoint - Basic Functionality', 'test');
  
  const testQueries = [
    { q: 'machine learning', k: 3 },
    { q: 'trading', k: 5 },
    { q: 'methodology', k: 2 }
  ];
  
  let successCount = 0;
  
  for (const query of testQueries) {
    try {
      const params = new URLSearchParams({
        q: query.q,
        k: query.k.toString()
      });
      
      const startTime = Date.now();
      const response = await fetch(`${API_BASE}/search?${params}`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.results) {
          log(`✅ Query "${query.q}": Found ${data.resultCount} results (${responseTime}ms)`, 'success');
          successCount++;
        } else {
          log(`❌ Query "${query.q}": Invalid response format`, 'error');
        }
      } else {
        log(`❌ Query "${query.q}": HTTP ${response.status}`, 'error');
      }
    } catch (error) {
      log(`❌ Query "${query.q}": ${error.message}`, 'error');
    }
    
    await sleep(200);
  }
  
  log(`Search Tests: ${successCount}/${testQueries.length} passed`, successCount === testQueries.length ? 'success' : 'warning');
  return successCount === testQueries.length;
}

// Test 2: Chat RAG Workflow
async function testChatRAG() {
  log('Testing Chat Endpoint - RAG Workflow', 'test');
  
  try {
    // Get a valid PDF ID first
    const searchResponse = await fetch(`${API_BASE}/search?q=test&k=1`);
    const searchData = await searchResponse.json();
    
    if (!searchData.success || !searchData.results || searchData.results.length === 0) {
      log('No PDFs available for chat test', 'warning');
      return false;
    }
    
    const pdfId = searchData.results[0].pdfId;
    log(`Using PDF ID: ${pdfId}`, 'info');
    
    const testQuery = "What are the main topics discussed in this document?";
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: testQuery,
          pdfId: pdfId,
          k: 5
        }),
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          log(`✅ Chat successful: Retrieved ${data.retrievedChunks} chunks (${responseTime}ms)`, 'success');
          
          if (data.sources && data.sources.length > 0) {
            log(`   Sources include page ${data.sources[0].pageNum} from "${data.sources[0].pdfTitle}"`, 'success');
          }
          
          if (data.answer && data.answer.length > 0) {
            log(`   Answer preview: ${data.answer.substring(0, 100)}...`, 'info');
          }
          
          return true;
        } else {
          log(`❌ Chat failed: ${data.error || 'Unknown error'}`, 'error');
          return false;
        }
      } else {
        log(`❌ Chat HTTP error: ${response.status}`, 'error');
        return false;
      }
    } catch (error) {
      log(`❌ Chat request failed: ${error.message}`, 'error');
      return false;
    }
  } catch (error) {
    log(`❌ Chat test error: ${error.message}`, 'error');
    return false;
  }
}

// Test 3: Error Handling
async function testErrorHandling() {
  log('Testing Error Handling', 'test');
  
  let successCount = 0;
  
  // Test missing query parameter
  try {
    const response = await fetch(`${API_BASE}/search?k=5`);
    if (response.status === 400) {
      log('✅ Missing query parameter handled correctly', 'success');
      successCount++;
    } else {
      log(`❌ Expected 400 for missing query, got ${response.status}`, 'error');
    }
  } catch (error) {
    log(`❌ Error test failed: ${error.message}`, 'error');
  }
  
  // Test missing pdfId in chat
  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'test' }),
    });
    
    if (response.status === 400) {
      log('✅ Missing pdfId in chat handled correctly', 'success');
      successCount++;
    } else {
      log(`❌ Expected 400 for missing pdfId, got ${response.status}`, 'error');
    }
  } catch (error) {
    log(`❌ Chat error test failed: ${error.message}`, 'error');
  }
  
  log(`Error Handling Tests: ${successCount}/2 passed`, successCount === 2 ? 'success' : 'warning');
  return successCount === 2;
}

// Test 4: Performance Check
async function testPerformance() {
  log('Testing Performance', 'test');
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE}/search?q=machine%20learning&k=3`);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      const data = await response.json();
      
      if (responseTime < 10000) { // 10 second threshold
        log(`✅ Performance good: ${responseTime}ms (${data.resultCount || 0} results)`, 'success');
        return true;
      } else {
        log(`⚠️ Performance slow: ${responseTime}ms`, 'warning');
        return false;
      }
    } else {
      log(`❌ Performance test failed: HTTP ${response.status}`, 'error');
      return false;
    }
  } catch (error) {
    log(`❌ Performance test error: ${error.message}`, 'error');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 BeyondChats RAG System Test Suite');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Search Basic', fn: testSearchBasic },
    { name: 'Chat RAG', fn: testChatRAG },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Performance', fn: testPerformance }
  ];
  
  let passedTests = 0;
  const totalTests = tests.length;
  
  for (const test of tests) {
    try {
      log(`Starting ${test.name} test...`, 'test');
      const result = await test.fn();
      if (result) passedTests++;
    } catch (error) {
      log(`Test ${test.name} crashed: ${error.message}`, 'error');
    }
    
    console.log(''); // Add spacing
  }
  
  // Generate summary
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log('=' .repeat(60));
  console.log('🎯 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${totalTests - passedTests} ❌`);
  console.log(`Success Rate: ${successRate}%`);
  console.log('=' .repeat(60));
  
  if (successRate >= 90) {
    log('🎉 Excellent! RAG system is working perfectly!', 'success');
  } else if (successRate >= 75) {
    log('👍 Good! Most features are working, minor issues detected.', 'success');
  } else if (successRate >= 50) {
    log('⚠️ Fair. Some significant issues need attention.', 'warning');
  } else {
    log('❌ Poor. Major issues detected, system needs debugging.', 'error');
  }
  
  return successRate >= 75;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      console.log('\n📋 Test run completed.');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testSearchBasic,
  testChatRAG,
  testErrorHandling,
  testPerformance
};