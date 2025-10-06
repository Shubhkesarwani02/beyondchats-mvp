/**
 * Browser-compatible RAG System Test Suite
 * 
 * Run this in your browser console or as a web page to test the RAG system
 */

class RAGTestSuite {
  constructor(apiBase = 'http://localhost:3000/api') {
    this.apiBase = apiBase;
    this.results = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
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

  addResult(testName, success, message, data = null) {
    this.results.push({
      testName,
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test 1: Search Endpoint Basic Functionality
  async testSearchBasic() {
    this.log('Testing Search Endpoint - Basic Functionality', 'test');
    
    const testQueries = [
      { q: 'machine learning', k: 3, description: 'Technical query' },
      { q: 'trading', k: 5, description: 'Domain-specific query' },
      { q: 'methodology', k: 2, description: 'Academic query' }
    ];
    
    let successCount = 0;
    
    for (const query of testQueries) {
      try {
        const params = new URLSearchParams({
          q: query.q,
          k: query.k.toString()
        });
        
        const startTime = Date.now();
        const response = await fetch(`${this.apiBase}/search?${params}`);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.results) {
            this.log(`✅ ${query.description}: Found ${data.resultCount} results (${responseTime}ms)`, 'success');
            this.addResult(`Search - ${query.description}`, true, `${data.resultCount} results in ${responseTime}ms`, {
              query: query.q,
              resultCount: data.resultCount,
              responseTime,
              sampleResult: data.results[0] || null
            });
            successCount++;
          } else {
            this.log(`❌ ${query.description}: Invalid response format`, 'error');
            this.addResult(`Search - ${query.description}`, false, 'Invalid response format');
          }
        } else {
          this.log(`❌ ${query.description}: HTTP ${response.status}`, 'error');
          this.addResult(`Search - ${query.description}`, false, `HTTP ${response.status}`);
        }
      } catch (error) {
        this.log(`❌ ${query.description}: ${error.message}`, 'error');
        this.addResult(`Search - ${query.description}`, false, error.message);
      }
      
      await this.sleep(200); // Prevent rate limiting
    }
    
    this.log(`Search Basic Tests: ${successCount}/${testQueries.length} passed`, successCount === testQueries.length ? 'success' : 'warning');
    return successCount === testQueries.length;
  }

  // Test 2: Chat Endpoint RAG Workflow
  async testChatRAG() {
    this.log('Testing Chat Endpoint - RAG Workflow', 'test');
    
    try {
      // Get a valid PDF ID first
      const searchResponse = await fetch(`${this.apiBase}/search?q=test&k=1`);
      const searchData = await searchResponse.json();
      
      if (!searchData.success || !searchData.results || searchData.results.length === 0) {
        this.log('No PDFs available for chat test', 'warning');
        this.addResult('Chat RAG', false, 'No PDFs available');
        return false;
      }
      
      const pdfId = searchData.results[0].pdfId;
      this.log(`Using PDF ID: ${pdfId}`, 'info');
      
      const testQueries = [
        {
          query: "What are the main topics discussed?",
          description: "Broad overview query"
        },
        {
          query: "What specific APIs or technologies are mentioned?",
          description: "Technical details query"
        }
      ];
      
      let successCount = 0;
      
      for (const test of testQueries) {
        try {
          const startTime = Date.now();
          const response = await fetch(`${this.apiBase}/chat`, {
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
              this.log(`✅ ${test.description}: Retrieved ${data.retrievedChunks} chunks (${responseTime}ms)`, 'success');
              
              // Check source quality
              const hasValidSources = data.sources && data.sources.length > 0 &&
                data.sources[0].pageNum && data.sources[0].content;
              
              if (hasValidSources) {
                this.log(`   Sources include page ${data.sources[0].pageNum} from "${data.sources[0].pdfTitle}"`, 'success');
              }
              
              this.addResult(`Chat - ${test.description}`, true, `${data.retrievedChunks} chunks retrieved in ${responseTime}ms`, {
                query: test.query,
                retrievedChunks: data.retrievedChunks,
                responseTime,
                hasValidSources,
                answerPreview: data.answer ? data.answer.substring(0, 100) + '...' : 'No answer',
                sources: data.sources.map(s => ({ pageNum: s.pageNum, pdfTitle: s.pdfTitle }))
              });
              successCount++;
            } else {
              this.log(`❌ ${test.description}: Chat failed - ${data.error || 'Unknown error'}`, 'error');
              this.addResult(`Chat - ${test.description}`, false, data.error || 'Unknown error');
            }
          } else {
            this.log(`❌ ${test.description}: HTTP ${response.status}`, 'error');
            this.addResult(`Chat - ${test.description}`, false, `HTTP ${response.status}`);
          }
        } catch (error) {
          this.log(`❌ ${test.description}: ${error.message}`, 'error');
          this.addResult(`Chat - ${test.description}`, false, error.message);
        }
        
        await this.sleep(1500); // Longer delay for chat requests
      }
      
      this.log(`Chat RAG Tests: ${successCount}/${testQueries.length} passed`, successCount > 0 ? 'success' : 'error');
      return successCount > 0;
    } catch (error) {
      this.log(`Chat RAG test error: ${error.message}`, 'error');
      this.addResult('Chat RAG', false, error.message);
      return false;
    }
  }

  // Test 3: Error Handling
  async testErrorHandling() {
    this.log('Testing Error Handling', 'test');
    
    const errorTests = [
      {
        name: 'Missing query parameter',
        url: `${this.apiBase}/search?k=5`,
        expectedStatus: 400,
        description: 'Should reject requests without query'
      },
      {
        name: 'Missing required fields in chat',
        method: 'POST',
        url: `${this.apiBase}/chat`,
        body: { query: 'test' }, // Missing pdfId
        expectedStatus: 400,
        description: 'Should reject incomplete chat requests'
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
            body: JSON.stringify(test.body),
          });
        } else {
          response = await fetch(test.url);
        }
        
        const isExpectedError = response.status === test.expectedStatus;
        
        if (isExpectedError) {
          this.log(`✅ ${test.name}: Handled correctly (${response.status})`, 'success');
          this.addResult(`Error Handling - ${test.name}`, true, `Status ${response.status} as expected`);
          successCount++;
        } else {
          this.log(`❌ ${test.name}: Unexpected status ${response.status}`, 'error');
          this.addResult(`Error Handling - ${test.name}`, false, `Expected ${test.expectedStatus}, got ${response.status}`);
        }
      } catch (error) {
        this.log(`❌ ${test.name}: ${error.message}`, 'error');
        this.addResult(`Error Handling - ${test.name}`, false, error.message);
      }
      
      await this.sleep(100);
    }
    
