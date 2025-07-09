// ==============================================
// src/lib/validations/team/team-member.ts - Team Member Validation Schemas
// ==============================================

import { z } from 'zod'

// ==============================================
// BASE TEAM MEMBER SCHEMA
// ==============================================
const baseTeamMemberSchema = z.object({
    // Required personal information
    firstName: z
        .string()
        .min(1, 'First name is required')
        .max(100, 'First name must be less than 100 characters')
        .trim(),

    lastName: z
        .string()
        .min(1, 'Last name is required')
        .max(100, 'Last name must be less than 100 characters')
        .trim(),

    email: z
        .string()
        .email('Invalid email address')
        .max(255, 'Email must be less than 255 characters')
        .toLowerCase()
        .trim(),

    phone: z
        .string()
        .regex(/^\+1\d{10}$/, 'Phone must be in format +1XXXXXXXXXX')
        .optional(),

    // Role & Permissions
    role: z
        .enum(['super_admin', 'admin', 'supervisor', 'member'])
        .default('member'),

    // Employment Details
    jobTitle: z
        .string()
        .max(100, 'Job title must be less than 100 characters')
        .optional(),

    tradeSpecialty: z
        .string()
        .max(100, 'Trade specialty must be less than 100 characters')
        .optional(),

    // Financial Information
    hourlyRate: z
        .number()
        .min(0, 'Hourly rate cannot be negative')
        .max(999.99, 'Hourly rate cannot exceed $999.99')
        .optional(),

    overtimeRate: z
        .number()
        .min(0, 'Overtime rate cannot be negative')
        .max(999.99, 'Overtime rate cannot exceed $999.99')
        .optional(),

    // Employment Timeline
    startDate: z
        .string()
        .date('Invalid start date')
        .optional(),

    // Additional Information
    certifications: z
        .string()
        .max(1000, 'Certifications must be less than 1000 characters')
        .optional(),

    emergencyContactName: z
        .string()
        .max(255, 'Emergency contact name must be less than 255 characters')
        .optional(),

    emergencyContactPhone: z
        .string()
        .regex(/^\+1\d{10}$/, 'Emergency contact phone must be in format +1XXXXXXXXXX')
        .optional(),

    // Status
    isActive: z
        .boolean()
        .default(true),
})

// ==============================================
// CREATE TEAM MEMBER SCHEMA (Enhanced with Project Assignment)
// ==============================================
export const createTeamMemberSchema = baseTeamMemberSchema.extend({
    // Optional project assignment during creation
    projectId: z
        .string()
        .uuid('Invalid project ID')
        .optional(),

    // Project-specific rates (override user defaults)
    projectHourlyRate: z
        .number()
        .min(0, 'Project hourly rate cannot be negative')
        .max(999.99, 'Project hourly rate cannot exceed $999.99')
        .optional(),

    projectOvertimeRate: z
        .number()
        .min(0, 'Project overtime rate cannot be negative')
        .max(999.99, 'Project overtime rate cannot exceed $999.99')
        .optional(),

    // Assignment details
    assignmentNotes: z
        .string()
        .max(500, 'Assignment notes must be less than 500 characters')
        .optional(),

    assignmentStatus: z
        .enum(['active', 'inactive'])
        .default('active'),

}).refine((data) => {
    // If emergency contact name provided, phone is required
    if (data.emergencyContactName && !data.emergencyContactPhone) {
        return false
    }
    return true
}, {
    message: 'Emergency contact phone is required when emergency contact name is provided',
    path: ['emergencyContactPhone']
}).refine((data) => {
    // If overtime rate provided, hourly rate should be provided too
    if (data.overtimeRate && !data.hourlyRate) {
        return false
    }
    return true
}, {
    message: 'Hourly rate is required when overtime rate is provided',
    path: ['hourlyRate']
}).refine((data) => {
    // If project overtime rate provided, project hourly rate should be provided too
    if (data.projectOvertimeRate && !data.projectHourlyRate) {
        return false
    }
    return true
}, {
    message: 'Project hourly rate is required when project overtime rate is provided',
    path: ['projectHourlyRate']
}).refine((data) => {
    // If project assignment details provided, projectId is required
    if ((data.projectHourlyRate || data.projectOvertimeRate || data.assignmentNotes) && !data.projectId) {
        return false
    }
    return true
}, {
    message: 'Project ID is required when project assignment details are provided',
    path: ['projectId']
}).refine((data) => {
    // Validate overtime rates are higher than regular rates
    if (data.hourlyRate && data.overtimeRate && data.overtimeRate <= data.hourlyRate) {
        return false
    }
    return true
}, {
    message: 'Overtime rate should be higher than hourly rate',
    path: ['overtimeRate']
}).refine((data) => {
    // Validate project overtime rates are higher than project regular rates
    if (data.projectHourlyRate && data.projectOvertimeRate && data.projectOvertimeRate <= data.projectHourlyRate) {
        return false
    }
    return true
}, {
    message: 'Project overtime rate should be higher than project hourly rate',
    path: ['projectOvertimeRate']
})

