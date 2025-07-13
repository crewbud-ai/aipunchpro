// ==============================================
// types/punchlist-items/punchlist-item.ts - UPDATED FOR MULTIPLE ASSIGNMENTS
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

// Trade Categories
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

// NEW: Assignment Roles
export const ASSIGNMENT_ROLE = [
  'primary',      // Main responsible person
  'secondary',    // Helper/assistant
  'inspector',    // Quality control
  'supervisor'    // Oversight
] as const

export type AssignmentRole = typeof ASSIGNMENT_ROLE[number]

// ==============================================
// ASSIGNMENT INTERFACES
// ==============================================
export interface PunchlistItemAssignment {
    id: string
    projectMemberId: string
    role: 'primary' | 'secondary' | 'inspector' | 'supervisor'
    assignedAt: string
    assignedBy: string
    isActive: boolean
    user: {
        id?: string
        firstName: string
        lastName: string
        email?: string
        tradeSpecialty?: string
    } | null                    // ✅ This allows null
    hourlyRate?: number         // ✅ This allows undefined (not null)
}



export interface SafePunchlistItemAssignment {
    id: string
    projectMemberId: string
    role: 'primary' | 'secondary' | 'inspector' | 'supervisor'
    assignedAt: string
    assignedBy: string
    isActive: boolean
    user: {
        id?: string
        firstName: string
        lastName: string
        email?: string
        tradeSpecialty?: string
    } | null
    hourlyRate?: number
}

export interface AssignmentInput {
  projectMemberId: string
  role?: AssignmentRole
}

// ==============================================
// CORE PUNCHLIST ITEM INTERFACE (UPDATED)
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

  // REMOVED: Single assignment
  // assignedProjectMemberId?: string // REMOVED

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
}

// ==============================================
// PUNCHLIST ITEM WITH RELATIONSHIPS (UPDATED)
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

  // NEW: Multiple assignments
  assignedMembers?: PunchlistItemAssignment[]

  // DEPRECATED: Keep for backward compatibility
  assignedMember?: {
    id: string
    userId: string
    user: {
      email: string
      firstName: string
      lastName: string
      tradeSpecialty?: string
    }
  }

  // Reporter details
  reporter?: {
    firstName: string
    lastName: string
    email: string
  }

  // Inspector details  
  inspector?: {
    firstName: string
    lastName: string
    email: string
  }
}

// ==============================================
// SUMMARY INTERFACE (UPDATED)
// ==============================================
export interface PunchlistItemSummary {
  id: string
  companyId: string
  projectId: string
  relatedScheduleProjectId?: string

  // Issue Details
  title: string
  description?: string
  issueType: IssueType
  location?: string

  // UPDATED: Multiple assignment info
  assignedMemberCount: number
  assignedMemberNames: string[]
  primaryAssignee?: {
    id: string
    name: string
    tradeSpecialty?: string
  }

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
  reporter?: {
    firstName: string
    lastName: string
  }
}

// ==============================================
// PUNCHLIST ITEM FILTERS & SEARCH (UPDATED)
// ==============================================
export interface PunchlistItemFilters {
  // Basic filters
  projectId?: string
  relatedScheduleProjectId?: string
  status?: PunchlistStatus
  priority?: PunchlistPriority
  issueType?: IssueType
  tradeCategory?: TradeCategory

  // Assignment filters (UPDATED)
  assignedToUserId?: string  // Any user assigned to the item
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
// CREATE INTERFACES (UPDATED)
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
    punchlistItem: PunchlistItemWithDetails
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// UPDATE INTERFACES (UPDATED)
// ==============================================
export interface UpdatePunchlistItemData {
  id: string
  title?: string
  description?: string
  issueType?: IssueType
  location?: string
  roomArea?: string

  // UPDATED: Multiple assignments
  assignedMembers?: AssignmentInput[]

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
// ASSIGNMENT MANAGEMENT INTERFACES (NEW)
// ==============================================
export interface AddAssignmentData {
  punchlistItemId: string
  projectMemberId: string
  role?: AssignmentRole
}

export interface RemoveAssignmentData {
  punchlistItemId: string
  projectMemberId: string
}

export interface UpdateAssignmentRoleData {
  punchlistItemId: string
  projectMemberId: string
  role: AssignmentRole
}

export interface AssignmentResult {
  success: boolean
  message: string
  data: {
    assignment: PunchlistItemAssignment
  }
}

// ==============================================
// QUICK STATUS UPDATE (UNCHANGED)
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
// QUERY RESULTS (UPDATED)
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
    filters?: PunchlistItemFilters
  }
  notifications?: {
    message: string
  }
}

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
// FORM DATA INTERFACES (UPDATED)
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

export interface UpdatePunchlistItemFormData {
  id: string
  title: string
  description: string
  issueType: IssueType | ''
  location: string
  roomArea: string

  // UPDATED: Multiple assignments
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
  priority: PunchlistPriority
  status: PunchlistStatus
  dueDate: string
  estimatedHours: number | ''
  actualHours: number | ''
  resolutionNotes: string
  rejectionReason: string
  requiresInspection: boolean
  inspectionPassed: boolean | ''
  inspectionNotes: string
  photos: string[]
  attachments: string[]

