// ==============================================
// src/lib/validations/punchlist/punchlist-items.ts - Punchlist Items Validation Schemas
// ==============================================

import { z } from 'zod'

// ==============================================
// PUNCHLIST STATUS & PRIORITY ENUMS (From Schema)
// ==============================================
export const PUNCHLIST_STATUS = [
  'open',
  'assigned',
  'in_progress',
  'completed',
  'rejected'
] as const

export const PUNCHLIST_PRIORITY = [
  'low',
  'medium',
  'high', 
  'critical'
] as const

export const ISSUE_TYPE = [
  'defect',
  'incomplete',
  'change_request',
  'safety',
  'quality',
  'rework'
] as const

export const TRADE_CATEGORY = [
  'electrical',
  'plumbing',
  'framing',
  'drywall',
  'roofing',
  'concrete',
  'hvac',
  'general',
  'management',
  'safety',
  'cleanup'
] as const

// ==============================================
// BASE PUNCHLIST ITEM SCHEMA
// ==============================================
const basePunchlistItemSchema = z.object({
  // Required issue details
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),

  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),

  // Required project reference
  projectId: z
    .string()
    .min(1, 'Project is required')
    .uuid('Invalid project ID'),

  // Optional schedule project link
  relatedScheduleProjectId: z
    .string()
    .uuid('Invalid schedule project ID')
    .optional(),

  // Issue classification
  issueType: z
    .enum(ISSUE_TYPE, {
      errorMap: () => ({ message: 'Please select a valid issue type' })
    })
    .default('defect'),

  // Location & Context
  location: z
    .string()
    .max(500, 'Location must be less than 500 characters')
    .optional(),

  roomArea: z
    .string()
    .max(100, 'Room/Area must be less than 100 characters')
    .optional(),

  // Assignment (single project member)
  assignedProjectMemberId: z
    .string()
    .uuid('Invalid project member ID')
    .optional(),

  tradeCategory: z
    .enum(TRADE_CATEGORY, {
      errorMap: () => ({ message: 'Please select a valid trade category' })
    })
    .optional(),

  // Priority & Status
  priority: z
    .enum(PUNCHLIST_PRIORITY, {
      errorMap: () => ({ message: 'Please select a valid priority' })
    })
    .default('medium'),

  status: z
    .enum(PUNCHLIST_STATUS, {
      errorMap: () => ({ message: 'Please select a valid status' })
    })
    .default('open'),

  // Media & Documentation
  photos: z
    .array(z.string().url('Invalid photo URL'))
    .optional(),

  attachments: z
    .array(z.string().url('Invalid attachment URL'))
    .optional(),

  // Scheduling & Estimates
  dueDate: z
    .string()
    .date('Invalid due date')
    .optional(),

  estimatedHours: z
    .number()
    .min(0, 'Estimated hours cannot be negative')
    .max(999.99, 'Estimated hours cannot exceed 999.99')
    .optional(),

  actualHours: z
    .number()
    .min(0, 'Actual hours cannot be negative')
    .max(999.99, 'Actual hours cannot exceed 999.99')
    .default(0),

  // Resolution Details
  resolutionNotes: z
    .string()
    .max(1000, 'Resolution notes must be less than 1000 characters')
    .optional(),

  rejectionReason: z
    .string()
    .max(500, 'Rejection reason must be less than 500 characters')
    .optional(),

  // Quality Control
  requiresInspection: z
    .boolean()
    .default(false),

  inspectionPassed: z
    .boolean()
    .optional(),

  inspectionNotes: z
    .string()
    .max(1000, 'Inspection notes must be less than 1000 characters')
    .optional(),
})

