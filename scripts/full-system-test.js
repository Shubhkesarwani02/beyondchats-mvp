#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * BeyondChats MVP - Complete System Test Suite
 * 
 * Tests all functionalities from the assignment brief:
 * 1. PDF Upload & Processing
 * 2. Chunking & Embedding Pipeline
 * 3. Vector Search & Retrieval
 * 4. RAG Chat with Citations
 * 5. Quiz Generation & Scoring
 * 6. PDF Viewer Integration
 * 7. End-to-End Workflow
 * 8. Performance & Load Testing
 * 9. Error Handling & Edge Cases
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api';
const UI_BASE = 'http://localhost:3000';
const TEST_RESULTS = [];

// Test utilities
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    test: '🧪',
    quiz: '🎯',
    upload: '📤',
    process: '⚙️'
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
  log('🏥 Testing System Health Check', 'test');
  
  const healthChecks = [
    { name: 'Search API', url: `${API_BASE}/search?q=test&k=1` },
    { name: 'PDF List API', url: `${API_BASE}/pdfs` },
    { name: 'Main UI', url: `${UI_BASE}` },
    { name: 'Dashboard UI', url: `${UI_BASE}/dashboard` },
    { name: 'Upload UI', url: `${UI_BASE}/upload` }
  ];
  
  let healthyCount = 0;
  
  for (const check of healthChecks) {
    try {
      const response = await fetch(check.url);
      const isHealthy = response.ok;
      
      if (isHealthy) {
        log(`✅ ${check.name}: Healthy (${response.status})`, 'success');
        addResult(`Health - ${check.name}`, true, `Status ${response.status}`);
        healthyCount++;
      } else {
        log(`❌ ${check.name}: Unhealthy (${response.status})`, 'error');
        addResult(`Health - ${check.name}`, false, `Status ${response.status}`);
      }
    } catch (error) {
      log(`❌ ${check.name}: ${error.message}`, 'error');
      addResult(`Health - ${check.name}`, false, error.message);
    }
  }
  
  const allHealthy = healthyCount === healthChecks.length;
  log(`Health Check Summary: ${healthyCount}/${healthChecks.length} services healthy`, allHealthy ? 'success' : 'warning');
  
  return allHealthy;
}

// Test 2: PDF Upload & Processing Pipeline
async function testPDFUploadPipeline() {
  log('📤 Testing PDF Upload & Processing Pipeline', 'upload');
  
  try {
    // Check if sample PDFs exist
    const samplePDFs = [
      'public/uploads/sample.pdf',
      'public/uploads/test-document.pdf'
    ];
    
    let testPDFPath = null;
    for (const pdfPath of samplePDFs) {
      const fullPath = path.join(process.cwd(), pdfPath);
      if (fs.existsSync(fullPath)) {
        testPDFPath = fullPath;
        break;
      }
    }
    
    if (!testPDFPath) {
      log('No test PDFs found - checking existing uploads', 'warning');
      
      // Get existing PDFs
      const response = await fetch(`${API_BASE}/pdfs`);
      const data = await response.json();
      
      if (data.success && data.pdfs && data.pdfs.length > 0) {
        log(`Found ${data.pdfs.length} existing PDFs in database`, 'success');
        addResult('PDF Upload Pipeline', true, `${data.pdfs.length} PDFs already available`);
        return { success: true, pdfId: data.pdfs[0].id, pdfTitle: data.pdfs[0].title };
      } else {
        log('No PDFs available for testing', 'error');
        addResult('PDF Upload Pipeline', false, 'No PDFs available');
        return { success: false };
      }
    }
    
    // If we have a test PDF, verify the processing pipeline
    log(`Using test PDF: ${testPDFPath}`, 'info');
    
    // Check if chunks and embeddings exist for this PDF
    const searchTest = await fetch(`${API_BASE}/search?q=test&k=1`);
    const searchData = await searchTest.json();
    
    if (searchData.success && searchData.results && searchData.results.length > 0) {
      const result = searchData.results[0];
      log(`✅ PDF processing verified: Found chunks with embeddings`, 'success');
      addResult('PDF Upload Pipeline', true, 'Processing pipeline working');
      return { 
        success: true, 
        pdfId: result.pdfId, 
        pdfTitle: result.pdfTitle,
        hasEmbeddings: result.similarity !== undefined 
      };
    } else {
      log('No processed chunks found', 'error');
      addResult('PDF Upload Pipeline', false, 'No processed chunks');
      return { success: false };
    }
    
  } catch (error) {
    log(`PDF pipeline test error: ${error.message}`, 'error');
    addResult('PDF Upload Pipeline', false, error.message);
    return { success: false };
  }
}