  // UI state
  hasUnsavedChanges?: boolean
  modifiedFields?: string[]
  originalData?: PunchlistItemWithDetails
}

// ==============================================
// FORM ERRORS (UPDATED)
// ==============================================
export interface PunchlistItemFieldErrors {
  title?: string
  description?: string
  projectId?: string
  relatedScheduleProjectId?: string
  issueType?: string
  location?: string
  roomArea?: string
  assignedMembers?: string  // UPDATED: For multiple assignments
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
// STATISTICS (UPDATED)
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
  // NEW: Assignment statistics
  assignmentStats: {
    totalAssignments: number
    multipleAssignments: number
    unassignedItems: number
    averageAssignmentsPerItem: number
  }
}

// ==============================================
// OPTION INTERFACES
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

export interface AssignmentRoleOption {
  value: AssignmentRole
  label: string
  description?: string
  color?: string
}

// ==============================================
// FORM OPTIONS DATA (UPDATED)
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

// NEW: Assignment role options
export const ASSIGNMENT_ROLE_OPTIONS: AssignmentRoleOption[] = [
  { value: 'primary', label: 'Primary', description: 'Main responsible person', color: 'blue' },
  { value: 'secondary', label: 'Secondary', description: 'Helper/assistant', color: 'gray' },
  { value: 'inspector', label: 'Inspector', description: 'Quality control', color: 'green' },
  { value: 'supervisor', label: 'Supervisor', description: 'Oversight', color: 'purple' }
]

// ==============================================
// UTILITY FUNCTIONS (UPDATED)
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

export const getAssignmentRoleLabel = (role: AssignmentRole): string => {
  const roleOption = ASSIGNMENT_ROLE_OPTIONS.find(option => option.value === role)
  return roleOption?.label || role
}

export const getAssignmentRoleColor = (role: AssignmentRole): string => {
  const roleOption = ASSIGNMENT_ROLE_OPTIONS.find(option => option.value === role)
  return roleOption?.color || 'gray'
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

export const isValidAssignmentRole = (role: string): role is AssignmentRole => {
  return ASSIGNMENT_ROLE.includes(role as AssignmentRole)
}

// ==============================================
// HELPER FUNCTIONS FOR ASSIGNMENTS
// ==============================================
export const getPrimaryAssignee = (assignments: PunchlistItemAssignment[]): PunchlistItemAssignment | undefined => {
  return assignments.find(assignment => assignment.role === 'primary')
}

export const getSecondaryAssignees = (assignments: PunchlistItemAssignment[]): PunchlistItemAssignment[] => {
  return assignments.filter(assignment => assignment.role !== 'primary')
}

export const getAssigneesByRole = (assignments: PunchlistItemAssignment[], role: AssignmentRole): PunchlistItemAssignment[] => {
  return assignments.filter(assignment => assignment.role === role)
}

export const formatAssigneeNames = (assignments: PunchlistItemAssignment[]): string[] => {
  return assignments.map(assignment => `${assignment.user?.firstName} ${assignment.user?.lastName}`)
}

export const getAssignmentSummary = (assignments: PunchlistItemAssignment[]): string => {
  if (assignments.length === 0) return 'Unassigned'
  if (assignments.length === 1) return `${assignments[0].user?.firstName} ${assignments[0].user?.lastName}`

  const primary = getPrimaryAssignee(assignments)
  if (primary) {
    const others = assignments.length - 1
    return `${primary.user?.firstName} ${primary.user?.lastName}${others > 0 ? ` +${others} other${others > 1 ? 's' : ''}` : ''}`
  }

  return `${assignments.length} members assigned`
}

// ==============================================
// FORM STATE TYPES
// ==============================================
export type CreatePunchlistItemState =
  | 'idle'           // Initial state
  | 'loading'        // Creating punchlist item
  | 'success'        // Punchlist item created
  | 'error'          // Creation failed

export type UpdatePunchlistItemState =
  | 'idle'           // Initial state
  | 'loading'        // Updating punchlist item
  | 'success'        // Punchlist item updated
  | 'error'          // Update failed

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
// FILE UPLOAD INTERFACES
// ==============================================
export interface PhotoUploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface BulkPhotoUploadResult {
  success: boolean
  urls: string[]
  errors?: string[]
}

// ==============================================
// FILTERS FORM DATA (UPDATED)
// ==============================================
export interface PunchlistItemFiltersFormData {
  projectId: string
  relatedScheduleProjectId: string
  status: string
  priority: string
  issueType: string
  tradeCategory: string
  assignedToUserId: string  // UPDATED: Any assigned user
  reportedBy: string
  dueDateFrom: string
  dueDateTo: string
  requiresInspection: string
  isOverdue: string
  search: string
  sortBy: 'title' | 'status' | 'priority' | 'issueType' | 'dueDate' | 'createdAt'
  sortOrder: 'asc' | 'desc'
}