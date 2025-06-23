// ==============================================
// src/lib/validations/email-verification.ts - Email Verification Validation Schemas
// ==============================================

import { z } from 'zod'

// ==============================================
// EMAIL VERIFICATION VALIDATION SCHEMA
// ==============================================
export const emailVerificationSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required')
    .length(64, 'Invalid verification token format')
    .regex(/^[a-f0-9]{64}$/, 'Verification token must be a valid hexadecimal string'),
  
  userId: z
    .string()
    .uuid('Invalid user ID format')
    .optional(),
})

// ==============================================
// RESEND VERIFICATION EMAIL SCHEMA
// ==============================================
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
})

// ==============================================
// URL PARAMS VALIDATION SCHEMA
// ==============================================
export const verificationUrlParamsSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required')
    .length(64, 'Invalid verification token format'),
  
  userId: z
    .string()
    .uuid('Invalid user ID format')
    .optional(),
})

// ==============================================
// TYPE EXPORTS
// ==============================================
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>
export type VerificationUrlParams = z.infer<typeof verificationUrlParamsSchema>

// ==============================================
// VALIDATION HELPER FUNCTIONS
// ==============================================
export function validateEmailVerification(data: unknown) {
  return emailVerificationSchema.safeParse(data)
}

export function validateResendVerification(data: unknown) {
  return resendVerificationSchema.safeParse(data)
}

export function validateVerificationUrlParams(data: unknown) {
  return verificationUrlParamsSchema.safeParse(data)
}

// ==============================================
// VALIDATION ERROR FORMATTER
// ==============================================
export function formatVerificationErrors(errors: z.ZodError) {
  return errors.errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
  }))
}

// ==============================================
// TOKEN VALIDATION HELPERS
// ==============================================
export function isValidTokenFormat(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token)
}

export function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)
}