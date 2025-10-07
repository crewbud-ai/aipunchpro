// ==============================================
// app/api/ai/conversations/[id]/route.ts - Single Conversation API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { AIChatDatabaseService } from '@/lib/database/services/ai-chat'

// ==============================================
// GET /api/ai/conversations/[id] - Get Conversation with Messages
// ==============================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ==============================================
    // 1. AUTHENTICATION
    // ==============================================
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')

    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to view this conversation.',
        },
        { status: 401 }
      )
    }

    // ==============================================
    // 2. GET CONVERSATION ID
    // ==============================================
    const conversationId = params.id

    if (!conversationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Conversation ID is required.',
        },
        { status: 400 }
      )
    }

    // ==============================================
    // 3. GET CONVERSATION WITH MESSAGES
    // ==============================================
    const chatService = new AIChatDatabaseService(false)
    const conversation = await chatService.getConversationWithMessages(
      conversationId,
      userId,
      companyId
    )

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conversation not found',
          message: 'The conversation you are looking for does not exist.',
        },
        { status: 404 }
      )
    }

    // ==============================================
    // 4. RETURN RESPONSE
    // ==============================================
    return NextResponse.json(
      {
        success: true,
        message: 'Conversation retrieved successfully',
        data: {
          conversation,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get Conversation Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve conversation. Please try again.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// DELETE /api/ai/conversations/[id] - Delete Conversation
// ==============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ==============================================
    // 1. AUTHENTICATION
    // ==============================================
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')

    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to delete conversations.',
        },
        { status: 401 }
      )
    }

    // ==============================================
    // 2. DELETE CONVERSATION
    // ==============================================
    const conversationId = params.id
    const chatService = new AIChatDatabaseService(false)

    await chatService.deleteConversation(conversationId, userId, companyId)

    // ==============================================
    // 3. RETURN RESPONSE
    // ==============================================
    return NextResponse.json(
      {
        success: true,
        message: 'Conversation deleted successfully',
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete Conversation Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete conversation. Please try again.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// OPTIONS /api/ai/conversations/[id] - CORS
// ==============================================
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}