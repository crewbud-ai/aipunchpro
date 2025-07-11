// ==============================================
// types/schedule-projects/update-schedule-project.ts - Update Schedule Project Types
// ==============================================

import { z } from 'zod'
import type { ScheduleProject } from './schedule-project'
import { TRADE_REQUIRED, SCHEDULE_STATUS, SCHEDULE_PRIORITY } from './create-schedule-project'

// ==============================================
// UPDATE SCHEDULE PROJECT INTERFACES
// ==============================================
export interface UpdateScheduleProjectData {
  id: string
  projectId?: string
  title?: string
  description?: string
  startDate?: string
  endDate?: string
  startTime?: string
  endTime?: string
  assignedProjectMemberIds?: string[]
  tradeRequired?: ScheduleProject['tradeRequired']
  status?: ScheduleProject['status']
  priority?: ScheduleProject['priority']
  progressPercentage?: number
  estimatedHours?: number
  actualHours?: number
  dependsOn?: string[]
  location?: string
  notes?: string
}

export interface UpdateScheduleProjectResult {
  success: boolean
  message: string
  data: {
    scheduleProject: ScheduleProject
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// QUICK UPDATE STATUS INTERFACES
// ==============================================
export interface QuickUpdateScheduleStatusData {
  id: string
  status: ScheduleProject['status']
  progressPercentage?: number
  actualHours?: number
  notes?: string
}

export interface QuickUpdateScheduleStatusResult {
  success: boolean
  message: string
  data: {
    scheduleProject: ScheduleProject
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// UPDATE SCHEDULE PROJECT STATE
// ==============================================
export type UpdateScheduleProjectState =
  | 'idle'           // Initial state
  | 'loading'        // Updating schedule project
  | 'success'        // Schedule project updated
  | 'error'          // Update failed

// ==============================================
// FORM DATA INTERFACE (for frontend forms)
// ==============================================
export interface UpdateScheduleProjectFormData {
  id: string

  // Work Information
  title: string
  description: string
  projectId: string
  tradeRequired: ScheduleProject['tradeRequired'] | ''

  // Timing
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  estimatedHours?: number
  actualHours: number

  // Assignment & Details
  assignedProjectMemberIds: string[]
  priority: ScheduleProject['priority']
  status: ScheduleProject['status']
  progressPercentage: number
  location: string
  notes: string
  dependsOn: string[]

  // UI state helpers
  hasUnsavedChanges?: boolean
  modifiedFields?: Set<string>
  currentStep?: number
  completedSteps?: number[]
}

// ==============================================
// VALIDATION SCHEMAS
// ==============================================

// Update schedule project schema (all fields optional except id)
export const updateScheduleProjectSchema = z.object({
  id: z
    .string()
    .min(1, 'Schedule project ID is required')
    .uuid('Invalid schedule project ID'),

  projectId: z
    .string()
    .uuid('Invalid project ID')
    .optional(),

  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim()
    .optional(),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),

  startDate: z
    .string()
    .min(1, 'Start date is required')
    .optional(),

  endDate: z
    .string()
    .min(1, 'End date is required')
    .optional(),

  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format')
    .optional(),

  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format')
    .optional(),

  assignedProjectMemberIds: z
    .array(z.string().uuid('Invalid project member ID'))
    .min(1, 'At least one team member must be assigned')
    .max(10, 'Cannot assign more than 10 team members')
    .optional(),

  tradeRequired: z
    .enum(TRADE_REQUIRED, {
      errorMap: () => ({ message: 'Please select a valid trade' })
    })
    .optional(),

  status: z
    .enum(SCHEDULE_STATUS, {
      errorMap: () => ({ message: 'Please select a valid status' })
    })
    .optional(),

  priority: z
    .enum(SCHEDULE_PRIORITY, {
      errorMap: () => ({ message: 'Please select a valid priority' })
    })
    .optional(),

  progressPercentage: z
    .number()
    .min(0, 'Progress cannot be negative')
    .max(100, 'Progress cannot exceed 100%')
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
    .optional(),

  dependsOn: z
    .array(z.string().uuid('Invalid dependency ID'))
    .optional(),

  location: z
    .string()
    .max(500, 'Location must be less than 500 characters')
    .optional(),

  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
})
.refine(
  (data) => {
    // If both dates are provided, validate end date is after start date
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)
      return endDate >= startDate
    }
    return true
  },
  {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  }
)
.refine(
  (data) => {
    // If both times are provided and it's the same day, end time must be after start time
    if (data.startTime && data.endTime && data.startDate === data.endDate) {
      return data.endTime > data.startTime
    }
    return true
  },
  {
    message: 'End time must be after start time for same-day work',
    path: ['endTime'],
  }
)

// Quick status update schema
export const quickUpdateScheduleStatusSchema = z.object({
  id: z
    .string()
    .min(1, 'Schedule project ID is required')
    .uuid('Invalid schedule project ID'),

  status: z
    .enum(SCHEDULE_STATUS, {
      errorMap: () => ({ message: 'Please select a valid status' })
    }),

  progressPercentage: z
    .number()
    .min(0, 'Progress cannot be negative')
    .max(100, 'Progress cannot exceed 100%')
    .optional(),

  actualHours: z
    .number()
    .min(0, 'Actual hours cannot be negative')
    .max(999.99, 'Actual hours cannot exceed 999.99')
    .optional(),

  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
})

// ==============================================
// VALIDATION FUNCTIONS
// ==============================================
export function validateUpdateScheduleProject(data: unknown) {
  return updateScheduleProjectSchema.safeParse(data)
}

export function validateQuickUpdateScheduleStatus(data: unknown) {
  return quickUpdateScheduleStatusSchema.safeParse(data)
}

// ==============================================
// FILTERS VALIDATION (for query parameters)
// ==============================================
export const scheduleProjectFiltersSchema = z.object({
  projectId: z
    .string()
    .uuid('Invalid project ID')
    .optional(),

  status: z
    .enum(SCHEDULE_STATUS)
    .optional(),

  priority: z
    .enum(SCHEDULE_PRIORITY)
    .optional(),

  tradeRequired: z
    .enum(TRADE_REQUIRED)
    .optional(),

  assignedToUserId: z
    .string()
    .uuid('Invalid user ID')
    .optional(),

  startDateFrom: z
    .string()
    .optional(),

  startDateTo: z
    .string()
    .optional(),

  search: z
    .string()
    .max(100, 'Search term must be less than 100 characters')
    .optional(),

  sortBy: z
    .enum(['title', 'startDate', 'endDate', 'status', 'priority', 'createdAt'])
    .default('startDate'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('asc'),

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
})

export function validateScheduleProjectFilters(data: unknown) {
  return scheduleProjectFiltersSchema.safeParse(data)
}

// ==============================================
// DATA TRANSFORMATION FUNCTIONS
// ==============================================
export function transformUpdateFormDataToApiData(
  formData: UpdateScheduleProjectFormData
): UpdateScheduleProjectData {
  return {
    id: formData.id,
    projectId: formData.projectId,
    title: formData.title.trim(),
    description: formData.description.trim() || undefined,
    startDate: formData.startDate,
    endDate: formData.endDate,
    startTime: formData.startTime || undefined,
    endTime: formData.endTime || undefined,
    assignedProjectMemberIds: formData.assignedProjectMemberIds,
    tradeRequired: formData.tradeRequired || undefined,
    status: formData.status,
    priority: formData.priority,
    progressPercentage: formData.progressPercentage,
    estimatedHours: formData.estimatedHours,
    actualHours: formData.actualHours,
    dependsOn: formData.dependsOn.length > 0 ? formData.dependsOn : undefined,
    location: formData.location.trim() || undefined,
    notes: formData.notes.trim() || undefined,
  }
}

export function scheduleProjectToUpdateFormData(
  scheduleProject: ScheduleProject
): UpdateScheduleProjectFormData {
  return {
    id: scheduleProject.id,
    title: scheduleProject.title,
    description: scheduleProject.description || '',
    projectId: scheduleProject.projectId,
    tradeRequired: scheduleProject.tradeRequired || '',
    startDate: scheduleProject.startDate,
    endDate: scheduleProject.endDate,
    startTime: scheduleProject.startTime || '',
    endTime: scheduleProject.endTime || '',
    estimatedHours: scheduleProject.estimatedHours,
    actualHours: scheduleProject.actualHours,
    assignedProjectMemberIds: scheduleProject.assignedProjectMemberIds,
    priority: scheduleProject.priority,
    status: scheduleProject.status,
    progressPercentage: scheduleProject.progressPercentage,
    location: scheduleProject.location || '',
    notes: scheduleProject.notes || '',
    dependsOn: scheduleProject.dependsOn || [],
  }
}

// ==============================================
// FORM STEP CONFIGURATION (for edit forms)
// ==============================================
export interface UpdateScheduleProjectFormStep {
  id: number
  title: string
  description: string
  fields: (keyof UpdateScheduleProjectFormData)[]
  isOptional?: boolean
  validation?: (data: UpdateScheduleProjectFormData) => boolean
}

export const UPDATE_SCHEDULE_PROJECT_FORM_STEPS: UpdateScheduleProjectFormStep[] = [
  {
    id: 1,
    title: 'Work Information',
    description: 'Update the basic details about the scheduled work',
    fields: ['title', 'description', 'projectId', 'tradeRequired'],
    validation: (data) => Boolean(data.title.trim() && data.projectId)
  },
  {
    id: 2,
    title: 'Timing & Duration',
    description: 'Update the schedule dates, times, and estimated hours',
    fields: ['startDate', 'endDate', 'startTime', 'endTime', 'estimatedHours', 'actualHours'],
    validation: (data) => Boolean(data.startDate && data.endDate)
  },
  {
    id: 3,
    title: 'Assignment & Details',
    description: 'Update team assignments and additional details',
    fields: ['assignedProjectMemberIds', 'priority', 'status', 'progressPercentage', 'location', 'notes', 'dependsOn'],
    validation: (data) => data.assignedProjectMemberIds.length > 0
  }
]

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

// Check if form data has been modified
export function hasFormChanges(
  currentData: UpdateScheduleProjectFormData,
  originalData: ScheduleProject
): boolean {
  const original = scheduleProjectToUpdateFormData(originalData)
  
  // Compare all relevant fields
  return (
    currentData.title !== original.title ||
    currentData.description !== original.description ||
    currentData.projectId !== original.projectId ||
    currentData.tradeRequired !== original.tradeRequired ||
    currentData.startDate !== original.startDate ||
    currentData.endDate !== original.endDate ||
    currentData.startTime !== original.startTime ||
    currentData.endTime !== original.endTime ||
    currentData.estimatedHours !== original.estimatedHours ||
    currentData.actualHours !== original.actualHours ||
    JSON.stringify(currentData.assignedProjectMemberIds.sort()) !== JSON.stringify(original.assignedProjectMemberIds.sort()) ||
    currentData.priority !== original.priority ||
    currentData.status !== original.status ||
    currentData.progressPercentage !== original.progressPercentage ||
    currentData.location !== original.location ||
    currentData.notes !== original.notes ||
    JSON.stringify(currentData.dependsOn.sort()) !== JSON.stringify(original.dependsOn.sort())
  )
}