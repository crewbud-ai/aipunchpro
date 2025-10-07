// ==============================================
// lib/api/ai-chat.ts - AI Chat API Client
// ==============================================

import { toast } from '@/hooks/use-toast'
import type { 
  SendMessageRequest, 
  SendMessageResponse,
  GetConversationsResponse,
  ConversationWithMessages 
} from '@/types/ai'

// ==============================================
// API CLIENT CONFIGURATION
// ==============================================
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any[]
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ==============================================
// GENERIC API CLIENT
// ==============================================
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`
      const errorDetails = data.details || []

      console.error('AI Chat API Error:', {
        status: response.status,
        message: errorMessage,
        details: errorDetails,
        url,
        data
      })

      throw new ApiError(
        response.status,
        errorMessage,
        errorDetails
      )
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    console.error('AI Chat Network Error:', error)
    throw new ApiError(
      0,
      'Network error. Please check your connection and try again.'
    )
  }
}

// ==============================================
// AI CHAT API CLIENT
// ==============================================
export const aiChatApi = {
  // ==============================================
  // SEND MESSAGE TO AI
  // ==============================================
  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await apiCall<SendMessageResponse>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Failed to Send Message',
          description: error.message,
          variant: 'destructive',
        })
        throw error
      }

      const networkError = new ApiError(0, 'Failed to send message to AI')
      toast({
        title: 'Connection Error',
        description: 'Unable to reach the AI assistant. Please try again.',
        variant: 'destructive',
      })
      throw networkError
    }
  },

  // ==============================================
  // GET USER'S CONVERSATIONS
  // ==============================================
  async getConversations(limit?: number): Promise<GetConversationsResponse> {
    try {
      const queryParams = limit ? `?limit=${limit}` : ''
      const response = await apiCall<GetConversationsResponse>(
        `/api/ai/conversations${queryParams}`,
        {
          method: 'GET',
        }
      )

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Failed to fetch conversations:', error.message)
        throw error
      }

      throw new ApiError(0, 'Failed to fetch conversations')
    }
  },

  // ==============================================
  // GET SINGLE CONVERSATION WITH MESSAGES
  // ==============================================
  async getConversation(conversationId: string): Promise<{
    success: boolean
    message: string
    data: {
      conversation: ConversationWithMessages
    }
  }> {
    try {
      const response = await apiCall<{
        success: boolean
        message: string
        data: {
          conversation: ConversationWithMessages
        }
      }>(`/api/ai/conversations/${conversationId}`, {
        method: 'GET',
      })

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Failed to fetch conversation:', error.message)
        throw error
      }

      throw new ApiError(0, 'Failed to fetch conversation')
    }
  },

  // ==============================================
  // DELETE CONVERSATION
  // ==============================================
  async deleteConversation(conversationId: string): Promise<{
    success: boolean
    message: string
  }> {
    try {
      const response = await apiCall<{
        success: boolean
        message: string
      }>(`/api/ai/conversations/${conversationId}`, {
        method: 'DELETE',
      })

      toast({
        title: 'Conversation Deleted',
        description: 'The conversation has been deleted successfully.',
      })

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Failed to Delete',
          description: error.message,
          variant: 'destructive',
        })
        throw error
      }

      const networkError = new ApiError(0, 'Failed to delete conversation')
      toast({
        title: 'Delete Failed',
        description: 'Unable to delete conversation. Please try again.',
        variant: 'destructive',
      })
      throw networkError
    }
  },
}

// ==============================================
// DEFAULT EXPORT
// ==============================================
export default aiChatApi

// ==============================================
// ADDITIONAL EXPORTS
// ==============================================
export { ApiError }