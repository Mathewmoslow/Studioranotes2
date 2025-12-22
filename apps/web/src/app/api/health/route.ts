import { NextResponse } from 'next/server';
import { getOpenAIClient, createChatCompletionWithFallback, getPrimaryModel, FALLBACK_CHAINS, MODEL_SPECS } from '@/lib/openai';

export async function GET() {
  const openaiKey = process.env.OPENAI_API_KEY_CONTEXT || process.env.OPENAI_API_KEY;
  const fixtureEnabled = process.env.NEXT_PUBLIC_ENABLE_FIXTURE === 'true';
  const mockExtraction = process.env.MOCK_EXTRACTION === 'true';

  let openaiStatus = 'not_configured';
  let openaiModel = null;
  let modelUsed = null;
  let routingReason = null;
  let estimatedTokens = null;
  const primaryModel = getPrimaryModel();

  // Actually test OpenAI if key exists - use smart routing
  if (openaiKey) {
    try {
      const result = await createChatCompletionWithFallback({
        messages: [{ role: 'user', content: 'Say "OK" in one word.' }],
        max_tokens: 5,
        temperature: 0.1,
      });
      openaiStatus = 'connected';
      openaiModel = result.completion.model;
      modelUsed = result.modelUsed;
      routingReason = result.routingReason;
      estimatedTokens = result.estimatedInputTokens;
    } catch (error: any) {
      openaiStatus = `error: ${error.message || 'unknown'}`;
    }
  }

  return NextResponse.json({
    status: openaiStatus === 'connected' ? 'healthy' : 'degraded',
    openai: {
      configured: Boolean(openaiKey),
      status: openaiStatus,
      defaultModel: primaryModel,
      modelUsed,
      responseModel: openaiModel,
      routingReason,
      estimatedTokens,
      smartRouting: {
        smallInputChain: FALLBACK_CHAINS.small,
        largeInputChain: FALLBACK_CHAINS.large,
        thresholdTokens: 350_000,
      },
      modelSpecs: MODEL_SPECS,
    },
    settings: {
      fixtureEnabled,
      mockExtraction,
    },
    recommendation: mockExtraction ? 'Set MOCK_EXTRACTION=false for production' : 'Production ready',
    timestamp: new Date().toISOString(),
  });
}
