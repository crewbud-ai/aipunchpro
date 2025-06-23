// ==============================================
// src/types/signup.ts - Signup Form Types & Validation
// ==============================================

import { z } from 'zod'

// ==============================================
// FORM DATA INTERFACE
// ==============================================
export interface SignupFormData {
  // Company info
  companyName: string
  companySlug: string
  industry: string
  companySize: string
  // User info
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  phone: string
}

// ==============================================
// VALIDATION SCHEMAS
// ==============================================
export const step1Schema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companySlug: z
    .string()
    .min(1, "Company URL is required")
    .regex(/^[a-z0-9-]+$/, "URL can only contain lowercase letters, numbers, and hyphens"),
  industry: z.string().optional(),
  companySize: z.string().optional(),
})

export const step2Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain one uppercase letter")
    .regex(/[a-z]/, "Password must contain one lowercase letter") 
    .regex(/[0-9]/, "Password must contain one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// ==============================================
// VALIDATION HELPERS
// ==============================================
export const validateStep1 = (data: Partial<SignupFormData>) => {
  try {
    step1Schema.parse(data)
    return { success: true, errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message
        }
      })
      return { success: false, errors }
    }
    return { success: false, errors: {} }
  }
}

export const validateStep2 = (data: Partial<SignupFormData>) => {
  try {
    step2Schema.parse(data)
    return { success: true, errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message
        }
      })
      return { success: false, errors }
    }
    return { success: false, errors: {} }
  }
}

// ==============================================
// FORM UTILITIES
// ==============================================
export const generateSlugFromName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim()
}

export const getInitialFormData = (): SignupFormData => ({
  companyName: "",
  companySlug: "",
  industry: "",
  companySize: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
})

// ==============================================
// SELECT OPTIONS
// ==============================================
export const industryOptions = [
  { value: "general-construction", label: "General Construction" },
  { value: "residential", label: "Residential Construction" },
  { value: "commercial", label: "Commercial Construction" },
  { value: "industrial", label: "Industrial Construction" },
  { value: "civil", label: "Civil Engineering" },
  { value: "electrical", label: "Electrical Contracting" },
  { value: "plumbing", label: "Plumbing Contracting" },
  { value: "hvac", label: "HVAC Contracting" },
  { value: "roofing", label: "Roofing" },
  { value: "other", label: "Other" },
]

export const companySizeOptions = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" },
]