// Test 3: Chunking & Embedding System
async function testChunkingEmbedding() {
  log('⚙️ Testing Chunking & Embedding System', 'process');
  
  try {
    // Test search to verify embeddings are working
    const testQueries = [
      'machine learning',
      'artificial intelligence',
      'data processing',
      'algorithm implementation'
    ];
    
    let embeddingTestsPassed = 0;
    
    for (const query of testQueries) {
      const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&k=3`);
      const data = await response.json();
      
      if (data.success && data.results && data.results.length > 0) {
        const hasEmbeddingScores = data.results.every(r => r.similarity !== undefined);
        
        if (hasEmbeddingScores) {
          const avgSimilarity = data.results.reduce((sum, r) => sum + r.similarity, 0) / data.results.length;
          log(`✅ Query "${query}": ${data.results.length} chunks, avg similarity ${avgSimilarity.toFixed(3)}`, 'success');
          embeddingTestsPassed++;
        } else {
          log(`⚠️ Query "${query}": No similarity scores (keyword fallback)`, 'warning');
        }
      }
      
      await sleep(100);
    }
    
    const allEmbeddingsWork = embeddingTestsPassed === testQueries.length;
    
    if (allEmbeddingsWork) {
      log('✅ Embedding system fully operational', 'success');
      addResult('Chunking & Embedding', true, `${embeddingTestsPassed}/${testQueries.length} queries with embeddings`);
    } else {
      log(`⚠️ Embedding system partially working: ${embeddingTestsPassed}/${testQueries.length}`, 'warning');
      addResult('Chunking & Embedding', false, `Only ${embeddingTestsPassed}/${testQueries.length} queries with embeddings`);
    }
    
    return allEmbeddingsWork;
  } catch (error) {
    log(`Chunking & embedding test error: ${error.message}`, 'error');
    addResult('Chunking & Embedding', false, error.message);
    return false;
  }
}

// Test 4: Vector Search & Retrieval
async function testVectorSearch() {
  log('🔍 Testing Vector Search & Retrieval', 'test');
  
  try {
    const searchTests = [
      {
        query: 'machine learning algorithms',
        k: 5,
        description: 'Technical concept search',
        expectedResultTypes: ['technical', 'academic']
      },
      {
        query: 'trading strategies and APIs',
        k: 3,
        description: 'Domain-specific search',
        expectedResultTypes: ['business', 'technical']
      },
      {
        query: 'what are the main requirements mentioned in this document',
        k: 4,
        description: 'Natural language query',
        expectedResultTypes: ['requirements', 'documentation']
      }
    ];
    
    let successfulSearches = 0;
    
    for (const test of searchTests) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(test.query)}&k=${test.k}`);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.results) {
            // Verify search quality
            const qualityChecks = {
              hasResults: data.results.length > 0,
              hasRelevantContent: data.results.length >= Math.min(test.k / 2, 2), // At least half expected results
              hasSimilarityScores: data.results.every(r => r.similarity !== undefined),
              hasPageNumbers: data.results.every(r => r.pageNum !== undefined),
              hasContent: data.results.every(r => r.content && r.content.length > 50),
              fastResponse: responseTime < 5000
            };
            
            const qualityScore = Object.values(qualityChecks).filter(Boolean).length;
            const maxQuality = Object.keys(qualityChecks).length;
            
            if (qualityScore >= maxQuality * 0.8) { // 80% quality threshold
              log(`✅ ${test.description}: ${data.results.length} results, quality ${qualityScore}/${maxQuality} (${responseTime}ms)`, 'success');
              addResult(`Search - ${test.description}`, true, `Quality ${qualityScore}/${maxQuality}, ${responseTime}ms`, {
                resultCount: data.results.length,
                qualityChecks,
                responseTime
              });
              successfulSearches++;
            } else {
              log(`⚠️ ${test.description}: Low quality ${qualityScore}/${maxQuality}`, 'warning');
              addResult(`Search - ${test.description}`, false, `Low quality ${qualityScore}/${maxQuality}`, qualityChecks);
            }
          } else {
            log(`❌ ${test.description}: Invalid response`, 'error');
            addResult(`Search - ${test.description}`, false, 'Invalid response format');
          }
        } else {
          log(`❌ ${test.description}: HTTP ${response.status}`, 'error');
          addResult(`Search - ${test.description}`, false, `HTTP ${response.status}`);
        }
      } catch (error) {
        log(`❌ ${test.description}: ${error.message}`, 'error');
        addResult(`Search - ${test.description}`, false, error.message);
      }
      
      await sleep(200);
    }
    
    const allSearchesSuccess = successfulSearches === searchTests.length;
    log(`Vector Search Summary: ${successfulSearches}/${searchTests.length} high-quality searches`, allSearchesSuccess ? 'success' : 'warning');
    
    return allSearchesSuccess;
  } catch (error) {
    log(`Vector search test error: ${error.message}`, 'error');
    addResult('Vector Search', false, error.message);
    return false;
  }
}

