// ==============================================
// src/types/profile.ts - Profile Types & Validation
// ==============================================

import { z } from 'zod'

// ==============================================
// PROFILE INTERFACES
// ==============================================
export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: string
  emailVerified: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileData {
  firstName: string
  lastName: string
  phone?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ==============================================
// API RESPONSE INTERFACES
// ==============================================
export interface GetProfileResult {
  success: boolean
  message: string
  data: {
    user: UserProfile
    company: {
      id: string
      name: string
      slug: string
      industry?: string
      size?: string
    }
  }
}

export interface UpdateProfileResult {
  success: boolean
  message: string
  data: {
    user: UserProfile
  }
  notifications?: {
    message: string
  }
}

export interface ChangePasswordResult {
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
// STATES
// ==============================================
export type ProfileState = 
  | 'loading'        // Loading profile data
  | 'viewing'        // Viewing profile
  | 'editing'        // Editing profile
  | 'saving'         // Saving changes
  | 'error'          // Error loading/saving

export type PasswordChangeState = 
  | 'idle'           // Initial state
  | 'loading'        // Changing password
  | 'success'        // Password changed
  | 'error'          // Change failed

// ==============================================
// VALIDATION SCHEMAS
// ==============================================
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  phone: z
    .string()
    .optional()
    .refine((phone) => {
      if (!phone || phone.trim() === '') return true
      // Basic phone validation - adjust pattern based on your requirements
      return /^\+?[\d\s\-\(\)]{10,}$/.test(phone)
    }, 'Please enter a valid phone number'),
})

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  
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
    .min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

// ==============================================
// VALIDATION HELPERS
// ==============================================
export const validateUpdateProfileForm = (data: unknown) => {
  try {
    const result = updateProfileSchema.parse(data)
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

export const validateChangePasswordForm = (data: unknown) => {
  try {
    const result = changePasswordSchema.parse(data)
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
// ERROR TYPES
// ==============================================
export interface FieldError {
  field: string
  message: string
}

export interface ProfileErrors {
  firstName?: string
  lastName?: string
  phone?: string
  general?: string
}

export interface PasswordErrors {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
  general?: string
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================
export const formatUserRole = (role: string): string => {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export const formatPhoneNumber = (phone?: string): string => {
  if (!phone) return 'Not provided'
  
  // Basic phone formatting - adjust based on your requirements
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export const getInitials = (firstName: string, lastName: string): string => {
  const firstInitial = firstName?.[0]?.toUpperCase() || ''
  const lastInitial = lastName?.[0]?.toUpperCase() || ''
  return firstInitial + lastInitial
}