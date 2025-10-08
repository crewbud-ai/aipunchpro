// ==============================================
// hooks/ai/use-ai-chat.ts - AI Chat Hook (Following Project Pattern)
// ==============================================

import { useState, useCallback, useEffect, useMemo } from 'react'
import { aiChatApi } from '@/lib/api/ai-chat'
import type { 
  ChatMessage, 
  SendMessageRequest,
  AIChatState 
} from '@/types/ai'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseAIChatState {
  messages: ChatMessage[]
  conversationId: string | undefined
  state: AIChatState
  error: string | null
}

interface UseAIChatActions {
  sendMessage: (message: string) => Promise<void>
  clearChat: () => void
  startNewConversation: () => void
  clearError: () => void
}

interface UseAIChatReturn extends UseAIChatState, UseAIChatActions {
  // Computed properties
  isLoading: boolean
  hasError: boolean
  isEmpty: boolean
  hasMessages: boolean
  messageCount: number
}

// ==============================================
// MAIN HOOK
// ==============================================
export function useAIChat() {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseAIChatState>({
    messages: [],
    conversationId: undefined,
    state: 'idle',
    error: null,
  })

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const computed = useMemo(() => ({
    isLoading: state.state === 'loading',
    hasError: state.state === 'error',
    isEmpty: state.messages.length === 0,
    hasMessages: state.messages.length > 0,
    messageCount: state.messages.length,
  }), [state])

  // ==============================================
  // ACTIONS
  // ==============================================

  // Send message to AI
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return

    try {
      // Add user message immediately to UI
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString(),
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        state: 'loading',
        error: null,
      }))

      // Send to API
      const response = await aiChatApi.sendMessage({
        message: message.trim(),
        conversationId: state.conversationId,
        includeContext: true,
      })

      // Add AI response
      const aiMessage: ChatMessage = {
        id: response.data.messageId,
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        metadata: {
          tokensUsed: response.data.tokensUsed,
        },
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        conversationId: response.data.conversationId,
        state: 'loaded',
      }))

    } catch (error) {
      console.error('Send message error:', error)
      
      setState(prev => ({
        ...prev,
        state: 'error',
        error: 'Failed to get AI response. Please try again.',
        // Remove the user message on error
        messages: prev.messages.slice(0, -1),
      }))
    }
  }, [state.conversationId])

  // Clear chat messages
  const clearChat = useCallback(() => {
    setState({
      messages: [],
      conversationId: undefined,
      state: 'idle',
      error: null,
    })
  }, [])

  // Start new conversation
  const startNewConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      conversationId: undefined,
      messages: [],
      state: 'idle',
      error: null,
    }))
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      state: prev.messages.length > 0 ? 'loaded' : 'idle',
    }))
  }, [])

  // ==============================================
  // RETURN HOOK STATE AND ACTIONS
  // ==============================================
  return {
    // State
    ...state,
    
    // Computed
    ...computed,
    
    // Actions
    sendMessage,
    clearChat,
    startNewConversation,
    clearError,
  }
}

// ==============================================
// DEFAULT EXPORT
// ==============================================
export default useAIChat