#!/usr/bin/env node

/**
 * Comprehensive RAG System Test Suite
 * 
 * Tests the complete RAG workflow including:
 * 1. PDF Upload & Processing
 * 2. Chunk Generation & Embedding
 * 3. Vector Search (GET /api/search)
 * 4. RAG Chat (POST /api/chat)
 * 5. Error Handling & Edge Cases
 * 6. Performance & Load Testing
 * 7. Citation Extraction & Validation
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api';
const TEST_RESULTS = [];

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
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function addResult(testName, success, message, data = null) {
  TEST_RESULTS.push({
    testName,
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Health Check
async function testHealthCheck() {
  log('Testing API Health Check', 'test');
  
  try {
    const response = await fetch(`${API_BASE}/search?q=test&k=1`);
    const isHealthy = response.ok;
    
    if (isHealthy) {
      log('API is healthy and responding', 'success');
      addResult('Health Check', true, 'API responding correctly');
    } else {
      log('API health check failed', 'error');
      addResult('Health Check', false, `API returned status ${response.status}`);
    }
    
    return isHealthy;
  } catch (error) {
    log(`Health check failed: ${error.message}`, 'error');
    addResult('Health Check', false, error.message);
    return false;
  }
}

// Test 2: PDF Upload (Mock test - requires actual file)
async function testPDFUpload() {
  log('Testing PDF Upload Functionality', 'test');
  
  try {
    // Check if test PDF exists
    const testPDFs = [
      'public/uploads/1759746860053-Assignment_ BeyondChats - FSWD.pdf',
      'public/uploads/1759749247860-sample.pdf',
      'public/uploads/1759749839147-sample.pdf'
    ];
    
    let uploadSuccess = false;
    for (const pdfPath of testPDFs) {
      const fullPath = path.join(process.cwd(), pdfPath);
      if (fs.existsSync(fullPath)) {
        log(`Found test PDF: ${pdfPath}`, 'success');
        uploadSuccess = true;
        break;
      }
    }
    
    if (uploadSuccess) {
      addResult('PDF Upload', true, 'Test PDFs available for processing');
    } else {
      log('No test PDFs found - upload test skipped', 'warning');
      addResult('PDF Upload', false, 'No test PDFs available');
    }
    
    return uploadSuccess;
  } catch (error) {
    log(`PDF upload test failed: ${error.message}`, 'error');
    addResult('PDF Upload', false, error.message);
    return false;
  }
}

// Test 3: Search Endpoint - Basic Functionality
async function testSearchBasic() {
  log('Testing Search Endpoint - Basic Functionality', 'test');
  
  const testQueries = [
    { q: 'machine learning', k: 3, description: 'Technical query' },
    { q: 'trading', k: 5, description: 'Domain-specific query' },
    { q: 'algorithm', k: 2, description: 'Short query' },
    { q: 'what is the methodology used in this research paper', k: 4, description: 'Long natural language query' }
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
          log(`✅ ${query.description}: Found ${data.resultCount} results (${responseTime}ms)`, 'success');
          addResult(`Search - ${query.description}`, true, `${data.resultCount} results in ${responseTime}ms`, {
            query: query.q,
            resultCount: data.resultCount,
            responseTime
          });
          successCount++;
        } else {
          log(`❌ ${query.description}: Invalid response format`, 'error');
          addResult(`Search - ${query.description}`, false, 'Invalid response format');
        }
      } else {
        log(`❌ ${query.description}: HTTP ${response.status}`, 'error');
        addResult(`Search - ${query.description}`, false, `HTTP ${response.status}`);
      }
    } catch (error) {
      log(`❌ ${query.description}: ${error.message}`, 'error');
      addResult(`Search - ${query.description}`, false, error.message);
    }
    
    await sleep(100); // Prevent rate limiting
  }
  
  log(`Search Basic Tests: ${successCount}/${testQueries.length} passed`, successCount === testQueries.length ? 'success' : 'warning');
  return successCount === testQueries.length;
}

// Test 4: Search Endpoint - With PDF ID
async function testSearchWithPDFId() {
  log('Testing Search Endpoint - With PDF ID', 'test');
  
  try {
    // First, get a valid PDF ID from a general search
    const generalSearch = await fetch(`${API_BASE}/search?q=test&k=1`);
    const generalData = await generalSearch.json();
    
    if (!generalData.success || !generalData.results || generalData.results.length === 0) {
      log('No PDFs available for PDF-specific search test', 'warning');
      addResult('Search with PDF ID', false, 'No PDFs available');
      return false;
    }
    
    const pdfId = generalData.results[0].pdfId;
    log(`Using PDF ID: ${pdfId}`, 'info');
    
    // Test search with specific PDF ID
    const params = new URLSearchParams({
      q: 'methodology',
      pdfId: pdfId,
      k: '3'
    });
    
    const response = await fetch(`${API_BASE}/search?${params}`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      log(`PDF-specific search successful: ${data.resultCount} results`, 'success');
      addResult('Search with PDF ID', true, `${data.resultCount} results from specific PDF`, {
        pdfId,
        resultCount: data.resultCount
      });
      return true;
    } else {
      log('PDF-specific search failed', 'error');
      addResult('Search with PDF ID', false, 'Search failed');
      return false;
    }
  } catch (error) {
    log(`PDF-specific search error: ${error.message}`, 'error');
    addResult('Search with PDF ID', false, error.message);
    return false;
  }
}

// Test 5: Chat Endpoint - RAG Workflow
async function testChatRAG() {
  log('Testing Chat Endpoint - RAG Workflow', 'test');
  
  try {
    // Get a valid PDF ID first
    const searchResponse = await fetch(`${API_BASE}/search?q=trading&k=1`);
    const searchData = await searchResponse.json();
    
    if (!searchData.success || !searchData.results || searchData.results.length === 0) {
      log('No PDFs available for chat test', 'warning');
      addResult('Chat RAG', false, 'No PDFs available');
      return false;
    }
    
    const pdfId = searchData.results[0].pdfId;
    
    const testQueries = [
      {
        query: "What trading APIs are mentioned in this document?",
        description: "Specific factual query"
      },
      {
        query: "Explain the main concepts discussed",
        description: "Broad conceptual query"
      },
      {
        query: "What are the requirements mentioned?",
        description: "List-based query"
      }
    ];
    
    let successCount = 0;
    
    for (const test of testQueries) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: test.query,
            pdfId: pdfId,
            k: 5
          }),
        });
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            log(`✅ ${test.description}: Retrieved ${data.retrievedChunks} chunks (${responseTime}ms)`, 'success');
            
            // Check if sources are properly formatted
            const hasValidSources = data.sources && data.sources.length > 0 &&
              data.sources[0].pageNum && data.sources[0].content;
            
            if (hasValidSources) {
              log(`   Sources include page numbers and content`, 'success');
            }
            
            addResult(`Chat - ${test.description}`, true, `${data.retrievedChunks} chunks retrieved in ${responseTime}ms`, {
              query: test.query,
              retrievedChunks: data.retrievedChunks,
              responseTime,
              hasValidSources
            });
            successCount++;
          } else {
            log(`❌ ${test.description}: Chat failed - ${data.error || 'Unknown error'}`, 'error');
            addResult(`Chat - ${test.description}`, false, data.error || 'Unknown error');
          }
        } else {
          log(`❌ ${test.description}: HTTP ${response.status}`, 'error');
          addResult(`Chat - ${test.description}`, false, `HTTP ${response.status}`);
        }
      } catch (error) {
        log(`❌ ${test.description}: ${error.message}`, 'error');
        addResult(`Chat - ${test.description}`, false, error.message);
      }
      
      await sleep(1000); // Longer delay for chat requests
    }
    
    log(`Chat RAG Tests: ${successCount}/${testQueries.length} passed`, successCount > 0 ? 'success' : 'error');
    return successCount > 0;
  } catch (error) {
    log(`Chat RAG test error: ${error.message}`, 'error');
    addResult('Chat RAG', false, error.message);
    return false;
  }
}

// Test 6: Error Handling
async function testErrorHandling() {
  log('Testing Error Handling', 'test');
  
  const errorTests = [
    {
      name: 'Missing query parameter',
      url: `${API_BASE}/search?k=5`,
      expectedStatus: 400,
      description: 'Should reject requests without query'
    },
    {
      name: 'Invalid PDF ID in chat',
      method: 'POST',
      url: `${API_BASE}/chat`,
      body: { query: 'test', pdfId: 'invalid-id', k: 3 },
      expectedStatus: 200, // Should handle gracefully
      description: 'Should handle invalid PDF IDs gracefully'
    },
    {
      name: 'Missing required fields in chat',
      method: 'POST',
      url: `${API_BASE}/chat`,
      body: { query: 'test' }, // Missing pdfId
      expectedStatus: 400,
      description: 'Should reject incomplete chat requests'
    },
    {
      name: 'Invalid JSON in chat',
      method: 'POST',
      url: `${API_BASE}/chat`,
      body: 'invalid json',
      expectedStatus: 400,
      description: 'Should handle malformed JSON'
    }
  ];
  
  let successCount = 0;
  
  for (const test of errorTests) {
    try {
      let response;
      
      if (test.method === 'POST') {
        response = await fetch(test.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: typeof test.body === 'string' ? test.body : JSON.stringify(test.body),
        });
      } else {
        response = await fetch(test.url);
      }
      
      const isExpectedError = response.status === test.expectedStatus || 
        (test.expectedStatus === 200 && response.status >= 200 && response.status < 300);
      
      if (isExpectedError) {
        log(`✅ ${test.name}: Handled correctly (${response.status})`, 'success');
        addResult(`Error Handling - ${test.name}`, true, `Status ${response.status} as expected`);
        successCount++;
      } else {
        log(`❌ ${test.name}: Unexpected status ${response.status}`, 'error');
        addResult(`Error Handling - ${test.name}`, false, `Expected ${test.expectedStatus}, got ${response.status}`);
      }
    } catch (error) {
      if (test.name.includes('Invalid JSON')) {
        // Fetch errors on invalid JSON are expected
        log(`✅ ${test.name}: Handled correctly (Fetch error)`, 'success');
        addResult(`Error Handling - ${test.name}`, true, 'Fetch rejected invalid JSON');
        successCount++;
      } else {
        log(`❌ ${test.name}: ${error.message}`, 'error');
        addResult(`Error Handling - ${test.name}`, false, error.message);
      }
    }
    
    await sleep(100);
  }
  
  log(`Error Handling Tests: ${successCount}/${errorTests.length} passed`, successCount === errorTests.length ? 'success' : 'warning');
  return successCount === errorTests.length;
}

// Test 7: Performance Testing
async function testPerformance() {
  log('Testing Performance Characteristics', 'test');
  
  try {
    const performanceTests = [
      { query: 'test', k: 1, description: 'Small result set' },
      { query: 'machine learning artificial intelligence', k: 10, description: 'Large result set' },
      { query: 'a', k: 5, description: 'Single character query' },
      { query: 'this is a very long query with multiple words to test performance with complex semantic search requirements', k: 5, description: 'Very long query' }
    ];
    
    let totalTime = 0;
    let successCount = 0;
    
    for (const test of performanceTests) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(test.query)}&k=${test.k}`);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        totalTime += responseTime;
        
        if (response.ok) {
          const data = await response.json();
          
          if (responseTime < 10000) { // 10 second threshold
            log(`✅ ${test.description}: ${responseTime}ms (${data.resultCount || 0} results)`, 'success');
            addResult(`Performance - ${test.description}`, true, `${responseTime}ms response time`, {
              responseTime,
              resultCount: data.resultCount || 0
            });
            successCount++;
          } else {
            log(`⚠️ ${test.description}: ${responseTime}ms (slow)`, 'warning');
            addResult(`Performance - ${test.description}`, false, `Slow response: ${responseTime}ms`);
          }
        } else {
          log(`❌ ${test.description}: HTTP ${response.status}`, 'error');
          addResult(`Performance - ${test.description}`, false, `HTTP ${response.status}`);
        }
      } catch (error) {
        log(`❌ ${test.description}: ${error.message}`, 'error');
        addResult(`Performance - ${test.description}`, false, error.message);
      }
      
      await sleep(100);
    }
    
    const avgTime = totalTime / performanceTests.length;
    log(`Performance Summary: Average response time ${avgTime.toFixed(0)}ms`, avgTime < 5000 ? 'success' : 'warning');
    
    return successCount === performanceTests.length;
  } catch (error) {
    log(`Performance testing error: ${error.message}`, 'error');
    return false;
  }
}

// Test 8: Citation Format Validation
async function testCitationFormat() {
  log('Testing Citation Format Validation', 'test');
  
  try {
    // Get a valid PDF ID
    const searchResponse = await fetch(`${API_BASE}/search?q=test&k=1`);
    const searchData = await searchResponse.json();
    
    if (!searchData.success || !searchData.results || searchData.results.length === 0) {
      log('No PDFs available for citation test', 'warning');
      addResult('Citation Format', false, 'No PDFs available');
      return false;
    }
    
    const pdfId = searchData.results[0].pdfId;
    
    // Test chat to check citation format
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "What are the main points discussed?",
        pdfId: pdfId,
        k: 3
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.sources) {
        // Check if sources have required citation fields
        const citationChecks = {
          hasPageNumbers: data.sources.every(s => s.pageNum),
          hasContent: data.sources.every(s => s.content),
          hasPdfTitle: data.sources.every(s => s.pdfTitle),
          hasSnippets: data.sources.every(s => s.snippet)
        };
        
        const allChecksPass = Object.values(citationChecks).every(check => check);
        
        if (allChecksPass) {
          log(`✅ Citation format validation passed`, 'success');
          addResult('Citation Format', true, 'All citation fields present', citationChecks);
        } else {
          log(`⚠️ Citation format incomplete`, 'warning');
          addResult('Citation Format', false, 'Missing citation fields', citationChecks);
        }
        
        return allChecksPass;
      } else {
        log('Citation test failed - no sources returned', 'error');
        addResult('Citation Format', false, 'No sources returned');
        return false;
      }
    } else {
      log('Citation test failed - chat request failed', 'error');
      addResult('Citation Format', false, 'Chat request failed');
      return false;
    }
  } catch (error) {
    log(`Citation format test error: ${error.message}`, 'error');
    addResult('Citation Format', false, error.message);
    return false;
  }
}

// Test 9: Database Integration
async function testDatabaseIntegration() {
  log('Testing Database Integration', 'test');
  
  try {
    // Test that embeddings are being stored and retrieved
    const response = await fetch(`${API_BASE}/search?q=test&k=1`);
    const data = await response.json();
    
    if (response.ok && data.success && data.results && data.results.length > 0) {
      const result = data.results[0];
      
      // Check if we have similarity scores (indicates vector search is working)
      const hasEmbeddings = result.similarity !== undefined && result.similarity !== null;
      
      if (hasEmbeddings) {
        log(`✅ Database integration: Vector embeddings working (similarity: ${result.similarity.toFixed(3)})`, 'success');
        addResult('Database Integration', true, `Vector search working with similarity ${result.similarity.toFixed(3)}`);
        return true;
      } else {
        log(`⚠️ Database integration: No similarity scores (keyword search fallback)`, 'warning');
        addResult('Database Integration', false, 'No vector embeddings found');
        return false;
      }
    } else {
      log('Database integration test failed - no results', 'error');
      addResult('Database Integration', false, 'No search results');
      return false;
    }
  } catch (error) {
    log(`Database integration test error: ${error.message}`, 'error');
    addResult('Database Integration', false, error.message);
    return false;
  }
}

// Generate Test Report
function generateTestReport() {
  log('Generating Test Report', 'info');
  
  const totalTests = TEST_RESULTS.length;
  const passedTests = TEST_RESULTS.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  const report = `
# 🧪 BeyondChats RAG System Test Report

**Generated:** ${new Date().toISOString()}
**Total Tests:** ${totalTests}
**Passed:** ${passedTests} ✅
**Failed:** ${failedTests} ❌
**Success Rate:** ${successRate}%

## Test Results Summary

${TEST_RESULTS.map(result => `
### ${result.success ? '✅' : '❌'} ${result.testName}
**Status:** ${result.success ? 'PASSED' : 'FAILED'}
**Message:** ${result.message}
**Timestamp:** ${result.timestamp}
${result.data ? `**Data:** \`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\`` : ''}
`).join('\n')}

## System Health Assessment

${successRate >= 90 ? '🟢 **EXCELLENT** - System is fully operational' :
  successRate >= 75 ? '🟡 **GOOD** - System is mostly functional with minor issues' :
  successRate >= 50 ? '🟠 **FAIR** - System has significant issues that need attention' :
  '🔴 **POOR** - System requires immediate attention'}

## Recommendations

${successRate >= 90 ? '- System is production-ready\n- Consider load testing for production deployment' :
  successRate >= 75 ? '- Address failed tests before production\n- Monitor performance in production' :
  '- Fix critical issues before proceeding\n- Review system architecture and dependencies'}

---
Generated by BeyondChats RAG Test Suite
`;

    // Save report to file
    const reportPath = path.join(process.cwd(), 'test-report.md');
    fs.writeFileSync(reportPath, report);
  
  log(`Test report saved to: ${reportPath}`, 'success');
  
  console.log('\n' + '='.repeat(80));
  console.log(`🎯 TEST SUMMARY: ${passedTests}/${totalTests} passed (${successRate}%)`);
  console.log('='.repeat(80));
  
  return { totalTests, passedTests, failedTests, successRate };
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 Starting BeyondChats RAG System Comprehensive Test Suite\n');
  console.log('='.repeat(80));
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'PDF Upload', fn: testPDFUpload },
    { name: 'Search Basic', fn: testSearchBasic },
    { name: 'Search with PDF ID', fn: testSearchWithPDFId },
    { name: 'Chat RAG', fn: testChatRAG },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Performance', fn: testPerformance },
    { name: 'Citation Format', fn: testCitationFormat },
    { name: 'Database Integration', fn: testDatabaseIntegration }
  ];
  
  let overallSuccess = true;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (!result) overallSuccess = false;
    } catch (error) {
      log(`Test ${test.name} crashed: ${error.message}`, 'error');
      addResult(test.name, false, `Test crashed: ${error.message}`);
      overallSuccess = false;
    }
    
    console.log(''); // Add spacing between tests
  }
  
  const summary = generateTestReport();
  
  if (overallSuccess && summary.successRate >= 90) {
    log('🎉 All tests completed successfully! RAG system is production-ready.', 'success');
  } else if (summary.successRate >= 75) {
    log('⚠️ Most tests passed, but some issues need attention.', 'warning');
  } else {
    log('❌ Multiple test failures detected. System needs debugging.', 'error');
  }
  
  return overallSuccess;
}

// CLI interface
if (require.main === module) {
  runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testHealthCheck,
  testSearchBasic,
  testChatRAG,
  testErrorHandling,
  testPerformance,
  generateTestReport
};