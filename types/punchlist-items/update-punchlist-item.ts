// ==============================================
// types/punchlist-items/update-punchlist-item.ts - UPDATED Update Punchlist Item Types
// ==============================================

import { z } from 'zod'
import type { 
  PunchlistItemWithDetails,
  PunchlistItemAssignment,
  IssueType, 
  PunchlistStatus, 
  PunchlistPriority, 
  TradeCategory,
  AssignmentRole 
} from '.'  // FIXED: Import from current directory index

// ==============================================
// ASSIGNMENT UPDATE SCHEMA (NEW)
// ==============================================
export const updatePunchlistAssignmentSchema = z.object({
  projectMemberId: z.string().uuid('Invalid project member ID'),
  role: z.enum(['primary', 'secondary', 'inspector', 'supervisor']).default('primary'),
})

// ==============================================
// VALIDATION SCHEMAS (UPDATED)
// ==============================================
export const updatePunchlistItemSchema = z.object({
  id: z.string().uuid('Invalid punchlist item ID'),
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  issueType: z.enum(['defect', 'incomplete', 'change_request', 'safety', 'quality', 'rework']).optional(),
  location: z.string().max(255, 'Location too long').optional(),
  roomArea: z.string().max(100, 'Room/area too long').optional(),
  
  // UPDATED: Multiple assignments support
  assignedMembers: z.array(updatePunchlistAssignmentSchema).optional(),
  
  // DEPRECATED: Keep for backward compatibility
  assignedProjectMemberId: z.string().uuid().optional(),
  
  tradeCategory: z.enum(['general', 'electrical', 'plumbing', 'hvac', 'framing', 'drywall', 'flooring', 'painting', 'roofing', 'concrete', 'masonry', 'landscaping', 'cleanup']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['open', 'assigned', 'in_progress', 'pending_review', 'completed', 'rejected', 'on_hold']).optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).max(999.99).optional(),
  actualHours: z.number().min(0).max(999.99).optional(),
  resolutionNotes: z.string().max(1000).optional(),
  rejectionReason: z.string().max(500).optional(),
  requiresInspection: z.boolean().optional(),
  inspectionPassed: z.boolean().optional(),
  inspectionNotes: z.string().max(1000).optional(),
  photos: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
})
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

export const quickUpdatePunchlistStatusSchema = z.object({
  id: z.string().uuid('Invalid punchlist item ID'),
  status: z.enum(['open', 'assigned', 'in_progress', 'pending_review', 'completed', 'rejected', 'on_hold']),
  actualHours: z.number().min(0).max(999.99).optional(),
  resolutionNotes: z.string().max(1000).optional(),
  rejectionReason: z.string().max(500).optional(),
  inspectionPassed: z.boolean().optional(),
  inspectionNotes: z.string().max(1000).optional(),
})

// ==============================================
// VALIDATION FUNCTIONS
// ==============================================
export function validateUpdatePunchlistItem(data: unknown) {
  return updatePunchlistItemSchema.safeParse(data)
}

export function validateQuickUpdatePunchlistStatus(data: unknown) {
  return quickUpdatePunchlistStatusSchema.safeParse(data)
}

// ==============================================
// UPDATE ASSIGNMENT INTERFACES (NEW)
// ==============================================
export interface UpdatePunchlistItemAssignmentData {
  projectMemberId: string
  role: AssignmentRole
}

// ==============================================
// UPDATE PUNCHLIST ITEM INTERFACES (UPDATED)
// ==============================================
export interface UpdatePunchlistItemData {
  id: string
  
  // Issue Details (all optional for updates)
  title?: string
  description?: string
  issueType?: IssueType
  location?: string
  roomArea?: string
  
  // UPDATED: Multiple assignments
  assignedMembers?: UpdatePunchlistItemAssignmentData[]
  
  // DEPRECATED: Keep for backward compatibility
  assignedProjectMemberId?: string
  
  tradeCategory?: TradeCategory
  
  // Priority & Status
  priority?: PunchlistPriority
  status?: PunchlistStatus
  
  // Media & Documentation
  photos?: string[]
  attachments?: string[]
  
  // Scheduling & Estimates
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  
  // Resolution Details
  resolutionNotes?: string
  rejectionReason?: string
  
  // Quality Control
  requiresInspection?: boolean
  inspectionPassed?: boolean
  inspectionNotes?: string
}

