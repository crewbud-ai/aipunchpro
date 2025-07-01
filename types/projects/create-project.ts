// ==============================================
// src/types/projects/create-project.ts - Project Creation Types
// ==============================================

import { z } from 'zod'
import type { Project } from './project'

// ==============================================
// CREATE PROJECT INTERFACES
// ==============================================
export interface CreateProjectData {
  name: string
  description?: string
  projectNumber?: string
  status?: Project['status']
  priority?: Project['priority']
  budget?: number
  startDate?: string
  endDate?: string
  estimatedHours?: number
  location?: string
  address?: string
  clientName?: string
  clientContact?: string
  tags?: string[]
}

export interface CreateProjectResult {
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
// CREATE PROJECT STATE
// ==============================================
export type CreateProjectState = 
  | 'idle'           // Initial state
  | 'loading'        // Creating project
  | 'success'        // Project created
  | 'error'          // Creation failed

// ==============================================
// BASE VALIDATION SCHEMA (without refinements)
// ==============================================
const baseCreateProjectSchema = z.object({
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
export const createProjectSchema = baseCreateProjectSchema.refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

// ==============================================
// TYPE EXPORTS FOR FORM VALIDATION
// ==============================================
export type CreateProjectFormData = z.infer<typeof baseCreateProjectSchema>

// ==============================================
// VALIDATION HELPER FUNCTIONS
// ==============================================
export const validateCreateProject = (data: unknown) => {
  try {
    const result = createProjectSchema.parse(data)
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