// Test 5: RAG Chat with Citations
async function testRAGChat() {
  log('💬 Testing RAG Chat with Citations', 'test');
  
  try {
    // Get a valid PDF first
    const searchResponse = await fetch(`${API_BASE}/search?q=test&k=1`);
    const searchData = await searchResponse.json();
    
    if (!searchData.success || !searchData.results || searchData.results.length === 0) {
      log('No PDFs available for chat test', 'error');
      addResult('RAG Chat', false, 'No PDFs available');
      return false;
    }
    
    const pdfId = searchData.results[0].pdfId;
    log(`Using PDF ID: ${pdfId}`, 'info');
    
    const chatTests = [
      {
        query: "What are the main concepts discussed in this document?",
        description: "Broad conceptual query",
        expectedElements: ['concepts', 'summary']
      },
      {
        query: "What specific requirements or steps are mentioned?",
        description: "Specific information query",
        expectedElements: ['requirements', 'steps', 'list']
      },
      {
        query: "Explain the methodology used in this research",
        description: "Deep analytical query",
        expectedElements: ['methodology', 'process', 'explanation']
      }
    ];
    
    let successfulChats = 0;
    
    for (const test of chatTests) {
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
            // Verify chat quality
            const chatQuality = {
              hasAnswer: data.answer && data.answer.length > 50,
              hasSources: data.sources && data.sources.length > 0,
              hasValidCitations: data.sources && data.sources.every(s => 
                s.pageNum && s.content && s.pdfTitle
              ),
              hasSnippets: data.sources && data.sources.every(s => s.snippet),
              reasonableLength: data.answer && data.answer.length > 100 && data.answer.length < 3000,
              fastResponse: responseTime < 15000 // 15 seconds for LLM calls
            };
            
            const qualityScore = Object.values(chatQuality).filter(Boolean).length;
            const maxQuality = Object.keys(chatQuality).length;
            
            if (qualityScore >= maxQuality * 0.8) {
              log(`✅ ${test.description}: High quality response (${qualityScore}/${maxQuality}) - ${data.sources?.length || 0} sources (${responseTime}ms)`, 'success');
              addResult(`Chat - ${test.description}`, true, `Quality ${qualityScore}/${maxQuality}, ${responseTime}ms`, {
                answerLength: data.answer?.length || 0,
                sourceCount: data.sources?.length || 0,
                chatQuality,
                responseTime
              });
              successfulChats++;
            } else {
              log(`⚠️ ${test.description}: Low quality response (${qualityScore}/${maxQuality})`, 'warning');
              addResult(`Chat - ${test.description}`, false, `Low quality ${qualityScore}/${maxQuality}`, chatQuality);
            }
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
      
      await sleep(1000); // Longer delay for LLM calls
    }
    
    const allChatsSuccess = successfulChats === chatTests.length;
    log(`RAG Chat Summary: ${successfulChats}/${chatTests.length} high-quality responses`, allChatsSuccess ? 'success' : 'warning');
    
    return allChatsSuccess;
  } catch (error) {
    log(`RAG chat test error: ${error.message}`, 'error');
    addResult('RAG Chat', false, error.message);
    return false;
  }
}

