// ==============================================
// types/ai/chat.ts - AI Chat Types
// ==============================================

// ==============================================
// MESSAGE TYPES
// ==============================================
export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  metadata?: {
    tokensUsed?: number
    model?: string
    context?: string[]
  }
}

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

// ==============================================
// API REQUEST TYPES
// ==============================================
export interface SendMessageRequest {
  message: string
  conversationId?: string // Optional - creates new conversation if not provided
  includeContext?: boolean // Whether to include project/user context
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

// ==============================================
// STATE TYPES
// ==============================================
export type ChatState = 'idle' | 'loading' | 'streaming' | 'error' | 'success'

export interface ChatHookState {
  state: ChatState
  error: string | null
  isLoading: boolean
  isStreaming: boolean
}

// ==============================================
// CONVERSATION LIST
// ==============================================
export interface ConversationSummary {
  id: string
  title: string
  lastMessage: string
  lastMessageAt: string
  messageCount: number
}

// ==============================================
// GET CONVERSATIONS RESPONSE
// ==============================================
export interface GetConversationsResponse {
  success: boolean
  message: string
  data: {
    conversations: ConversationSummary[]
    total: number
  }
}