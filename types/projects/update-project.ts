// ==============================================
// src/types/projects/update-project.ts - Updated Project Update Types
// ==============================================

import { z } from 'zod'
import type { Project, ProjectLocation, ProjectClient } from './project'

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
  actualStartDate?: string
  actualEndDate?: string
  estimatedHours?: number
  actualHours?: number

  // Enhanced location and client data
  location?: ProjectLocation
  client?: ProjectClient

  // Alternative: form-specific location selection
  selectedLocation?: {
    address: string
    displayName: string
    coordinates?: { lat: number; lng: number }
    placeId?: string
  }

  // Alternative: form-specific client fields (will be transformed to client object)
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  clientContactPerson?: string
  clientWebsite?: string
  clientNotes?: string

  tags?: string[]
  projectManagerId?: string
  foremanId?: string
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
// FORM DATA INTERFACE (for frontend forms)
// ==============================================
export interface UpdateProjectFormData {
  id: string

  // Basic project info
  name: string
  description: string
  projectNumber: string
  status: Project['status']
  priority: Project['priority']
  budget?: number
  spent?: number
  progress?: number
  startDate: string
  endDate: string
  actualStartDate: string
  actualEndDate: string
  estimatedHours?: number
  actualHours?: number

  // Location form fields
  locationSearch: string  // For autocomplete input
  selectedLocation?: {
    address: string
    displayName: string
    coordinates?: { lat: number; lng: number }
    placeId?: string
  }

  // Client form fields (individual inputs)
  clientName: string
  clientEmail: string
  clientPhone: string
  clientContactPerson: string
  clientWebsite: string
  clientNotes: string

  // Team assignments
  projectManagerId?: string
  foremanId?: string

  // Additional fields
  tags: string[]

  // UI state helpers
  isCheckingName?: boolean
  isNameAvailable?: boolean
  lastCheckedName?: string
}

// ==============================================
// PROJECT FILTERS FORM DATA
// ==============================================
export interface ProjectFiltersFormData {
  status?: Project['status']
  priority?: Project['priority']
  search: string
  location: string
  client: string
  managerId?: string
  sortBy: 'name' | 'created_at' | 'start_date' | 'progress' | 'priority' | 'status'
  sortOrder: 'asc' | 'desc'
}

// ==============================================
// LOCATION SCHEMAS (JSONB validation)
// ==============================================
const locationSchema = z.object({
  address: z.string().min(1, 'Address is required').max(500, 'Address too long'),
  displayName: z.string().max(255, 'Display name too long').optional(),
  city: z.string().max(100, 'City name too long').optional(),
  state: z.string().max(10, 'State code too long').optional(),
  country: z.string().max(10, 'Country code too long').optional().default('US'),
  zipCode: z.string().max(20, 'ZIP code too long').optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90, 'Invalid latitude'),
    lng: z.number().min(-180).max(180, 'Invalid longitude'),
  }).optional(),
  placeId: z.string().max(255, 'Place ID too long').optional(),
  timezone: z.string().max(50, 'Timezone too long').optional(),
}).optional()