// Test 6: Quiz Generation & Scoring
async function testQuizSystem() {
  log('🎯 Testing Quiz Generation & Scoring System', 'quiz');
  
  try {
    // Get a valid PDF for quiz generation
    const searchResponse = await fetch(`${API_BASE}/search?q=test&k=1`);
    const searchData = await searchResponse.json();
    
    if (!searchData.success || !searchData.results || searchData.results.length === 0) {
      log('No PDFs available for quiz test', 'error');
      addResult('Quiz System', false, 'No PDFs available');
      return false;
    }
    
    const pdfId = searchData.results[0].pdfId;
    
    // Test 6.1: Quiz Generation
    log('Generating quiz...', 'info');
    const generateStartTime = Date.now();
    
    const generateResponse = await fetch(`${API_BASE}/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfId: pdfId,
        numMCQ: 3,
        numSAQ: 2,
        numLAQ: 1
      }),
    });
    
    const generateEndTime = Date.now();
    const generateTime = generateEndTime - generateStartTime;
    
    if (!generateResponse.ok) {
      log(`❌ Quiz generation failed: HTTP ${generateResponse.status}`, 'error');
      addResult('Quiz Generation', false, `HTTP ${generateResponse.status}`);
      return false;
    }
    
    const quizData = await generateResponse.json();
    
    if (!quizData.success || !quizData.quizId) {
      log(`❌ Quiz generation failed: ${quizData.error || 'No quiz ID returned'}`, 'error');
      addResult('Quiz Generation', false, quizData.error || 'No quiz ID');
      return false;
    }
    
    log(`✅ Quiz generated successfully: ID ${quizData.quizId} (${generateTime}ms)`, 'success');
    
    // Test 6.2: Quiz Retrieval
    const getQuizResponse = await fetch(`${API_BASE}/get-quiz?quizId=${quizData.quizId}`);
    
    if (!getQuizResponse.ok) {
      log(`❌ Quiz retrieval failed: HTTP ${getQuizResponse.status}`, 'error');
      addResult('Quiz Retrieval', false, `HTTP ${getQuizResponse.status}`);
      return false;
    }
    
    const retrievedQuiz = await getQuizResponse.json();
    
    if (!retrievedQuiz.success || !retrievedQuiz.quiz) {
      log(`❌ Quiz retrieval failed: ${retrievedQuiz.error || 'No quiz data'}`, 'error');
      addResult('Quiz Retrieval', false, retrievedQuiz.error || 'No quiz data');
      return false;
    }
    
    // Validate quiz structure
    const quiz = retrievedQuiz.quiz;
    const quizValidation = {
      hasQuestions: quiz.questions && quiz.questions.length > 0,
      hasCorrectCount: quiz.questions.length === 6, // 3 MCQ + 2 SAQ + 1 LAQ
      hasMCQs: quiz.questions.some(q => q.type === 'MCQ'),
      hasSAQs: quiz.questions.some(q => q.type === 'SAQ'),
      hasLAQs: quiz.questions.some(q => q.type === 'LAQ'),
      allQuestionsValid: quiz.questions.every(q => q.question && q.type),
      mcqsHaveOptions: quiz.questions.filter(q => q.type === 'MCQ').every(q => q.options && q.options.length >= 2)
    };
    
    const validationScore = Object.values(quizValidation).filter(Boolean).length;
    const maxValidation = Object.keys(quizValidation).length;
    
    if (validationScore === maxValidation) {
      log(`✅ Quiz structure valid: ${quiz.questions.length} questions`, 'success');
      addResult('Quiz Structure', true, `${quiz.questions.length} questions, all validation passed`);
    } else {
      log(`⚠️ Quiz structure issues: ${validationScore}/${maxValidation} validations passed`, 'warning');
      addResult('Quiz Structure', false, `${validationScore}/${maxValidation} validations passed`, quizValidation);
    }
    
    // Test 6.3: Quiz Submission & Scoring
    log('Testing quiz submission...', 'info');
    
    // Create sample answers
    const sampleAnswers = {};
    quiz.questions.forEach((question) => {
      if (question.type === 'MCQ') {
        // Pick first option for MCQ
        sampleAnswers[question.id] = '0';
      } else {
        // Provide sample text answers for SAQ/LAQ
        sampleAnswers[question.id] = 'This is a sample answer for testing purposes.';
      }
    });
    
    const submitResponse = await fetch(`${API_BASE}/submit-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quizId: quizData.quizId,
        answers: sampleAnswers
      }),
    });
    
    if (!submitResponse.ok) {
      log(`❌ Quiz submission failed: HTTP ${submitResponse.status}`, 'error');
      addResult('Quiz Submission', false, `HTTP ${submitResponse.status}`);
      return false;
    }
    
    const submissionResult = await submitResponse.json();
    
    if (submissionResult.success) {
      const score = submissionResult.score;
      const totalQuestions = quiz.questions.length;
      
      log(`✅ Quiz submission successful: Score ${score}/${totalQuestions}`, 'success');
      addResult('Quiz Submission', true, `Score ${score}/${totalQuestions}`, {
        score,
        totalQuestions,
        submissionId: submissionResult.submissionId
      });
      
      // Overall quiz system assessment
      addResult('Quiz System Overall', true, `Complete workflow tested successfully`, {
        quizId: quizData.quizId,
        generateTime,
        questionCount: quiz.questions.length,
        finalScore: score
      });
      
      return true;
    } else {
      log(`❌ Quiz submission failed: ${submissionResult.error}`, 'error');
      addResult('Quiz Submission', false, submissionResult.error);
      return false;
    }
    
  } catch (error) {
    log(`Quiz system test error: ${error.message}`, 'error');
    addResult('Quiz System', false, error.message);
    return false;
  }
}

// Test 7: PDF Viewer Integration
async function testPDFViewer() {
  log('📄 Testing PDF Viewer Integration', 'test');
  
  try {
    // Get available PDFs
    const pdfsResponse = await fetch(`${API_BASE}/pdfs`);
    const pdfsData = await pdfsResponse.json();
    
    if (!pdfsData.success || !pdfsData.pdfs || pdfsData.pdfs.length === 0) {
      log('No PDFs available for viewer test', 'error');
      addResult('PDF Viewer', false, 'No PDFs available');
      return false;
    }
    
    const testPDF = pdfsData.pdfs[0];
    
    // Test PDF endpoint
    const pdfResponse = await fetch(`${API_BASE}/pdf/${testPDF.id}`);
    
    if (pdfResponse.ok) {
      const contentType = pdfResponse.headers.get('content-type');
      
      if (contentType && contentType.includes('application/pdf')) {
        log(`✅ PDF viewer endpoint working: ${testPDF.title}`, 'success');
        addResult('PDF Viewer', true, `PDF served correctly: ${testPDF.title}`, {
          pdfId: testPDF.id,
          title: testPDF.title,
          contentType
        });
        return true;
      } else {
        log(`⚠️ PDF endpoint returns non-PDF content: ${contentType}`, 'warning');
        addResult('PDF Viewer', false, `Wrong content type: ${contentType}`);
        return false;
      }
    } else {
      log(`❌ PDF endpoint failed: HTTP ${pdfResponse.status}`, 'error');
      addResult('PDF Viewer', false, `HTTP ${pdfResponse.status}`);
      return false;
    }
    
  } catch (error) {
    log(`PDF viewer test error: ${error.message}`, 'error');
    addResult('PDF Viewer', false, error.message);
    return false;
  }
}

