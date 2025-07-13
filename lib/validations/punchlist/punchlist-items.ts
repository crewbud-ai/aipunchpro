// ==============================================
// lib/validations/punchlist/punchlist-items.ts - UPDATED FOR MULTIPLE ASSIGNMENTS
// ==============================================

import { z } from 'zod'

// ==============================================
// ENUM CONSTANTS (UPDATED)
// ==============================================
export const ISSUE_TYPE = ['defect', 'incomplete', 'change_request', 'safety', 'quality', 'rework'] as const
export const PUNCHLIST_STATUS = ['open', 'assigned', 'in_progress', 'pending_review', 'completed', 'rejected', 'on_hold'] as const
export const PUNCHLIST_PRIORITY = ['low', 'medium', 'high', 'critical'] as const
export const TRADE_CATEGORY = ['general', 'electrical', 'plumbing', 'hvac', 'framing', 'drywall', 'flooring', 'painting', 'roofing', 'concrete', 'masonry', 'landscaping', 'cleanup'] as const
export const ASSIGNMENT_ROLE = ['primary', 'secondary', 'inspector', 'supervisor'] as const

// ==============================================
// ASSIGNMENT OBJECT SCHEMA
// ==============================================
const assignmentSchema = z.object({
  projectMemberId: z
    .string()
    .uuid('Invalid project member ID'),
  
  role: z
    .enum(ASSIGNMENT_ROLE)
    .default('primary'),
})

// ==============================================
// CREATE PUNCHLIST ITEM VALIDATION SCHEMA (UPDATED)
// ==============================================
const baseCreatePunchlistItemSchema = z.object({
  projectId: z
    .string()
    .uuid('Invalid project ID')
    .min(1, 'Project is required'),

  relatedScheduleProjectId: z
    .string()
    .uuid('Invalid schedule project ID')
    .optional(),

  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be less than 255 characters')
    .trim(),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),

  issueType: z
    .enum(ISSUE_TYPE, {
      errorMap: () => ({ message: 'Please select a valid issue type' })
    }),

  location: z
    .string()
    .max(255, 'Location must be less than 255 characters')
    .optional(),

  roomArea: z
    .string()
    .max(100, 'Room/area must be less than 100 characters')
    .optional(),

  // UPDATED: Multiple assignments with roles
  assignedMembers: z
    .array(assignmentSchema)
    .min(0, 'At least 0 team members can be assigned')
    .max(5, 'Cannot assign more than 5 team members')
    .default([])
    .optional(),

  tradeCategory: z
    .enum(TRADE_CATEGORY)
    .optional(),

  priority: z
    .enum(PUNCHLIST_PRIORITY, {
      errorMap: () => ({ message: 'Please select a valid priority' })
    }),

  status: z
    .enum(PUNCHLIST_STATUS)
    .default('open'),

  dueDate: z
    .string()
    .date('Invalid due date')
    .optional(),

  estimatedHours: z
    .number()
    .min(0.1, 'Estimated hours must be at least 0.1')
    .max(999.99, 'Estimated hours cannot exceed 999.99')
    .optional(),

  requiresInspection: z
    .boolean()
    .default(false),

  photos: z
    .array(z.string().url('Invalid photo URL'))
    .default([]),

  attachments: z
    .array(z.string().url('Invalid attachment URL'))
    .default([]),

  resolutionNotes: z
    .string()
    .max(1000, 'Resolution notes must be less than 1000 characters')
    .optional(),
})

