// ==============================================
// src/lib/validations/schedule/schedule-projects.ts - Schedule Projects Validation Schemas
// ==============================================

import { z } from 'zod'

// ==============================================
// SCHEDULE STATUS & PRIORITY ENUMS (From Schema)
// ==============================================
export const SCHEDULE_STATUS = [
    'planned',
    'in_progress',
    'completed',
    'delayed',
    'cancelled'
] as const

export const SCHEDULE_PRIORITY = [
    'low',
    'medium',
    'high',
    'critical'
] as const

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

// ==============================================
// BASE SCHEDULE PROJECT SCHEMA
// ==============================================
const baseScheduleProjectSchema = z.object({
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
        .date('Invalid start date'),

    endDate: z
        .string()
        .date('Invalid end date'),

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

    progressPercentage: z
        .number()
        .min(0, 'Progress cannot be negative')
        .max(100, 'Progress cannot exceed 100%')
        .default(0),

    // Work estimates
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

// ==============================================
// CREATE SCHEDULE PROJECT SCHEMA (WITH REFINEMENTS)
// ==============================================
export const createScheduleProjectSchema = baseScheduleProjectSchema
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
            // Validate end time is after start time (if both provided and same date)
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
    .refine(
        (data) => {
            // Validate actual hours doesn't exceed estimated hours (if both provided)
            if (data.estimatedHours && data.actualHours) {
                return data.actualHours <= data.estimatedHours * 1.5 // Allow 50% overrun
            }
            return true
        },
        {
            message: 'Actual hours significantly exceeds estimated hours',
            path: ['actualHours'],
        }
    )

// ==============================================
// UPDATE SCHEDULE PROJECT SCHEMA (PARTIAL)
// ==============================================
export const updateScheduleProjectSchema = baseScheduleProjectSchema
    .partial()
    .extend({
        id: z
            .string()
            .min(1, 'Schedule ID is required')
            .uuid('Invalid schedule ID'),
    })
    .refine(
        (data) => {
            // Validate end date is after start date (if both provided)
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
            // Validate end time is after start time (if all provided and same date)
            if (data.startTime && data.endTime && data.startDate && data.endDate && data.startDate === data.endDate) {
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
// QUICK UPDATE STATUS SCHEMA
// ==============================================
export const quickUpdateScheduleStatusSchema = z.object({
    id: z
        .string()
        .min(1, 'Schedule ID is required')
        .uuid('Invalid schedule ID'),

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
// GET SCHEDULE PROJECTS SCHEMA (FILTERING & PAGINATION)
// ==============================================
export const getScheduleProjectsSchema = z.object({
    // Pagination
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

    // Sorting
    sortBy: z
        .enum(['title', 'startDate', 'endDate', 'status', 'priority', 'createdAt'])
        .default('startDate')
        .optional(),

    sortOrder: z
        .enum(['asc', 'desc'])
        .default('asc')
        .optional(),

    // Filtering
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
        .date('Invalid start date')
        .optional(),

    startDateTo: z
        .string()
        .date('Invalid end date')
        .optional(),

    search: z
        .string()
        .max(255, 'Search query too long')
        .optional(),
})

// ==============================================
// DATA TRANSFORMATION HELPERS (Like team-member.ts)
// ==============================================
export function transformCreateScheduleProjectData(formData: CreateScheduleProjectFormData) {
    const apiData = {
        title: formData.title.trim(),
        description: formData.description?.trim(),
        projectId: formData.projectId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        assignedProjectMemberIds: formData.assignedProjectMemberIds,
        tradeRequired: formData.tradeRequired || null,
        status: formData.status || 'planned',
        priority: formData.priority || 'medium',
        estimatedHours: formData.estimatedHours || null,
        location: formData.location?.trim() || null,
        notes: formData.notes?.trim() || null,
        dependsOn: formData.dependsOn || [],
    }

    return apiData
}

// ==============================================
// TYPE EXPORTS
// ==============================================
export type CreateScheduleProjectInput = z.infer<typeof createScheduleProjectSchema>
export type UpdateScheduleProjectInput = z.infer<typeof updateScheduleProjectSchema>
export type QuickUpdateScheduleStatusInput = z.infer<typeof quickUpdateScheduleStatusSchema>
export type GetScheduleProjectsInput = z.infer<typeof getScheduleProjectsSchema>

// Enhanced form data type (like team-member.ts)
export interface CreateScheduleProjectFormData {
    title: string
    description?: string
    projectId: string
    startDate: string
    endDate: string
    startTime?: string
    endTime?: string
    assignedProjectMemberIds: string[]
    tradeRequired?: typeof TRADE_REQUIRED[number]
    status?: typeof SCHEDULE_STATUS[number]
    priority?: typeof SCHEDULE_PRIORITY[number]
    estimatedHours?: number
    location?: string
    notes?: string
    dependsOn?: string[]
}

// ==============================================
// VALIDATION HELPER FUNCTIONS (Like team-member.ts)
// ==============================================
export function validateCreateScheduleProject(data: unknown) {
    return createScheduleProjectSchema.safeParse(data)
}

export function validateUpdateScheduleProject(data: unknown) {
    return updateScheduleProjectSchema.safeParse(data)
}

export function validateQuickUpdateScheduleStatus(data: unknown) {
    return quickUpdateScheduleStatusSchema.safeParse(data)
}

export function validateGetScheduleProjects(data: unknown) {
    return getScheduleProjectsSchema.safeParse(data)
}

// ==============================================
// VALIDATION ERROR FORMATTER (Like team-member.ts)
// ==============================================
export function formatScheduleProjectErrors(errors: z.ZodError) {
    return errors.errors.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
    }))
}