const clientSchema = z.object({
  name: z.string().max(255, 'Client name too long').optional(),
  contactPerson: z.string().max(255, 'Contact person name too long').optional(),
  email: z.string().email('Invalid email address').max(255, 'Email too long').optional(),
  phone: z.string().regex(/^\+1\d{10}$/, 'Phone must be in format +1XXXXXXXXXX').optional(),
  secondaryEmail: z.string().email('Invalid secondary email').max(255, 'Secondary email too long').optional(),
  secondaryPhone: z.string().regex(/^\+1\d{10}$/, 'Secondary phone must be in format +1XXXXXXXXXX').optional(),
  website: z.string().url('Invalid website URL').max(500, 'Website URL too long').optional(),
  businessAddress: z.string().max(500, 'Business address too long').optional(),
  billingAddress: z.string().max(500, 'Billing address too long').optional(),
  taxId: z.string().max(50, 'Tax ID too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  preferredContact: z.enum(['email', 'phone', 'both']).optional(),
}).optional()

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
    .enum([
      'not_started',
      'in_progress',
      'on_track',
      'ahead_of_schedule',
      'behind_schedule',
      'on_hold',
      'completed',
      'cancelled'
    ])
    .optional(),

  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .optional(),

  budget: z
    .number()
    .min(0, 'Budget cannot be negative')
    .max(999999999999.99, 'Budget is too large')
    .optional(),

  spent: z
    .number()
    .min(0, 'Spent amount cannot be negative')
    .max(999999999999.99, 'Spent amount is too large')
    .optional(),

  progress: z
    .number()
    .min(0, 'Progress cannot be less than 0')
    .max(100, 'Progress cannot be more than 100')
    .optional(),

  // FIXED: Better date handling that allows empty strings
  startDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true // Allow empty
      try {
        const date = new Date(val)
        return !isNaN(date.getTime()) // Check if valid date
      } catch {
        return false
      }
    }, 'Invalid start date'),

  endDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true // Allow empty
      try {
        const date = new Date(val)
        return !isNaN(date.getTime()) // Check if valid date
      } catch {
        return false
      }
    }, 'Invalid end date'),

  actualStartDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true // Allow empty
      try {
        const date = new Date(val)
        return !isNaN(date.getTime()) // Check if valid date
      } catch {
        return false
      }
    }, 'Invalid actual start date'),

  actualEndDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true // Allow empty
      try {
        const date = new Date(val)
        return !isNaN(date.getTime()) // Check if valid date
      } catch {
        return false
      }
    }, 'Invalid actual end date'),

  estimatedHours: z
    .number()
    .min(0, 'Estimated hours cannot be negative')
    .max(999999.99, 'Estimated hours is too large')
    .optional(),

  actualHours: z
    .number()
    .min(0, 'Actual hours cannot be negative')
    .max(999999.99, 'Actual hours is too large')
    .optional(),

  projectManagerId: z
    .string()
    .uuid('Invalid project manager ID')
    .optional(),

  foremanId: z
    .string()
    .uuid('Invalid foreman ID')
    .optional(),

  // Enhanced JSONB fields
  location: locationSchema,
  client: clientSchema,

  tags: z
    .array(z.string().max(50, 'Tag too long'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),

  // Form-specific fields for handling frontend data
  locationSearch: z.string().optional(),
  selectedLocation: z.object({
    address: z.string(),
    displayName: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    placeId: z.string().optional(),
  }).optional(),

  // Form fields for client data (will be transformed to client JSONB)
  clientName: z.string().max(255, 'Client name too long').optional(),
  clientEmail: z.string().email('Invalid email address').max(255, 'Email too long').optional(),
  clientPhone: z.string().regex(/^\+1\d{10}$/, 'Phone must be in format +1XXXXXXXXXX').optional(),
  clientContactPerson: z.string().max(255, 'Contact person name too long').optional(),
  clientWebsite: z
    .string()
    .optional()
    .refine((val) => {
      // If empty, undefined, or just whitespace, it's valid (optional)
      if (!val || val.trim() === '') return true
      // If has content, must be valid URL
      try {
        new URL(val)
        return val.length <= 500 // Also check max length
      } catch {
        return false
      }
    }, {
      message: 'Invalid website URL or URL too long (max 500 characters)'
    }),
  clientNotes: z.string().max(1000, 'Client notes too long').optional(),
})