// ==============================================
// UPDATE TEAM MEMBER SCHEMA
// ==============================================
export const updateTeamMemberSchema = baseTeamMemberSchema.partial().extend({
    id: z.string().uuid('Invalid team member ID'),
}).refine((data) => {
    // Same refinements as create, but all fields are optional
    if (data.emergencyContactName && !data.emergencyContactPhone) {
        return false
    }
    return true
}, {
    message: 'Emergency contact phone is required when emergency contact name is provided',
    path: ['emergencyContactPhone']
}).refine((data) => {
    if (data.overtimeRate && !data.hourlyRate) {
        return false
    }
    return true
}, {
    message: 'Hourly rate is required when overtime rate is provided',
    path: ['hourlyRate']
}).refine((data) => {
    if (data.hourlyRate && data.overtimeRate && data.overtimeRate <= data.hourlyRate) {
        return false
    }
    return true
}, {
    message: 'Overtime rate should be higher than hourly rate',
    path: ['overtimeRate']
})

// ==============================================
// PROJECT ASSIGNMENT SCHEMA
// ==============================================
export const projectAssignmentSchema = z.object({
    userId: z
        .string()
        .uuid('Invalid user ID'),

    projectId: z
        .string()
        .uuid('Invalid project ID'),

    // Optional rate overrides for this project
    hourlyRate: z
        .number()
        .min(0, 'Hourly rate cannot be negative')
        .max(999.99, 'Hourly rate cannot exceed $999.99')
        .optional(),

    overtimeRate: z
        .number()
        .min(0, 'Overtime rate cannot be negative')
        .max(999.99, 'Overtime rate cannot exceed $999.99')
        .optional(),

    // Assignment details
    notes: z
        .string()
        .max(500, 'Notes must be less than 500 characters')
        .optional(),

    status: z
        .enum(['active', 'inactive'])
        .default('active'),
    startDate: z.string().optional(),

}).refine((data) => {
    // If overtime rate provided, hourly rate should be provided too
    if (data.overtimeRate && !data.hourlyRate) {
        return false
    }
    return true
}, {
    message: 'Hourly rate is required when overtime rate is provided',
    path: ['hourlyRate']
}).refine((data) => {
    // Validate overtime rate is higher than hourly rate
    if (data.hourlyRate && data.overtimeRate && data.overtimeRate <= data.hourlyRate) {
        return false
    }
    return true
}, {
    message: 'Overtime rate should be higher than hourly rate',
    path: ['overtimeRate']
})

// ==============================================
// UPDATE PROJECT ASSIGNMENT SCHEMA
// ==============================================
export const updateProjectAssignmentSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    projectId: z.string().uuid('Invalid project ID'),

    hourlyRate: z
        .number()
        .min(0, 'Hourly rate cannot be negative')
        .max(999.99, 'Hourly rate cannot exceed $999.99')
        .optional(),

    overtimeRate: z
        .number()
        .min(0, 'Overtime rate cannot be negative')
        .max(999.99, 'Overtime rate cannot exceed $999.99')
        .optional(),

    notes: z
        .string()
        .max(500, 'Notes must be less than 500 characters')
        .optional(),

    status: z
        .enum(['active', 'inactive'])
        .optional(),

}).refine((data) => {
    if (data.overtimeRate && !data.hourlyRate) {
        return false
    }
    return true
}, {
    message: 'Hourly rate is required when overtime rate is provided',
    path: ['hourlyRate']
}).refine((data) => {
    if (data.hourlyRate && data.overtimeRate && data.overtimeRate <= data.hourlyRate) {
        return false
    }
    return true
}, {
    message: 'Overtime rate should be higher than hourly rate',
    path: ['overtimeRate']
})

