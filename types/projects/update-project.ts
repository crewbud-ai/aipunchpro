// ==============================================
// src/types/projects/update-project.ts - Project Update Types
// ==============================================

import { z } from 'zod'
import type { Project } from './project'

// ==============================================
// UPDATE PROJECT INTERFACES
// ==============================================
export interface UpdateProjectData {
  id: string
  name?: string
  description?: string
  projectNumber?: string
  status?: Project['status']
  priority?: Project['priority']
  budget?: number
  spent?: number
  progress?: number
  startDate?: string
  endDate?: string
  estimatedHours?: number
  actualHours?: number
  location?: string
  address?: string
  clientName?: string
  clientContact?: string
  tags?: string[]
}

export interface UpdateProjectResult {
  success: boolean
  message: string
  data: {
    project: Project
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// UPDATE PROJECT STATE
// ==============================================
export type UpdateProjectState = 
  | 'idle'           // Initial state
  | 'loading'        // Updating project
  | 'success'        // Project updated
  | 'error'          // Update failed

// ==============================================
// BASE UPDATE VALIDATION SCHEMA (without refinements)
// ==============================================
const baseUpdateProjectSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
  
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Project name must be less than 255 characters')
    .trim()
    .optional(),
  
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
    .optional(),
  
  priority: z
    .enum(['low', 'medium', 'high'])
    .optional(),
  
  budget: z
    .number()
    .min(0, 'Budget cannot be negative')
    .max(999999999.99, 'Budget is too large')
    .optional(),
  
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
  
  actualHours: z
    .number()
    .min(0, 'Actual hours cannot be negative')
    .max(999999, 'Actual hours is too large')
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
// UPDATE PROJECT VALIDATION SCHEMA (with refinements)
// ==============================================
export const updateProjectSchema = baseUpdateProjectSchema.refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

// ==============================================
// FILTERS VALIDATION SCHEMA
// ==============================================
export const projectFiltersSchema = z.object({
  status: z
    .enum(['not_started', 'in_progress', 'on_track', 'ahead_of_schedule', 'behind_schedule', 'completed'])
    .optional(),
  
  priority: z
    .enum(['low', 'medium', 'high'])
    .optional(),
  
  search: z
    .string()
    .max(255, 'Search term too long')
    .optional(),

  sortBy: z
    .enum(['name', 'created_at', 'start_date', 'progress'])
    .optional(),

  sortOrder: z
    .enum(['asc', 'desc'])
    .optional(),

  limit: z
    .number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional(),

  offset: z
    .number()
    .min(0, 'Offset cannot be negative')
    .optional(),
})

// ==============================================
// TYPE EXPORTS FOR FORM VALIDATION
// ==============================================
export type UpdateProjectFormData = z.infer<typeof baseUpdateProjectSchema>
export type ProjectFiltersFormData = z.infer<typeof projectFiltersSchema>

// ==============================================
// VALIDATION HELPER FUNCTIONS
// ==============================================
export const validateUpdateProject = (data: unknown) => {
  try {
    const result = updateProjectSchema.parse(data)
    return { success: true, data: result, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      return { success: false, data: null, errors }
    }
    return { success: false, data: null, errors: [{ field: 'unknown', message: 'Validation failed' }] }
  }
}

export const validateProjectFilters = (data: unknown) => {
  try {
    const result = projectFiltersSchema.parse(data)
    return { success: true, data: result, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      return { success: false, data: null, errors }
    }
    return { success: false, data: null, errors: [{ field: 'unknown', message: 'Validation failed' }] }
  }
}