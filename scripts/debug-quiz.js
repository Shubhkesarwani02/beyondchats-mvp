const https = require('https');
const http = require('http');

async function testQuizGeneration() {
  try {
    console.log('🎯 Testing quiz generation API...');
    
    const testData = JSON.stringify({
      pdfId: 'cmgg8ybfu0003zxu07gq3zglm',
      numMCQ: 2,
      numSAQ: 1,
      numLAQ: 1
    });
    
    console.log('Sending request with data:', testData);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/generate-quiz',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length,
      },
    };
    
    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        });
      });
      
      req.on('error', reject);
      req.write(testData);
      req.end();
    });
    
    console.log('Response status:', response.status);
    console.log('Response body:', response.body);
    
    if (response.status === 200) {
      console.log('✅ Quiz generation successful!');
      try {
        const jsonData = JSON.parse(response.body);
        console.log('Quiz ID:', jsonData.quizId);
        console.log('Questions count:', jsonData.questions?.length);
      } catch (e) {
        console.log('Could not parse as JSON');
      }
    } else {
      console.log('❌ Quiz generation failed!');
    }
    
  } catch (error) {
    console.error('Error testing quiz generation:', error);
  }
}

testQuizGeneration();

testQuizGeneration();