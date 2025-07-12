// ==============================================
// types/punchlist-items/update-punchlist-item.ts - Update Punchlist Item Types
// ==============================================

import { z } from 'zod'
import type { 
  PunchlistItem, 
  PunchlistItemWithDetails,
  IssueType, 
  PunchlistStatus, 
  PunchlistPriority, 
  TradeCategory 
} from './punchlist-item'

// ==============================================
// VALIDATION SCHEMAS
// ==============================================
export const updatePunchlistItemSchema = z.object({
  id: z.string().uuid('Invalid punchlist item ID'),
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  issueType: z.enum(['defect', 'incomplete', 'change_request', 'safety', 'quality', 'rework']).optional(),
  location: z.string().max(255, 'Location too long').optional(),
  roomArea: z.string().max(100, 'Room/area too long').optional(),
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
// UPDATE PUNCHLIST ITEM INTERFACES
// ==============================================
export interface UpdatePunchlistItemData {
  id: string
  
  // Issue Details (all optional for updates)
  title?: string
  description?: string
  issueType?: IssueType
  location?: string
  roomArea?: string
  
  // Assignment
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
// UPDATE PUNCHLIST ITEM STATE
// ==============================================
export type UpdatePunchlistItemState = 
  | 'idle'           // Initial state
  | 'loading'        // Loading current data
  | 'editing'        // Form is being edited
  | 'saving'         // Saving changes
  | 'success'        // Update successful
  | 'error'          // Update failed

// ==============================================
// FORM DATA INTERFACE (for frontend forms)
// ==============================================
export interface UpdatePunchlistItemFormData {
  id: string
  
  // Issue Information
  title: string
  description: string
  issueType: IssueType | ''
  
  // Location & Assignment
  location: string
  roomArea: string
  assignedProjectMemberId: string
  tradeCategory: TradeCategory | ''
  
  // Priority & Timeline
  priority: PunchlistPriority
  status: PunchlistStatus
  dueDate: string
  estimatedHours: number | ''
  actualHours: number | ''
  
  // Resolution Details
  resolutionNotes: string
  rejectionReason: string
  
  // Quality & Documentation
  requiresInspection: boolean
  inspectionPassed: boolean | ''
  inspectionNotes: string
  photos: string[]
  attachments: string[]

  // UI state helpers
  hasUnsavedChanges?: boolean
  modifiedFields?: string[]
  originalData?: PunchlistItemWithDetails
}

// ==============================================
// FORM ERRORS INTERFACE
// ==============================================
export interface UpdatePunchlistItemFormErrors {
  // Issue Information errors
  title?: string
  description?: string
  issueType?: string
  
  // Location & Assignment errors
  location?: string
  roomArea?: string
  assignedProjectMemberId?: string
  tradeCategory?: string
  
  // Priority & Timeline errors
  priority?: string
  status?: string
  dueDate?: string
  estimatedHours?: string
  actualHours?: string
  
  // Resolution Details errors
  resolutionNotes?: string
  rejectionReason?: string
  
  // Quality & Documentation errors
  requiresInspection?: string
  inspectionPassed?: string
  inspectionNotes?: string
  photos?: string
  attachments?: string
  
  // General errors
  general?: string
}

// ==============================================
// VALIDATION INTERFACES
// ==============================================
export interface UpdatePunchlistItemValidation {
  isValid: boolean
  errors: UpdatePunchlistItemFormErrors
  hasFieldErrors: boolean
  canSubmit: boolean
  hasChanges: boolean
}

// ==============================================
// FORM SUBMISSION INTERFACE
// ==============================================
export interface SubmitUpdatePunchlistItemData {
  id: string
  
  // Only include changed fields
  title?: string
  description?: string
  issueType?: IssueType
  location?: string
  roomArea?: string
  assignedProjectMemberId?: string
  tradeCategory?: TradeCategory
  priority?: PunchlistPriority
  status?: PunchlistStatus
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  resolutionNotes?: string
  rejectionReason?: string
  requiresInspection?: boolean
  inspectionPassed?: boolean
  inspectionNotes?: string
  photos?: string[]
  attachments?: string[]
}

// ==============================================
// STATUS WORKFLOW INTERFACES
// ==============================================
export interface PunchlistStatusTransition {
  from: PunchlistStatus
  to: PunchlistStatus
  isValid: boolean
  requiresFields?: string[]
  warningMessage?: string
}

export interface PunchlistStatusWorkflow {
  currentStatus: PunchlistStatus
  availableTransitions: PunchlistStatus[]
  getTransition: (toStatus: PunchlistStatus) => PunchlistStatusTransition
}

// ==============================================
// STATUS WORKFLOW RULES
// ==============================================
export const PUNCHLIST_STATUS_TRANSITIONS: Record<PunchlistStatus, PunchlistStatus[]> = {
  open: ['assigned', 'on_hold'],
  assigned: ['in_progress', 'open', 'on_hold'],
  in_progress: ['pending_review', 'completed', 'on_hold', 'assigned'],
  pending_review: ['completed', 'rejected', 'in_progress'],
  completed: ['rejected', 'in_progress'], // Can reopen if needed
  rejected: ['assigned', 'in_progress'],
  on_hold: ['open', 'assigned', 'in_progress']
}

export const REQUIRED_FIELDS_FOR_STATUS: Record<PunchlistStatus, string[]> = {
  open: [],
  assigned: ['assignedProjectMemberId'],
  in_progress: ['assignedProjectMemberId'],
  pending_review: ['assignedProjectMemberId', 'resolutionNotes'],
  completed: ['assignedProjectMemberId', 'resolutionNotes'],
  rejected: ['rejectionReason'],
  on_hold: []
}

// ==============================================
// BULK UPDATE INTERFACES
// ==============================================
export interface BulkUpdatePunchlistItemsData {
  punchlistItemIds: string[]
  updates: {
    status?: PunchlistStatus
    priority?: PunchlistPriority
    assignedProjectMemberId?: string
    dueDate?: string
    tradeCategory?: TradeCategory
  }
}

export interface BulkUpdatePunchlistItemsResult {
  success: boolean
  message: string
  data: {
    updatedCount: number
    failedCount: number
    errors?: Array<{
      punchlistItemId: string
      error: string
    }>
  }
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

// Check if status transition is valid
export const isValidStatusTransition = (
  fromStatus: PunchlistStatus, 
  toStatus: PunchlistStatus
): boolean => {
  return PUNCHLIST_STATUS_TRANSITIONS[fromStatus]?.includes(toStatus) || false
}

// Get available status transitions
export const getAvailableStatusTransitions = (currentStatus: PunchlistStatus): PunchlistStatus[] => {
  return PUNCHLIST_STATUS_TRANSITIONS[currentStatus] || []
}

// Get required fields for status
export const getRequiredFieldsForStatus = (status: PunchlistStatus): string[] => {
  return REQUIRED_FIELDS_FOR_STATUS[status] || []
}

// Check if all required fields are provided for status change
export const validateStatusChange = (
  newStatus: PunchlistStatus,
  formData: UpdatePunchlistItemFormData
): { isValid: boolean; missingFields: string[] } => {
  const requiredFields = getRequiredFieldsForStatus(newStatus)
  const missingFields: string[] = []

  requiredFields.forEach(field => {
    const value = formData[field as keyof UpdatePunchlistItemFormData]
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(field)
    }
  })

  return {
    isValid: missingFields.length === 0,
    missingFields
  }
}

// Get status transition with validation
export const getStatusTransition = (
  fromStatus: PunchlistStatus,
  toStatus: PunchlistStatus,
  formData?: UpdatePunchlistItemFormData
): PunchlistStatusTransition => {
  const isValid = isValidStatusTransition(fromStatus, toStatus)
  const requiredFields = getRequiredFieldsForStatus(toStatus)
  
  let warningMessage: string | undefined
  
  // Add specific warning messages for certain transitions
  if (toStatus === 'rejected') {
    warningMessage = 'Please provide a clear rejection reason explaining why this item was rejected.'
  } else if (toStatus === 'completed') {
    warningMessage = 'Make sure all work has been completed and resolution notes are detailed.'
  } else if (toStatus === 'on_hold') {
    warningMessage = 'This will pause work on this item. Add notes explaining why it\'s on hold.'
  }

  return {
    from: fromStatus,
    to: toStatus,
    isValid,
    requiresFields: requiredFields.length > 0 ? requiredFields : undefined,
    warningMessage
  }
}

// ==============================================
// DEFAULT VALUES
// ==============================================
export const DEFAULT_UPDATE_PUNCHLIST_ITEM_FORM_DATA: Omit<UpdatePunchlistItemFormData, 'id' | 'originalData'> = {
  // Issue Information
  title: '',
  description: '',
  issueType: '',
  
  // Location & Assignment
  location: '',
  roomArea: '',
  assignedProjectMemberId: '',
  tradeCategory: '',
  
  // Priority & Timeline
  priority: 'medium',
  status: 'open',
  dueDate: '',
  estimatedHours: '',
  actualHours: '',
  
  // Resolution Details
  resolutionNotes: '',
  rejectionReason: '',
  
  // Quality & Documentation
  requiresInspection: false,
  inspectionPassed: '',
  inspectionNotes: '',
  photos: [],
  attachments: [],

  // UI state
  hasUnsavedChanges: false,
  modifiedFields: []
}

// ==============================================
// VALIDATION RULES
// ==============================================
export const UPDATE_PUNCHLIST_ITEM_VALIDATION_RULES = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 255
  },
  description: {
    required: false,
    maxLength: 1000
  },
  location: {
    required: false,
    maxLength: 255
  },
  roomArea: {
    required: false,
    maxLength: 100
  },
  estimatedHours: {
    required: false,
    min: 0.1,
    max: 999.99
  },
  actualHours: {
    required: false,
    min: 0.1,
    max: 999.99
  },
  dueDate: {
    required: false,
    format: 'date'
  },
  resolutionNotes: {
    required: false,
    maxLength: 1000
  },
  rejectionReason: {
    required: false,
    maxLength: 500
  },
  inspectionNotes: {
    required: false,
    maxLength: 1000
  }
} as const

// ==============================================
// CHANGE TRACKING UTILITIES
// ==============================================
export interface FieldChange {
  field: string
  oldValue: any
  newValue: any
  label: string
}

export const trackFormChanges = (
  originalData: PunchlistItemWithDetails,
  currentData: UpdatePunchlistItemFormData
): FieldChange[] => {
  const changes: FieldChange[] = []
  
  // Define field mappings with user-friendly labels
  const fieldMappings: Record<string, { key: keyof PunchlistItemWithDetails; label: string }> = {
    title: { key: 'title', label: 'Title' },
    description: { key: 'description', label: 'Description' },
    issueType: { key: 'issueType', label: 'Issue Type' },
    location: { key: 'location', label: 'Location' },
    roomArea: { key: 'roomArea', label: 'Room/Area' },
    assignedProjectMemberId: { key: 'assignedProjectMemberId', label: 'Assigned To' },
    tradeCategory: { key: 'tradeCategory', label: 'Trade Category' },
    priority: { key: 'priority', label: 'Priority' },
    status: { key: 'status', label: 'Status' },
    dueDate: { key: 'dueDate', label: 'Due Date' },
    estimatedHours: { key: 'estimatedHours', label: 'Estimated Hours' },
    actualHours: { key: 'actualHours', label: 'Actual Hours' },
    resolutionNotes: { key: 'resolutionNotes', label: 'Resolution Notes' },
    rejectionReason: { key: 'rejectionReason', label: 'Rejection Reason' },
    requiresInspection: { key: 'requiresInspection', label: 'Requires Inspection' },
    inspectionPassed: { key: 'inspectionPassed', label: 'Inspection Passed' },
    inspectionNotes: { key: 'inspectionNotes', label: 'Inspection Notes' }
  }

  // Check each field for changes
  Object.entries(fieldMappings).forEach(([formField, { key, label }]) => {
    const originalValue = originalData[key]
    const currentValue = currentData[formField as keyof UpdatePunchlistItemFormData]
    
    // Normalize values for comparison
    const normalizedOriginal = originalValue ?? ''
    const normalizedCurrent = currentValue ?? ''
    
    if (normalizedOriginal !== normalizedCurrent) {
      changes.push({
        field: formField,
        oldValue: originalValue,
        newValue: currentValue,
        label
      })
    }
  })

  // Special handling for arrays (photos, attachments)
  const originalPhotos = originalData.photos || []
  const currentPhotos = currentData.photos || []
  if (JSON.stringify(originalPhotos) !== JSON.stringify(currentPhotos)) {
    changes.push({
      field: 'photos',
      oldValue: originalPhotos,
      newValue: currentPhotos,
      label: 'Photos'
    })
  }

  const originalAttachments = originalData.attachments || []
  const currentAttachments = currentData.attachments || []
  if (JSON.stringify(originalAttachments) !== JSON.stringify(currentAttachments)) {
    changes.push({
      field: 'attachments',
      oldValue: originalAttachments,
      newValue: currentAttachments,
      label: 'Attachments'
    })
  }

  return changes
}

// Get list of modified field names
export const getModifiedFields = (
  originalData: PunchlistItemWithDetails,
  currentData: UpdatePunchlistItemFormData
): string[] => {
  const changes = trackFormChanges(originalData, currentData)
  return changes.map(change => change.field)
}

// Check if form has unsaved changes
export const hasUnsavedChanges = (
  originalData: PunchlistItemWithDetails,
  currentData: UpdatePunchlistItemFormData
): boolean => {
  const changes = trackFormChanges(originalData, currentData)
  return changes.length > 0
}

// Transform update form data to API data
export const transformUpdateFormDataToApiData = (
  formData: UpdatePunchlistItemFormData
): SubmitUpdatePunchlistItemData => {
  const changes = getModifiedFields(formData.originalData!, formData)
  const apiData: SubmitUpdatePunchlistItemData = { id: formData.id }

  // Only include changed fields
  changes.forEach(field => {
    const value = formData[field as keyof UpdatePunchlistItemFormData]
    if (value !== undefined && field !== 'id' && field !== 'originalData') {
      ;(apiData as any)[field] = value
    }
  })

  return apiData
}

// Transform punchlist item to update form data
export const punchlistItemToUpdateFormData = (
  punchlistItem: PunchlistItemWithDetails
): UpdatePunchlistItemFormData => {
  return {
    id: punchlistItem.id,
    title: punchlistItem.title,
    description: punchlistItem.description || '',
    issueType: punchlistItem.issueType || '',
    location: punchlistItem.location || '',
    roomArea: punchlistItem.roomArea || '',
    assignedProjectMemberId: punchlistItem.assignedProjectMemberId || '',
    tradeCategory: punchlistItem.tradeCategory || '',
    priority: punchlistItem.priority,
    status: punchlistItem.status,
    dueDate: punchlistItem.dueDate || '',
    estimatedHours: punchlistItem.estimatedHours || '',
    actualHours: punchlistItem.actualHours || '',
    resolutionNotes: punchlistItem.resolutionNotes || '',
    rejectionReason: punchlistItem.rejectionReason || '',
    requiresInspection: punchlistItem.requiresInspection || false,
    inspectionPassed: punchlistItem.inspectionPassed || '',
    inspectionNotes: punchlistItem.inspectionNotes || '',
    photos: punchlistItem.photos || [],
    attachments: punchlistItem.attachments || [],
    hasUnsavedChanges: false,
    modifiedFields: [],
    originalData: punchlistItem
  }
}

// Check if form has changes compared to original
export const hasFormChanges = (
  originalData: PunchlistItemWithDetails,
  currentData: UpdatePunchlistItemFormData
): boolean => {
  return hasUnsavedChanges(originalData, currentData)
}