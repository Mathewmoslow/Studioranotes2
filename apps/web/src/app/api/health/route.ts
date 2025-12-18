import { NextResponse } from 'next/server';

export async function GET() {
  const openaiKey = process.env.OPENAI_API_KEY_CONTEXT || process.env.OPENAI_API_KEY;
  const fixtureEnabled = process.env.NEXT_PUBLIC_ENABLE_FIXTURE === 'true';
  const mockExtraction = process.env.MOCK_EXTRACTION === 'true';

  return NextResponse.json({
    openaiEnabled: Boolean(openaiKey),
    fixtureEnabled,
    mockExtraction,
    timestamp: new Date().toISOString(),
  });
}
