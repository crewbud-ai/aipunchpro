// ==============================================
// lib/validations/projects/project-files.ts - Project Files Validation Schemas
// ==============================================

import { z } from 'zod'

// ==============================================
// CONSTANTS
// ==============================================
const FOLDER_OPTIONS = ['blueprints', 'documents', 'photos', 'contracts', 'reports', 'general'] as const
const CATEGORY_OPTIONS = ['architectural', 'structural', 'electrical', 'mechanical', 'progress', 'legal', 'administrative'] as const
const STATUS_OPTIONS = ['active', 'inactive', 'archived'] as const
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf'] // Only PDF for blueprints

// ==============================================
// HELPER FUNCTIONS
// ==============================================
function validateFile(file: File): boolean {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return false
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return false
  }
  
  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension !== 'pdf') {
    return false
  }
  
  return true
}

// ==============================================
// FILE VALIDATION SCHEMA
// ==============================================
const fileSchema = z.instanceof(File).refine((file) => {
  return validateFile(file)
}, {
  message: 'File must be a PDF under 10MB',
})

// ==============================================
// CREATE PROJECT FILE VALIDATION SCHEMA
// ==============================================
export const createProjectFileSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  
  file: fileSchema,
  
  folder: z
    .enum(FOLDER_OPTIONS, { 
      errorMap: () => ({ message: 'Invalid folder option' }) 
    })
    .default('blueprints'),
  
  category: z
    .enum(CATEGORY_OPTIONS, { 
      errorMap: () => ({ message: 'Invalid category option' }) 
    })
    .default('architectural'),
  
  version: z
    .string()
    .min(1, 'Version is required')
    .max(50, 'Version too long')
    .default('1.0'),
  
  description: z
    .string()
    .max(1000, 'Description too long')
    .optional(),
  
  isPublic: z
    .boolean()
    .default(true),
  
  tags: z
    .array(z.string().max(50, 'Tag too long'))
    .max(10, 'Too many tags')
    .default([]),
})

// ==============================================
// UPDATE PROJECT FILE VALIDATION SCHEMA
// ==============================================
export const updateProjectFileSchema = z.object({
  id: z.string().uuid('Invalid file ID'),
  
  version: z
    .string()
    .min(1, 'Version is required')
    .max(50, 'Version too long')
    .optional(),
  
  description: z
    .string()
    .max(1000, 'Description too long')
    .optional(),
  
  isPublic: z
    .boolean()
    .optional(),
  
  tags: z
    .array(z.string().max(50, 'Tag too long'))
    .max(10, 'Too many tags')
    .optional(),
  
  status: z
    .enum(STATUS_OPTIONS, { 
      errorMap: () => ({ message: 'Invalid status option' }) 
    })
    .optional(),
})

// ==============================================
// GET PROJECT FILES VALIDATION SCHEMA (Fixed defaults)
// ==============================================
export const getProjectFilesSchema = z.object({
  folder: z
    .enum(FOLDER_OPTIONS, { 
      errorMap: () => ({ message: 'Invalid folder option' }) 
    })
    .optional()
    .nullable(),
  
  category: z
    .enum(CATEGORY_OPTIONS, { 
      errorMap: () => ({ message: 'Invalid category option' }) 
    })
    .optional()
    .nullable(),
  
  status: z
    .enum(STATUS_OPTIONS, { 
      errorMap: () => ({ message: 'Invalid status option' }) 
    })
    .optional()
    .nullable(),
  
  limit: z
    .string()
    .transform(val => val ? Number(val) : 50)
    .refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100')
    .optional()
    .nullable(),
  
  offset: z
    .string()
    .transform(val => val ? Number(val) : 0)
    .refine(n => n >= 0, 'Offset cannot be negative')
    .optional()
    .nullable(),
  
  search: z
    .string()
    .min(1, 'Search term too short')
    .max(255, 'Search term too long')
    .optional()
    .nullable(),
  
  sortBy: z
    .enum(['name', 'uploadedAt', 'fileSize', 'version'], {
      errorMap: () => ({ message: 'Invalid sort field' })
    })
    .optional()
    .nullable(),
  
  sortOrder: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: 'Invalid sort order' })
    })
    .optional()
    .nullable(),
})

// ==============================================
// DELETE PROJECT FILE VALIDATION SCHEMA
// ==============================================
export const deleteProjectFileSchema = z.object({
  id: z.string().uuid('Invalid file ID'),
  projectId: z.string().uuid('Invalid project ID'),
})

// ==============================================
// TYPE EXPORTS
// ==============================================
export type CreateProjectFileInput = z.infer<typeof createProjectFileSchema>
export type UpdateProjectFileInput = z.infer<typeof updateProjectFileSchema>
export type GetProjectFilesInput = z.infer<typeof getProjectFilesSchema>
export type DeleteProjectFileInput = z.infer<typeof deleteProjectFileSchema>

// ==============================================
// VALIDATION HELPER FUNCTIONS
// ==============================================
export function validateCreateProjectFile(data: unknown) {
  return createProjectFileSchema.safeParse(data)
}

export function validateUpdateProjectFile(data: unknown) {
  return updateProjectFileSchema.safeParse(data)
}

export function validateGetProjectFiles(data: unknown) {
  return getProjectFilesSchema.safeParse(data)
}

export function validateDeleteProjectFile(data: unknown) {
  return deleteProjectFileSchema.safeParse(data)
}

// ==============================================
// VALIDATION ERROR FORMATTER
// ==============================================
export function formatProjectFileErrors(errors: z.ZodError) {
  return errors.errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
  }))
}