// ==============================================
// UPDATE PROJECT VALIDATION SCHEMA (with refinements)
// ==============================================
export const updateProjectSchema = baseUpdateProjectSchema.refine((data) => {
  // Validate planned date logic - only if both dates are provided and not empty
  if (data.startDate && data.startDate.trim() !== '' && data.endDate && data.endDate.trim() !== '') {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine((data) => {
  // Validate actual date logic - only if both dates are provided and not empty
  if (data.actualStartDate && data.actualStartDate.trim() !== '' && data.actualEndDate && data.actualEndDate.trim() !== '') {
    return new Date(data.actualStartDate) <= new Date(data.actualEndDate)
  }
  return true
}, {
  message: 'Actual end date must be after actual start date',
  path: ['actualEndDate'],
}).refine((data) => {
  // Validate budget vs spent
  if (data.budget !== undefined && data.spent !== undefined) {
    return data.spent <= data.budget
  }
  return true
}, {
  message: 'Spent amount cannot exceed budget',
  path: ['spent'],
}).refine((data) => {
  // Validate client contact information - if client name provided, must have contact info
  if (data.clientName || data.client?.name) {
    return (
      data.client?.email ||
      data.client?.phone ||
      data.clientEmail ||
      data.clientPhone
    )
  }
  return true
}, {
  message: 'Client contact information (email or phone) is required when client name is provided',
  path: ['clientEmail'],
})
// ==============================================
// PROJECT FILTERS VALIDATION SCHEMA
// ==============================================
export const projectFiltersSchema = z.object({
  status: z
    .enum([
      'not_started',
      'in_progress',
      'on_track',
      'ahead_of_schedule',
      'behind_schedule',
      'on_hold',
      'completed',
      'cancelled'
    ])
    .optional(),

  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .optional(),

  search: z.string().optional(),
  location: z.string().optional(),
  client: z.string().optional(),
  managerId: z.string().uuid('Invalid manager ID').optional(),

  sortBy: z
    .enum(['name', 'created_at', 'start_date', 'progress', 'priority', 'status'])
    .default('created_at'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
})

// ==============================================
// TYPE EXPORTS
// ==============================================
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type ProjectFiltersInput = z.infer<typeof projectFiltersSchema>

// ==============================================
// VALIDATION HELPER FUNCTIONS
// ==============================================
export const validateUpdateProject = (data: unknown) => {
  return updateProjectSchema.safeParse(data)
}

export const validateProjectFilters = (data: unknown) => {
  return projectFiltersSchema.safeParse(data)
}

// ==============================================
// FORM DATA TRANSFORMATION HELPERS
// ==============================================

/**
 * Transform form data to API data format
 * Converts form fields to proper JSONB structure
 */
export function transformUpdateFormDataToApiData(formData: UpdateProjectFormData): UpdateProjectData {
  const apiData: UpdateProjectData = {
    id: formData.id,
    name: formData.name,
    description: formData.description,
    projectNumber: formData.projectNumber,
    status: formData.status,
    priority: formData.priority,
    budget: formData.budget,
    spent: formData.spent,
    progress: formData.progress,

    // FIXED: Handle empty date strings by converting them to undefined
    startDate: formData.startDate && formData.startDate.trim() !== '' ? formData.startDate : undefined,
    endDate: formData.endDate && formData.endDate.trim() !== '' ? formData.endDate : undefined,
    actualStartDate: formData.actualStartDate && formData.actualStartDate.trim() !== '' ? formData.actualStartDate : undefined,
    actualEndDate: formData.actualEndDate && formData.actualEndDate.trim() !== '' ? formData.actualEndDate : undefined,

    estimatedHours: formData.estimatedHours,
    actualHours: formData.actualHours,
    tags: formData.tags,
    projectManagerId: formData.projectManagerId,
    foremanId: formData.foremanId,
  }

  // Transform location data
  if (formData.selectedLocation) {
    apiData.location = {
      address: formData.selectedLocation.address,
      displayName: formData.selectedLocation.displayName,
      coordinates: formData.selectedLocation.coordinates,
      placeId: formData.selectedLocation.placeId,
      country: 'US', // Default to US for now
    }
  }

  // Transform client data from form fields
  if (formData.clientName || formData.clientEmail || formData.clientPhone) {
    apiData.client = {
      name: formData.clientName || undefined,
      email: formData.clientEmail || undefined,
      phone: formData.clientPhone || undefined,
      contactPerson: formData.clientContactPerson || undefined,
      website: formData.clientWebsite || undefined,
      notes: formData.clientNotes || undefined,
      preferredContact:
        formData.clientEmail && formData.clientPhone ? 'both' :
          formData.clientEmail ? 'email' :
            formData.clientPhone ? 'phone' : undefined
    }
  }

  return apiData
}

/**
 * Convert Project to UpdateProjectFormData
 */
export function projectToUpdateFormData(project: Project): UpdateProjectFormData {
  return {
    id: project.id,
    name: project.name,
    description: project.description || '',
    projectNumber: project.projectNumber || '',
    status: project.status,
    priority: project.priority,
    budget: project.budget,
    spent: project.spent,
    progress: project.progress,
    startDate: project.startDate || '',
    endDate: project.endDate || '',
    actualStartDate: project.actualStartDate || '',
    actualEndDate: project.actualEndDate || '',
    estimatedHours: project.estimatedHours,
    actualHours: project.actualHours,

    // Location handling
    locationSearch: project.location?.displayName || project.location?.address || '',
    selectedLocation: project.location ? {
      address: project.location.address,
      displayName: project.location.displayName || project.location.address,
      coordinates: project.location.coordinates,
      placeId: project.location.placeId,
    } : undefined,

    // Client handling
    clientName: project.client?.name || '',
    clientEmail: project.client?.email || '',
    clientPhone: project.client?.phone || '',
    clientContactPerson: project.client?.contactPerson || '',
    clientWebsite: project.client?.website || '',
    clientNotes: project.client?.notes || '',

    // Team assignments
    projectManagerId: project.projectManagerId,
    foremanId: project.foremanId,

    tags: project.tags || [],
  }
}

/**
 * Check if form data has changes compared to original project
 */
export function hasFormChanges(
  current: UpdateProjectFormData,
  original: Project
): boolean {
  const originalForm = projectToUpdateFormData(original)

  // Compare all fields
  return (
    current.name !== originalForm.name ||
    current.description !== originalForm.description ||
    current.projectNumber !== originalForm.projectNumber ||
    current.status !== originalForm.status ||
    current.priority !== originalForm.priority ||
    current.budget !== originalForm.budget ||
    current.spent !== originalForm.spent ||
    current.progress !== originalForm.progress ||
    current.startDate !== originalForm.startDate ||
    current.endDate !== originalForm.endDate ||
    current.actualStartDate !== originalForm.actualStartDate ||
    current.actualEndDate !== originalForm.actualEndDate ||
    current.estimatedHours !== originalForm.estimatedHours ||
    current.actualHours !== originalForm.actualHours ||
    current.projectManagerId !== originalForm.projectManagerId ||
    current.foremanId !== originalForm.foremanId ||

    // Location comparison
    current.locationSearch !== originalForm.locationSearch ||
    JSON.stringify(current.selectedLocation) !== JSON.stringify(originalForm.selectedLocation) ||

    // Client comparison
    current.clientName !== originalForm.clientName ||
    current.clientEmail !== originalForm.clientEmail ||
    current.clientPhone !== originalForm.clientPhone ||
    current.clientContactPerson !== originalForm.clientContactPerson ||
    current.clientWebsite !== originalForm.clientWebsite ||
    current.clientNotes !== originalForm.clientNotes ||

    // Tags comparison
    JSON.stringify(current.tags) !== JSON.stringify(originalForm.tags)
  )
}

/**
 * Get default filter form data
 */
export function getDefaultProjectFiltersFormData(): ProjectFiltersFormData {
  return {
    search: '',
    location: '',
    client: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  }
}