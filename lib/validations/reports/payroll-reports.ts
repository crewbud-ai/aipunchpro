// ==============================================
// lib/validations/reports/payroll-reports.ts - Payroll Report Validation Schemas
// ==============================================

import { z } from 'zod'

// ==============================================
// CONSTANTS
// ==============================================
const STATUS_OPTIONS = ['all', 'pending', 'approved', 'clocked_out'] as const
const DATE_RANGE_PRESETS = [
  'this-week',
  'last-week', 
  'this-month',
  'last-month',
  'this-quarter',
  'this-year',
  'custom'
] as const

// ==============================================
// HELPER FUNCTIONS
// ==============================================

/**
 * Validate that end date is after start date
 */
function validateDateRange(data: { startDate: string; endDate: string }) {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start <= end
}

/**
 * Check if date is in valid format and not in future
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today
  
  return !isNaN(date.getTime()) && date <= today
}

/**
 * Calculate max allowed date range (e.g., 1 year)
 */
function isWithinMaxRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // Maximum 366 days (1 year + 1 day for leap year)
  return diffDays <= 366
}

// ==============================================
// PAYROLL REPORT FILTERS SCHEMA
// ==============================================
export const payrollReportFiltersSchema = z.object({
  // Required date range
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .refine(isValidDate, 'Start date must be valid and not in the future'),
  
  endDate: z
    .string()
    .min(1, 'End date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .refine(isValidDate, 'End date must be valid and not in the future'),
  
  // Optional filters
  projectId: z
    .string()
    .uuid('Invalid project ID')
    .optional()
    .nullable(),
  
  userId: z
    .string()
    .uuid('Invalid user ID')
    .optional()
    .nullable(),
  
  status: z
    .enum(STATUS_OPTIONS, {
      errorMap: () => ({ message: 'Invalid status option' })
    })
    .optional()
    .nullable(),
  
  // Options
  includeNotes: z
    .boolean()
    .default(false)
    .optional(),
  
  includeDetailedEntries: z
    .boolean()
    .default(true)
    .optional(),
    
}).refine(
  (data) => validateDateRange(data),
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate']
  }
).refine(
  (data) => isWithinMaxRange(data.startDate, data.endDate),
  {
    message: 'Date range cannot exceed 1 year',
    path: ['endDate']
  }
)

// ==============================================
// QUERY PARAMETERS SCHEMA (for GET requests)
// ==============================================
export const payrollReportQuerySchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  projectId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  status: z.enum(STATUS_OPTIONS).optional().nullable(),
  includeNotes: z
    .string()
    .transform(val => val === 'true')
    .optional()
    .nullable(),
  includeDetailedEntries: z
    .string()
    .transform(val => val === 'true')
    .optional()
    .nullable(),
}).refine(
  (data) => validateDateRange(data),
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate']
  }
)

// ==============================================
// FORM DATA SCHEMA (for UI forms)
// ==============================================
export const payrollReportFormSchema = z.object({
  // Date range preset
  dateRangePreset: z
    .enum(DATE_RANGE_PRESETS, {
      errorMap: () => ({ message: 'Invalid date range preset' })
    })
    .default('this-month'),
  
  // Custom dates
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .refine(isValidDate, 'Start date must be valid and not in the future'),
  
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .refine(isValidDate, 'End date must be valid and not in the future'),
  
  // Multi-select filters (arrays of IDs)
  projectIds: z
    .array(z.string().uuid('Invalid project ID'))
    .default([])
    .optional(),
  
  userIds: z
    .array(z.string().uuid('Invalid user ID'))
    .default([])
    .optional(),
  
  // Status filter
  status: z
    .string()
    .default('all')
    .optional(),
  
  // Options
  includeNotes: z
    .boolean()
    .default(false),
  
  includeDetailedEntries: z
    .boolean()
    .default(true),
    
}).refine(
  (data) => validateDateRange(data),
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate']
  }
)

// ==============================================
// CSV EXPORT SCHEMA
// ==============================================
export const exportPayrollCSVSchema = z.object({
  // Same as report filters
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  
  endDate: z
    .string()
    .min(1, 'End date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  
  projectId: z
    .string()
    .uuid('Invalid project ID')
    .optional()
    .nullable(),
  
  userId: z
    .string()
    .uuid('Invalid user ID')
    .optional()
    .nullable(),
  
  status: z
    .enum(STATUS_OPTIONS)
    .optional()
    .nullable(),
  
  // Export-specific options
  includeNotes: z
    .boolean()
    .default(true),
  
  includeDetailedEntries: z
    .boolean()
    .default(true),
  
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Filename can only contain letters, numbers, hyphens, and underscores')
    .default('payroll-report')
    .optional(),
    
}).refine(
  (data) => validateDateRange(data),
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate']
  }
)

// ==============================================
// STATS QUERY SCHEMA
// ==============================================
export const payrollStatsQuerySchema = z.object({
  // Optional filters for stats
  projectId: z
    .string()
    .uuid('Invalid project ID')
    .optional()
    .nullable(),
  
  userId: z
    .string()
    .uuid('Invalid user ID')
    .optional()
    .nullable(),
})

// ==============================================
// TYPE EXPORTS
// ==============================================
export type PayrollReportFiltersInput = z.infer<typeof payrollReportFiltersSchema>
export type PayrollReportQueryInput = z.infer<typeof payrollReportQuerySchema>
export type PayrollReportFormInput = z.infer<typeof payrollReportFormSchema>
export type ExportPayrollCSVInput = z.infer<typeof exportPayrollCSVSchema>
export type PayrollStatsQueryInput = z.infer<typeof payrollStatsQuerySchema>

