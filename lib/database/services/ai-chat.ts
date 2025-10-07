// ==============================================
// lib/database/services/ai-chat.ts - AI Chat Database Service
// ==============================================

import { createClient } from '@supabase/supabase-js'
import type { 
  Conversation, 
  ConversationWithMessages, 
  ChatMessage,
  ConversationSummary 
} from '@/types/ai'

// ==============================================
// AI CHAT DATABASE SERVICE
// ==============================================
export class AIChatDatabaseService {
  private supabaseClient: ReturnType<typeof createClient>
  private enableLogging: boolean

  constructor(enableLogging = false) {
    this.enableLogging = enableLogging

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    this.supabaseClient = createClient(supabaseUrl, supabaseKey)
  }

  private log(message: string, data?: any) {
    if (this.enableLogging) {
      console.log(`[AIChatService] ${message}`, data || '')
    }
  }

  // ==============================================
  // CREATE NEW CONVERSATION
  // ==============================================
  async createConversation(
    userId: string,
    companyId: string,
    title: string = 'New Conversation'
  ): Promise<string> {
    this.log('Creating new conversation', { userId, companyId, title })

    const { data, error } = await this.supabaseClient
      .from('ai_conversations')
      .insert({
        user_id: userId,
        company_id: companyId,
        title,
      })
      .select('id')
      .single()

    if (error) {
      this.log('Error creating conversation', error)
      throw new Error(`Failed to create conversation: ${error.message}`)
    }

    if (!data) {
      throw new Error('Failed to create conversation: No data returned')
    }

    this.log('Conversation created', { conversationId: data.id })
    return data.id as string
  }

  // ==============================================
  // GET CONVERSATION BY ID
  // ==============================================
  async getConversationById(
    conversationId: string,
    userId: string,
    companyId: string
  ): Promise<Conversation | null> {
    this.log('Fetching conversation', { conversationId, userId })

    const { data, error } = await this.supabaseClient
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single()

    if (error) {
      this.log('Error fetching conversation', error)
      return null
    }

    if (!data) return null

    return {
      id: data.id as string,
      userId: data.user_id as string,
      companyId: data.company_id as string,
      title: data.title as string,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    }
  }

  // ==============================================
  // GET USER'S CONVERSATIONS
  // ==============================================
  async getUserConversations(
    userId: string,
    companyId: string,
    limit: number = 20
  ): Promise<ConversationSummary[]> {
    this.log('Fetching user conversations', { userId, limit })

    // Get conversations with their last message
    const { data: conversations, error } = await this.supabaseClient
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      this.log('Error fetching conversations', error)
      throw new Error(`Failed to fetch conversations: ${error.message}`)
    }

    if (!conversations || conversations.length === 0) {
      return []
    }

    // Get message counts and last messages for each conversation
    const conversationSummaries: ConversationSummary[] = []

    for (const conv of conversations) {
      const convId = conv.id as string

      const { data: messages, error: msgError } = await this.supabaseClient
        .from('ai_messages')
        .select('content, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(1)

      const { count } = await this.supabaseClient
        .from('ai_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', convId)

      conversationSummaries.push({
        id: convId,
        title: conv.title as string,
        lastMessage: messages?.[0]?.content as string || 'No messages yet',
        lastMessageAt: messages?.[0]?.created_at as string || conv.created_at as string,
        messageCount: count || 0,
      })
    }

    return conversationSummaries
  }

  // ==============================================
  // SAVE MESSAGE
  // ==============================================
  async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    this.log('Saving message', { conversationId, role })

    const { data, error } = await this.supabaseClient
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        metadata,
      })
      .select('id')
      .single()

    if (error) {
      this.log('Error saving message', error)
      throw new Error(`Failed to save message: ${error.message}`)
    }

    if (!data) {
      throw new Error('Failed to save message: No data returned')
    }

    // Update conversation's updated_at timestamp
    await this.supabaseClient
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    this.log('Message saved', { messageId: data.id })
    return data.id as string
  }

  // ==============================================
  // GET CONVERSATION MESSAGES
  // ==============================================
  async getConversationMessages(
    conversationId: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    this.log('Fetching conversation messages', { conversationId, limit })

    const { data, error } = await this.supabaseClient
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      this.log('Error fetching messages', error)
      throw new Error(`Failed to fetch messages: ${error.message}`)
    }

    if (!data) return []

    return data.map((msg) => ({
      id: msg.id as string,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content as string,
      timestamp: msg.created_at as string,
      metadata: (msg.metadata || {}) as any,
    }))
  }

  // ==============================================
  // GET CONVERSATION WITH MESSAGES
  // ==============================================
  async getConversationWithMessages(
    conversationId: string,
    userId: string,
    companyId: string
  ): Promise<ConversationWithMessages | null> {
    this.log('Fetching conversation with messages', { conversationId })

    const conversation = await this.getConversationById(conversationId, userId, companyId)
    
    if (!conversation) return null

    const messages = await this.getConversationMessages(conversationId)

    return {
      ...conversation,
      messages,
    }
  }

  // ==============================================
  // UPDATE CONVERSATION TITLE
  // ==============================================
  async updateConversationTitle(
    conversationId: string,
    userId: string,
    companyId: string,
    title: string
  ): Promise<void> {
    this.log('Updating conversation title', { conversationId, title })

    const { error } = await this.supabaseClient
      .from('ai_conversations')
      .update({ title })
      .eq('id', conversationId)
      .eq('user_id', userId)
      .eq('company_id', companyId)

    if (error) {
      this.log('Error updating conversation title', error)
      throw new Error(`Failed to update conversation title: ${error.message}`)
    }
  }

  // ==============================================
  // DELETE CONVERSATION
  // ==============================================
  async deleteConversation(
    conversationId: string,
    userId: string,
    companyId: string
  ): Promise<void> {
    this.log('Deleting conversation', { conversationId })

    const { error } = await this.supabaseClient
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId)
      .eq('company_id', companyId)

    if (error) {
      this.log('Error deleting conversation', error)
      throw new Error(`Failed to delete conversation: ${error.message}`)
    }
  }

  // ==============================================
  // GENERATE TITLE FROM FIRST MESSAGE
  // ==============================================
  generateTitleFromMessage(message: string): string {
    // Take first 50 characters or first sentence
    const maxLength = 50
    let title = message.trim()

    // Get first sentence
    const firstSentence = title.split(/[.!?]/)[0]
    if (firstSentence.length > 0 && firstSentence.length <= maxLength) {
      return firstSentence.trim()
    }

    // Truncate to max length
    if (title.length > maxLength) {
      title = title.substring(0, maxLength).trim() + '...'
    }

    return title || 'New Conversation'
  }
}