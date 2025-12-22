import OpenAI from 'openai'

/**
 * OpenAI Smart Model Router
 *
 * Routes requests to the optimal model based on input size:
 * - Small inputs (< 350k tokens): GPT-5 family (cheaper)
 * - Large inputs (≥ 350k tokens): GPT-4.1 family (1M context)
 *
 * Includes automatic fallback on errors.
 */

// Model specifications
// useLegacyMaxTokens: true = uses max_tokens, false = uses max_completion_tokens
// supportsTemperature: false = reasoning models that only support temperature=1
export const MODEL_SPECS = {
  // GPT-5 family - 400k context, REASONING models (no temperature support)
  // See: https://community.openai.com/t/temperature-in-gpt-5-models/1337133
  'gpt-5-nano': { contextWindow: 400_000, maxOutput: 128_000, inputCost: 0.05, outputCost: 0.40, useLegacyMaxTokens: false, supportsTemperature: false },
  'gpt-5-mini': { contextWindow: 400_000, maxOutput: 128_000, inputCost: 0.25, outputCost: 2.00, useLegacyMaxTokens: false, supportsTemperature: false },
  'gpt-5': { contextWindow: 400_000, maxOutput: 128_000, inputCost: 1.00, outputCost: 4.00, useLegacyMaxTokens: false, supportsTemperature: false },

  // GPT-4.1 family - 1M context, standard models (temperature supported)
  // See: https://platform.openai.com/docs/models/gpt-4.1-nano
  'gpt-4.1-nano': { contextWindow: 1_047_576, maxOutput: 32_768, inputCost: 0.10, outputCost: 0.40, useLegacyMaxTokens: false, supportsTemperature: true },
  'gpt-4.1-mini': { contextWindow: 1_047_576, maxOutput: 32_768, inputCost: 0.40, outputCost: 1.60, useLegacyMaxTokens: false, supportsTemperature: true },
  'gpt-4.1': { contextWindow: 1_047_576, maxOutput: 32_768, inputCost: 2.00, outputCost: 8.00, useLegacyMaxTokens: false, supportsTemperature: true },

  // Legacy fallback (old API with max_tokens, full temperature support)
  'gpt-4o-mini': { contextWindow: 128_000, maxOutput: 16_384, inputCost: 0.15, outputCost: 0.60, useLegacyMaxTokens: true, supportsTemperature: true },
  'gpt-4o': { contextWindow: 128_000, maxOutput: 16_384, inputCost: 2.50, outputCost: 10.00, useLegacyMaxTokens: true, supportsTemperature: true },
} as const

export type ModelName = keyof typeof MODEL_SPECS

// Threshold for switching from GPT-5 to GPT-4.1 family
// GPT-5 has 400k context, but we switch at 350k to leave room for output
const LARGE_INPUT_THRESHOLD = 350_000

// Fallback chains by input size category
export const FALLBACK_CHAINS = {
  // For inputs < 350k tokens - prioritize GPT-5 (cheaper)
  small: [
    'gpt-5-nano',      // $0.05/1M - cheapest
    'gpt-5-mini',      // $0.25/1M - more capable
    'gpt-4.1-nano',    // $0.10/1M - if GPT-5 unavailable
    'gpt-4o-mini',     // Legacy fallback
  ] as ModelName[],

  // For inputs ≥ 350k tokens - need 1M context
  large: [
    'gpt-4.1-nano',    // $0.10/1M - cheapest with 1M context
    'gpt-4.1-mini',    // $0.40/1M - more capable
    'gpt-4.1',         // $2.00/1M - full power
  ] as ModelName[],
}

// Default model for env configuration
export const DEFAULT_MODEL: ModelName = 'gpt-5-nano'

/**
 * Estimate token count from text
 * Rule of thumb: ~4 characters per token for English text
 * We use 3.5 to be conservative (overestimate slightly)
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 3.5)
}

/**
 * Estimate tokens from messages array
 */
export function estimateMessagesTokens(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): number {
  let total = 0
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      total += estimateTokens(msg.content)
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text') {
          total += estimateTokens(part.text)
        }
      }
    }
    // Add overhead for message structure (~4 tokens per message)
    total += 4
  }
  return total
}

/**
 * Select the optimal model based on input size
 */
export function selectOptimalModel(estimatedTokens: number): {
  model: ModelName
  chain: ModelName[]
  reason: string
} {
  if (estimatedTokens >= LARGE_INPUT_THRESHOLD) {
    return {
      model: FALLBACK_CHAINS.large[0],
      chain: FALLBACK_CHAINS.large,
      reason: `Large input (~${Math.round(estimatedTokens / 1000)}k tokens) → using GPT-4.1 family (1M context)`
    }
  }

  return {
    model: FALLBACK_CHAINS.small[0],
    chain: FALLBACK_CHAINS.small,
    reason: `Standard input (~${Math.round(estimatedTokens / 1000)}k tokens) → using GPT-5 family (cheaper)`
  }
}

/**
 * Get configured primary model from environment (override)
 */
export function getPrimaryModel(): ModelName {
  const envModel = process.env.OPENAI_MODEL as ModelName
  if (envModel && MODEL_SPECS[envModel]) {
    return envModel
  }
  return DEFAULT_MODEL
}

// Initialize OpenAI client (singleton)
let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY_CONTEXT || process.env.OPENAI_API_KEY

  if (!apiKey) {
    return null
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey })
  }

  return openaiClient
}