export interface UpdatePunchlistItemResult {
  success: boolean
  message: string
  data: {
    punchlistItem: PunchlistItemWithDetails
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// FORM DATA INTERFACES (UPDATED)
// ==============================================
export interface UpdatePunchlistItemFormData {
  id: string
  title?: string
  description?: string
  issueType?: IssueType | '' // FIXED: Allow empty string for form state
  location?: string
  roomArea?: string
  
  // UPDATED: Form assignments
  assignedMembers?: Array<{
    projectMemberId: string
    role: AssignmentRole
    // Additional form fields for UI
    projectMemberName?: string
    projectMemberTrade?: string
  }>
  
  tradeCategory?: TradeCategory | '' // FIXED: Allow empty string for form state
  priority?: PunchlistPriority
  status?: PunchlistStatus
  dueDate?: string
  estimatedHours?: number | '' // FIXED: Allow empty string for form state
  actualHours?: number | '' // FIXED: Allow empty string for form state
  resolutionNotes?: string
  rejectionReason?: string
  requiresInspection?: boolean
  inspectionPassed?: boolean | '' // FIXED: Allow empty string for form state
  inspectionNotes?: string
  photos?: string[]
  attachments?: string[]
}

export interface UpdatePunchlistItemFormErrors {
  id?: string[]
  title?: string[]
  description?: string[]
  issueType?: string[]
  location?: string[]
  roomArea?: string[]
  assignedMembers?: string[]
  tradeCategory?: string[]
  priority?: string[]
  status?: string[]
  dueDate?: string[]
  estimatedHours?: string[]
  actualHours?: string[]
  resolutionNotes?: string[]
  rejectionReason?: string[]
  requiresInspection?: string[]
  inspectionPassed?: string[]
  inspectionNotes?: string[]
  photos?: string[]
  attachments?: string[]
  _form?: string[]
}

export interface UpdatePunchlistItemValidation {
  success: boolean
  data?: UpdatePunchlistItemData
  errors?: UpdatePunchlistItemFormErrors
}

// ==============================================
// QUICK STATUS UPDATE INTERFACE
// ==============================================
export interface QuickUpdatePunchlistStatusData {
  id: string
  status: PunchlistStatus
  actualHours?: number
  resolutionNotes?: string
  rejectionReason?: string
  inspectionPassed?: boolean
  inspectionNotes?: string
}

export interface QuickUpdatePunchlistStatusResult {
  success: boolean
  message: string
  data: {
    punchlistItem: PunchlistItemWithDetails
  }
}

// ==============================================
// STATUS WORKFLOW TYPES
// ==============================================
export interface PunchlistStatusTransition {
  from: PunchlistStatus
  to: PunchlistStatus
  requiredFields?: string[]
  userRoles?: string[]
  conditions?: string[]
}

export interface PunchlistStatusWorkflow {
  [key: string]: PunchlistStatus[]
}

// ==============================================
// BULK UPDATE TYPES
// ==============================================
export interface BulkUpdatePunchlistItemsData {
  punchlistItemIds: string[]
  updates: Partial<UpdatePunchlistItemData>
}

export interface BulkUpdatePunchlistItemsResult {
  success: boolean
  message: string
  data: {
    updatedCount: number
    failedItems?: Array<{
      id: string
      error: string
    }>
  }
}

// ==============================================
// CHANGE TRACKING TYPES
// ==============================================
export interface FieldChange<T = any> {
  field: string
  oldValue: T
  newValue: T
  timestamp: Date
}

// ==============================================
// SUBMISSION TYPES
// ==============================================
export interface SubmitUpdatePunchlistItemData {
  punchlistItemId: string
  formData: UpdatePunchlistItemFormData
  currentUser: {
    id: string
    name: string
    role: string
  }
}

// ==============================================
// STATE TYPES
// ==============================================
export type UpdatePunchlistItemState = 
  | 'idle'           // Initial state
  | 'loading'        // Updating punchlist item
  | 'success'        // Punchlist item updated
  | 'error'          // Update failed

// ==============================================
// CONSTANTS
// ==============================================
export const PUNCHLIST_STATUS_TRANSITIONS: PunchlistStatusWorkflow = {
  'open': ['assigned', 'in_progress', 'rejected'],
  'assigned': ['in_progress', 'on_hold', 'rejected'],
  'in_progress': ['pending_review', 'completed', 'on_hold', 'rejected'],
  'pending_review': ['completed', 'rejected', 'in_progress'],
  'completed': ['rejected'], // Only allow rejection of completed items
  'rejected': ['open', 'assigned'], // Can restart from rejection
  'on_hold': ['assigned', 'in_progress', 'rejected']
}

export const REQUIRED_FIELDS_FOR_STATUS: Record<PunchlistStatus, string[]> = {
  'open': [],
  'assigned': ['assignedMembers'],
  'in_progress': ['assignedMembers'],
  'pending_review': ['assignedMembers', 'resolutionNotes'],
  'completed': ['assignedMembers', 'resolutionNotes'],
  'rejected': ['rejectionReason'],
  'on_hold': ['assignedMembers']
}

export const DEFAULT_UPDATE_PUNCHLIST_ITEM_FORM_DATA: Partial<UpdatePunchlistItemFormData> = {
  assignedMembers: [],
  photos: [],
  attachments: [],
  requiresInspection: false
}

export const UPDATE_PUNCHLIST_ITEM_VALIDATION_RULES = {
  title: { minLength: 3, maxLength: 255 },
  description: { maxLength: 1000 },
  location: { maxLength: 255 },
  roomArea: { maxLength: 100 },
  estimatedHours: { min: 0, max: 999.99 },
  actualHours: { min: 0, max: 999.99 },
  resolutionNotes: { maxLength: 1000 },
  rejectionReason: { maxLength: 500 },
  inspectionNotes: { maxLength: 1000 }
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
export function isValidStatusTransition(from: PunchlistStatus, to: PunchlistStatus): boolean {
  const allowedTransitions = PUNCHLIST_STATUS_TRANSITIONS[from] || []
  return allowedTransitions.includes(to)
}

export function getAvailableStatusTransitions(currentStatus: PunchlistStatus): PunchlistStatus[] {
  return PUNCHLIST_STATUS_TRANSITIONS[currentStatus] || []
}

export function getRequiredFieldsForStatus(status: PunchlistStatus): string[] {
  return REQUIRED_FIELDS_FOR_STATUS[status] || []
}

export function validateStatusChange(
  from: PunchlistStatus, 
  to: PunchlistStatus, 
  formData: UpdatePunchlistItemFormData
): { valid: boolean; missingFields?: string[] } {
  // Check if transition is allowed
  if (!isValidStatusTransition(from, to)) {
    return { valid: false }
  }
  
  // Check required fields
  const requiredFields = getRequiredFieldsForStatus(to)
  const missingFields = requiredFields.filter(field => {
    const value = formData[field as keyof UpdatePunchlistItemFormData]
    return !value || (Array.isArray(value) && value.length === 0)
  })
  
  return {
    valid: missingFields.length === 0,
    missingFields: missingFields.length > 0 ? missingFields : undefined
  }
}

export function getStatusTransition(from: PunchlistStatus, to: PunchlistStatus): PunchlistStatusTransition | null {
  if (!isValidStatusTransition(from, to)) {
    return null
  }
  
  return {
    from,
    to,
    requiredFields: getRequiredFieldsForStatus(to)
  }
}

export function trackFormChanges(
  original: UpdatePunchlistItemFormData,
  current: UpdatePunchlistItemFormData
): FieldChange[] {
  const changes: FieldChange[] = []
  const timestamp = new Date()
  
  // Compare all fields
  Object.keys(current).forEach(key => {
    const originalValue = original[key as keyof UpdatePunchlistItemFormData]
    const currentValue = current[key as keyof UpdatePunchlistItemFormData]
    
    // Deep comparison for arrays and objects
    if (JSON.stringify(originalValue) !== JSON.stringify(currentValue)) {
      changes.push({
        field: key,
        oldValue: originalValue,
        newValue: currentValue,
        timestamp
      })
    }
  })
  
  return changes
}

export function getModifiedFields(
  original: UpdatePunchlistItemFormData,
  current: UpdatePunchlistItemFormData
): string[] {
  return trackFormChanges(original, current).map(change => change.field)
}

export function hasUnsavedChanges(
  original: UpdatePunchlistItemFormData,
  current: UpdatePunchlistItemFormData
): boolean {
  return getModifiedFields(original, current).length > 0
}

export function transformUpdateFormDataToApiData(formData: UpdatePunchlistItemFormData): UpdatePunchlistItemData {
  // Transform form data to API data structure
  const apiData: UpdatePunchlistItemData = {
    id: formData.id
  }
  
  // Only include fields that have values and convert empty strings to undefined
  if (formData.title !== undefined && formData.title !== '') apiData.title = formData.title
  if (formData.description !== undefined && formData.description !== '') apiData.description = formData.description
  if (formData.issueType !== undefined && formData.issueType !== '') apiData.issueType = formData.issueType as IssueType
  if (formData.location !== undefined && formData.location !== '') apiData.location = formData.location
  if (formData.roomArea !== undefined && formData.roomArea !== '') apiData.roomArea = formData.roomArea
  
  // Transform assignments
  if (formData.assignedMembers !== undefined && formData.assignedMembers.length > 0) {
    apiData.assignedMembers = formData.assignedMembers.map(member => ({
      projectMemberId: member.projectMemberId,
      role: member.role
    }))
  }
  
  if (formData.tradeCategory !== undefined && formData.tradeCategory !== '') apiData.tradeCategory = formData.tradeCategory as TradeCategory
  if (formData.priority !== undefined) apiData.priority = formData.priority
  if (formData.status !== undefined) apiData.status = formData.status
  if (formData.dueDate !== undefined && formData.dueDate !== '') apiData.dueDate = formData.dueDate
  if (formData.estimatedHours !== undefined && formData.estimatedHours !== '') apiData.estimatedHours = typeof formData.estimatedHours === 'number' ? formData.estimatedHours : parseFloat(formData.estimatedHours as string)
  if (formData.actualHours !== undefined && formData.actualHours !== '') apiData.actualHours = typeof formData.actualHours === 'number' ? formData.actualHours : parseFloat(formData.actualHours as string)
  if (formData.resolutionNotes !== undefined && formData.resolutionNotes !== '') apiData.resolutionNotes = formData.resolutionNotes
  if (formData.rejectionReason !== undefined && formData.rejectionReason !== '') apiData.rejectionReason = formData.rejectionReason
  if (formData.requiresInspection !== undefined) apiData.requiresInspection = formData.requiresInspection
  if (formData.inspectionPassed !== undefined && formData.inspectionPassed !== '') apiData.inspectionPassed = typeof formData.inspectionPassed === 'boolean' ? formData.inspectionPassed : formData.inspectionPassed === 'true'
  if (formData.inspectionNotes !== undefined && formData.inspectionNotes !== '') apiData.inspectionNotes = formData.inspectionNotes
  if (formData.photos !== undefined) apiData.photos = formData.photos
  if (formData.attachments !== undefined) apiData.attachments = formData.attachments
  
  return apiData
}

export function punchlistItemToUpdateFormData(punchlistItem: PunchlistItemWithDetails): UpdatePunchlistItemFormData {
  return {
    id: punchlistItem.id,
    title: punchlistItem.title,
    description: punchlistItem.description,
    issueType: punchlistItem.issueType,
    location: punchlistItem.location,
    roomArea: punchlistItem.roomArea,
    assignedMembers: punchlistItem.assignedMembers?.map(member => ({
      projectMemberId: member.projectMemberId,
      role: member.role,
      projectMemberName: `${member.user.firstName} ${member.user.lastName}`,
      projectMemberTrade: member.user.tradeSpecialty
    })) || [],
    tradeCategory: punchlistItem.tradeCategory,
    priority: punchlistItem.priority,
    status: punchlistItem.status,
    dueDate: punchlistItem.dueDate,
    estimatedHours: punchlistItem.estimatedHours,
    actualHours: punchlistItem.actualHours,
    resolutionNotes: punchlistItem.resolutionNotes,
    rejectionReason: punchlistItem.rejectionReason,
    requiresInspection: punchlistItem.requiresInspection,
    inspectionPassed: punchlistItem.inspectionPassed,
    inspectionNotes: punchlistItem.inspectionNotes,
    photos: punchlistItem.photos || [],
    attachments: punchlistItem.attachments || []
  }
}

export function hasFormChanges(
  original: UpdatePunchlistItemFormData,
  current: UpdatePunchlistItemFormData
): boolean {
  return hasUnsavedChanges(original, current)
}