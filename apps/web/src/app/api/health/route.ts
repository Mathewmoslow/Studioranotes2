import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  const openaiKey = process.env.OPENAI_API_KEY_CONTEXT || process.env.OPENAI_API_KEY;
  const fixtureEnabled = process.env.NEXT_PUBLIC_ENABLE_FIXTURE === 'true';
  const mockExtraction = process.env.MOCK_EXTRACTION === 'true';

  let openaiStatus = 'not_configured';
  let openaiModel = null;

  // Actually test OpenAI if key exists
  if (openaiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say "OK" in one word.' }],
        max_tokens: 5,
      });
      openaiStatus = 'connected';
      openaiModel = response.model;
    } catch (error: any) {
      openaiStatus = `error: ${error.message || 'unknown'}`;
    }
  }

  return NextResponse.json({
    status: openaiStatus === 'connected' ? 'healthy' : 'degraded',
    openai: {
      configured: Boolean(openaiKey),
      status: openaiStatus,
      model: openaiModel,
    },
    settings: {
      fixtureEnabled,
      mockExtraction,
    },
    recommendation: mockExtraction ? 'Set MOCK_EXTRACTION=false for production' : 'Production ready',
    timestamp: new Date().toISOString(),
  });
}
