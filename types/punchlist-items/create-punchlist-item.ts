// ==============================================
// types/punchlist-items/create-punchlist-item.ts - UPDATED FOR MULTIPLE ASSIGNMENTS
// ==============================================

import { z } from 'zod'
import type { 
    PunchlistItem, 
    IssueType, 
    PunchlistStatus, 
    PunchlistPriority, 
    TradeCategory,
    AssignmentRole,
    AssignmentInput 
} from './punchlist-item'

// ==============================================
// VALIDATION SCHEMAS (UPDATED)
// ==============================================
export const createPunchlistItemSchema = z.object({
  projectId: z.string().uuid('Invalid project ID').min(1, 'Project is required'),
  relatedScheduleProjectId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters').max(255, 'Title too long').trim(),
  description: z.string().max(1000, 'Description too long').optional(),
  issueType: z.enum(['defect', 'incomplete', 'change_request', 'safety', 'quality', 'rework']),
  location: z.string().max(255, 'Location too long').optional(),
  roomArea: z.string().max(100, 'Room/area too long').optional(),
  
  // UPDATED: Multiple assignments
  assignedMembers: z.array(z.object({
    projectMemberId: z.string().uuid('Invalid project member ID'),
    role: z.enum(['primary', 'secondary', 'inspector', 'supervisor']).default('primary')
  })).min(0).max(5).default([]).optional(),
  
  tradeCategory: z.enum(['general', 'electrical', 'plumbing', 'hvac', 'framing', 'drywall', 'flooring', 'painting', 'roofing', 'concrete', 'masonry', 'landscaping', 'cleanup']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'assigned', 'in_progress', 'pending_review', 'completed', 'rejected', 'on_hold']).default('open'),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0.1).max(999.99).optional(),
  requiresInspection: z.boolean().default(false),
  photos: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
  resolutionNotes: z.string().max(1000).optional(),
})

// ==============================================
// VALIDATION FUNCTIONS
// ==============================================
export function validateCreatePunchlistItem(data: unknown) {
  return createPunchlistItemSchema.safeParse(data)
}

// ==============================================
// CREATE PUNCHLIST ITEM INTERFACES (UPDATED)
// ==============================================
export interface CreatePunchlistItemData {
  projectId: string
  relatedScheduleProjectId?: string
  
  // Issue Details
  title: string
  description?: string
  issueType: IssueType
  location?: string
  roomArea?: string
  
  // UPDATED: Multiple assignments
  assignedMembers?: AssignmentInput[]
  
  tradeCategory?: TradeCategory
  
  // Priority & Status
  priority: PunchlistPriority
  status?: PunchlistStatus
  
  // Media & Documentation
  photos?: string[]
  attachments?: string[]
  
  // Scheduling & Estimates
  dueDate?: string
  estimatedHours?: number
  
  // Quality Control
  requiresInspection?: boolean
  
  // Additional Notes
  resolutionNotes?: string
}

