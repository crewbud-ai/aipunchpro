// ==============================================
// types/ai/chat.ts - AI Chat Types (UPDATED)
// ==============================================

// ==============================================
// MESSAGE TYPES
// ==============================================
export type MessageRole = 'user' | 'assistant' | 'system' | 'function'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  metadata?: {
    tokensUsed?: number
    model?: string
    context?: string[]
    functionCall?: {
      name: string
      arguments: string
    }
    functionResult?: any
  }
}

// ==============================================
// STATE TYPES
// ==============================================
export type AIChatState = 'idle' | 'loading' | 'loaded' | 'error'

// ==============================================
// CONVERSATION TYPES
// ==============================================
export interface Conversation {
  id: string
  userId: string
  companyId: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount?: number
  lastMessage?: string
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[]
}

// Summary for list views
export interface ConversationSummary {
  id: string
  title: string
  messageCount: number
  lastMessage?: string
  lastMessageAt?: string
  createdAt?: string  // ✅ Made optional
  updatedAt?: string  // ✅ Made optional
}

// ==============================================
// API REQUEST TYPES
// ==============================================
export interface SendMessageRequest {
  message: string
  conversationId?: string
  includeContext?: boolean
}

export interface SendMessageResponse {
  success: boolean
  message: string
  data: {
    conversationId: string
    messageId: string
    response: string
    tokensUsed: number
  }
}

export interface GetConversationsResponse {
  success: boolean
  message: string
  data: {
    conversations: Conversation[]
    total: number
  }
}

// ==============================================
// CONTEXT TYPES (for database queries)
// ==============================================
export interface UserContext {
  userId: string
  companyId: string
  role: string
  firstName: string
  lastName: string
  permissions: any
}

export interface DatabaseContext {
  // User's own data
  myProjects?: any[]
  myTimeEntries?: any[]
  myPunchlistItems?: any[]
  
  // Admin data (only if admin)
  companyProjects?: any[]
  teamMembers?: any[]
  payrollData?: any[]
}

// ==============================================
// AI CONFIGURATION
// ==============================================
export interface AIConfig {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
}

// ==============================================
// PERMISSION-BASED CONTEXT
// ==============================================
export interface ContextPermissions {
  canAccessPayroll: boolean
  canAccessAllProjects: boolean
  canAccessTeamData: boolean
  canAccessReports: boolean
}

// ==============================================
// FUNCTION CALLING TYPES (For Admin)
// ==============================================
export interface AIFunction {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, {
      type: string
      description: string
      enum?: string[]
    }>
    required?: string[]
  }
}

export interface FunctionCallResult {
  success: boolean
  data?: any
  error?: string
}

// ==============================================
// FORM DATA
// ==============================================
export interface ChatFormData {
  message: string
  conversationId?: string
}

export interface ChatFormErrors {
  message?: string
  general?: string
}