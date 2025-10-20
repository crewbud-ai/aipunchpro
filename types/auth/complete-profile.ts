// ==============================================
// types/auth/complete-profile.ts - Complete Profile Types
// ==============================================

import { z } from 'zod'

// ==============================================
// STATE TYPES
// ==============================================
export type CompleteProfileState = 
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'

// ==============================================
// FORM DATA INTERFACE
// ==============================================
export interface CompleteProfileFormData {
  phone?: string
  tradeSpecialty?: string
  startDate?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

// ==============================================
// ERROR TYPES
// ==============================================
export interface CompleteProfileErrors {
  phone?: string
  tradeSpecialty?: string
  startDate?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  general?: string
}

// ==============================================
// API REQUEST/RESPONSE TYPES
// ==============================================
export interface CompleteProfileRequest {
  phone?: string
  tradeSpecialty?: string
  startDate?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

export interface CompleteProfileResponse {
  success: boolean
  message: string
  data?: {
    profileCompleted: boolean
    completedAt: string
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// VALIDATION SCHEMA
// ==============================================
export const completeProfileSchema = z.object({
  phone: z
    .string()
    .optional()
    .refine(val => !val || val.length >= 10, 'Phone number must be at least 10 digits'),
  
  tradeSpecialty: z
    .string()
    .optional(),
  
  startDate: z
    .string()
    .optional(),
  
  emergencyContactName: z
    .string()
    .max(255, 'Emergency contact name must be less than 255 characters')
    .optional(),
  
  emergencyContactPhone: z
    .string()
    .optional()
    .refine(val => !val || val.length >= 10, 'Emergency contact phone must be at least 10 digits'),
})

// ==============================================
// VALIDATION HELPER
// ==============================================
export const validateCompleteProfileForm = (data: unknown) => {
  try {
    const result = completeProfileSchema.parse(data)
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
export const COMPLETE_PROFILE_MESSAGES = {
  idle: '',
  loading: 'Completing your profile...',
  success: 'Profile completed successfully! Redirecting to dashboard...',
  error: 'Failed to complete profile. Please try again.',
} as const

// ==============================================
// FIELD ERROR TYPE
// ==============================================
export interface FieldError {
  field: string
  message: string
}

// ==============================================
// DEFAULT FORM DATA
// ==============================================
export function getDefaultCompleteProfileFormData(): CompleteProfileFormData {
  return {
    phone: '',
    tradeSpecialty: undefined,
    startDate: new Date().toISOString().split('T')[0], // Today's date
    emergencyContactName: '',
    emergencyContactPhone: '',
  }
}