    this.log(`Error Handling Tests: ${successCount}/${errorTests.length} passed`, successCount === errorTests.length ? 'success' : 'warning');
    return successCount === errorTests.length;
  }

  // Test 4: Performance & Response Times
  async testPerformance() {
    this.log('Testing Performance Characteristics', 'test');
    
    const performanceTests = [
      { query: 'test', k: 1, description: 'Small result set', maxTime: 5000 },
      { query: 'machine learning', k: 5, description: 'Medium result set', maxTime: 8000 },
      { query: 'comprehensive analysis methodology', k: 3, description: 'Complex query', maxTime: 10000 }
    ];
    
    let successCount = 0;
    let totalTime = 0;
    
    for (const test of performanceTests) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${this.apiBase}/search?q=${encodeURIComponent(test.query)}&k=${test.k}`);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        totalTime += responseTime;
        
        if (response.ok) {
          const data = await response.json();
          
          if (responseTime < test.maxTime) {
            this.log(`✅ ${test.description}: ${responseTime}ms (${data.resultCount || 0} results)`, 'success');
            this.addResult(`Performance - ${test.description}`, true, `${responseTime}ms response time`, {
              responseTime,
              resultCount: data.resultCount || 0,
              threshold: test.maxTime
            });
            successCount++;
          } else {
            this.log(`⚠️ ${test.description}: ${responseTime}ms (slow, threshold: ${test.maxTime}ms)`, 'warning');
            this.addResult(`Performance - ${test.description}`, false, `Slow response: ${responseTime}ms`);
          }
        } else {
          this.log(`❌ ${test.description}: HTTP ${response.status}`, 'error');
          this.addResult(`Performance - ${test.description}`, false, `HTTP ${response.status}`);
        }
      } catch (error) {
        this.log(`❌ ${test.description}: ${error.message}`, 'error');
        this.addResult(`Performance - ${test.description}`, false, error.message);
      }
      
      await this.sleep(200);
    }
    
    const avgTime = totalTime / performanceTests.length;
    this.log(`Performance Summary: Average response time ${avgTime.toFixed(0)}ms`, avgTime < 5000 ? 'success' : 'warning');
    
    return successCount === performanceTests.length;
  }

  // Generate comprehensive test report
  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log('\n' + '='.repeat(80));
    console.log('🧪 BeyondChats RAG System Test Report');
    console.log('='.repeat(80));
    console.log(`📊 Test Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} ✅`);
    console.log(`   Failed: ${failedTests} ❌`);
    console.log(`   Success Rate: ${successRate}%`);
    console.log(`   Duration: ${duration}s`);
    console.log('='.repeat(80));
    
    // Detailed results
    this.results.forEach(result => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} | ${result.testName}`);
      console.log(`         Message: ${result.message}`);
      if (result.data) {
        console.log(`         Data: ${JSON.stringify(result.data, null, 2)}`);
      }
      console.log('');
    });
    
    // Health assessment
    const healthStatus = successRate >= 90 ? '🟢 EXCELLENT' :
      successRate >= 75 ? '🟡 GOOD' :
      successRate >= 50 ? '🟠 FAIR' : '🔴 POOR';
    
    console.log(`🏥 System Health: ${healthStatus} (${successRate}%)`);
    
    if (successRate >= 90) {
      console.log('🎉 System is production-ready!');
    } else if (successRate >= 75) {
      console.log('⚠️ System is mostly functional but needs attention');
    } else {
      console.log('🚨 System has significant issues that need fixing');
    }
    
    console.log('='.repeat(80));
    
    return { totalTests, passedTests, failedTests, successRate, duration };
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Comprehensive RAG System Test Suite');
    console.log('='.repeat(80));
    
    this.log('Initializing test suite...', 'info');
    
    const tests = [
      { name: 'Search Basic', fn: () => this.testSearchBasic() },
      { name: 'Chat RAG', fn: () => this.testChatRAG() },
      { name: 'Error Handling', fn: () => this.testErrorHandling() },
      { name: 'Performance', fn: () => this.testPerformance() }
    ];
    
    let overallSuccess = true;
    
    for (const test of tests) {
      try {
        this.log(`Starting ${test.name} tests...`, 'test');
        const result = await test.fn();
        if (!result) overallSuccess = false;
      } catch (error) {
        this.log(`Test ${test.name} crashed: ${error.message}`, 'error');
        this.addResult(test.name, false, `Test crashed: ${error.message}`);
        overallSuccess = false;
      }
      
      console.log(''); // Add spacing between tests
    }
    
    const summary = this.generateReport();
    
    if (overallSuccess && summary.successRate >= 90) {
      this.log('🎉 All tests completed successfully! RAG system is production-ready.', 'success');
    } else if (summary.successRate >= 75) {
      this.log('⚠️ Most tests passed, but some issues need attention.', 'warning');
    } else {
      this.log('❌ Multiple test failures detected. System needs debugging.', 'error');
    }
    
    return overallSuccess;
  }
}

// For browser usage
if (typeof window !== 'undefined') {
  window.RAGTestSuite = RAGTestSuite;
  
  // Auto-run if requested
  if (window.location.search.includes('autorun=true')) {
    const testSuite = new RAGTestSuite();
    testSuite.runAllTests();
  }
}

// For Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RAGTestSuite;
}

// Usage examples:
/*
// In browser console:
const testSuite = new RAGTestSuite();
await testSuite.runAllTests();

// Quick single test:
const testSuite = new RAGTestSuite();
await testSuite.testSearchBasic();

// Custom API base:
const testSuite = new RAGTestSuite('https://your-api.com/api');
await testSuite.runAllTests();
*/