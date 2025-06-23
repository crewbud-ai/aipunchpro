// ==============================================
// src/lib/validations/login.ts - Login Validation Schemas
// ==============================================

import { z } from 'zod'

// ==============================================
// LOGIN VALIDATION SCHEMA
// ==============================================
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  
  password: z
    .string()
    .min(1, 'Password is required')
    .max(255, 'Password is too long'),
    
  rememberMe: z
    .boolean()
    .optional()
    .default(false),
})

// ==============================================
// LOGOUT VALIDATION SCHEMA
// ==============================================
export const logoutSchema = z.object({
  token: z
    .string()
    .min(1, 'Session token is required')
    .optional(), // Can be provided in header or body
    
  logoutAll: z
    .boolean()
    .optional()
    .default(false), // Logout from all devices
})

// ==============================================
// SESSION VALIDATION SCHEMA
// ==============================================
export const sessionValidationSchema = z.object({
  token: z
    .string()
    .min(1, 'Session token is required'),
})

// ==============================================
// TYPE EXPORTS
// ==============================================
export type LoginInput = z.infer<typeof loginSchema>
export type LogoutInput = z.infer<typeof logoutSchema>
export type SessionValidationInput = z.infer<typeof sessionValidationSchema>

// ==============================================
// VALIDATION HELPER FUNCTIONS
// ==============================================
export function validateLogin(data: unknown) {
  return loginSchema.safeParse(data)
}

export function validateLogout(data: unknown) {
  return logoutSchema.safeParse(data)
}

export function validateSession(data: unknown) {
  return sessionValidationSchema.safeParse(data)
}

// ==============================================
// VALIDATION ERROR FORMATTER
// ==============================================
export function formatLoginErrors(errors: z.ZodError) {
  return errors.errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
  }))
}

// ==============================================
// LOGIN ATTEMPT TRACKING SCHEMA
// ==============================================
export const loginAttemptSchema = z.object({
  email: z.string().email(),
  ipAddress: z.string().min(1),
  userAgent: z.string().optional(),
  success: z.boolean(),
  failureReason: z.string().optional(),
})

export type LoginAttemptInput = z.infer<typeof loginAttemptSchema>