export const createPunchlistItemSchema = baseCreatePunchlistItemSchema
  .refine(
    (data) => {
      // If due date is provided, it must be in the future
      if (data.dueDate) {
        const dueDate = new Date(data.dueDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return dueDate >= today
      }
      return true
    },
    {
      message: 'Due date must be today or in the future',
      path: ['dueDate'],
    }
  )
  .refine(
    (data) => {
      // Only one primary assignment allowed
      if (data.assignedMembers && data.assignedMembers.length > 0) {
        const primaryCount = data.assignedMembers.filter(a => a.role === 'primary').length
        return primaryCount <= 1
      }
      return true
    },
    {
      message: 'Only one primary assignee is allowed',
      path: ['assignedMembers'],
    }
  )
  .refine(
    (data) => {
      // No duplicate project member assignments
      if (data.assignedMembers && data.assignedMembers.length > 0) {
        const memberIds = data.assignedMembers.map(a => a.projectMemberId)
        const uniqueIds = new Set(memberIds)
        return uniqueIds.size === memberIds.length
      }
      return true
    },
    {
      message: 'Cannot assign the same team member multiple times',
      path: ['assignedMembers'],
    }
  )

// ==============================================
// UPDATE PUNCHLIST ITEM VALIDATION SCHEMA (UPDATED)
// ==============================================
export const updatePunchlistItemSchema = z.object({
  id: z
    .string()
    .uuid('Invalid punchlist item ID'),

  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be less than 255 characters')
    .trim()
    .optional(),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),

  issueType: z
    .enum(ISSUE_TYPE)
    .optional(),

  location: z
    .string()
    .max(255, 'Location must be less than 255 characters')
    .optional(),

  roomArea: z
    .string()
    .max(100, 'Room/area must be less than 100 characters')
    .optional(),

  // UPDATED: Multiple assignments for updates
  assignedMembers: z
    .array(assignmentSchema)
    .min(0, 'At least 0 team members can be assigned')
    .max(5, 'Cannot assign more than 5 team members')
    .optional(),

  tradeCategory: z
    .enum(TRADE_CATEGORY)
    .optional(),

  priority: z
    .enum(PUNCHLIST_PRIORITY)
    .optional(),

  status: z
    .enum(PUNCHLIST_STATUS)
    .optional(),

  dueDate: z
    .string()
    .date('Invalid due date')
    .optional(),

  estimatedHours: z
    .number()
    .min(0.1, 'Estimated hours must be at least 0.1')
    .max(999.99, 'Estimated hours cannot exceed 999.99')
    .optional(),

  actualHours: z
    .number()
    .min(0.1, 'Actual hours must be at least 0.1')
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

  requiresInspection: z
    .boolean()
    .optional(),

  inspectionPassed: z
    .boolean()
    .optional(),

  inspectionNotes: z
    .string()
    .max(1000, 'Inspection notes must be less than 1000 characters')
    .optional(),

  photos: z
    .array(z.string().url('Invalid photo URL'))
    .optional(),

  attachments: z
    .array(z.string().url('Invalid attachment URL'))
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
.refine(
  (data) => {
    // Only one primary assignment allowed in updates too
    if (data.assignedMembers && data.assignedMembers.length > 0) {
      const primaryCount = data.assignedMembers.filter(a => a.role === 'primary').length
      return primaryCount <= 1
    }
    return true
  },
  {
    message: 'Only one primary assignee is allowed',
    path: ['assignedMembers'],
  }
)
.refine(
  (data) => {
    // No duplicate project member assignments in updates
    if (data.assignedMembers && data.assignedMembers.length > 0) {
      const memberIds = data.assignedMembers.map(a => a.projectMemberId)
      const uniqueIds = new Set(memberIds)
      return uniqueIds.size === memberIds.length
    }
    return true
  },
  {
    message: 'Cannot assign the same team member multiple times',
    path: ['assignedMembers'],
  }
)

// ==============================================
// QUICK UPDATE STATUS SCHEMA (UNCHANGED)
// ==============================================
export const quickUpdatePunchlistStatusSchema = z.object({
  id: z
    .string()
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
// GET PUNCHLIST ITEMS SCHEMA (UPDATED)
// ==============================================
export const getPunchlistItemsSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20)
    .optional(),

  offset: z
    .number()
    .int()
    .min(0, 'Offset cannot be negative')
    .default(0)
    .optional(),

  sortBy: z
    .enum(['title', 'status', 'priority', 'issueType', 'dueDate', 'createdAt'])
    .default('createdAt')
    .optional(),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
    .optional(),

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

  // UPDATED: Filter by any assigned user ID
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
    .date('Invalid date')
    .optional(),

  dueDateTo: z
    .string()
    .date('Invalid date')
    .optional(),

  requiresInspection: z
    .boolean()
    .optional(),

  isOverdue: z
    .boolean()
    .optional(),

  search: z
    .string()
    .max(255, 'Search query too long')
    .optional(),
})

// ==============================================
// DATA TRANSFORMATION HELPERS (UPDATED)
// ==============================================
export function transformCreatePunchlistItemData(formData: any) {
  const apiData = {
    projectId: formData.projectId,
    relatedScheduleProjectId: formData.relatedScheduleProjectId || undefined,
    title: formData.title.trim(),
    description: formData.description?.trim(),
    issueType: formData.issueType,
    location: formData.location?.trim() || undefined,
    roomArea: formData.roomArea?.trim() || undefined,
    // UPDATED: Transform multiple assignments
    assignedMembers: formData.assignedMembers || [],
    tradeCategory: formData.tradeCategory || undefined,
    priority: formData.priority,
    status: formData.status || 'open',
    dueDate: formData.dueDate || undefined,
    estimatedHours: formData.estimatedHours || undefined,
    requiresInspection: formData.requiresInspection || false,
    photos: formData.photos || [],
    attachments: formData.attachments || [],
    resolutionNotes: formData.resolutionNotes?.trim() || undefined,
  }

  return apiData
}

// ==============================================
// ASSIGNMENT MANAGEMENT SCHEMAS
// ==============================================
export const addAssignmentSchema = z.object({
  punchlistItemId: z.string().uuid('Invalid punchlist item ID'),
  projectMemberId: z.string().uuid('Invalid project member ID'),
  role: z.enum(ASSIGNMENT_ROLE).default('primary'),
})

export const removeAssignmentSchema = z.object({
  punchlistItemId: z.string().uuid('Invalid punchlist item ID'),
  projectMemberId: z.string().uuid('Invalid project member ID'),
})

export const updateAssignmentRoleSchema = z.object({
  punchlistItemId: z.string().uuid('Invalid punchlist item ID'),
  projectMemberId: z.string().uuid('Invalid project member ID'),
  role: z.enum(ASSIGNMENT_ROLE),
})

// ==============================================
// TYPE EXPORTS (UPDATED)
// ==============================================
export type CreatePunchlistItemInput = z.infer<typeof createPunchlistItemSchema>
export type UpdatePunchlistItemInput = z.infer<typeof updatePunchlistItemSchema>
export type QuickUpdatePunchlistStatusInput = z.infer<typeof quickUpdatePunchlistStatusSchema>
export type GetPunchlistItemsInput = z.infer<typeof getPunchlistItemsSchema>
export type AddAssignmentInput = z.infer<typeof addAssignmentSchema>
export type RemoveAssignmentInput = z.infer<typeof removeAssignmentSchema>
export type UpdateAssignmentRoleInput = z.infer<typeof updateAssignmentRoleSchema>

// ==============================================
// VALIDATION HELPER FUNCTIONS (UPDATED)
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

export function validateAddAssignment(data: unknown) {
  return addAssignmentSchema.safeParse(data)
}

export function validateRemoveAssignment(data: unknown) {
  return removeAssignmentSchema.safeParse(data)
}

export function validateUpdateAssignmentRole(data: unknown) {
  return updateAssignmentRoleSchema.safeParse(data)
}

// ==============================================
// VALIDATION ERROR FORMATTER (UNCHANGED)
// ==============================================
export function formatPunchlistItemErrors(errors: z.ZodError) {
  return errors.errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
  }))
}