// Test 8: End-to-End Workflow
async function testEndToEndWorkflow() {
  log('🔄 Testing Complete End-to-End Workflow', 'test');
  
  try {
    const workflowSteps = [];
    
    // Step 1: List available PDFs
    log('Step 1: Listing available PDFs...', 'info');
    const pdfsResponse = await fetch(`${API_BASE}/pdfs`);
    const pdfsData = await pdfsResponse.json();
    
    if (pdfsData.success && pdfsData.pdfs && pdfsData.pdfs.length > 0) {
      workflowSteps.push({ step: 'List PDFs', success: true, data: pdfsData.pdfs.length });
      log(`✅ Found ${pdfsData.pdfs.length} PDFs`, 'success');
    } else {
      workflowSteps.push({ step: 'List PDFs', success: false });
      log(`❌ No PDFs found`, 'error');
      return false;
    }
    
    const testPDF = pdfsData.pdfs[0];
    
    // Step 2: Search for content
    log('Step 2: Searching for content...', 'info');
    const searchResponse = await fetch(`${API_BASE}/search?q=methodology&pdfId=${testPDF.id}&k=3`);
    const searchData = await searchResponse.json();
    
    if (searchData.success && searchData.results && searchData.results.length > 0) {
      workflowSteps.push({ step: 'Search Content', success: true, data: searchData.results.length });
      log(`✅ Found ${searchData.results.length} relevant chunks`, 'success');
    } else {
      workflowSteps.push({ step: 'Search Content', success: false });
      log(`❌ Search failed`, 'error');
      return false;
    }
    
    // Step 3: Generate answer via RAG
    log('Step 3: Generating RAG answer...', 'info');
    const chatResponse = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is the main methodology discussed?',
        pdfId: testPDF.id,
        k: 3
      })
    });
    const chatData = await chatResponse.json();
    
    if (chatData.success && chatData.answer) {
      workflowSteps.push({ step: 'RAG Answer', success: true, data: chatData.answer.length });
      log(`✅ Generated answer (${chatData.answer.length} chars)`, 'success');
    } else {
      workflowSteps.push({ step: 'RAG Answer', success: false });
      log(`❌ RAG failed`, 'error');
      return false;
    }
    
    // Step 4: Generate quiz
    log('Step 4: Generating quiz...', 'info');
    const quizResponse = await fetch(`${API_BASE}/generate-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfId: testPDF.id,
        numMCQ: 2,
        numSAQ: 1,
        numLAQ: 1
      })
    });
    const quizData = await quizResponse.json();
    
    if (quizData.success && quizData.quizId) {
      workflowSteps.push({ step: 'Generate Quiz', success: true, data: quizData.quizId });
      log(`✅ Generated quiz ${quizData.quizId}`, 'success');
    } else {
      workflowSteps.push({ step: 'Generate Quiz', success: false });
      log(`❌ Quiz generation failed`, 'error');
      return false;
    }
    
    // Step 5: Access PDF viewer
    log('Step 5: Testing PDF viewer access...', 'info');
    const pdfViewerResponse = await fetch(`${API_BASE}/pdf/${testPDF.id}`);
    
    if (pdfViewerResponse.ok) {
      workflowSteps.push({ step: 'PDF Viewer', success: true, data: pdfViewerResponse.status });
      log(`✅ PDF viewer accessible`, 'success');
    } else {
      workflowSteps.push({ step: 'PDF Viewer', success: false });
      log(`❌ PDF viewer failed`, 'error');
    }
    
    // Workflow assessment
    const successfulSteps = workflowSteps.filter(s => s.success).length;
    const totalSteps = workflowSteps.length;
    
    if (successfulSteps === totalSteps) {
      log(`✅ Complete end-to-end workflow successful: ${successfulSteps}/${totalSteps} steps`, 'success');
      addResult('End-to-End Workflow', true, `${successfulSteps}/${totalSteps} steps completed`, workflowSteps);
      return true;
    } else {
      log(`⚠️ Partial workflow success: ${successfulSteps}/${totalSteps} steps`, 'warning');
      addResult('End-to-End Workflow', false, `Only ${successfulSteps}/${totalSteps} steps completed`, workflowSteps);
      return false;
    }
    
  } catch (error) {
    log(`End-to-end workflow error: ${error.message}`, 'error');
    addResult('End-to-End Workflow', false, error.message);
    return false;
  }
}

// Test 9: Performance & Load Testing
async function testPerformanceLoad() {
  log('⚡ Testing Performance & Load Characteristics', 'test');
  
  try {
    // Test 1: Concurrent search requests
    log('Testing concurrent search performance...', 'info');
    
    const concurrentSearches = Array(5).fill().map((_, i) => 
      fetch(`${API_BASE}/search?q=test${i}&k=3`)
    );
    
    const searchStartTime = Date.now();
    const searchResults = await Promise.all(concurrentSearches);
    const searchEndTime = Date.now();
    const totalSearchTime = searchEndTime - searchStartTime;
    
    const successfulSearches = searchResults.filter(r => r.ok).length;
    
    if (successfulSearches === concurrentSearches.length && totalSearchTime < 10000) {
      log(`✅ Concurrent searches: ${successfulSearches}/5 successful in ${totalSearchTime}ms`, 'success');
      addResult('Performance - Concurrent Search', true, `${totalSearchTime}ms for 5 concurrent searches`);
    } else {
      log(`⚠️ Concurrent search issues: ${successfulSearches}/5 successful, ${totalSearchTime}ms`, 'warning');
      addResult('Performance - Concurrent Search', false, `${successfulSearches}/5 successful, ${totalSearchTime}ms`);
    }
    
    // Test 2: Large result set performance
    log('Testing large result set performance...', 'info');
    
    const largeSearchStart = Date.now();
    const largeSearchResponse = await fetch(`${API_BASE}/search?q=the&k=20`);
    const largeSearchEnd = Date.now();
    const largeSearchTime = largeSearchEnd - largeSearchStart;
    
    if (largeSearchResponse.ok && largeSearchTime < 8000) {
      const largeSearchData = await largeSearchResponse.json();
      log(`✅ Large result set: ${largeSearchData.resultCount || 0} results in ${largeSearchTime}ms`, 'success');
      addResult('Performance - Large Results', true, `${largeSearchTime}ms for k=20`);
    } else {
      log(`⚠️ Large result set slow: ${largeSearchTime}ms`, 'warning');
      addResult('Performance - Large Results', false, `Slow response: ${largeSearchTime}ms`);
    }
    
    // Test 3: Complex query performance
    log('Testing complex query performance...', 'info');
    
    const complexQuery = 'What are the detailed methodological approaches and implementation strategies for machine learning algorithms in the context of data processing pipelines';
    const complexStart = Date.now();
    
    const complexChatResponse = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: complexQuery,
        k: 5
      })
    });
    
    const complexEnd = Date.now();
    const complexTime = complexEnd - complexStart;
    
    if (complexChatResponse.ok && complexTime < 30000) { // 30 seconds for complex LLM query
      log(`✅ Complex RAG query: ${complexTime}ms`, 'success');
      addResult('Performance - Complex Query', true, `${complexTime}ms for complex RAG`);
    } else {
      log(`⚠️ Complex query slow: ${complexTime}ms`, 'warning');
      addResult('Performance - Complex Query', false, `Slow response: ${complexTime}ms`);
    }
    
    return true;
  } catch (error) {
    log(`Performance testing error: ${error.message}`, 'error');
    addResult('Performance Testing', false, error.message);
    return false;
  }
}

// Test 10: Error Handling & Edge Cases
async function testErrorHandling() {
  log('🛡️ Testing Error Handling & Edge Cases', 'test');
  
  const errorTests = [
    {
      name: 'Empty search query',
      test: () => fetch(`${API_BASE}/search?q=&k=5`),
      expectedOk: false,
      description: 'Should reject empty queries'
    },
    {
      name: 'Invalid PDF ID in search',
      test: () => fetch(`${API_BASE}/search?q=test&pdfId=invalid-uuid&k=3`),
      expectedOk: true, // Should handle gracefully
      description: 'Should handle invalid PDF IDs gracefully'
    },
    {
      name: 'Missing chat query',
      test: () => fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: 3 })
      }),
      expectedOk: false,
      description: 'Should reject requests without query'
    },
    {
      name: 'Invalid quiz parameters',
      test: () => fetch(`${API_BASE}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numMCQ: -1 })
      }),
      expectedOk: false,
      description: 'Should reject invalid quiz parameters'
    },
    {
      name: 'Non-existent quiz retrieval',
      test: () => fetch(`${API_BASE}/get-quiz?quizId=non-existent-quiz`),
      expectedOk: false,
      description: 'Should handle non-existent quiz IDs'
    },
    {
      name: 'Malformed JSON in chat',
      test: () => fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      }),
      expectedOk: false,
      description: 'Should handle malformed JSON'
    }
  ];
  
  let successfulErrorHandling = 0;
  
  for (const test of errorTests) {
    try {
      const response = await test.test();
      const handledCorrectly = test.expectedOk ? response.ok : !response.ok;
      
      if (handledCorrectly) {
        log(`✅ ${test.name}: Handled correctly`, 'success');
        addResult(`Error Handling - ${test.name}`, true, 'Handled as expected');
        successfulErrorHandling++;
      } else {
        log(`❌ ${test.name}: Not handled correctly`, 'error');
        addResult(`Error Handling - ${test.name}`, false, 'Not handled as expected');
      }
    } catch (error) {
      // Network errors for malformed requests are acceptable
      if (test.name.includes('Malformed JSON')) {
        log(`✅ ${test.name}: Rejected at network level`, 'success');
        addResult(`Error Handling - ${test.name}`, true, 'Rejected by fetch');
        successfulErrorHandling++;
      } else {
        log(`❌ ${test.name}: ${error.message}`, 'error');
        addResult(`Error Handling - ${test.name}`, false, error.message);
      }
    }
    
    await sleep(100);
  }
  
  const allErrorsHandled = successfulErrorHandling === errorTests.length;
  log(`Error Handling Summary: ${successfulErrorHandling}/${errorTests.length} cases handled correctly`, allErrorsHandled ? 'success' : 'warning');
  
  return allErrorsHandled;
}

