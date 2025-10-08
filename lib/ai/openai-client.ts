// ==============================================
// lib/ai/openai-client.ts - OpenAI Client with Function Calling
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
  model: process.env.OPENAI_MODEL || 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2000,
}

// ==============================================
// TYPES
// ==============================================
export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant' | 'function'
  content: string | null
  name?: string // For function role
  function_call?: {
    name: string
    arguments: string
  }
}

export interface ChatCompletionOptions {
  messages: ChatCompletionMessage[]
  temperature?: number
  maxTokens?: number
  functions?: any[]
  function_call?: 'auto' | 'none' | { name: string }
}

export interface ChatCompletionResult {
  content: string
  tokensUsed: number
  model: string
  functionCall?: {
    name: string
    arguments: any
  }
  finishReason: string
}

// ==============================================
// MAIN CHAT COMPLETION FUNCTION
// ==============================================
export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  try {
    const requestOptions: any = {
      model: AI_CONFIG.model,
      messages: options.messages,
      temperature: options.temperature || AI_CONFIG.temperature,
      max_tokens: options.maxTokens || AI_CONFIG.maxTokens,
    }

    // Add functions if provided (for function calling)
    if (options.functions && options.functions.length > 0) {
      requestOptions.functions = options.functions
      requestOptions.function_call = options.function_call || 'auto'
    }

    console.log('[OpenAI] Sending request:', {
      model: requestOptions.model,
      messageCount: options.messages.length,
      hasFunctions: !!options.functions,
      functionsCount: options.functions?.length || 0
    })

    const response = await openai.chat.completions.create(requestOptions)

    const message = response.choices[0]?.message
    const finishReason = response.choices[0]?.finish_reason || 'stop'

    console.log('[OpenAI] Response:', {
      finishReason,
      hasFunctionCall: !!message?.function_call,
      tokensUsed: response.usage?.total_tokens
    })

    // Check if AI wants to call a function
    if (message?.function_call) {
      return {
        content: message.content || '',
        tokensUsed: response.usage?.total_tokens || 0,
        model: response.model,
        functionCall: {
          name: message.function_call.name,
          arguments: JSON.parse(message.function_call.arguments)
        },
        finishReason
      }
    }

    // Regular response
    return {
      content: message?.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model,
      finishReason
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