export interface CreatePunchlistItemResult {
  success: boolean
  message: string
  data: {
    punchlistItem: PunchlistItem
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// CREATE PUNCHLIST ITEM STATE
// ==============================================
export type CreatePunchlistItemState = 
  | 'idle'           // Initial state
  | 'loading'        // Creating punchlist item
  | 'success'        // Punchlist item created
  | 'error'          // Creation failed

// ==============================================
// FORM DATA INTERFACE (UPDATED)
// ==============================================
export interface CreatePunchlistItemFormData {
  // Step 1: Issue Information
  title: string
  description: string
  projectId: string
  relatedScheduleProjectId: string
  issueType: IssueType | ''
  
  // Step 2: Location & Assignment (UPDATED)
  location: string
  roomArea: string
  assignedMembers: Array<{
    projectMemberId: string
    role: AssignmentRole
    user?: {
      firstName: string
      lastName: string
      tradeSpecialty?: string
    }
  }>
  tradeCategory: TradeCategory | ''
  
  // Step 3: Priority & Timeline
  priority: PunchlistPriority
  status: PunchlistStatus
  dueDate: string
  estimatedHours: number | ''
  
  // Step 4: Quality & Documentation
  requiresInspection: boolean
  photos: string[]
  attachments: string[]
  resolutionNotes: string

  // UI state helpers
  currentStep: number
  completedSteps: number[]
  hasUnsavedChanges?: boolean
  modifiedFields?: string[]
}

// ==============================================
// FORM ERRORS INTERFACE (UPDATED)
// ==============================================
export interface CreatePunchlistItemFormErrors {
  // Issue Information errors
  title?: string
  description?: string
  projectId?: string
  relatedScheduleProjectId?: string
  issueType?: string
  
  // Location & Assignment errors (UPDATED)
  location?: string
  roomArea?: string
  assignedMembers?: string  // For multiple assignments validation
  tradeCategory?: string
  
  // Priority & Timeline errors
  priority?: string
  status?: string
  dueDate?: string
  estimatedHours?: string
  
  // Quality & Documentation errors
  requiresInspection?: string
  photos?: string
  attachments?: string
  resolutionNotes?: string
  
  // General errors
  general?: string
}

// ==============================================
// FORM STEP INTERFACES (UPDATED)
// ==============================================
export interface CreatePunchlistItemStep {
  id: number
  title: string
  description: string
  fields: string[]
  isOptional?: boolean
  isCompleted?: boolean
  hasErrors?: boolean
  validation?: (data: CreatePunchlistItemFormData) => boolean
}

export const CREATE_PUNCHLIST_ITEM_STEPS: CreatePunchlistItemStep[] = [
  {
    id: 1,
    title: 'Issue Information',
    description: 'Describe the issue and select the project',
    fields: ['title', 'description', 'projectId', 'issueType'],
    isOptional: false,
    validation: (data) => Boolean(data.title.trim() && data.projectId && data.issueType)
  },
  {
    id: 2,
    title: 'Location & Assignment',
    description: 'Specify location and assign to team members',
    fields: ['location', 'roomArea', 'assignedMembers', 'tradeCategory'],
    isOptional: false,
    validation: (data) => Boolean(data.assignedMembers.length > 0)
  },
  {
    id: 3,
    title: 'Priority & Timeline',
    description: 'Set priority and timeline for resolution',
    fields: ['priority', 'status', 'dueDate', 'estimatedHours'],
    isOptional: false,
    validation: (data) => Boolean(data.priority)
  },
  {
    id: 4,
    title: 'Quality & Documentation',
    description: 'Add photos, attachments, and inspection requirements',
    fields: ['requiresInspection', 'photos', 'attachments', 'resolutionNotes'],
    isOptional: true,
    validation: () => true
  }
]

// ==============================================
// DATA TRANSFORMATION FUNCTIONS (UPDATED)
// ==============================================
export function transformCreateFormDataToApiData(
  formData: CreatePunchlistItemFormData
): CreatePunchlistItemData {
  return {
    projectId: formData.projectId,
    relatedScheduleProjectId: formData.relatedScheduleProjectId || undefined,
    title: formData.title.trim(),
    description: formData.description.trim() || undefined,
    issueType: formData.issueType as IssueType,
    location: formData.location.trim() || undefined,
    roomArea: formData.roomArea.trim() || undefined,
    assignedMembers: formData.assignedMembers.map(member => ({
      projectMemberId: member.projectMemberId,
      role: member.role
    })),
    tradeCategory: formData.tradeCategory as TradeCategory || undefined,
    priority: formData.priority,
    status: formData.status,
    dueDate: formData.dueDate || undefined,
    estimatedHours: typeof formData.estimatedHours === 'number' ? formData.estimatedHours : undefined,
    requiresInspection: formData.requiresInspection,
    photos: formData.photos,
    attachments: formData.attachments,
    resolutionNotes: formData.resolutionNotes.trim() || undefined,
  }
}

export function getDefaultCreatePunchlistItemFormData(): CreatePunchlistItemFormData {
  return {
    // Step 1: Issue Information
    title: '',
    description: '',
    projectId: '',
    relatedScheduleProjectId: '',
    issueType: '',
    
    // Step 2: Location & Assignment (UPDATED)
    location: '',
    roomArea: '',
    assignedMembers: [],
    tradeCategory: '',
    
    // Step 3: Priority & Timeline
    priority: 'medium',
    status: 'open',
    dueDate: '',
    estimatedHours: '',
    
    // Step 4: Quality & Documentation
    requiresInspection: false,
    photos: [],
    attachments: [],
    resolutionNotes: '',

    // UI state
    currentStep: 1,
    completedSteps: [],
    hasUnsavedChanges: false,
    modifiedFields: []
  }
}

// ==============================================
// VALIDATION INTERFACES
// ==============================================
export interface CreatePunchlistItemValidation {
  isValid: boolean
  errors: CreatePunchlistItemFormErrors
  hasFieldErrors: boolean
  canSubmit: boolean
  completedSteps: number[]
  currentStepValid: boolean
}

// ==============================================
// PROJECT MEMBER SELECTION INTERFACE (UPDATED)
// ==============================================
export interface ProjectMemberForPunchlist {
  id: string
  userId: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    tradeSpecialty?: string
  }
  role: string
  hourlyRate?: number
  isActive: boolean
}

// ==============================================
// SCHEDULE PROJECT SELECTION INTERFACE
// ==============================================
export interface ScheduleProjectForPunchlist {
  id: string
  title: string
  status: string
  startDate: string
  endDate: string
  assignedMembers: Array<{
    id: string
    userId: string
    user: {
      firstName: string
      lastName: string
      tradeSpecialty?: string
    }
  }>
}

// ==============================================
// FORM SUBMISSION INTERFACE (UPDATED)
// ==============================================
export interface SubmitCreatePunchlistItemData {
  // Core data (cleaned and transformed)
  projectId: string
  relatedScheduleProjectId?: string
  title: string
  description?: string
  issueType: IssueType
  location?: string
  roomArea?: string
  assignedMembers: AssignmentInput[]
  tradeCategory?: TradeCategory
  priority: PunchlistPriority
  status: PunchlistStatus
  dueDate?: string
  estimatedHours?: number
  requiresInspection: boolean
  photos: string[]
  attachments: string[]
  resolutionNotes?: string
}

// ==============================================
// FILE UPLOAD INTERFACES
// ==============================================
export interface PunchlistFileUpload {
  id: string
  file: File
  type: 'photo' | 'attachment'
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  url?: string
  error?: string
}

export interface PunchlistFileUploadResult {
  success: boolean
  url?: string
  error?: string
}

// ==============================================
// DEFAULT VALUES
// ==============================================
export const DEFAULT_CREATE_PUNCHLIST_ITEM_FORM_DATA: CreatePunchlistItemFormData = {
  // Step 1: Issue Information
  title: '',
  description: '',
  projectId: '',
  relatedScheduleProjectId: '',
  issueType: '',
  
  // Step 2: Location & Assignment (UPDATED)
  location: '',
  roomArea: '',
  assignedMembers: [],
  tradeCategory: '',
  
  // Step 3: Priority & Timeline
  priority: 'medium',
  status: 'open',
  dueDate: '',
  estimatedHours: '',
  
  // Step 4: Quality & Documentation
  requiresInspection: false,
  photos: [],
  attachments: [],
  resolutionNotes: '',

  // UI state
  currentStep: 1,
  completedSteps: [],
  hasUnsavedChanges: false,
  modifiedFields: []
}