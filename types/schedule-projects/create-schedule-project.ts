// ==============================================
// types/schedule-projects/create-schedule-project.ts - Create Schedule Project Types
// ==============================================

import { z } from 'zod'
import type { ScheduleProject } from './schedule-project'

// ==============================================
// CREATE SCHEDULE PROJECT INTERFACES
// ==============================================
export interface CreateScheduleProjectData {
  projectId: string
  title: string
  description?: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  assignedProjectMemberIds: string[]
  tradeRequired?: ScheduleProject['tradeRequired']
  status?: ScheduleProject['status']
  priority?: ScheduleProject['priority']
  estimatedHours?: number
  dependsOn?: string[]
  location?: string
  notes?: string
}

export interface CreateScheduleProjectResult {
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
// CREATE SCHEDULE PROJECT STATE
// ==============================================
export type CreateScheduleProjectState = 
  | 'idle'           // Initial state
  | 'loading'        // Creating schedule project
  | 'success'        // Schedule project created
  | 'error'          // Creation failed

// ==============================================
// FORM DATA INTERFACE (for frontend forms)
// ==============================================
export interface CreateScheduleProjectFormData {
  // Step 1: Work Information
  title: string
  description: string
  projectId: string
  tradeRequired: ScheduleProject['tradeRequired'] | ''

  // Step 2: Timing
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  estimatedHours?: number

  // Step 3: Assignment & Details
  assignedProjectMemberIds: string[]
  priority: ScheduleProject['priority']
  status: ScheduleProject['status']
  location: string
  notes: string
  dependsOn: string[]

  // UI state helpers
  currentStep: number
  completedSteps: number[]
  hasUnsavedChanges?: boolean
  modifiedFields?: Set<string>
}

// ==============================================
// VALIDATION SCHEMAS
// ==============================================

// Trade options
export const TRADE_REQUIRED = [
  'electrical',
  'plumbing',
  'framing',
  'drywall',
  'roofing',
  'concrete',
  'hvac',
  'general',
  'management',
  'safety'
] as const

// Status options  
export const SCHEDULE_STATUS = [
  'planned',
  'in_progress',
  'completed',
  'delayed',
  'cancelled'
] as const

// Priority options
export const SCHEDULE_PRIORITY = [
  'low',
  'medium',
  'high',
  'critical'
] as const

// Base schema for schedule project creation
const baseCreateScheduleProjectSchema = z.object({
  // Required work details
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),

  // Required project reference
  projectId: z
    .string()
    .min(1, 'Project is required')
    .uuid('Invalid project ID'),

  // Required timing
  startDate: z
    .string()
    .min(1, 'Start date is required'),

  endDate: z
    .string()
    .min(1, 'End date is required'),

  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format')
    .optional(),

  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format')
    .optional(),

  // Required assignment
  assignedProjectMemberIds: z
    .array(z.string().uuid('Invalid project member ID'))
    .min(1, 'At least one team member must be assigned')
    .max(10, 'Cannot assign more than 10 team members'),

  tradeRequired: z
    .enum(TRADE_REQUIRED, {
      errorMap: () => ({ message: 'Please select a valid trade' })
    })
    .optional(),

  // Status & Priority
  status: z
    .enum(SCHEDULE_STATUS, {
      errorMap: () => ({ message: 'Please select a valid status' })
    })
    .default('planned'),

  priority: z
    .enum(SCHEDULE_PRIORITY, {
      errorMap: () => ({ message: 'Please select a valid priority' })
    })
    .default('medium'),

  // Work estimates
  estimatedHours: z
    .number()
    .min(0, 'Estimated hours cannot be negative')
    .max(999.99, 'Estimated hours cannot exceed 999.99')
    .optional(),

  // Dependencies
  dependsOn: z
    .array(z.string().uuid('Invalid dependency ID'))
    .optional(),

  // Location & Details
  location: z
    .string()
    .max(500, 'Location must be less than 500 characters')
    .optional(),

  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
})

// Create schedule project schema with refinements
export const createScheduleProjectSchema = baseCreateScheduleProjectSchema
  .refine(
    (data) => {
      // Validate end date is after start date
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)
      return endDate >= startDate
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

// ==============================================
// VALIDATION FUNCTIONS
// ==============================================
export function validateCreateScheduleProject(data: unknown) {
  return createScheduleProjectSchema.safeParse(data)
}

// ==============================================
// HELPER FUNCTIONS FOR FORM DATA
// ==============================================
export function getDefaultCreateScheduleProjectFormData(): CreateScheduleProjectFormData {
  return {
    // Step 1: Work Information
    title: '',
    description: '',
    projectId: '',
    tradeRequired: '',

    // Step 2: Timing
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    estimatedHours: undefined,

    // Step 3: Assignment & Details
    assignedProjectMemberIds: [],
    priority: 'medium',
    status: 'planned',
    location: '',
    notes: '',
    dependsOn: [],

    // UI state
    currentStep: 1,
    completedSteps: [],
  }
}

// ==============================================
// FORM STEP CONFIGURATION
// ==============================================
export interface CreateScheduleProjectFormStep {
  id: number
  title: string
  description: string
  fields: (keyof CreateScheduleProjectFormData)[]
  isOptional?: boolean
  validation?: (data: CreateScheduleProjectFormData) => boolean
}

export const CREATE_SCHEDULE_PROJECT_FORM_STEPS: CreateScheduleProjectFormStep[] = [
  {
    id: 1,
    title: 'Work Information',
    description: 'Enter the basic details about the scheduled work',
    fields: ['title', 'description', 'projectId', 'tradeRequired'],
    validation: (data) => Boolean(data.title.trim() && data.projectId)
  },
  {
    id: 2,
    title: 'Timing & Duration',
    description: 'Set the schedule dates, times, and estimated hours',
    fields: ['startDate', 'endDate', 'startTime', 'endTime', 'estimatedHours'],
    validation: (data) => Boolean(data.startDate && data.endDate)
  },
  {
    id: 3,
    title: 'Assignment & Details',
    description: 'Assign team members and add additional details',
    fields: ['assignedProjectMemberIds', 'priority', 'status', 'location', 'notes', 'dependsOn'],
    validation: (data) => data.assignedProjectMemberIds.length > 0
  }
]

// ==============================================
// DATA TRANSFORMATION FUNCTIONS
// ==============================================
export function transformCreateFormDataToApiData(
  formData: CreateScheduleProjectFormData
): CreateScheduleProjectData {
  return {
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
    estimatedHours: formData.estimatedHours,
    dependsOn: formData.dependsOn.length > 0 ? formData.dependsOn : undefined,
    location: formData.location.trim() || undefined,
    notes: formData.notes.trim() || undefined,
  }
}