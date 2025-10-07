import { NextResponse } from 'next/server';
import { listAvailableModels } from '@/lib/gemini';

export async function GET() {
  try {
    console.log('Testing Gemini API connection...');
    console.log('API Key present:', !!process.env.GEMINI_API_KEY);
    
    const models = await listAvailableModels();
    console.log('Available models:', models);
    
    return NextResponse.json({
      success: true,
      apiKeyPresent: !!process.env.GEMINI_API_KEY,
      availableModels: models,
      message: 'Gemini API test completed'
    });
  } catch (error) {
    console.error('Gemini test error:', error);
    return NextResponse.json(
      { 
        error: 'Gemini API test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        apiKeyPresent: !!process.env.GEMINI_API_KEY
      },
      { status: 500 }
    );
  }
}