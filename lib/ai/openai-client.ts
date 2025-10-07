// ==============================================
// lib/ai/openai-client.ts - OpenAI Client Wrapper
// ==============================================

import OpenAI from 'openai'

// ==============================================
// INITIALIZE OPENAI CLIENT
// ==============================================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ==============================================
// CONFIGURATION
// ==============================================
export const AI_CONFIG = {
  model: process.env.OPENAI_MODEL || 'gpt-4',
  temperature: 0.7, // Balance between creativity and consistency
  maxTokens: 1000, // Max tokens per response
  streamingEnabled: true,
}

// ==============================================
// TYPES
// ==============================================
export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  messages: ChatCompletionMessage[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

// ==============================================
// MAIN CHAT COMPLETION FUNCTION
// ==============================================
export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<{
  content: string
  tokensUsed: number
  model: string
}> {
  try {
    const response = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: options.messages,
      temperature: options.temperature || AI_CONFIG.temperature,
      max_tokens: options.maxTokens || AI_CONFIG.maxTokens,
      stream: false, // We'll add streaming later
    })

    const content = response.choices[0]?.message?.content || ''
    const tokensUsed = response.usage?.total_tokens || 0

    return {
      content,
      tokensUsed,
      model: response.model,
    }
  } catch (error) {
    console.error('OpenAI API Error:', error)
    
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI Error: ${error.message}`)
    }
    
    throw new Error('Failed to get AI response')
  }
}

// ==============================================
// STREAMING CHAT COMPLETION (For future use)
// ==============================================
export async function createStreamingChatCompletion(
  options: ChatCompletionOptions
) {
  try {
    const stream = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: options.messages,
      temperature: options.temperature || AI_CONFIG.temperature,
      max_tokens: options.maxTokens || AI_CONFIG.maxTokens,
      stream: true,
    })

    return stream
  } catch (error) {
    console.error('OpenAI Streaming Error:', error)
    throw new Error('Failed to start AI stream')
  }
}

// ==============================================
// HELPER: COUNT TOKENS (Approximate)
// ==============================================
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4)
}

// ==============================================
// HELPER: VALIDATE API KEY
// ==============================================
export function validateOpenAIConfig(): { valid: boolean; error?: string } {
  if (!process.env.OPENAI_API_KEY) {
    return {
      valid: false,
      error: 'OPENAI_API_KEY not found in environment variables',
    }
  }

  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    return {
      valid: false,
      error: 'Invalid OPENAI_API_KEY format',
    }
  }

  return { valid: true }
}

// ==============================================
// EXPORT CLIENT (for advanced use)
// ==============================================
export { openai }