// ==============================================
// TEAM MEMBER QUERY SCHEMA
// ==============================================
export const getTeamMembersSchema = z.object({
    role: z
        .string()
        .refine(val => ['super_admin', 'admin', 'supervisor', 'member'].includes(val), 'Invalid role')
        .transform(val => val as 'super_admin' | 'admin' | 'supervisor' | 'member')
        .optional()
        .nullable(),

    status: z
        .string()
        .refine(val => ['active', 'inactive', 'all'].includes(val), 'Invalid status')
        .transform(val => val as 'active' | 'inactive' | 'all')
        .optional()
        .nullable(),

    assignmentStatus: z
        .string()
        .refine(val => ['not_assigned', 'assigned', 'inactive'].includes(val), 'Invalid assignment status')
        .transform(val => val as 'not_assigned' | 'assigned' | 'inactive')
        .optional()
        .nullable(),

    tradeSpecialty: z
        .string()
        .max(100, 'Trade specialty filter too long')
        .optional()
        .nullable(),

    projectId: z
        .string()
        .uuid('Invalid project ID')
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
            'firstName',
            'lastName',
            'email',
            'role',
            'tradeSpecialty',
            'hourlyRate',
            'startDate',
            'createdAt'
        ].includes(val), 'Invalid sortBy field')
        .transform(val => val as 'firstName' | 'lastName' | 'email' | 'role' | 'tradeSpecialty' | 'hourlyRate' | 'startDate' | 'createdAt')
        .optional()
        .nullable(),

    sortOrder: z
        .string()
        .refine(val => ['asc', 'desc'].includes(val), 'Invalid sort order')
        .transform(val => val as 'asc' | 'desc')
        .optional()
        .nullable(),

}).transform(data => ({
    // Clean up the data and convert null/empty to undefined with proper types
    role: data.role || undefined,
    status: data.status || undefined,
    assignmentStatus: data.assignmentStatus || undefined,
    tradeSpecialty: data.tradeSpecialty || undefined,
    projectId: data.projectId || undefined,
    limit: data.limit || undefined,
    offset: data.offset || undefined,
    search: data.search || undefined,
    sortBy: data.sortBy || undefined,
    sortOrder: data.sortOrder || undefined,
})).optional().default({})

// ==============================================
// FORM DATA TRANSFORMATION HELPER
// ==============================================
export function transformTeamMemberFormData(formData: any) {
    const apiData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        jobTitle: formData.jobTitle,
        tradeSpecialty: formData.tradeSpecialty,
        hourlyRate: formData.hourlyRate,
        overtimeRate: formData.overtimeRate,
        startDate: formData.startDate,
        certifications: formData.certifications,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
    }

    // Add project assignment if provided
    if (formData.projectId) {
        apiData.projectId = formData.projectId
        apiData.projectHourlyRate = formData.projectHourlyRate
        apiData.projectOvertimeRate = formData.projectOvertimeRate
        apiData.assignmentNotes = formData.assignmentNotes
        apiData.assignmentStatus = formData.assignmentStatus || 'active'
    }

    return apiData
}

// ==============================================
// TYPE EXPORTS
// ==============================================
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>
export type ProjectAssignmentInput = z.infer<typeof projectAssignmentSchema>
export type UpdateProjectAssignmentInput = z.infer<typeof updateProjectAssignmentSchema>
export type GetTeamMembersInput = z.infer<typeof getTeamMembersSchema>

// Enhanced form data type
export interface CreateTeamMemberFormData {
    firstName: string
    lastName: string
    email: string
    phone?: string
    role?: 'super_admin' | 'admin' | 'supervisor' | 'member'
    jobTitle?: string
    tradeSpecialty?: string
    hourlyRate?: number
    overtimeRate?: number
    startDate?: string
    certifications?: string
    emergencyContactName?: string
    emergencyContactPhone?: string
    isActive?: boolean

    // Project assignment fields
    projectId?: string
    projectHourlyRate?: number
    projectOvertimeRate?: number
    assignmentNotes?: string
    assignmentStatus?: 'active' | 'inactive'
}

// ==============================================
// VALIDATION HELPER FUNCTIONS
// ==============================================
export function validateCreateTeamMember(data: unknown) {
    return createTeamMemberSchema.safeParse(data)
}

export function validateUpdateTeamMember(data: unknown) {
    return updateTeamMemberSchema.safeParse(data)
}

export function validateProjectAssignment(data: unknown) {
    return projectAssignmentSchema.safeParse(data)
}

export function validateUpdateProjectAssignment(data: unknown) {
    return updateProjectAssignmentSchema.safeParse(data)
}

export function validateGetTeamMembers(data: unknown) {
    return getTeamMembersSchema.safeParse(data)
}

// ==============================================
// VALIDATION ERROR FORMATTER
// ==============================================
export function formatTeamMemberErrors(errors: z.ZodError) {
    return errors.errors.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
    }))
}