// ==============================================
// src/types/projects/create-project.ts - Updated Project Creation Types
// ==============================================

import { z } from 'zod'
import type { Project, ProjectLocation, ProjectClient } from './project'

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
// FORM DATA INTERFACE (for frontend forms)
// ==============================================
export interface CreateProjectFormData {
  // Basic project info
  name: string
  description: string
  projectNumber: string
  status: Project['status']
  priority: Project['priority']
  budget?: number
  startDate: string
  endDate: string
  estimatedHours?: number
  
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
  
  // Additional fields
  tags: string[]
  projectManagerId?: string
  foremanId?: string
  
  // UI state helpers
  isCheckingName?: boolean
  isNameAvailable?: boolean
  lastCheckedName?: string
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
    .default('not_started'),
  
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .default('medium'),
  
  budget: z
    .number()
    .min(0, 'Budget cannot be negative')
    .max(999999999999.99, 'Budget is too large')
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
    .max(999999.99, 'Estimated hours is too large')
    .optional(),
  
  // Enhanced JSONB fields
  location: locationSchema,
  client: clientSchema,
  
  tags: z
    .array(z.string().max(50, 'Tag too long'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),

  projectManagerId: z
    .string()
    .uuid('Invalid project manager ID')
    .optional(),

  foremanId: z
    .string()
    .uuid('Invalid foreman ID')
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
// CREATE PROJECT VALIDATION SCHEMA (with refinements)
// ==============================================
export const createProjectSchema = baseCreateProjectSchema.refine((data) => {
  // Validate date logic for planned dates
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine((data) => {
  // Validate location - either location object or selectedLocation should be provided
  if (!data.location && !data.selectedLocation && !data.locationSearch) {
    return false // Require some location info
  }
  return true
}, {
  message: 'Project location is required',
  path: ['selectedLocation'],
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
// TYPE EXPORTS FOR FORM VALIDATION
// ==============================================
export type CreateProjectInput = z.infer<typeof createProjectSchema>

// ==============================================
// VALIDATION HELPER FUNCTIONS
// ==============================================
export const validateCreateProject = (data: unknown) => {
  return createProjectSchema.safeParse(data)
}

// ==============================================
// FORM DATA TRANSFORMATION HELPERS
// ==============================================

/**
 * Transform form data to API data format
 * Converts form fields to proper JSONB structure
 */
export function transformFormDataToApiData(formData: CreateProjectFormData): CreateProjectData {
  const apiData: CreateProjectData = {
    name: formData.name,
    description: formData.description,
    projectNumber: formData.projectNumber,
    status: formData.status,
    priority: formData.priority,
    budget: formData.budget,
    startDate: formData.startDate,
    endDate: formData.endDate,
    estimatedHours: formData.estimatedHours,
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
 * Get default form data with proper structure
 */
export function getDefaultCreateProjectFormData(): CreateProjectFormData {
  return {
    name: '',
    description: '',
    projectNumber: '',
    status: 'not_started',
    priority: 'medium',
    budget: undefined,
    startDate: '',
    endDate: '',
    estimatedHours: undefined,
    locationSearch: '',
    selectedLocation: undefined,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientContactPerson: '',
    clientWebsite: '',
    clientNotes: '',
    tags: [],
    projectManagerId: undefined,
    foremanId: undefined,
  }
}