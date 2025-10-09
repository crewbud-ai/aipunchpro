// ==============================================
// app/api/ai/chat/route.ts - Simple Construction AI (MVP)
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { validateSendMessage } from '@/lib/validations/ai/chat'
import { AIChatDatabaseService } from '@/lib/database/services/ai-chat'
import { 
  createChatCompletion, 
  validateOpenAIConfig,
  type ChatCompletionMessage
} from '@/lib/ai/openai-client'
import type { UserContext } from '@/types/ai'

// ==============================================
// SIMPLE CONSTRUCTION AI PROMPT
// ==============================================
const SIMPLE_CONSTRUCTION_PROMPT = `You are CrewBud AI, a helpful construction industry assistant.

**Your Role:**
- Help with construction questions, calculations, and best practices
- Provide guidance on project management and scheduling
- Answer questions about building codes, safety standards, and OSHA compliance
- Help with material estimates and labor calculations
- Offer practical construction advice and problem-solving

**Communication Style:**
- Professional yet friendly and conversational
- Clear, practical explanations
- Use construction industry terminology appropriately
- Be specific and actionable in your advice
- Show empathy for construction challenges

**Important:**
- You provide general construction knowledge and guidance
- For company-specific data (like "how many projects do we have"), politely explain: "I can help with construction knowledge and advice, but I don't have access to your company's specific data. You can find that information in your dashboard."
- Always prioritize safety in recommendations
- Be honest when you don't know something
- Suggest when expert consultation is needed

**Example Topics You Can Help With:**
- Construction calculations (materials, labor hours, costs)
- Safety protocols and OSHA guidelines
- Building codes and regulations
- Project management best practices
- Equipment usage and maintenance
- Trade-specific questions (carpentry, electrical, plumbing, etc.)
- Construction scheduling and planning
- Problem-solving common construction issues

Keep responses concise, practical, and helpful!`

// ==============================================
// POST /api/ai/chat - Simple Construction AI
// ==============================================
export async function POST(request: NextRequest) {
  try {
    // ==============================================
    // 1. AUTHENTICATION
    // ==============================================
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')
    const userRole = request.headers.get('x-user-role')
    const firstName = request.headers.get('x-user-name')?.split(' ')[0] || 'User'

    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to use the AI assistant.',
        },
        { status: 401 }
      )
    }

    console.log('💬 Simple AI Chat Request from:', { userId, firstName, role: userRole })

    // ==============================================
    // 2. VALIDATE OPENAI
    // ==============================================
    const configValidation = validateOpenAIConfig()
    if (!configValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI service unavailable',
          message: 'The AI assistant is temporarily unavailable.',
        },
        { status: 503 }
      )
    }

    // ==============================================
    // 3. VALIDATE REQUEST
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

    const { message, conversationId } = validation.data

    // ==============================================
    // 4. INITIALIZE SERVICE
    // ==============================================
    const chatService = new AIChatDatabaseService(false)

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
    // 7. GET CONVERSATION HISTORY (Last 5 messages)
    // ==============================================
    const conversationMessages = await chatService.getConversationMessages(
      activeConversationId,
      5  // Keep it short to save tokens
    )

    // ==============================================
    // 8. BUILD MESSAGES
    // ==============================================
    const messages: ChatCompletionMessage[] = [
      { 
        role: 'system', 
        content: SIMPLE_CONSTRUCTION_PROMPT 
      },
      ...conversationMessages.slice(-5).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ]

    console.log('📤 Sending to OpenAI:', { 
      messageCount: messages.length,
      systemPromptLength: SIMPLE_CONSTRUCTION_PROMPT.length 
    })

    // ==============================================
    // 9. CALL AI (Single, simple call)
    // ==============================================
    const aiResponse = await createChatCompletion({ 
      messages,
      temperature: 0.7,
      maxTokens: 800,  // Shorter responses = lower cost
    })

    console.log('✅ AI Response received:', { 
      tokensUsed: aiResponse.tokensUsed,
      model: aiResponse.model 
    })

    // ==============================================
    // 10. SAVE AI RESPONSE
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
    // 11. RETURN RESPONSE
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

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// OPTIONS - CORS
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