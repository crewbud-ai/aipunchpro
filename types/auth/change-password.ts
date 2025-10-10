// ==============================================
// types/auth/change-password.ts - Change Password Types (First Login)
// ==============================================

import { z } from 'zod'

// ==============================================
// STATE TYPES
// ==============================================
export type ChangePasswordFirstLoginState = 
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'

// ==============================================
// FORM DATA INTERFACE
// ==============================================
export interface ChangePasswordFirstLoginFormData {
  newPassword: string
  confirmPassword: string
}

// ==============================================
// ERROR TYPES
// ==============================================
export interface ChangePasswordFirstLoginErrors {
  newPassword?: string
  confirmPassword?: string
  general?: string
}

// ==============================================
// API REQUEST/RESPONSE TYPES
// ==============================================
export interface ChangePasswordFirstLoginRequest {
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordFirstLoginResponse {
  success: boolean
  message: string
  data?: {
    passwordChanged: boolean
    changedAt: string
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// VALIDATION SCHEMA
// ==============================================
export const changePasswordFirstLoginSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
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

// ==============================================
// VALIDATION HELPER
// ==============================================
export const validateChangePasswordFirstLoginForm = (data: unknown) => {
  try {
    const result = changePasswordFirstLoginSchema.parse(data)
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
// MESSAGES
// ==============================================
export const CHANGE_PASSWORD_MESSAGES = {
  idle: '',
  loading: 'Changing your password...',
  success: 'Password changed successfully! Redirecting to dashboard...',
  error: 'Failed to change password. Please try again.',
} as const

// ==============================================
// FIELD ERROR TYPE
// ==============================================
export interface FieldError {
  field: string
  message: string
}