// ==============================================
// lib/validations/time-tracking/time-entries.ts - Time Entry Validation Schemas
// ==============================================

import { z } from 'zod'

// ==============================================
// CONSTANTS
// ==============================================
const TIME_ENTRY_STATUS_VALUES = ['clocked_in', 'clocked_out', 'pending', 'approved', 'rejected', 'modified'] as const
const WORK_TYPE_VALUES = ['installation', 'repair', 'cleanup', 'inspection', 'maintenance', 'setup', 'demolition', 'general'] as const
const TRADE_TYPE_VALUES = ['electrical', 'plumbing', 'hvac', 'framing', 'drywall', 'flooring', 'painting', 'roofing', 'concrete', 'masonry', 'landscaping', 'general'] as const

// ==============================================
// COMMON FIELD SCHEMAS
// ==============================================
const uuidSchema = z.string().uuid('Invalid ID format')
const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
}).optional()

// ==============================================
// CLOCK IN VALIDATION SCHEMA
// ==============================================
export const clockInSchema = z.object({
  projectId: uuidSchema,
  scheduleProjectId: uuidSchema.optional(),
  workType: z.enum(WORK_TYPE_VALUES).optional(),
  trade: z.enum(TRADE_TYPE_VALUES).optional(),
  description: z.string().max(500, 'Description too long').optional(),
  location: locationSchema
})

// ==============================================
// CLOCK OUT VALIDATION SCHEMA
// ==============================================
export const clockOutSchema = z.object({
  description: z.string().max(500, 'Description too long').optional(),
  workCompleted: z.string().max(1000, 'Work completed description too long').optional(),
  issuesEncountered: z.string().max(1000, 'Issues description too long').optional(),
  location: locationSchema
})

// ==============================================
// CREATE TIME ENTRY VALIDATION SCHEMA
// ==============================================
export const createTimeEntrySchema = z.object({
  projectId: uuidSchema,
  scheduleProjectId: uuidSchema.optional(),
  
  // Time details
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema.optional(),
  breakMinutes: z.number().min(0).max(480).default(0), // Max 8 hours of breaks
  
  // Work context
  workType: z.enum(WORK_TYPE_VALUES).optional(),
  trade: z.enum(TRADE_TYPE_VALUES).optional(),
  description: z.string().max(500, 'Description too long').optional(),
  
  // Location
  clockInLocation: locationSchema,
  clockOutLocation: locationSchema,
  workLocation: z.string().max(255, 'Work location too long').optional(),
  
  // Additional details
  equipmentUsed: z.array(z.string().max(100)).max(20, 'Too many equipment items').optional(),
  materialsUsed: z.array(z.string().max(100)).max(20, 'Too many material items').optional(),
  weatherConditions: z.string().max(100, 'Weather description too long').optional(),
  temperatureF: z.number().min(-50).max(150).optional(),
  workConditions: z.string().max(500, 'Work conditions description too long').optional(),
  
  // Safety & quality
  safetyIncidents: z.string().max(1000, 'Safety incidents description too long').optional(),
  ppe: z.array(z.string().max(50)).max(15, 'Too many PPE items').optional(),
  workCompleted: z.string().max(1000, 'Work completed description too long').optional(),
  issuesEncountered: z.string().max(1000, 'Issues description too long').optional(),
  nextSteps: z.string().max(500, 'Next steps description too long').optional(),
  qualityRating: z.number().min(1).max(5).optional()
}).refine((data) => {
  // If endTime is provided, it should be after startTime
  if (data.endTime && data.startTime) {
    const start = new Date(`1970-01-01T${data.startTime}`)
    const end = new Date(`1970-01-01T${data.endTime}`)
    return end > start
  }
  return true
}, {
  message: 'End time must be after start time',
  path: ['endTime']
})

// ==============================================
// UPDATE TIME ENTRY VALIDATION SCHEMA
// ==============================================
export const updateTimeEntrySchema = z.object({
  id: uuidSchema,
  
  // Time details (all optional for updates)
  date: dateSchema.optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  breakMinutes: z.number().min(0).max(480).optional(),
  
  // Work context
  workType: z.enum(WORK_TYPE_VALUES).optional(),
  trade: z.enum(TRADE_TYPE_VALUES).optional(),
  description: z.string().max(500, 'Description too long').optional(),
  
  // Location
  clockInLocation: locationSchema,
  clockOutLocation: locationSchema,
  workLocation: z.string().max(255, 'Work location too long').optional(),
  
  // Status (for approval workflow)
  status: z.enum(TIME_ENTRY_STATUS_VALUES).optional(),
  rejectionReason: z.string().max(500, 'Rejection reason too long').optional(),
  
  // Additional details
  equipmentUsed: z.array(z.string().max(100)).max(20, 'Too many equipment items').optional(),
  materialsUsed: z.array(z.string().max(100)).max(20, 'Too many material items').optional(),
  weatherConditions: z.string().max(100, 'Weather description too long').optional(),
  temperatureF: z.number().min(-50).max(150).optional(),
  workConditions: z.string().max(500, 'Work conditions description too long').optional(),
  
  // Safety & quality
  safetyIncidents: z.string().max(1000, 'Safety incidents description too long').optional(),
  ppe: z.array(z.string().max(50)).max(15, 'Too many PPE items').optional(),
  workCompleted: z.string().max(1000, 'Work completed description too long').optional(),
  issuesEncountered: z.string().max(1000, 'Issues description too long').optional(),
  nextSteps: z.string().max(500, 'Next steps description too long').optional(),
  qualityRating: z.number().min(1).max(5).optional()
}).refine((data) => {
  // If both times are provided, endTime should be after startTime
  if (data.endTime && data.startTime) {
    const start = new Date(`1970-01-01T${data.startTime}`)
    const end = new Date(`1970-01-01T${data.endTime}`)
    return end > start
  }
  return true
}, {
  message: 'End time must be after start time',
  path: ['endTime']
})

