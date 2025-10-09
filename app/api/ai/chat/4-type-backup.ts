// ==============================================
// app/api/ai/chat/route.ts - Type 4 AI Chat (Intelligent API Discovery)
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { validateSendMessage } from '@/lib/validations/ai/chat'
import { AIChatDatabaseService } from '@/lib/database/services/ai-chat'
import { AIContextBuilder } from '@/lib/ai/context-builder'
import { 
  createChatCompletion, 
  validateOpenAIConfig,
  type ChatCompletionMessage
} from '@/lib/ai/openai-client'
import { generateType4SystemPrompt, CALL_API_FUNCTION } from '@/lib/ai/prompts/type4-prompt'
import { IntelligentAPICaller } from '@/lib/ai/intelligent-api-caller'
import { getAIContextPermissions } from '@/lib/ai/permissions'
import type { UserContext } from '@/types/ai'

// ==============================================
// POST /api/ai/chat - Send Message to Type 4 AI
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
    const sessionToken = request.cookies.get('sessionToken')?.value

    if (!userId || !companyId || !userRole || !sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to use the AI assistant.',
        },
        { status: 401 }
      )
    }

    console.log('🧠 Type 4 AI Chat Request from:', { userId, companyId, role: userRole, firstName })

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
    const intelligentAPI = new IntelligentAPICaller(
      userId,
      companyId,
      userRole,
      userName,
      sessionToken
    )

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
    // 7. BUILD CONTEXT (Optional - for reference)
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
    // 8. BUILD TYPE 4 SYSTEM PROMPT
    // ==============================================
    const userContext: UserContext = {
      userId,
      companyId,
      role: userRole,
      firstName,
      lastName,
      permissions: null,
    }

    const systemPrompt = generateType4SystemPrompt(
      userContext,
      contextString || undefined
    )

    console.log('📋 Type 4 AI: Intelligent API Discovery Mode')
    console.log('🎯 AI has access to ALL endpoints and can reason about what to call')

    // ==============================================
    // 9. GET CONVERSATION HISTORY
    // ==============================================
    const conversationMessages = await chatService.getConversationMessages(
      activeConversationId,
      10
    )

    // ==============================================
    // 10. PREPARE MESSAGES FOR AI
    // ==============================================
    const messages: ChatCompletionMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationMessages.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ]

    // Type 4: Only ONE function - call_api
    const functions = [CALL_API_FUNCTION]

    // ==============================================
    // 11. AI REASONING & API CALLING LOOP
    // ==============================================
    let aiResponse
    let apiCallCount = 0
    const maxAPICalls = 10 // Safety limit

    while (apiCallCount < maxAPICalls) {
      // Call AI
      aiResponse = await createChatCompletion({ 
        messages,
        functions,
        function_call: 'auto'
      })

      // If no function call, AI has finished reasoning
      if (!aiResponse.functionCall) {
        break
      }

      apiCallCount++
      console.log(`🔧 API Call #${apiCallCount}/${maxAPICalls}`)

      // AI wants to call an API
      if (aiResponse.functionCall.name === 'call_api') {
        const apiParams = aiResponse.functionCall.arguments

        console.log(`   → ${apiParams.method} ${apiParams.path}`)
        if (apiParams.reason) {
          console.log(`   → Reason: ${apiParams.reason}`)
        }

        // Execute the API call
        const result = await intelligentAPI.callAPI({
          method: apiParams.method,
          path: apiParams.path,
          queryParams: apiParams.queryParams,
          pathParams: apiParams.pathParams,
          body: apiParams.body,
          reason: apiParams.reason
        })

        console.log(`   ✅ Result: ${result.success ? 'Success' : 'Failed'}`)
        if (!result.success) {
          console.log(`   ❌ Error: ${result.error}`)
        }

        // Add function call and result to conversation
        messages.push({
          role: 'assistant',
          content: null,
          function_call: {
            name: 'call_api',
            arguments: JSON.stringify(apiParams)
          }
        })

        messages.push({
          role: 'function',
          name: 'call_api',
          content: IntelligentAPICaller.formatResultForAI(result),
        })
      }

      // Continue loop - AI will reason about the result and decide next step
    }

    if (!aiResponse) {
      throw new Error('No AI response generated')
    }

    // Safety check
    if (apiCallCount >= maxAPICalls) {
      console.warn('⚠️ Reached maximum API call limit')
      aiResponse.content += '\n\n(Note: Reached maximum query complexity limit. If you need more information, please ask a more specific question.)'
    }

    console.log(`✅ Type 4 AI completed with ${apiCallCount} API calls`)

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
        functionCallsUsed: apiCallCount,
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
          apiCallsUsed: apiCallCount,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Type 4 AI Chat Error:', error)

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