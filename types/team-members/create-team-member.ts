// ==============================================
// src/types/team-members/create-team-member.ts - Team Member Creation Types
// ==============================================

import { z } from 'zod'
import type { TeamMember } from './team-member'

// ==============================================
// CREATE TEAM MEMBER INTERFACES
// ==============================================
export interface CreateTeamMemberData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: TeamMember['role']
  jobTitle?: string
  tradeSpecialty?: TeamMember['tradeSpecialty']
  hourlyRate?: number
  overtimeRate?: number
  startDate?: string
  certifications?: string[]
  emergencyContactName?: string
  emergencyContactPhone?: string
  isActive?: boolean
  
  // Project assignment during creation (optional)
  projectId?: string
  projectHourlyRate?: number
  projectOvertimeRate?: number
  projectNotes?: string
}

export interface CreateTeamMemberResult {
  success: boolean
  message: string
  data: {
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone?: string
      role: TeamMember['role']
      jobTitle?: string
      tradeSpecialty?: TeamMember['tradeSpecialty']
      hourlyRate?: number
      overtimeRate?: number
      startDate?: string
      certifications?: string[]
      emergencyContactName?: string
      emergencyContactPhone?: string
      isActive: boolean
      createdAt: string
      updatedAt: string
    }
    assignmentStatus: 'not_assigned' | 'assigned' | 'inactive'
    activeProjectCount: number
    
    // Project assignment details if created
    projectAssignment?: {
      id: string
      projectId: string
      status: 'active' | 'inactive'
      hourlyRate?: number
      overtimeRate?: number
      notes?: string
      joinedAt: string
    }
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// CREATE TEAM MEMBER STATE
// ==============================================
export type CreateTeamMemberState = 
  | 'idle'           // Initial state
  | 'loading'        // Creating team member
  | 'success'        // Team member created
  | 'error'          // Creation failed

// ==============================================
// FORM DATA INTERFACE (for frontend forms)
// ==============================================
export interface CreateTeamMemberFormData {
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
  certifications: string[]
  emergencyContactName: string
  emergencyContactPhone: string
  isActive: boolean
  
  // Project assignment fields (optional)
  assignToProject: boolean
  projectId?: string
  projectHourlyRate?: number
  projectOvertimeRate?: number
  projectNotes: string
  
  // UI state helpers
  isCheckingEmail?: boolean
  isEmailAvailable?: boolean
  lastCheckedEmail?: string
  
  // Multi-step form state
  currentStep?: number
  completedSteps?: number[]
}

// ==============================================
// ZOD VALIDATION SCHEMA
// ==============================================
export const createTeamMemberSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  
  phone: z.string()
    .optional()
    .refine(val => !val || val.length >= 10, 'Phone number must be at least 10 digits'),
  
  role: z.enum(['admin', 'supervisor', 'member'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  }),
  
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
  
  certifications: z.array(z.string())
    .optional(),
  
  emergencyContactName: z.string()
    .max(100, 'Emergency contact name must be less than 100 characters')
    .optional(),
  
  emergencyContactPhone: z.string()
    .optional()
    .refine(val => !val || val.length >= 10, 'Emergency contact phone must be at least 10 digits'),
  
  isActive: z.boolean()
    .default(true),
  
  // Project assignment fields
  projectId: z.string()
    .optional(),
  
  projectHourlyRate: z.number()
    .min(0, 'Project hourly rate must be positive')
    .max(999.99, 'Project hourly rate must be less than $1000')
    .optional(),
  
  projectOvertimeRate: z.number()
    .min(0, 'Project overtime rate must be positive')
    .max(999.99, 'Project overtime rate must be less than $1000')
    .optional(),
  
  projectNotes: z.string()
    .max(1000, 'Project notes must be less than 1000 characters')
    .optional(),
})

// ==============================================
// VALIDATION FUNCTIONS
// ==============================================
export function validateCreateTeamMember(data: unknown) {
  return createTeamMemberSchema.safeParse(data)
}

// ==============================================
// HELPER FUNCTIONS FOR FORM DATA
// ==============================================
export function getDefaultCreateTeamMemberFormData(): CreateTeamMemberFormData {
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
    startDate: new Date().toISOString().split('T')[0], // Today's date
    certifications: [],
    emergencyContactName: '',
    emergencyContactPhone: '',
    isActive: true,
    
    // Project assignment
    assignToProject: false,
    projectId: undefined,
    projectHourlyRate: undefined,
    projectOvertimeRate: undefined,
    projectNotes: '',
    
    // UI state
    isCheckingEmail: false,
    isEmailAvailable: true,
    lastCheckedEmail: '',
    
    // Multi-step form
    currentStep: 1,
    completedSteps: [],
  }
}

// ==============================================
// FORM STEP CONFIGURATION
// ==============================================
export interface CreateTeamMemberFormStep {
  id: number
  title: string
  description: string
  fields: (keyof CreateTeamMemberFormData)[]
  isOptional?: boolean
}

export const CREATE_TEAM_MEMBER_FORM_STEPS: CreateTeamMemberFormStep[] = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Enter basic team member details',
    fields: ['firstName', 'lastName', 'email', 'phone', 'role'],
  },
  {
    id: 2,
    title: 'Job Details',
    description: 'Set job title, trade specialty, and rates',
    fields: ['jobTitle', 'tradeSpecialty', 'hourlyRate', 'overtimeRate', 'startDate'],
    isOptional: true,
  },
  {
    id: 3,
    title: 'Emergency Contact',
    description: 'Add emergency contact information',
    fields: ['emergencyContactName', 'emergencyContactPhone'],
    isOptional: true,
  },
  {
    id: 4,
    title: 'Project Assignment',
    description: 'Optionally assign to a project',
    fields: ['assignToProject', 'projectId', 'projectHourlyRate', 'projectOvertimeRate', 'projectNotes'],
    isOptional: true,
  },
]

// ==============================================
// ROLE AND TRADE SPECIALTY OPTIONS
// ==============================================
export const TEAM_MEMBER_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'member', label: 'Member' },
] as const

export const TRADE_SPECIALTIES = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'framing', label: 'Framing' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'general', label: 'General Construction' },
  { value: 'management', label: 'Management' },
  { value: 'safety', label: 'Safety' },
] as const