// ==============================================
// CREATE PUNCHLIST ITEM SCHEMA (WITH REFINEMENTS)
// ==============================================
export const createPunchlistItemSchema = basePunchlistItemSchema
  .refine(
    (data) => {
      // If status is rejected, rejection reason is required
      if (data.status === 'rejected') {
        return data.rejectionReason && data.rejectionReason.trim().length > 0
      }
      return true
    },
    {
      message: 'Rejection reason is required when status is rejected',
      path: ['rejectionReason'],
    }
  )
  .refine(
    (data) => {
      // If status is completed, resolution notes should be provided
      if (data.status === 'completed') {
        return data.resolutionNotes && data.resolutionNotes.trim().length > 0
      }
      return true
    },
    {
      message: 'Resolution notes are recommended when marking as completed',
      path: ['resolutionNotes'],
    }
  )
  .refine(
    (data) => {
      // If requires inspection, inspection results should be provided when completed
      if (data.requiresInspection && data.status === 'completed') {
        return data.inspectionPassed !== undefined
      }
      return true
    },
    {
      message: 'Inspection result is required when completing items that require inspection',
      path: ['inspectionPassed'],
    }
  )
  .refine(
    (data) => {
      // Validate actual hours doesn't exceed estimated hours significantly (if both provided)
      if (data.estimatedHours && data.actualHours) {
        return data.actualHours <= data.estimatedHours * 2 // Allow 100% overrun
      }
      return true
    },
    {
      message: 'Actual hours significantly exceeds estimated hours',
      path: ['actualHours'],
    }
  )
  .refine(
    (data) => {
      // Due date should be in the future for new items
      if (data.dueDate) {
        const dueDate = new Date(data.dueDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time for date-only comparison
        return dueDate >= today
      }
      return true
    },
    {
      message: 'Due date should be today or in the future',
      path: ['dueDate'],
    }
  )

// ==============================================
// UPDATE PUNCHLIST ITEM SCHEMA (PARTIAL)
// ==============================================
export const updatePunchlistItemSchema = basePunchlistItemSchema
  .partial()
  .extend({
    id: z
      .string()
      .min(1, 'Punchlist item ID is required')
      .uuid('Invalid punchlist item ID'),
  })
  .refine(
    (data) => {
      // If status is rejected, rejection reason is required
      if (data.status === 'rejected') {
        return data.rejectionReason && data.rejectionReason.trim().length > 0
      }
      return true
    },
    {
      message: 'Rejection reason is required when status is rejected',
      path: ['rejectionReason'],
    }
  )
  .refine(
    (data) => {
      // If requires inspection and status is completed, inspection results required
      if (data.requiresInspection && data.status === 'completed') {
        return data.inspectionPassed !== undefined
      }
      return true
    },
    {
      message: 'Inspection result is required when completing items that require inspection',
      path: ['inspectionPassed'],
    }
  )

// ==============================================
// QUICK UPDATE STATUS SCHEMA
// ==============================================
export const quickUpdatePunchlistStatusSchema = z.object({
  id: z
    .string()
    .min(1, 'Punchlist item ID is required')
    .uuid('Invalid punchlist item ID'),

  status: z
    .enum(PUNCHLIST_STATUS, {
      errorMap: () => ({ message: 'Please select a valid status' })
    }),

  actualHours: z
    .number()
    .min(0, 'Actual hours cannot be negative')
    .max(999.99, 'Actual hours cannot exceed 999.99')
    .optional(),

  resolutionNotes: z
    .string()
    .max(1000, 'Resolution notes must be less than 1000 characters')
    .optional(),

  rejectionReason: z
    .string()
    .max(500, 'Rejection reason must be less than 500 characters')
    .optional(),

  inspectionPassed: z
    .boolean()
    .optional(),

  inspectionNotes: z
    .string()
    .max(1000, 'Inspection notes must be less than 1000 characters')
    .optional(),
})
.refine(
  (data) => {
    // If status is rejected, rejection reason is required
    if (data.status === 'rejected') {
      return data.rejectionReason && data.rejectionReason.trim().length > 0
    }
    return true
  },
  {
    message: 'Rejection reason is required when status is rejected',
    path: ['rejectionReason'],
  }
)

// ==============================================
// GET PUNCHLIST ITEMS SCHEMA (FILTERING & PAGINATION)
// ==============================================
export const getPunchlistItemsSchema = z.object({
  // Pagination
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),

  offset: z
    .number()
    .int()
    .min(0, 'Offset cannot be negative')
    .default(0),

  // Sorting
  sortBy: z
    .enum(['title', 'status', 'priority', 'issueType', 'dueDate', 'createdAt'])
    .default('createdAt'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),

  // Filtering
  projectId: z
    .string()
    .uuid('Invalid project ID')
    .optional(),

  relatedScheduleProjectId: z
    .string()
    .uuid('Invalid schedule project ID')
    .optional(),

  status: z
    .enum(PUNCHLIST_STATUS)
    .optional(),

  priority: z
    .enum(PUNCHLIST_PRIORITY)
    .optional(),

  issueType: z
    .enum(ISSUE_TYPE)
    .optional(),

  tradeCategory: z
    .enum(TRADE_CATEGORY)
    .optional(),

  assignedToUserId: z
    .string()
    .uuid('Invalid user ID')
    .optional(),

  reportedBy: z
    .string()
    .uuid('Invalid user ID')
    .optional(),

  dueDateFrom: z
    .string()
    .date('Invalid due date from')
    .optional(),

  dueDateTo: z
    .string()
    .date('Invalid due date to')
    .optional(),

  requiresInspection: z
    .boolean()
    .optional(),

  isOverdue: z
    .boolean()
    .optional(),

  // Search
  search: z
    .string()
    .max(255, 'Search term too long')
    .optional(),
})

