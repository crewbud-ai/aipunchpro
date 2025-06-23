// ==============================================
// src/types/forgot-password.ts - Forgot Password Types & Validation
// ==============================================

import { z } from 'zod'

// ==============================================
// FORGOT PASSWORD INTERFACES
// ==============================================
export interface ForgotPasswordData {
  email: string
}

export interface VerifyResetTokenData {
  token: string
  email?: string
}

export interface ResetPasswordData {
  token: string
  email: string
  newPassword: string
  confirmPassword: string
}

// ==============================================
// API RESPONSE INTERFACES - Updated to match your actual API
// ==============================================
export interface ForgotPasswordResult {
  success: boolean
  message: string
  error?: string
  data?: {
    emailSent: boolean
    expiresAt: string
  }
  notifications?: {
    message: string
  }
  actions?: {
    resendVerification?: string
  }
}

export interface VerifyResetTokenResult {
  success: boolean
  message: string
  error?: string
  data?: {
    token: string
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
    }
    tokenExpiry: string
  }
  notifications?: {
    message: string
  }
  actions?: {
    resendVerification?: string
  }
}

export interface ResetPasswordResult {
  success: boolean
  message: string
  error?: string
  data?: {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
    }
    passwordReset: {
      resetAt: string
    }
    emailSent: boolean
    sessionsInvalidated: boolean
  }
  notifications?: {
    message: string
    confirmationEmailSent?: string
  }
  actions?: {
    login: string
    loginUrl: string
  }
}

// ==============================================
// STATES
// ==============================================
export type ForgotPasswordState = 
  | 'idle'           // Initial state
  | 'loading'        // Submitting request
  | 'success'        // Email sent successfully
  | 'error'          // Request failed
  | 'rate-limited'   // Too many requests

export type VerifyTokenState = 
  | 'loading'        // Verifying token
  | 'valid'          // Token is valid
  | 'invalid'        // Token is invalid
  | 'expired'        // Token has expired
  | 'error'          // Verification failed

export type ResetPasswordState = 
  | 'idle'           // Initial state
  | 'loading'        // Resetting password
  | 'success'        // Password reset successfully
  | 'error'          // Reset failed

// ==============================================
// VALIDATION SCHEMAS
// ==============================================
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
})

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required'),
  
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// ==============================================
// VALIDATION HELPERS
// ==============================================
export const validateForgotPasswordForm = (data: unknown) => {
  try {
    const result = forgotPasswordSchema.parse(data)
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

export const validateResetPasswordForm = (data: unknown) => {
  try {
    const result = resetPasswordSchema.parse(data)
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
export const FORGOT_PASSWORD_MESSAGES = {
  idle: '',
  loading: 'Sending password reset email...',
  success: 'Password reset email sent! Please check your inbox.',
  error: 'Failed to send password reset email. Please try again.',
  'rate-limited': 'Too many password reset requests. Please wait before trying again.',
} as const

export const RESET_PASSWORD_MESSAGES = {
  idle: '',
  loading: 'Resetting your password...',
  success: 'Password reset successfully! You can now log in with your new password.',
  error: 'Failed to reset password. Please try again.',
} as const

// ==============================================
// FIELD ERROR TYPES
// ==============================================
export interface FieldError {
  field: string
  message: string
}

export interface ForgotPasswordErrors {
  email?: string
  general?: string
}

export interface ResetPasswordErrors {
  newPassword?: string
  confirmPassword?: string
  general?: string
}