// ==============================================
// VALIDATION HELPER FUNCTIONS
// ==============================================

/**
 * Validate payroll report filters
 */
export function validatePayrollReportFilters(data: unknown) {
  return payrollReportFiltersSchema.safeParse(data)
}

/**
 * Validate query parameters (from URL)
 */
export function validatePayrollReportQuery(data: unknown) {
  return payrollReportQuerySchema.safeParse(data)
}

/**
 * Validate form data
 */
export function validatePayrollReportForm(data: unknown) {
  return payrollReportFormSchema.safeParse(data)
}

/**
 * Validate CSV export request
 */
export function validateExportPayrollCSV(data: unknown) {
  return exportPayrollCSVSchema.safeParse(data)
}

/**
 * Validate stats query
 */
export function validatePayrollStatsQuery(data: unknown) {
  return payrollStatsQuerySchema.safeParse(data)
}

// ==============================================
// VALIDATION ERROR FORMATTER
// ==============================================
export function formatPayrollReportErrors(errors: z.ZodError) {
  return errors.errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
  }))
}

// ==============================================
// CUSTOM VALIDATORS FOR SPECIFIC CASES
// ==============================================

/**
 * Validate that at least one filter is provided (besides date range)
 */
export function hasAtLeastOneFilter(filters: PayrollReportFiltersInput): boolean {
  return !!(filters.projectId || filters.userId || (filters.status && filters.status !== 'all'))
}

/**
 * Check if date range is reasonable for performance
 * (e.g., warn if > 3 months)
 */
export function isReasonableDateRange(startDate: string, endDate: string): {
  isReasonable: boolean
  warningMessage?: string
} {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30)
  
  if (diffMonths > 6) {
    return {
      isReasonable: false,
      warningMessage: 'Date range exceeds 6 months. Report generation may be slow.'
    }
  }
  
  if (diffMonths > 3) {
    return {
      isReasonable: true,
      warningMessage: 'Large date range selected. Report may take a moment to generate.'
    }
  }
  
  return { isReasonable: true }
}

/**
 * Validate filename for CSV export
 */
export function validateCSVFilename(filename: string): {
  isValid: boolean
  sanitized: string
  error?: string
} {
  // Remove any path separators
  const sanitized = filename.replace(/[\/\\]/g, '-')
  
  // Check length
  if (sanitized.length === 0) {
    return {
      isValid: false,
      sanitized: 'payroll-report',
      error: 'Filename cannot be empty'
    }
  }
  
  if (sanitized.length > 255) {
    return {
      isValid: false,
      sanitized: sanitized.substring(0, 255),
      error: 'Filename too long (max 255 characters)'
    }
  }
  
  // Check for valid characters
  if (!/^[a-zA-Z0-9-_]+$/.test(sanitized)) {
    const cleaned = sanitized.replace(/[^a-zA-Z0-9-_]/g, '-')
    return {
      isValid: true,
      sanitized: cleaned,
      error: 'Filename contained invalid characters (sanitized)'
    }
  }
  
  return {
    isValid: true,
    sanitized
  }
}

// ==============================================
// DATE RANGE HELPERS
// ==============================================

/**
 * Get date range from preset
 */
export function getDateRangeFromPreset(preset: string): {
  startDate: string
  endDate: string
} | null {
  const now = new Date()
  
  switch (preset) {
    case 'this-week': {
      const dayOfWeek = now.getDay()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - dayOfWeek)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      return {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0]
      }
    }
    
    case 'last-week': {
      const dayOfWeek = now.getDay()
      const startOfLastWeek = new Date(now)
      startOfLastWeek.setDate(now.getDate() - dayOfWeek - 7)
      const endOfLastWeek = new Date(startOfLastWeek)
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6)
      
      return {
        startDate: startOfLastWeek.toISOString().split('T')[0],
        endDate: endOfLastWeek.toISOString().split('T')[0]
      }
    }
    
    case 'this-month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      return {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0]
      }
    }
    
    case 'last-month': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      
      return {
        startDate: startOfLastMonth.toISOString().split('T')[0],
        endDate: endOfLastMonth.toISOString().split('T')[0]
      }
    }
    
    case 'this-quarter': {
      const quarter = Math.floor(now.getMonth() / 3)
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1)
      const endOfQuarter = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
      
      return {
        startDate: startOfQuarter.toISOString().split('T')[0],
        endDate: endOfQuarter.toISOString().split('T')[0]
      }
    }
    
    case 'this-year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const endOfYear = new Date(now.getFullYear(), 11, 31)
      
      return {
        startDate: startOfYear.toISOString().split('T')[0],
        endDate: endOfYear.toISOString().split('T')[0]
      }
    }
    
    default:
      return null
  }
}

// ==============================================
// EXPORT DEFAULT VALIDATION FUNCTIONS
// ==============================================
export default {
  validatePayrollReportFilters,
  validatePayrollReportQuery,
  validatePayrollReportForm,
  validateExportPayrollCSV,
  validatePayrollStatsQuery,
  formatPayrollReportErrors,
  hasAtLeastOneFilter,
  isReasonableDateRange,
  validateCSVFilename,
  getDateRangeFromPreset,
}