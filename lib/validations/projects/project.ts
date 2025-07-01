// ==============================================
// src/lib/validations/projects/project.ts - Project Validation Schemas
// ==============================================

import { z } from 'zod'

// ==============================================
// BASE PROJECT SCHEMA (without refinements)
// ==============================================
const baseProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Project name must be less than 255 characters')
    .trim(),
  
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  projectNumber: z
    .string()
    .max(100, 'Project number must be less than 100 characters')
    .optional(),
  
  status: z
    .enum(['not_started', 'in_progress', 'on_track', 'ahead_of_schedule', 'behind_schedule', 'completed'])
    .default('not_started'),
  
  priority: z
    .enum(['low', 'medium', 'high'])
    .default('medium'),
  
  budget: z
    .number()
    .min(0, 'Budget cannot be negative')
    .max(999999999.99, 'Budget is too large')
    .optional(),
  
  startDate: z
    .string()
    .date('Invalid start date')
    .optional(),
  
  endDate: z
    .string()
    .date('Invalid end date')
    .optional(),
  
  estimatedHours: z
    .number()
    .min(0, 'Estimated hours cannot be negative')
    .max(999999, 'Estimated hours is too large')
    .optional(),
  
  location: z
    .string()
    .max(500, 'Location must be less than 500 characters')
    .optional(),
  
  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  
  clientName: z
    .string()
    .max(255, 'Client name must be less than 255 characters')
    .optional(),
  
  clientContact: z
    .string()
    .max(500, 'Client contact must be less than 500 characters')
    .optional(),
  
  tags: z
    .array(z.string().max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
})

// ==============================================
// CREATE PROJECT VALIDATION SCHEMA (with refinements)
// ==============================================
export const createProjectSchema = baseProjectSchema.refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

// ==============================================
// UPDATE PROJECT VALIDATION SCHEMA
// ==============================================
export const updateProjectSchema = baseProjectSchema.partial().extend({
  id: z.string().uuid('Invalid project ID'),
  spent: z
    .number()
    .min(0, 'Spent amount cannot be negative')
    .max(999999999.99, 'Spent amount is too large')
    .optional(),
  
  progress: z
    .number()
    .min(0, 'Progress cannot be less than 0')
    .max(100, 'Progress cannot be more than 100')
    .optional(),
  
  actualHours: z
    .number()
    .min(0, 'Actual hours cannot be negative')
    .max(999999, 'Actual hours is too large')
    .optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

// ==============================================
// PROJECT QUERY SCHEMA
// ==============================================
export const getProjectsSchema = z.object({
  status: z
    .string()
    .refine(val => ['not_started', 'in_progress', 'on_track', 'ahead_of_schedule', 'behind_schedule', 'completed'].includes(val), 'Invalid status')
    .transform(val => val as 'not_started' | 'in_progress' | 'on_track' | 'ahead_of_schedule' | 'behind_schedule' | 'completed')
    .optional()
    .nullable(),
  
  priority: z
    .string()
    .refine(val => ['low', 'medium', 'high'].includes(val), 'Invalid priority')
    .transform(val => val as 'low' | 'medium' | 'high')
    .optional()
    .nullable(),
  
  limit: z
    .string()
    .transform(val => val ? Number(val) : undefined)
    .refine(n => !n || (n > 0 && n <= 100), 'Limit must be between 1 and 100')
    .optional()
    .nullable(),
  
  offset: z
    .string()
    .transform(val => val ? Number(val) : undefined)
    .refine(n => !n || n >= 0, 'Offset cannot be negative')
    .optional()
    .nullable(),
  
  search: z
    .string()
    .max(255, 'Search term too long')
    .optional()
    .nullable(),

  sortBy: z
    .string()
    .refine(val => ['name', 'created_at', 'start_date', 'progress'].includes(val), 'Invalid sortBy field')
    .transform(val => val as 'name' | 'created_at' | 'start_date' | 'progress')
    .optional()
    .nullable(),

  sortOrder: z
    .string()
    .refine(val => ['asc', 'desc'].includes(val), 'Invalid sort order')
    .transform(val => val as 'asc' | 'desc')
    .optional()
    .nullable(),
}).transform(data => ({
  // Clean up the data and convert null/empty to undefined with proper types
  status: data.status || undefined,
  priority: data.priority || undefined,
  limit: data.limit || undefined,
  offset: data.offset || undefined,
  search: data.search || undefined,
  sortBy: data.sortBy || undefined,
  sortOrder: data.sortOrder || undefined,
})).optional().default({})

// ==============================================
// TYPE EXPORTS
// ==============================================
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type GetProjectsInput = z.infer<typeof getProjectsSchema>

// ==============================================
// VALIDATION HELPER FUNCTIONS
// ==============================================
export function validateCreateProject(data: unknown) {
  return createProjectSchema.safeParse(data)
}

export function validateUpdateProject(data: unknown) {
  return updateProjectSchema.safeParse(data)
}

export function validateGetProjects(data: unknown) {
  return getProjectsSchema.safeParse(data)
}

// ==============================================
// VALIDATION ERROR FORMATTER
// ==============================================
export function formatProjectErrors(errors: z.ZodError) {
  return errors.errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
  }))
}