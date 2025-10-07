// ==============================================
// lib/validations/ai/chat.ts - AI Chat Validation
// ==============================================

import { z } from 'zod'

// ==============================================
// SEND MESSAGE VALIDATION
// ==============================================
export const sendMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message is too long (max 4000 characters)'),
  conversationId: z.string().uuid().optional(),
  includeContext: z.boolean().optional().default(true),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>

// ==============================================
// VALIDATION FUNCTION
// ==============================================
export function validateSendMessage(data: unknown) {
  try {
    const validated = sendMessageSchema.parse(data)
    return { success: true as const, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false as const, 
        error: error.errors[0].message 
      }
    }
    return { 
      success: false as const, 
      error: 'Invalid message data' 
    }
  }
}

// ==============================================
// FORMAT ERRORS HELPER
// ==============================================
export function formatChatErrors(error: z.ZodError) {
  const errors: Record<string, string> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })
  
  return errors
}