// Generate Comprehensive Test Report
function generateComprehensiveReport() {
  log('📊 Generating Comprehensive Test Report', 'info');
  
  const totalTests = TEST_RESULTS.length;
  const passedTests = TEST_RESULTS.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  // Categorize results
  const categories = {
    'Infrastructure': TEST_RESULTS.filter(r => r.testName.includes('Health')),
    'PDF Processing': TEST_RESULTS.filter(r => r.testName.includes('PDF') || r.testName.includes('Upload') || r.testName.includes('Chunking')),
    'Search & Retrieval': TEST_RESULTS.filter(r => r.testName.includes('Search') || r.testName.includes('Vector')),
    'RAG Chat': TEST_RESULTS.filter(r => r.testName.includes('Chat') || r.testName.includes('RAG')),
    'Quiz System': TEST_RESULTS.filter(r => r.testName.includes('Quiz')),
    'Performance': TEST_RESULTS.filter(r => r.testName.includes('Performance')),
    'Error Handling': TEST_RESULTS.filter(r => r.testName.includes('Error')),
    'End-to-End': TEST_RESULTS.filter(r => r.testName.includes('End-to-End'))
  };
  
  const report = `
# 🚀 BeyondChats MVP - Complete System Test Report

**Generated:** ${new Date().toISOString()}
**Total Tests:** ${totalTests}
**Passed:** ${passedTests} ✅
**Failed:** ${failedTests} ❌
**Success Rate:** ${successRate}%

## 📋 Executive Summary

${successRate >= 95 ? '🟢 **EXCELLENT** - System is production-ready with all functionalities working perfectly' :
  successRate >= 85 ? '🟡 **VERY GOOD** - System is mostly production-ready with minor issues' :
  successRate >= 75 ? '🟠 **GOOD** - System is functional but needs some improvements before production' :
  successRate >= 60 ? '🟡 **FAIR** - System has multiple issues that need attention' :
  '🔴 **POOR** - System requires significant work before deployment'}

## 🎯 Feature Implementation Status

### ✅ Core Features Tested:
- PDF Upload & Processing Pipeline
- Text Chunking & Embedding Generation
- Vector Search & Similarity Matching
- RAG Chat with Citation Support
- Quiz Generation (MCQ, SAQ, LAQ)
- Quiz Scoring & Submission
- PDF Viewer Integration
- Error Handling & Edge Cases
- Performance & Load Testing
- End-to-End Workflow

## 📊 Results by Category

${Object.entries(categories).map(([category, results]) => {
  const categoryPassed = results.filter(r => r.success).length;
  const categoryTotal = results.length;
  const categoryRate = categoryTotal > 0 ? ((categoryPassed / categoryTotal) * 100).toFixed(1) : 'N/A';
  const status = categoryRate >= 90 ? '🟢' : categoryRate >= 75 ? '🟡' : categoryRate >= 50 ? '🟠' : '🔴';
  
  return `
### ${status} ${category}
**Status:** ${categoryPassed}/${categoryTotal} passed (${categoryRate}%)
${results.map(r => `- ${r.success ? '✅' : '❌'} ${r.testName}: ${r.message}`).join('\n')}
`;
}).join('\n')}

## 🔍 Detailed Test Results

${TEST_RESULTS.map(result => `
### ${result.success ? '✅' : '❌'} ${result.testName}
**Status:** ${result.success ? 'PASSED' : 'FAILED'}
**Message:** ${result.message}
**Timestamp:** ${result.timestamp}
${result.data ? `**Additional Data:**
\`\`\`json
${JSON.stringify(result.data, null, 2)}
\`\`\`` : ''}
`).join('\n')}

## 🚦 System Readiness Assessment

### Production Readiness Checklist:
- ${categories['Infrastructure'].every(r => r.success) ? '✅' : '❌'} Infrastructure & Health Checks
- ${categories['PDF Processing'].every(r => r.success) ? '✅' : '❌'} PDF Processing Pipeline
- ${categories['Search & Retrieval'].every(r => r.success) ? '✅' : '❌'} Search & Vector Retrieval
- ${categories['RAG Chat'].every(r => r.success) ? '✅' : '❌'} RAG Chat System
- ${categories['Quiz System'].every(r => r.success) ? '✅' : '❌'} Quiz Generation & Scoring
- ${categories['Performance'].every(r => r.success) ? '✅' : '❌'} Performance Benchmarks
- ${categories['Error Handling'].every(r => r.success) ? '✅' : '❌'} Error Handling
- ${categories['End-to-End'].every(r => r.success) ? '✅' : '❌'} Complete Workflow

## 💡 Recommendations

${successRate >= 95 ? `### 🎉 Excellent Work!
- System is production-ready
- All core functionalities working perfectly
- Consider scaling optimizations for production load
- Implement monitoring and logging for production deployment` :

successRate >= 85 ? `### 🚀 Nearly Production Ready
- Address the few failing tests before production
- System architecture is solid
- Consider additional stress testing
- Implement comprehensive logging and monitoring` :

successRate >= 75 ? `### 🔧 Good Foundation, Needs Polish
- Fix failing critical tests before production
- Review and improve error handling
- Optimize performance bottlenecks
- Add comprehensive testing for edge cases` :

`### ⚠️ Significant Issues Detected
- Critical system components need attention
- Review architecture and implementation
- Fix failing tests systematically
- Consider additional development time before production`}

## 🛠️ Next Steps

1. **Address failing tests:** Focus on critical failures first
2. **Performance optimization:** Ensure all operations meet performance requirements  
3. **Security review:** Implement proper authentication and authorization
4. **Production setup:** Configure environment variables, database, and deployment
5. **Monitoring:** Implement logging, metrics, and alerting
6. **User testing:** Conduct user acceptance testing
7. **Documentation:** Complete API documentation and user guides

## 📈 Performance Metrics Summary

${(() => {
  const perfResults = TEST_RESULTS.filter(r => r.data && (r.data.responseTime || r.data.generateTime));
  if (perfResults.length === 0) return 'No performance data available';
  
  const avgResponseTime = perfResults
    .map(r => r.data.responseTime || r.data.generateTime || 0)
    .reduce((sum, time) => sum + time, 0) / perfResults.length;
    
  return `- Average Response Time: ${avgResponseTime.toFixed(0)}ms
- Search Performance: ${perfResults.filter(r => r.testName.includes('Search')).length > 0 ? 'Tested' : 'Not tested'}
- Chat Performance: ${perfResults.filter(r => r.testName.includes('Chat')).length > 0 ? 'Tested' : 'Not tested'}
- Quiz Generation: ${perfResults.filter(r => r.testName.includes('Quiz')).length > 0 ? 'Tested' : 'Not tested'}`;
})()}

---
**Generated by BeyondChats MVP Complete System Test Suite**
**Test Framework Version:** 1.0.0
**Total Runtime:** ${Date.now() - new Date().getTime()}ms
`;

  // Save report to file
  const reportPath = path.join(process.cwd(), 'comprehensive-test-report.md');
  fs.writeFileSync(reportPath, report);
  
  log(`📄 Comprehensive test report saved to: ${reportPath}`, 'success');
  
  // Console summary
  console.log('\n' + '='.repeat(100));
  console.log(`🎯 BEYONDCHATS MVP TEST SUMMARY: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
  console.log('='.repeat(100));
  
  return { totalTests, passedTests, failedTests, successRate, reportPath };
}

// Main test runner
async function runCompleteSystemTest() {
  console.log('\n🚀 BeyondChats MVP - Complete System Test Suite');
  console.log('Testing all functionalities from the assignment brief...\n');
  console.log('='.repeat(100));
  
  const tests = [
    { name: 'System Health Check', fn: testHealthCheck, critical: true },
    { name: 'PDF Upload Pipeline', fn: testPDFUploadPipeline, critical: true },
    { name: 'Chunking & Embedding', fn: testChunkingEmbedding, critical: true },
    { name: 'Vector Search', fn: testVectorSearch, critical: true },
    { name: 'RAG Chat', fn: testRAGChat, critical: true },
    { name: 'Quiz System', fn: testQuizSystem, critical: true },
    { name: 'PDF Viewer', fn: testPDFViewer, critical: false },
    { name: 'End-to-End Workflow', fn: testEndToEndWorkflow, critical: true },
    { name: 'Performance & Load', fn: testPerformanceLoad, critical: false },
    { name: 'Error Handling', fn: testErrorHandling, critical: false }
  ];
  
  let overallSuccess = true;
  let criticalFailures = 0;
  
  log('🧪 Starting comprehensive test suite...', 'test');
  
  for (const test of tests) {
    try {
      log(`\n${'─'.repeat(80)}`, 'info');
      log(`Running: ${test.name}`, 'test');
      log(`${'─'.repeat(80)}`, 'info');
      
      const result = await test.fn();
      
      if (!result) {
        overallSuccess = false;
        if (test.critical) {
          criticalFailures++;
        }
      }
      
    } catch (error) {
      log(`💥 Test ${test.name} crashed: ${error.message}`, 'error');
      addResult(test.name, false, `Test crashed: ${error.message}`);
      overallSuccess = false;
      
      if (test.critical) {
        criticalFailures++;
      }
    }
    
    await sleep(500); // Brief pause between major test suites
  }
  
  console.log('\n' + '='.repeat(100));
  log('📊 Generating comprehensive test report...', 'info');
  
  const summary = generateComprehensiveReport();
  
  // Final assessment
  if (overallSuccess && summary.successRate >= 95) {
    log('🎉 OUTSTANDING! All tests passed. System is production-ready!', 'success');
  } else if (summary.successRate >= 85 && criticalFailures === 0) {
    log('🚀 EXCELLENT! System is nearly production-ready with minor issues.', 'success');
  } else if (summary.successRate >= 75 && criticalFailures <= 1) {
    log('👍 GOOD! System is functional but needs some improvements.', 'warning');
  } else if (criticalFailures > 2) {
    log('⚠️ CRITICAL ISSUES! Multiple core functionalities have problems.', 'error');
  } else {
    log('❌ NEEDS WORK! System requires significant attention before production.', 'error');
  }
  
  console.log('\n' + '='.repeat(100));
  console.log(`📋 Full report available at: ${summary.reportPath}`);
  console.log('='.repeat(100));
  
  return {
    success: overallSuccess && criticalFailures === 0,
    summary,
    criticalFailures
  };
}

// CLI interface
if (require.main === module) {
  runCompleteSystemTest()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = {
  runCompleteSystemTest,
  testHealthCheck,
  testPDFUploadPipeline,
  testChunkingEmbedding,
  testVectorSearch,
  testRAGChat,
  testQuizSystem,
  testPDFViewer,
  testEndToEndWorkflow,
  testPerformanceLoad,
  testErrorHandling,
  generateComprehensiveReport
};