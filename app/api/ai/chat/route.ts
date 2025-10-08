// ==============================================
// app/api/ai/chat/route.ts - AI Chat with API Function Calling
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { validateSendMessage } from '@/lib/validations/ai/chat'
import { AIChatDatabaseService } from '@/lib/database/services/ai-chat'
import { AIContextBuilder } from '@/lib/ai/context-builder'
import { 
  createChatCompletion, 
  validateOpenAIConfig,
  type ChatCompletionMessage  // ✅ Import the type
} from '@/lib/ai/openai-client'
import { 
  generateCompleteSystemPrompt, 
  getAIContextPermissions 
} from '@/lib/ai'
import { convertToOpenAIFunctions } from '@/lib/ai/api-registry'
import { APICaller } from '@/lib/ai/api-caller'
import type { UserContext } from '@/types/ai'

// ==============================================
// POST /api/ai/chat - Send Message to AI
// ==============================================
export async function POST(request: NextRequest) {
  try {
    // ==============================================
    // 1. AUTHENTICATION & USER CONTEXT
    // ==============================================
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')
    const userRole = request.headers.get('x-user-role')
    const firstName = request.headers.get('x-user-name')?.split(' ')[0] || 'User'
    const lastName = request.headers.get('x-user-name')?.split(' ')[1] || ''
    const userName = `${firstName} ${lastName}`

    if (!userId || !companyId || !userRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to use the AI assistant.',
        },
        { status: 401 }
      )
    }

    console.log('🔍 AI Chat Request from:', { userId, companyId, role: userRole, firstName })

    // ==============================================
    // 2. VALIDATE OPENAI CONFIGURATION
    // ==============================================
    const configValidation = validateOpenAIConfig()
    if (!configValidation.valid) {
      console.error('OpenAI config error:', configValidation.error)
      return NextResponse.json(
        {
          success: false,
          error: 'AI service unavailable',
          message: 'The AI assistant is temporarily unavailable. Please try again later.',
        },
        { status: 503 }
      )
    }

    // ==============================================
    // 3. PARSE & VALIDATE REQUEST
    // ==============================================
    const body = await request.json()
    const validation = validateSendMessage(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid message',
          message: validation.error,
        },
        { status: 400 }
      )
    }

    const { message, conversationId, includeContext } = validation.data

    // ==============================================
    // 4. INITIALIZE SERVICES
    // ==============================================
    const chatService = new AIChatDatabaseService(false)
    const contextBuilder = new AIContextBuilder(false)
    const apiCaller = new APICaller(userId, companyId, userRole, userName)

    // ==============================================
    // 5. GET OR CREATE CONVERSATION
    // ==============================================
    let activeConversationId = conversationId

    if (!activeConversationId) {
      const title = chatService.generateTitleFromMessage(message)
      activeConversationId = await chatService.createConversation(
        userId,
        companyId,
        title
      )
    }

    // ==============================================
    // 6. SAVE USER MESSAGE
    // ==============================================
    await chatService.saveMessage(
      activeConversationId,
      'user',
      message
    )

    // ==============================================
    // 7. BUILD CONTEXT (Simple context for members)
    // ==============================================
    let contextString = ''
    
    if (includeContext) {
      const userContext: UserContext = {
        userId,
        companyId,
        role: userRole,
        firstName,
        lastName,
        permissions: null,
      }

      const dbContext = await contextBuilder.buildDatabaseContext(userContext)
      contextString = contextBuilder.formatContextAsString(dbContext, userContext)
    }

    // ==============================================
    // 8. BUILD SYSTEM PROMPT
    // ==============================================
    const userContext: UserContext = {
      userId,
      companyId,
      role: userRole,
      firstName,
      lastName,
      permissions: null,
    }

    const permissions = getAIContextPermissions(userRole)
    const systemPrompt = generateCompleteSystemPrompt(
      userContext,
      permissions,
      contextString || undefined
    )

    // ==============================================
    // 9. GET CONVERSATION HISTORY
    // ==============================================
    const conversationMessages = await chatService.getConversationMessages(
      activeConversationId,
      10 // Last 10 messages
    )

    // ==============================================
    // 10. PREPARE MESSAGES FOR AI (with function calling)
    // ==============================================
    const messages: ChatCompletionMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationMessages.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ]

    // Get available functions based on user role
    const functions = convertToOpenAIFunctions(userRole)
    
    console.log(`📋 Available functions for ${userRole}:`, functions.map(f => f.name))

    // ==============================================
    // 11. AI RESPONSE LOOP (Handle function calls)
    // ==============================================
    let aiResponse
    let functionCallCount = 0
    const maxFunctionCalls = 5 // Prevent infinite loops

    while (functionCallCount < maxFunctionCalls) {
      // Call AI
      aiResponse = await createChatCompletion({ 
        messages,
        functions: functions.length > 0 ? functions : undefined,
      })

      // If no function call, we're done
      if (!aiResponse.functionCall) {
        break
      }

      functionCallCount++
      console.log(`🔧 Function call #${functionCallCount}:`, aiResponse.functionCall.name)

      // Execute the function (call your existing API)
      const functionResult = await apiCaller.call(
        aiResponse.functionCall.name,
        aiResponse.functionCall.arguments
      )

      console.log(`✅ Function result:`, {
        success: functionResult.success,
        hasData: !!functionResult.data,
        error: functionResult.error
      })

      // Add function result to conversation
      messages.push({
        role: 'assistant',
        content: null,
        function_call: {
          name: aiResponse.functionCall.name,
          arguments: JSON.stringify(aiResponse.functionCall.arguments)
        }
      })

      messages.push({
        role: 'function',
        name: aiResponse.functionCall.name,
        content: APICaller.formatResultForAI(functionResult),
      })
      // Continue loop to get AI's final response
    }

    if (!aiResponse) {
      throw new Error('No AI response generated')
    }

    // ==============================================
    // 12. SAVE AI RESPONSE
    // ==============================================
    const assistantMessageId = await chatService.saveMessage(
      activeConversationId,
      'assistant',
      aiResponse.content,
      {
        tokensUsed: aiResponse.tokensUsed,
        model: aiResponse.model,
        functionCallsUsed: functionCallCount,
      }
    )

    // ==============================================
    // 13. RETURN RESPONSE
    // ==============================================
    return NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully',
        data: {
          conversationId: activeConversationId,
          messageId: assistantMessageId,
          response: aiResponse.content,
          tokensUsed: aiResponse.tokensUsed,
          functionCallsUsed: functionCallCount,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('AI Chat Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// OPTIONS /api/ai/chat - CORS
// ==============================================
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}