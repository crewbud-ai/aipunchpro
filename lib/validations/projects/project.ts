// ==============================================
// src/lib/validations/projects/project.ts - Enhanced Project Validation Schemas
// ==============================================

import { z } from 'zod'

// ==============================================
// JSONB OBJECT SCHEMAS
// ==============================================

// Location JSONB validation schema
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

// Client JSONB validation schema
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
// BASE PROJECT SCHEMA (Enhanced)
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

  actualStartDate: z
    .string()
    .date('Invalid actual start date')
    .optional(),

  actualEndDate: z
    .string()
    .date('Invalid actual end date')
    .optional(),
  
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
  clientWebsite: z.string().url('Invalid website URL').max(500, 'Website URL too long').optional(),
  clientNotes: z.string().max(1000, 'Client notes too long').optional(),
})

// ==============================================
// CREATE PROJECT VALIDATION SCHEMA (with refinements)
// ==============================================
export const createProjectSchema = baseProjectSchema.refine((data) => {
  // Validate date logic for planned dates
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine((data) => {
  // Validate actual date logic
  if (data.actualStartDate && data.actualEndDate) {
    return new Date(data.actualStartDate) <= new Date(data.actualEndDate)
  }
  return true
}, {
  message: 'Actual end date must be after actual start date',
  path: ['actualEndDate'],
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
}).refine((data) => {
  // Validate location - either location object or selectedLocation should be provided
  if (data.selectedLocation && !data.location) {
    return true // This will be transformed in the API
  }
  return true
}, {
  message: 'Location information is required',
  path: ['location'],
})

// ==============================================
// UPDATE PROJECT VALIDATION SCHEMA
// ==============================================
export const updateProjectSchema = baseProjectSchema.partial().extend({
  id: z.string().uuid('Invalid project ID'),
  
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

  projectManagerId: z
    .string()
    .uuid('Invalid project manager ID')
    .optional(),

  foremanId: z
    .string()
    .uuid('Invalid foreman ID')
    .optional(),
}).refine((data) => {
  // Validate planned date logic
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine((data) => {
  // Validate actual date logic
  if (data.actualStartDate && data.actualEndDate) {
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
})

// ==============================================
// PROJECT QUERY SCHEMA (Enhanced)
// ==============================================
export const getProjectsSchema = z.object({
  status: z
    .string()
    .refine(val => [
      'not_started', 
      'in_progress', 
      'on_track', 
      'ahead_of_schedule', 
      'behind_schedule', 
      'on_hold', 
      'completed', 
      'cancelled'
    ].includes(val), 'Invalid status')
    .transform(val => val as 'not_started' | 'in_progress' | 'on_track' | 'ahead_of_schedule' | 'behind_schedule' | 'on_hold' | 'completed' | 'cancelled')
    .optional()
    .nullable(),
  
  priority: z
    .string()
    .refine(val => ['low', 'medium', 'high', 'urgent'].includes(val), 'Invalid priority')
    .transform(val => val as 'low' | 'medium' | 'high' | 'urgent')
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
    .refine(val => [
      'name', 
      'created_at', 
      'start_date', 
      'end_date', 
      'progress', 
      'status', 
      'priority', 
      'budget'
    ].includes(val), 'Invalid sortBy field')
    .transform(val => val as 'name' | 'created_at' | 'start_date' | 'end_date' | 'progress' | 'status' | 'priority' | 'budget')
    .optional()
    .nullable(),

  sortOrder: z
    .string()
    .refine(val => ['asc', 'desc'].includes(val), 'Invalid sort order')
    .transform(val => val as 'asc' | 'desc')
    .optional()
    .nullable(),

  // managerId: z
  //   .string()
  //   .uuid('Invalid manager ID')
  //   .optional()
  //   .nullable(),

  location: z
    .string()
    .max(255, 'Location search term too long')
    .optional()
    .nullable(),

  client: z
    .string()
    .max(255, 'Client search term too long')
    .optional()
    .nullable(),

  dateRange: z.object({
    start: z.string().date('Invalid start date'),
    end: z.string().date('Invalid end date'),
  }).optional().nullable(),

}).transform(data => ({
  // Clean up the data and convert null/empty to undefined with proper types
  status: data.status || undefined,
  priority: data.priority || undefined,
  limit: data.limit || undefined,
  offset: data.offset || undefined,
  search: data.search || undefined,
  sortBy: data.sortBy || undefined,
  sortOrder: data.sortOrder || undefined,
  // managerId: data.managerId || undefined,
  location: data.location || undefined,
  client: data.client || undefined,
  dateRange: data.dateRange || undefined,
})).optional().default({})

// ==============================================
// FORM DATA TRANSFORMATION HELPER
// ==============================================
export function transformFormDataToApiData(formData: any) {
  const apiData: any = {
    name: formData.name,
    description: formData.description,
    projectNumber: formData.projectNumber,
    status: formData.status,
    priority: formData.priority,
    budget: formData.budget,
    startDate: formData.startDate,
    endDate: formData.endDate,
    estimatedHours: formData.estimatedHours,
  }

  // Transform location data
  if (formData.selectedLocation) {
    apiData.location = {
      address: formData.selectedLocation.address,
      displayName: formData.selectedLocation.displayName,
      coordinates: formData.selectedLocation.coordinates,
      placeId: formData.selectedLocation.placeId,
      country: 'US',
    }
  } else if (formData.location) {
    apiData.location = formData.location
  }

  // Transform client data from form fields
  if (formData.clientName || formData.clientEmail || formData.clientPhone) {
    apiData.client = {
      name: formData.clientName,
      email: formData.clientEmail,
      phone: formData.clientPhone,
      contactPerson: formData.clientContactPerson,
      website: formData.clientWebsite,
      notes: formData.clientNotes,
      preferredContact: 
        formData.clientEmail && formData.clientPhone ? 'both' :
        formData.clientEmail ? 'email' :
        formData.clientPhone ? 'phone' : undefined
    }
  } else if (formData.client) {
    apiData.client = formData.client
  }

  return apiData
}

// ==============================================
// TYPE EXPORTS
// ==============================================
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type GetProjectsInput = z.infer<typeof getProjectsSchema>

// Enhanced form data type
export interface CreateProjectFormData {
  name: string
  description?: string
  projectNumber?: string
  status?: string
  priority?: string
  budget?: number
  startDate?: string
  endDate?: string
  estimatedHours?: number
  
  // Location form fields
  locationSearch?: string
  selectedLocation?: {
    address: string
    displayName: string
    coordinates?: { lat: number; lng: number }
    placeId?: string
  }
  
  // Client form fields
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  clientContactPerson?: string
  clientWebsite?: string
  clientNotes?: string
}

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