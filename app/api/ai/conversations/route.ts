// ==============================================
// app/api/ai/conversations/route.ts - Conversations API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { AIChatDatabaseService } from '@/lib/database/services/ai-chat'

// ==============================================
// GET /api/ai/conversations - Get User's Conversations
// ==============================================
export async function GET(request: NextRequest) {
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
          message: 'You must be logged in to view conversations.',
        },
        { status: 401 }
      )
    }

    // ==============================================
    // 2. PARSE QUERY PARAMETERS
    // ==============================================
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')

    // ==============================================
    // 3. GET CONVERSATIONS
    // ==============================================
    const chatService = new AIChatDatabaseService(false)
    const conversations = await chatService.getUserConversations(
      userId,
      companyId,
      Math.min(limit, 50) // Max 50 conversations
    )

    // ==============================================
    // 4. RETURN RESPONSE
    // ==============================================
    return NextResponse.json(
      {
        success: true,
        message: 'Conversations retrieved successfully',
        data: {
          conversations,
          total: conversations.length,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get Conversations Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve conversations. Please try again.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// OPTIONS /api/ai/conversations - CORS
// ==============================================
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}