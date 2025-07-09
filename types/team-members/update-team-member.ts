// ==============================================
// src/types/team-members/update-team-member.ts - Team Member Update Types
// ==============================================

import { z } from 'zod'
import type { TeamMember } from './team-member'

// ==============================================
// UPDATE TEAM MEMBER INTERFACES
// ==============================================
export interface UpdateTeamMemberData {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  role?: TeamMember['role']
  jobTitle?: string
  tradeSpecialty?: TeamMember['tradeSpecialty']
  hourlyRate?: number
  overtimeRate?: number
  startDate?: string
  certifications?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  isActive?: boolean
}

export interface UpdateTeamMemberResult {
  success: boolean
  message: string
  data: {
    teamMember: TeamMember
    updatedFields: string[]
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// UPDATE TEAM MEMBER STATE
// ==============================================
export type UpdateTeamMemberState = 
  | 'idle'           // Initial state
  | 'loading'        // Updating team member
  | 'success'        // Team member updated
  | 'error'          // Update failed

// ==============================================
// FORM DATA INTERFACE (for frontend forms)
// ==============================================
export interface UpdateTeamMemberFormData {
  // Basic team member info
  firstName: string
  lastName: string
  email: string
  phone: string
  role: TeamMember['role']
  jobTitle: string
  tradeSpecialty?: TeamMember['tradeSpecialty']
  hourlyRate?: number
  overtimeRate?: number
  startDate: string
  certifications?: string
  emergencyContactName: string
  emergencyContactPhone: string
  isActive: boolean
  
  // UI state helpers
  isCheckingEmail?: boolean
  isEmailAvailable?: boolean
  lastCheckedEmail?: string
  hasUnsavedChanges?: boolean
  
  // Track which fields have been modified
  modifiedFields?: Set<keyof UpdateTeamMemberFormData>
  
  // Multi-step form state
  currentStep?: number
  completedSteps?: number[]
}

// ==============================================
// QUICK UPDATE INTERFACES (for inline editing)
// ==============================================
export interface QuickUpdateTeamMemberData {
  id: string
  field: 'firstName' | 'lastName' | 'email' | 'phone' | 'role' | 'jobTitle' | 'tradeSpecialty' | 'hourlyRate' | 'overtimeRate' | 'isActive'
  value: string | number | boolean
  notes?: string
}

export interface QuickUpdateTeamMemberResult {
  success: boolean
  message: string
  data: {
    teamMemberId: string
    field: string
    oldValue: any
    newValue: any
    updatedAt: string
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// TEAM MEMBER STATUS UPDATE
// ==============================================
export interface UpdateTeamMemberStatusData {
  id: string
  isActive: boolean
  reason?: string
  notes?: string
}

export interface UpdateTeamMemberStatusResult {
  success: boolean
  message: string
  data: {
    teamMemberId: string
    previousStatus: boolean
    newStatus: boolean
    affectedProjects: Array<{
      id: string
      name: string
      action: 'removed' | 'suspended'
    }>
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// ZOD VALIDATION SCHEMA
// ==============================================
export const updateTeamMemberSchema = z.object({
  id: z.string()
    .min(1, 'Team member ID is required'),
  
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .optional(),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
  
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional(),
  
  phone: z.string()
    .optional()
    .refine(val => !val || val.length >= 10, 'Phone number must be at least 10 digits'),
  
  role: z.enum(['admin', 'supervisor', 'member'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  }).optional(),
  
  jobTitle: z.string()
    .max(100, 'Job title must be less than 100 characters')
    .optional(),
  
  tradeSpecialty: z.enum(['electrical', 'plumbing', 'framing', 'drywall', 'roofing', 'concrete', 'hvac', 'general', 'management', 'safety'])
    .optional(),
  
  hourlyRate: z.number()
    .min(0, 'Hourly rate must be positive')
    .max(999.99, 'Hourly rate must be less than $1000')
    .optional(),
  
  overtimeRate: z.number()
    .min(0, 'Overtime rate must be positive')
    .max(999.99, 'Overtime rate must be less than $1000')
    .optional(),
  
  startDate: z.string()
    .optional(),
  
  certifications: z.string()
    .optional(),
  
  emergencyContactName: z.string()
    .max(100, 'Emergency contact name must be less than 100 characters')
    .optional(),
  
  emergencyContactPhone: z.string()
    .optional()
    .refine(val => !val || val.length >= 10, 'Emergency contact phone must be at least 10 digits'),
  
  isActive: z.boolean()
    .optional(),
})

// Quick update schema for single field updates
export const quickUpdateTeamMemberSchema = z.object({
  id: z.string().min(1, 'Team member ID is required'),
  field: z.enum(['firstName', 'lastName', 'email', 'phone', 'role', 'jobTitle', 'tradeSpecialty', 'hourlyRate', 'overtimeRate', 'isActive']),
  value: z.union([z.string(), z.number(), z.boolean()]),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

// Status update schema
export const updateTeamMemberStatusSchema = z.object({
  id: z.string().min(1, 'Team member ID is required'),
  isActive: z.boolean(),
  reason: z.string().max(200, 'Reason must be less than 200 characters').optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
})

// ==============================================
// VALIDATION FUNCTIONS
// ==============================================
export function validateUpdateTeamMember(data: unknown) {
  return updateTeamMemberSchema.safeParse(data)
}

export function validateUpdateTeamMemberStatus(data: unknown) {
  return updateTeamMemberStatusSchema.safeParse(data)
}

// ==============================================
// HELPER FUNCTIONS FOR FORM DATA
// ==============================================
export function getDefaultUpdateTeamMemberFormData(): UpdateTeamMemberFormData {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'member',
    jobTitle: '',
    tradeSpecialty: undefined,
    hourlyRate: undefined,
    overtimeRate: undefined,
    startDate: '',
    certifications: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    isActive: true,
    
    // UI state
    isCheckingEmail: false,
    isEmailAvailable: true,
    lastCheckedEmail: '',
    hasUnsavedChanges: false,
    modifiedFields: new Set(),
    
    // Multi-step form
    currentStep: 1,
    completedSteps: [],
  }
}

export function convertTeamMemberToFormData(teamMember: TeamMember): UpdateTeamMemberFormData {
  return {
    firstName: teamMember.firstName,
    lastName: teamMember.lastName,
    email: teamMember.email,
    phone: teamMember.phone || '',
    role: teamMember.role,
    jobTitle: teamMember.jobTitle || '',
    tradeSpecialty: teamMember.tradeSpecialty,
    hourlyRate: teamMember.hourlyRate,
    overtimeRate: teamMember.overtimeRate,
    startDate: teamMember.startDate || '',
    certifications: teamMember.certifications || '',
    emergencyContactName: teamMember.emergencyContactName || '',
    emergencyContactPhone: teamMember.emergencyContactPhone || '',
    isActive: teamMember.isActive,
    
    // UI state defaults
    isCheckingEmail: false,
    isEmailAvailable: true,
    lastCheckedEmail: teamMember.email,
    hasUnsavedChanges: false,
    modifiedFields: new Set(),
    currentStep: 1,
    completedSteps: [1, 2, 3, 4],
  }
}

// ==============================================
// FORM STEP CONFIGURATION (same as create but for editing)
// ==============================================
export interface UpdateTeamMemberFormStep {
  id: number
  title: string
  description: string
  fields: (keyof UpdateTeamMemberFormData)[]
  isOptional?: boolean
}

export const UPDATE_TEAM_MEMBER_FORM_STEPS: UpdateTeamMemberFormStep[] = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Update basic team member details',
    fields: ['firstName', 'lastName', 'email', 'phone', 'role'],
  },
  {
    id: 2,
    title: 'Job Details',
    description: 'Update job title, trade specialty, and rates',
    fields: ['jobTitle', 'tradeSpecialty', 'hourlyRate', 'overtimeRate', 'startDate'],
    isOptional: true,
  },
  {
    id: 3,
    title: 'Emergency Contact',
    description: 'Update emergency contact information',
    fields: ['emergencyContactName', 'emergencyContactPhone'],
    isOptional: true,
  },
  {
    id: 4,
    title: 'Status & Access',
    description: 'Update account status and permissions',
    fields: ['isActive'],
    isOptional: true,
  },
]

// ==============================================
// FIELD DISPLAY CONFIGURATION
// ==============================================
export interface TeamMemberFieldConfig {
  key: keyof TeamMember
  label: string
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'boolean' | 'date' | 'array'
  editable: boolean
  required?: boolean
  options?: Array<{ value: string; label: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
  }
}

export const TEAM_MEMBER_FIELD_CONFIGS: TeamMemberFieldConfig[] = [
  { key: 'firstName', label: 'First Name', type: 'text', editable: true, required: true },
  { key: 'lastName', label: 'Last Name', type: 'text', editable: true, required: true },
  { key: 'email', label: 'Email', type: 'email', editable: true, required: true },
  { key: 'phone', label: 'Phone', type: 'tel', editable: true },
  { key: 'role', label: 'Role', type: 'select', editable: true, required: true },
  { key: 'jobTitle', label: 'Job Title', type: 'text', editable: true },
  { key: 'tradeSpecialty', label: 'Trade Specialty', type: 'select', editable: true },
  { key: 'hourlyRate', label: 'Hourly Rate', type: 'number', editable: true, validation: { min: 0, max: 999.99 } },
  { key: 'overtimeRate', label: 'Overtime Rate', type: 'number', editable: true, validation: { min: 0, max: 999.99 } },
  { key: 'startDate', label: 'Start Date', type: 'date', editable: true },
  { key: 'emergencyContactName', label: 'Emergency Contact', type: 'text', editable: true },
  { key: 'emergencyContactPhone', label: 'Emergency Phone', type: 'tel', editable: true },
  { key: 'isActive', label: 'Active Status', type: 'boolean', editable: true },
]