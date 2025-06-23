// ==============================================
// src/lib/validations/auth.ts - Authentication Validation Schemas
// ==============================================

import { z } from 'zod'

// ==============================================
// COMPANY VALIDATION SCHEMA
// ==============================================
export const companySignupSchema = z.object({
    name: z
        .string()
        .min(2, 'Company name must be at least 2 characters')
        .max(255, 'Company name must be less than 255 characters')
        .trim(),

    slug: z
        .string()
        .min(2, 'Company slug must be at least 2 characters')
        .max(100, 'Company slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),

    industry: z
        .enum([
            'general-construction',
            'residential',
            'commercial',
            'industrial',
            'civil',
            'electrical',
            'plumbing',
            'hvac',
            'roofing',
            'other'
        ])
        .optional(),

    size: z
        .enum(['1-10', '11-50', '51-200', '201-500', '500+'])
        .optional(),
})

// ==============================================
// USER VALIDATION SCHEMA
// ==============================================
export const userSignupSchema = z.object({
    firstName: z
        .string()
        .min(1, 'First name is required')
        .max(100, 'First name must be less than 100 characters')
        .trim(),

    lastName: z
        .string()
        .min(1, 'Last name is required')
        .max(100, 'Last name must be less than 100 characters')
        .trim(),

    email: z
        .string()
        .email('Please enter a valid email address')
        .max(255, 'Email must be less than 255 characters')
        .toLowerCase()
        .trim(),

    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be less than 128 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

    phone: z
        .string()
        .max(50, 'Phone number must be less than 50 characters')
        .optional()
        .transform(val => val === '' ? undefined : val), // Convert empty string to undefined

    role: z
        .enum(['super_admin', 'admin', 'manager', 'member'])
        .default('admin'),
})

// ==============================================
// COMBINED SIGNUP SCHEMA
// ==============================================
export const completeSignupSchema = z.object({
    company: companySignupSchema,
    user: userSignupSchema,
})

// ==============================================
// LOGIN VALIDATION SCHEMA
// ==============================================
export const loginSchema = z.object({
    email: z
        .string()
        .email('Please enter a valid email address')
        .toLowerCase()
        .trim(),

    password: z
        .string()
        .min(1, 'Password is required'),
})

// ==============================================
// PASSWORD VALIDATION SCHEMA
// ==============================================
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

// ==============================================
// TYPE EXPORTS
// ==============================================
export type CompanySignupInput = z.infer<typeof companySignupSchema>
export type UserSignupInput = z.infer<typeof userSignupSchema>
export type CompleteSignupInput = z.infer<typeof completeSignupSchema>
export type LoginInput = z.infer<typeof loginSchema>

// ==============================================
// VALIDATION HELPER FUNCTIONS
// ==============================================
export function validateCompanySignup(data: unknown) {
    return companySignupSchema.safeParse(data)
}

export function validateUserSignup(data: unknown) {
    return userSignupSchema.safeParse(data)
}

export function validateCompleteSignup(data: unknown) {
    return completeSignupSchema.safeParse(data)
}

export function validateLogin(data: unknown) {
    return loginSchema.safeParse(data)
}

// ==============================================
// SLUG GENERATION HELPER
// ==============================================
export function generateSlugFromName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')         // Replace spaces with hyphens
        .replace(/-+/g, '-')          // Replace multiple hyphens with single
        .replace(/^-|-$/g, '')        // Remove leading/trailing hyphens
}

// ==============================================
// VALIDATION ERROR FORMATTER
// ==============================================
export function formatValidationErrors(errors: z.ZodError) {
    return errors.errors.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
    }))
}