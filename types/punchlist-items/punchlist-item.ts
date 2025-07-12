// ==============================================
// types/punchlist-items/punchlist-item.ts - Punchlist Item Types
// ==============================================

import { z } from 'zod'

// ==============================================
// PUNCHLIST ITEM ENUMS & CONSTANTS
// ==============================================

// Issue Types
export const ISSUE_TYPE = [
  'defect',
  'incomplete', 
  'change_request',
  'safety',
  'quality',
  'rework'
] as const

export type IssueType = typeof ISSUE_TYPE[number]

// Punchlist Status  
export const PUNCHLIST_STATUS = [
  'open',
  'assigned', 
  'in_progress',
  'pending_review',
  'completed',
  'rejected',
  'on_hold'
] as const

export type PunchlistStatus = typeof PUNCHLIST_STATUS[number]

// Punchlist Priority
export const PUNCHLIST_PRIORITY = [
  'low',
  'medium', 
  'high',
  'critical'
] as const

export type PunchlistPriority = typeof PUNCHLIST_PRIORITY[number]

// Trade Categories (matching your existing patterns)
export const TRADE_CATEGORY = [
  'general',
  'electrical',
  'plumbing', 
  'hvac',
  'framing',
  'drywall',
  'flooring',
  'painting',
  'roofing',
  'concrete',
  'masonry',
  'landscaping',
  'cleanup'
] as const

export type TradeCategory = typeof TRADE_CATEGORY[number]

export interface PunchlistItemSummary {
  id: string
  companyId: string
  projectId: string
  relatedScheduleProjectId?: string
  
  // Issue Details
  title: string
  issueType: IssueType
  location?: string
  
  // Assignment 
  assignedProjectMemberId?: string
  tradeCategory?: TradeCategory
  reportedBy: string
  
  // Priority & Status
  priority: PunchlistPriority
  status: PunchlistStatus
  
  // Quality Control (added for analytics)
  requiresInspection?: boolean
  
  // Timeline
  dueDate?: string
  estimatedHours?: number
  
  // Metadata
  createdAt: string
  updatedAt: string
  
  // Basic related info for list view
  project?: {
    id: string
    name: string
    status: string
  }
  assignedProjectMember?: {
    id: string
    user: {
      firstName: string
      lastName: string
      tradeSpecialty?: string
    }
  }
  reporter?: {
    firstName: string
    lastName: string
  }
}

// ==============================================
// CORE PUNCHLIST ITEM INTERFACE
// ==============================================
export interface PunchlistItem {
  id: string
  companyId: string
  projectId: string
  relatedScheduleProjectId?: string
  
  // Issue Details
  title: string
  description?: string
  issueType: IssueType
  location?: string
  roomArea?: string
  
  // Assignment (Single project member)
  assignedProjectMemberId?: string
  tradeCategory?: TradeCategory
  reportedBy: string
  
  // Priority & Status
  priority: PunchlistPriority
  status: PunchlistStatus
  
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
  inspectedBy?: string
  inspectedAt?: string
  inspectionPassed?: boolean
  inspectionNotes?: string
  
  // Metadata
  createdAt: string
  updatedAt: string
  completedAt?: string
  assignedAt?: string
}

// ==============================================
// PUNCHLIST ITEM WITH RELATIONSHIPS
// ==============================================
export interface PunchlistItemWithDetails extends PunchlistItem {
  // Project relationship
  project?: {
    id: string
    name: string
    status: string
    projectNumber?: string
  }
  
  // Related schedule project
  relatedScheduleProject?: {
    id: string
    title: string
    status: string
    startDate: string
    endDate: string
  }
  
  // Assigned team member
  assignedProjectMember?: {
    id: string
    userId: string
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      tradeSpecialty?: string
    }
    hourlyRate?: number
    role: string
  }
  
  // Reporter details
  reporter?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  
  // Inspector details  
  inspector?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

// ==============================================
// PUNCHLIST ITEM FILTERS & SEARCH
// ==============================================
export interface PunchlistItemFilters {
  // Basic filters
  projectId?: string
  relatedScheduleProjectId?: string
  status?: PunchlistStatus
  priority?: PunchlistPriority
  issueType?: IssueType
  tradeCategory?: TradeCategory
  
