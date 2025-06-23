// ==============================================
// src/types/login.ts - Login Types & Validation
// ==============================================

import { z } from 'zod'

// ==============================================
// LOGIN INTERFACES
// ==============================================
export interface LoginData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResult {
  success: boolean
  message?: string
  error?: string  // Your API returns 'error' field in error cases
  data?: {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      role: string
      phone?: string
      emailVerified: boolean
      lastLoginAt: string
    }
    company: {
      id: string
      name: string
      slug: string
      industry?: string
      size?: string
    }
    session: {
      token: string
      expiresAt: string
      rememberMe: boolean
    }
  }
  notifications?: {
    message: string
    emailVerificationRequired?: boolean
  }
  actions?: {
    resendVerification?: string
    resetPassword?: string
  }
}

// ==============================================
// LOGIN STATES
// ==============================================
export type LoginState = 
  | 'idle'           // Initial state
  | 'loading'        // Submitting login
  | 'success'        // Login successful
  | 'error'          // Login failed
  | 'email-unverified' // Email not verified

// ==============================================
// FORM VALIDATION SCHEMA
// ==============================================
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
  
  rememberMe: z.boolean().optional().default(false),
})

export type LoginFormData = z.infer<typeof loginSchema>

// ==============================================
// VALIDATION HELPERS
// ==============================================
export const validateLoginForm = (data: unknown) => {
  try {
    const result = loginSchema.parse(data)
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
export const LOGIN_MESSAGES = {
  idle: '',
  loading: 'Signing you in...',
  success: 'Login successful! Redirecting...',
  error: 'Login failed. Please check your credentials and try again.',
  'email-unverified': 'Please verify your email address before logging in.',
} as const

// ==============================================
// FIELD ERROR TYPES
// ==============================================
export interface FieldError {
  field: string
  message: string
}

export interface LoginErrors {
  email?: string
  password?: string
  general?: string
}