// ==============================================
// QUICK STATUS UPDATE VALIDATION SCHEMA
// ==============================================
export const quickUpdateTimeEntryStatusSchema = z.object({
  id: uuidSchema,
  status: z.enum(TIME_ENTRY_STATUS_VALUES),
  rejectionReason: z.string().max(500, 'Rejection reason too long').optional()
}).refine((data) => {
  // If status is rejected, rejection reason is required
  if (data.status === 'rejected') {
    return data.rejectionReason && data.rejectionReason.trim().length > 0
  }
  return true
}, {
  message: 'Rejection reason is required when rejecting a time entry',
  path: ['rejectionReason']
})

// ==============================================
// GET TIME ENTRIES VALIDATION SCHEMA
// ==============================================
export const getTimeEntriesSchema = z.object({
  userId: uuidSchema.optional(),
  projectId: uuidSchema.optional(),
  scheduleProjectId: uuidSchema.optional(),
  status: z.enum(TIME_ENTRY_STATUS_VALUES).optional(),
  workType: z.enum(WORK_TYPE_VALUES).optional(),
  trade: z.enum(TRADE_TYPE_VALUES).optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  search: z.string().max(100, 'Search term too long').optional(),
  needsApproval: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['date', 'startTime', 'totalHours', 'status', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
}).refine((data) => {
  // If dateTo is provided, it should be after or equal to dateFrom
  if (data.dateFrom && data.dateTo) {
    return new Date(data.dateTo) >= new Date(data.dateFrom)
  }
  return true
}, {
  message: 'End date must be after or equal to start date',
  path: ['dateTo']
})

// ==============================================
// VALIDATION FUNCTIONS
// ==============================================
export function validateClockIn(data: unknown) {
  return clockInSchema.safeParse(data)
}

export function validateClockOut(data: unknown) {
  return clockOutSchema.safeParse(data)
}

export function validateCreateTimeEntry(data: unknown) {
  return createTimeEntrySchema.safeParse(data)
}

export function validateUpdateTimeEntry(data: unknown) {
  return updateTimeEntrySchema.safeParse(data)
}

export function validateQuickUpdateTimeEntryStatus(data: unknown) {
  return quickUpdateTimeEntryStatusSchema.safeParse(data)
}

export function validateGetTimeEntries(data: unknown) {
  return getTimeEntriesSchema.safeParse(data)
}

// ==============================================
// ERROR FORMATTING FUNCTION
// ==============================================
export function formatTimeEntryErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {}

  error.errors.forEach((err) => {
    const field = err.path.join('.')
    formatted[field] = err.message
  })

  return formatted
}

// ==============================================
// TYPE EXPORTS (inferred from schemas)
// ==============================================
export type ClockInInput = z.infer<typeof clockInSchema>
export type ClockOutInput = z.infer<typeof clockOutSchema>
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>
export type QuickUpdateTimeEntryStatusInput = z.infer<typeof quickUpdateTimeEntryStatusSchema>
export type GetTimeEntriesInput = z.infer<typeof getTimeEntriesSchema>

// ==============================================
// VALIDATION RESULT TYPES
// ==============================================
export type ClockInValidationResult = z.SafeParseReturnType<unknown, ClockInInput>
export type ClockOutValidationResult = z.SafeParseReturnType<unknown, ClockOutInput>
export type CreateTimeEntryValidationResult = z.SafeParseReturnType<unknown, CreateTimeEntryInput>
export type UpdateTimeEntryValidationResult = z.SafeParseReturnType<unknown, UpdateTimeEntryInput>
export type QuickUpdateTimeEntryStatusValidationResult = z.SafeParseReturnType<unknown, QuickUpdateTimeEntryStatusInput>
export type GetTimeEntriesValidationResult = z.SafeParseReturnType<unknown, GetTimeEntriesInput>

// ==============================================
// HELPER FUNCTIONS
// ==============================================

// Transform form data for API submission
export function transformClockInFormData(formData: any): ClockInInput {
  return {
    projectId: formData.projectId,
    scheduleProjectId: formData.scheduleProjectId || undefined,
    workType: formData.workType || undefined,
    trade: formData.trade || undefined,
    description: formData.description || undefined,
    location: formData.useLocation && formData.location ? formData.location : undefined
  }
}

export function transformClockOutFormData(formData: any): ClockOutInput {
  return {
    description: formData.description || undefined,
    workCompleted: formData.workCompleted || undefined,
    issuesEncountered: formData.issuesEncountered || undefined,
    location: formData.useLocation && formData.location ? formData.location : undefined
  }
}

// Calculate total hours from start and end time
export function calculateHours(startTime: string, endTime: string, breakMinutes: number = 0): number {
  const start = new Date(`1970-01-01T${startTime}`)
  const end = new Date(`1970-01-01T${endTime}`)
  
  const diffMs = end.getTime() - start.getTime()
  const totalMinutes = Math.floor(diffMs / (1000 * 60)) - breakMinutes
  
  return Math.max(0, totalMinutes / 60) // Convert to hours, ensure non-negative
}

// Check if time entry is for today
export function isToday(date: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return date === today
}

// Format time for display
export function formatTimeForDisplay(time: string): string {
  return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}