  // Assignment filters
  assignedToUserId?: string
  reportedBy?: string
  
  // Date filters
  dueDateFrom?: string
  dueDateTo?: string
  createdFrom?: string
  createdTo?: string
  
  // Special filters
  requiresInspection?: boolean
  isOverdue?: boolean
  hasPhotos?: boolean
  
  // Search
  search?: string
  
  // Pagination & Sorting
  limit?: number
  offset?: number
  sortBy?: 'title' | 'status' | 'priority' | 'issueType' | 'dueDate' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// ==============================================
// PUNCHLIST ITEM STATES
// ==============================================
export type PunchlistItemsState = 
  | 'loading'        // Loading punchlist items list
  | 'loaded'         // Punchlist items loaded successfully
  | 'error'          // Error loading punchlist items
  | 'empty'          // No punchlist items found

export type PunchlistItemState = 
  | 'loading'        // Loading single punchlist item
  | 'loaded'         // Punchlist item loaded
  | 'error'          // Error loading punchlist item
  | 'not_found'      // Punchlist item not found

// ==============================================
// FILTERS FORM DATA (for UI)
// ==============================================
export interface PunchlistItemFiltersFormData {
  projectId: string
  relatedScheduleProjectId: string
  status: string
  priority: string
  issueType: string
  tradeCategory: string
  assignedToUserId: string
  reportedBy: string
  dueDateFrom: string
  dueDateTo: string
  requiresInspection: string
  isOverdue: string
  search: string
  sortBy: 'title' | 'status' | 'priority' | 'issueType' | 'dueDate' | 'createdAt'
  sortOrder: 'asc' | 'desc'
}

// ==============================================
// ERROR TYPES
// ==============================================
export interface PunchlistItemFieldError {
  field: string
  message: string
}

export interface PunchlistItemFieldErrors {
  title?: string
  description?: string
  projectId?: string
  relatedScheduleProjectId?: string
  issueType?: string
  location?: string
  roomArea?: string
  assignedProjectMemberId?: string
  tradeCategory?: string
  priority?: string
  status?: string
  dueDate?: string
  estimatedHours?: string
  actualHours?: string
  resolutionNotes?: string
  rejectionReason?: string
  requiresInspection?: string
  inspectionPassed?: string
  inspectionNotes?: string
  photos?: string
  attachments?: string
  