// ==============================================
// DATA TRANSFORMATION HELPERS
// ==============================================
export function transformCreatePunchlistItemData(formData: CreatePunchlistItemFormData) {
  const apiData = {
    title: formData.title.trim(),
    description: formData.description?.trim(),
    projectId: formData.projectId,
    relatedScheduleProjectId: formData.relatedScheduleProjectId || null,
    issueType: formData.issueType || 'defect',
    location: formData.location?.trim() || null,
    roomArea: formData.roomArea?.trim() || null,
    assignedProjectMemberId: formData.assignedProjectMemberId || null,
    tradeCategory: formData.tradeCategory || null,
    priority: formData.priority || 'medium',
    status: formData.status || 'open',
    photos: formData.photos || [],
    attachments: formData.attachments || [],
    dueDate: formData.dueDate || null,
    estimatedHours: formData.estimatedHours || null,
    resolutionNotes: formData.resolutionNotes?.trim() || null,
    rejectionReason: formData.rejectionReason?.trim() || null,
    requiresInspection: formData.requiresInspection || false,
    inspectionPassed: formData.inspectionPassed || null,
    inspectionNotes: formData.inspectionNotes?.trim() || null,
  }

  return apiData
}

// ==============================================
// TYPE EXPORTS
// ==============================================
export type CreatePunchlistItemInput = z.infer<typeof createPunchlistItemSchema>
export type UpdatePunchlistItemInput = z.infer<typeof updatePunchlistItemSchema>
export type QuickUpdatePunchlistStatusInput = z.infer<typeof quickUpdatePunchlistStatusSchema>
export type GetPunchlistItemsInput = z.infer<typeof getPunchlistItemsSchema>

// Enhanced form data type
export interface CreatePunchlistItemFormData {
  title: string
  description?: string
  projectId: string
  relatedScheduleProjectId?: string
  issueType?: typeof ISSUE_TYPE[number]
  location?: string
  roomArea?: string
  assignedProjectMemberId?: string
  tradeCategory?: typeof TRADE_CATEGORY[number]
  priority?: typeof PUNCHLIST_PRIORITY[number]
  status?: typeof PUNCHLIST_STATUS[number]
  photos?: string[]
  attachments?: string[]
  dueDate?: string
  estimatedHours?: number
  resolutionNotes?: string
  rejectionReason?: string
  requiresInspection?: boolean
  inspectionPassed?: boolean
  inspectionNotes?: string
}

// ==============================================
// VALIDATION HELPER FUNCTIONS
// ==============================================
export function validateCreatePunchlistItem(data: unknown) {
  return createPunchlistItemSchema.safeParse(data)
}

export function validateUpdatePunchlistItem(data: unknown) {
  return updatePunchlistItemSchema.safeParse(data)
}

export function validateQuickUpdatePunchlistStatus(data: unknown) {
  return quickUpdatePunchlistStatusSchema.safeParse(data)
}

export function validateGetPunchlistItems(data: unknown) {
  return getPunchlistItemsSchema.safeParse(data)
}

// ==============================================
// VALIDATION ERROR FORMATTER
// ==============================================
export function formatPunchlistItemErrors(errors: z.ZodError) {
  return errors.errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
  }))
}