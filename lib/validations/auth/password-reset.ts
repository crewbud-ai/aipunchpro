// ==============================================
// src/lib/validations/password-reset.ts - Password Reset Validation Schemas
// ==============================================

import { z } from 'zod'

// ==============================================
// FORGOT PASSWORD VALIDATION SCHEMA
// ==============================================
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
})

// ==============================================
// VERIFY RESET TOKEN VALIDATION SCHEMA
// ==============================================
export const verifyResetTokenSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required')
    .length(64, 'Invalid reset token format')
    .regex(/^[a-f0-9]{64}$/, 'Reset token must be a valid hexadecimal string'),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional(), // Optional for extra security
})

// ==============================================
// RESET PASSWORD VALIDATION SCHEMA
// ==============================================
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required')
    .length(64, 'Invalid reset token format')
    .regex(/^[a-f0-9]{64}$/, 'Reset token must be a valid hexadecimal string'),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  
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
// URL PARAMS VALIDATION SCHEMA
// ==============================================
export const resetUrlParamsSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required')
    .length(64, 'Invalid reset token format'),
  
  email: z
    .string()
    .email('Invalid email address')
    .optional(),
})

// ==============================================
// TYPE EXPORTS
// ==============================================
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type VerifyResetTokenInput = z.infer<typeof verifyResetTokenSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ResetUrlParamsInput = z.infer<typeof resetUrlParamsSchema>

// ==============================================
// VALIDATION HELPER FUNCTIONS
// ==============================================
export function validateForgotPassword(data: unknown) {
  return forgotPasswordSchema.safeParse(data)
}

export function validateVerifyResetToken(data: unknown) {
  return verifyResetTokenSchema.safeParse(data)
}

export function validateResetPassword(data: unknown) {
  return resetPasswordSchema.safeParse(data)
}

export function validateResetUrlParams(data: unknown) {
  return resetUrlParamsSchema.safeParse(data)
}

// ==============================================
// VALIDATION ERROR FORMATTER
// ==============================================
export function formatPasswordResetErrors(errors: z.ZodError) {
  return errors.errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
  }))
}

// ==============================================
// PASSWORD RESET HELPERS
// ==============================================
export function isValidResetTokenFormat(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token)
}

export function generatePasswordResetToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}