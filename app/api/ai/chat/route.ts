// ==============================================
// app/api/ai/chat/route.ts - AI Chat API Route
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { validateSendMessage } from '@/lib/validations/ai/chat'
import { AIChatDatabaseService } from '@/lib/database/services/ai-chat'
import { AIContextBuilder } from '@/lib/ai/context-builder'
import { 
  createChatCompletion, 
  validateOpenAIConfig 
} from '@/lib/ai/openai-client'
import { 
  generateCompleteSystemPrompt, 
  getAIContextPermissions 
} from '@/lib/ai'
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

    // ==============================================
    // 5. GET OR CREATE CONVERSATION
    // ==============================================
    let activeConversationId = conversationId

    if (!activeConversationId) {
      // Create new conversation
      const title = chatService.generateTitleFromMessage(message)
      activeConversationId = await chatService.createConversation(
        userId,
        companyId,
        title
      )
    } else {
      // Verify conversation exists and belongs to user
      const conversation = await chatService.getConversationById(
        activeConversationId,
        userId,
        companyId
      )

      if (!conversation) {
        return NextResponse.json(
          {
            success: false,
            error: 'Conversation not found',
            message: 'The conversation you are trying to access does not exist.',
          },
          { status: 404 }
        )
      }
    }

    // ==============================================
    // 6. SAVE USER MESSAGE
    // ==============================================
    const userMessageId = await chatService.saveMessage(
      activeConversationId,
      'user',
      message
    )

    // ==============================================
    // 7. BUILD CONTEXT (if enabled)
    // ==============================================
    let contextString = ''
    
    if (includeContext) {
      const userContext: UserContext = {
        userId,
        companyId,
        role: userRole,
        firstName,
        lastName,
        permissions: null, // We'll use role-based permissions
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
      10 // Last 10 messages for context
    )

    // Build messages array for OpenAI
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationMessages.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ]

    // ==============================================
    // 10. GET AI RESPONSE
    // ==============================================
    const aiResponse = await createChatCompletion({ messages })

    // ==============================================
    // 11. SAVE AI RESPONSE
    // ==============================================
    const assistantMessageId = await chatService.saveMessage(
      activeConversationId,
      'assistant',
      aiResponse.content,
      {
        tokensUsed: aiResponse.tokensUsed,
        model: aiResponse.model,
      }
    )

    // ==============================================
    // 12. RETURN RESPONSE
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
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('AI Chat Error:', error)

    // Handle specific error types
    if (error instanceof Error) {
      // OpenAI API errors
      if (error.message.includes('OpenAI')) {
        return NextResponse.json(
          {
            success: false,
            error: 'AI service error',
            message: 'The AI assistant encountered an error. Please try again.',
          },
          { status: 503 }
        )
      }

      // Database errors
      if (error.message.includes('Failed to')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database error',
            message: 'Failed to save your message. Please try again.',
          },
          { status: 500 }
        )
      }
    }

    // Generic error
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