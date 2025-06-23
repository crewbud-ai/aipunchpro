// ==============================================
// src/types/verify-email.ts - Updated Email Verification Types
// ==============================================

import { z } from 'zod'

// ==============================================
// EMAIL VERIFICATION INTERFACE
// ==============================================
export interface EmailVerificationData {
  token: string
  userId?: string
}

// ==============================================
// VERIFICATION STATES
// ==============================================
export type VerificationState = 
  | 'ready'          // Ready to verify (showing verify button)
  | 'loading'        // Checking token
  | 'success'        // Email verified successfully
  | 'error'          // Verification failed
  | 'already-verified' // Email already verified
  | 'expired'        // Token expired
  | 'invalid'        // Invalid token

// ==============================================
// VERIFICATION RESULT INTERFACE
// ==============================================
export interface VerificationResult {
  success: boolean
  message: string
  data?: {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      emailVerified: boolean
    }
    verification?: {
      verifiedAt: string
    }
    emailSent?: boolean
  }
  notifications?: {
    message: string
    confirmationEmailSent?: string
  }
}

// ==============================================
// URL PARAMS VALIDATION
// ==============================================
export const verifyEmailParamsSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required')
    .length(64, 'Invalid verification token format')
    .regex(/^[a-f0-9]{64}$/, 'Invalid token format'),
  
  userId: z
    .string()
    .uuid('Invalid user ID')
    .optional(),
})

export type VerifyEmailParams = z.infer<typeof verifyEmailParamsSchema>

// ==============================================
// VALIDATION HELPERS
// ==============================================
export const validateVerifyEmailParams = (params: unknown) => {
  try {
    const result = verifyEmailParamsSchema.parse(params)
    return { success: true, data: result, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path[0] as string,
        message: err.message,
      }))
      return { success: false, data: null, errors }
    }
    return { success: false, data: null, errors: [{ field: 'unknown', message: 'Validation failed' }] }
  }
}

// ==============================================
// ERROR MESSAGES
// ==============================================
export const VERIFICATION_MESSAGES = {
  ready: 'Click the button below to verify your email address and activate your account.',
  loading: 'Verifying your email address...',
  success: '🎉 Email verified successfully! Your account is now fully activated.',
  error: 'Verification failed. Please try again or request a new verification email.',
  'already-verified': 'Your email is already verified. You can continue using your account.',
  expired: 'This verification link has expired. Please request a new verification email.',
  invalid: 'This verification link is invalid. Please check your email or request a new verification link.',
} as const