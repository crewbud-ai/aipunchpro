// ==============================================
// src/lib/validations/dashboard/profile.ts - Fixed Profile Validation
// ==============================================

import { z } from 'zod'

// ==============================================
// UPDATE PROFILE VALIDATION
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
    .transform((phone) => phone?.trim() === '' ? undefined : phone)
    .refine((phone) => {
      if (!phone) return true
      // Basic phone validation - adjust pattern based on your requirements
      return /^\+?[\d\s\-\(\)]{10,}$/.test(phone)
    }, 'Please enter a valid phone number'),
})

// ==============================================
// CHANGE PASSWORD VALIDATION
// ==============================================
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
})

export type UpdateProfileData = z.infer<typeof updateProfileSchema>
export type ChangePasswordData = z.infer<typeof changePasswordSchema>

// ==============================================
// VALIDATION FUNCTIONS - FIXED
// ==============================================
export function validateUpdateProfile(data: unknown) {
  try {
    const result = updateProfileSchema.parse(data)
    return { success: true as const, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false as const, error }
    }
    return { success: false as const, error: new z.ZodError([]) }
  }
}

export function validateChangePassword(data: unknown) {
  try {
    const result = changePasswordSchema.parse(data)
    return { success: true as const, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false as const, error }
    }
    return { success: false as const, error: new z.ZodError([]) }
  }
}

// ==============================================
// ERROR FORMATTING
// ==============================================
export function formatProfileErrors(error: z.ZodError) {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }))
}