  // General errors
  general?: string
  submit?: string
}

// ==============================================
// PUNCHLIST ITEM LIST RESPONSE
// ==============================================
export interface GetPunchlistItemsResult {
  success: boolean
  message: string
  data: {
    punchlistItems: PunchlistItemSummary[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
    filters?: {
      projectId?: string
      relatedScheduleProjectId?: string
      status?: PunchlistStatus
      priority?: PunchlistPriority
      issueType?: IssueType
      tradeCategory?: TradeCategory
      assignedToUserId?: string
      reportedBy?: string
      dueDateFrom?: string
      dueDateTo?: string
      requiresInspection?: boolean
      isOverdue?: boolean
      search?: string
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// SINGLE PUNCHLIST ITEM RESPONSE
// ==============================================
export interface GetPunchlistItemResult {
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
// DELETE PUNCHLIST ITEM RESPONSE
// ==============================================
export interface DeletePunchlistItemResult {
  success: boolean
  message: string
  data: {
    deletedPunchlistItemId: string
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// PUNCHLIST ITEM STATISTICS
// ==============================================
export interface PunchlistItemStats {
  total: number
  byStatus: {
    open: number
    assigned: number
    in_progress: number
    pending_review: number
    completed: number
    rejected: number
    on_hold: number
  }
  byPriority: {
    low: number
    medium: number
    high: number
    critical: number
  }
  byIssueType: {
    defect: number
    incomplete: number
    change_request: number
    safety: number
    quality: number
    rework: number
  }
  averageResolutionTime: number
  overdueItems: number
  requiresInspection: number
  completionRate: number
}

// ==============================================
// FORM OPTION INTERFACES
// ==============================================
export interface IssueTypeOption {
  value: IssueType
  label: string
  description?: string
}

export interface PunchlistStatusOption {
  value: PunchlistStatus
  label: string
  color: 'gray' | 'blue' | 'yellow' | 'orange' | 'green' | 'red'
}

export interface PunchlistPriorityOption {
  value: PunchlistPriority
  label: string
  color: 'gray' | 'blue' | 'yellow' | 'red'
}

export interface TradeCategoryOption {
  value: TradeCategory
  label: string
  icon?: string
}

// ==============================================
// FORM OPTIONS DATA
// ==============================================
export const ISSUE_TYPE_OPTIONS: IssueTypeOption[] = [
  { value: 'defect', label: 'Defect', description: 'Work that needs to be fixed or corrected' },
  { value: 'incomplete', label: 'Incomplete', description: 'Work that was not finished' },
  { value: 'change_request', label: 'Change Request', description: 'Client requested changes' },
  { value: 'safety', label: 'Safety Issue', description: 'Safety hazard or concern' },
  { value: 'quality', label: 'Quality Issue', description: 'Work quality does not meet standards' },
  { value: 'rework', label: 'Rework', description: 'Work needs to be redone' }
]

export const PUNCHLIST_STATUS_OPTIONS: PunchlistStatusOption[] = [
  { value: 'open', label: 'Open', color: 'gray' },
  { value: 'assigned', label: 'Assigned', color: 'blue' },
  { value: 'in_progress', label: 'In Progress', color: 'yellow' },
  { value: 'pending_review', label: 'Pending Review', color: 'orange' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'on_hold', label: 'On Hold', color: 'gray' }
]

export const PUNCHLIST_PRIORITY_OPTIONS: PunchlistPriorityOption[] = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'high', label: 'High', color: 'yellow' },
  { value: 'critical', label: 'Critical', color: 'red' }
]

export const TRADE_CATEGORY_OPTIONS: TradeCategoryOption[] = [
  { value: 'general', label: 'General', icon: 'Wrench' },
  { value: 'electrical', label: 'Electrical', icon: 'Zap' },
  { value: 'plumbing', label: 'Plumbing', icon: 'Droplets' },
  { value: 'hvac', label: 'HVAC', icon: 'Wind' },
  { value: 'framing', label: 'Framing', icon: 'Square' },
  { value: 'drywall', label: 'Drywall', icon: 'Layers' },
  { value: 'flooring', label: 'Flooring', icon: 'Grid3x3' },
  { value: 'painting', label: 'Painting', icon: 'Paintbrush' },
  { value: 'roofing', label: 'Roofing', icon: 'Home' },
  { value: 'concrete', label: 'Concrete', icon: 'Mountain' },
  { value: 'masonry', label: 'Masonry', icon: 'Brick' },
  { value: 'landscaping', label: 'Landscaping', icon: 'Trees' },
  { value: 'cleanup', label: 'Cleanup', icon: 'Trash2' }
]

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
export const getPunchlistStatusColor = (status: PunchlistStatus): string => {
  const statusOption = PUNCHLIST_STATUS_OPTIONS.find(option => option.value === status)
  return statusOption?.color || 'gray'
}

export const getPunchlistPriorityColor = (priority: PunchlistPriority): string => {
  const priorityOption = PUNCHLIST_PRIORITY_OPTIONS.find(option => option.value === priority)
  return priorityOption?.color || 'gray'
}

export const getIssueTypeLabel = (issueType: IssueType): string => {
  const issueOption = ISSUE_TYPE_OPTIONS.find(option => option.value === issueType)
  return issueOption?.label || issueType
}

export const getTradeCategoryLabel = (tradeCategory: TradeCategory): string => {
  const tradeOption = TRADE_CATEGORY_OPTIONS.find(option => option.value === tradeCategory)
  return tradeOption?.label || tradeCategory
}

// ==============================================
// VALIDATION HELPERS
// ==============================================
export const isValidPunchlistStatus = (status: string): status is PunchlistStatus => {
  return PUNCHLIST_STATUS.includes(status as PunchlistStatus)
}

export const isValidPunchlistPriority = (priority: string): priority is PunchlistPriority => {
  return PUNCHLIST_PRIORITY.includes(priority as PunchlistPriority)
}

export const isValidIssueType = (issueType: string): issueType is IssueType => {
  return ISSUE_TYPE.includes(issueType as IssueType)
}

export const isValidTradeCategory = (tradeCategory: string): tradeCategory is TradeCategory => {
  return TRADE_CATEGORY.includes(tradeCategory as TradeCategory)
}