/**
 * Create chat completion with smart model routing and automatic fallback
 *
 * 1. Estimates input token count
 * 2. Selects optimal model based on size (GPT-5 vs GPT-4.1)
 * 3. Falls back through chain on errors
 */
export async function createChatCompletionWithFallback(
  params: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, 'model'>,
  options?: {
    preferredModel?: ModelName
    maxRetries?: number
    timeout?: number
    skipSmartRouting?: boolean  // Force use of preferred model / env model
  }
): Promise<{
  completion: OpenAI.Chat.Completions.ChatCompletion
  modelUsed: string
  estimatedInputTokens: number
  routingReason: string
}> {
  const client = getOpenAIClient()

  if (!client) {
    throw new Error('OpenAI API key not configured')
  }

  const { preferredModel, maxRetries = 3, timeout = 120000, skipSmartRouting = false } = options || {}

  // Estimate input size
  const estimatedTokens = estimateMessagesTokens(params.messages)

  // Determine model chain
  let modelsToTry: ModelName[]
  let routingReason: string

  if (skipSmartRouting && preferredModel) {
    // User explicitly wants a specific model
    modelsToTry = [preferredModel]
    routingReason = `Forced model: ${preferredModel}`
  } else if (preferredModel) {
    // User preference, but still smart route as fallback
    const { chain } = selectOptimalModel(estimatedTokens)
    modelsToTry = [preferredModel, ...chain.filter(m => m !== preferredModel)]
    routingReason = `Preferred: ${preferredModel}, fallback based on ~${Math.round(estimatedTokens / 1000)}k tokens`
  } else {
    // Smart routing based on input size
    const selection = selectOptimalModel(estimatedTokens)
    modelsToTry = selection.chain
    routingReason = selection.reason
  }

  console.log(`[OpenAI Router] ${routingReason}`)
  console.log(`[OpenAI Router] Will try: ${modelsToTry.join(' → ')}`)

  let lastError: Error | null = null

  for (const model of modelsToTry) {
    // Check if model can handle the input
    const spec = MODEL_SPECS[model]
    if (spec && estimatedTokens > spec.contextWindow * 0.95) {
      console.warn(`[OpenAI Router] Skipping ${model} - input (~${Math.round(estimatedTokens / 1000)}k) exceeds context (${Math.round(spec.contextWindow / 1000)}k)`)
      continue
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Build request params, adapting to model capabilities
        const requestParams: any = { ...params, model }

        // Handle max_tokens vs max_completion_tokens
        if (params.max_tokens !== undefined) {
          const useLegacy = spec?.useLegacyMaxTokens ?? false
          if (useLegacy) {
            // Keep max_tokens for legacy models (gpt-4o family)
            requestParams.max_tokens = params.max_tokens
          } else {
            // Use max_completion_tokens for newer models (gpt-5, gpt-4.1 families)
            requestParams.max_completion_tokens = params.max_tokens
            delete requestParams.max_tokens
          }
        }

        // Handle temperature - nano models don't support it
        if (spec?.supportsTemperature === false) {
          delete requestParams.temperature
        }

        const completion = await Promise.race([
          client.chat.completions.create(requestParams),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ])

        // Success!
        console.log(`[OpenAI Router] Success with ${model}`)
        return {
          completion,
          modelUsed: model,
          estimatedInputTokens: estimatedTokens,
          routingReason
        }

      } catch (error: any) {
        lastError = error

        const errorMessage = error.message?.toLowerCase() || ''
        const statusCode = error.status || error.statusCode

        // Context length exceeded - skip to next model with larger context
        if (errorMessage.includes('context') || errorMessage.includes('maximum context length')) {
          console.warn(`[OpenAI Router] ${model} context exceeded, trying next...`)
          break
        }

        // Model not found - try next model immediately
        if (statusCode === 404 || (errorMessage.includes('model') && errorMessage.includes('not found'))) {
          console.warn(`[OpenAI Router] ${model} not available, trying next...`)
          break
        }

        // Rate limit - wait and retry same model
        if (statusCode === 429 || errorMessage.includes('rate limit')) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000)
          console.warn(`[OpenAI Router] Rate limited on ${model}, waiting ${waitTime}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }

        // Timeout - try next model
        if (errorMessage.includes('timeout')) {
          console.warn(`[OpenAI Router] Timeout on ${model}, trying next...`)
          break
        }

        // Server error - retry same model
        if (statusCode >= 500) {
          const waitTime = 1000 * (attempt + 1)
          console.warn(`[OpenAI Router] Server error on ${model}, retrying in ${waitTime}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }

        // Other error - throw immediately (API key, content policy, etc.)
        throw error
      }
    }
  }

  // All models failed
  throw lastError || new Error('All models in fallback chain failed')
}

/**
 * Simple wrapper for common use case
 */
export async function chatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options?: {
    temperature?: number
    maxTokens?: number
    jsonMode?: boolean
    preferredModel?: ModelName
  }
): Promise<{ content: string; modelUsed: string }> {
  const { temperature = 0.3, maxTokens, jsonMode = false, preferredModel } = options || {}

  const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
    model: '', // Will be set by router
    messages,
    temperature,
  }

  if (maxTokens) {
    params.max_tokens = maxTokens
  }

  if (jsonMode) {
    params.response_format = { type: 'json_object' }
  }

  const { completion, modelUsed } = await createChatCompletionWithFallback(params, { preferredModel })

  return {
    content: completion.choices[0]?.message?.content || '',
    modelUsed
  }
}

// Export types for convenience
export type { OpenAI }
