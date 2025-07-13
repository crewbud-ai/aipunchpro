// ==============================================
// types/punchlist-items/index.ts - Updated Punchlist Items Types Export
// ==============================================

import { CreatePunchlistItemFormData, CreatePunchlistItemFormErrors, CreatePunchlistItemResult, CreatePunchlistItemState, CreatePunchlistItemValidation } from './create-punchlist-item'
import { GetPunchlistItemResult, GetPunchlistItemsResult, QuickUpdatePunchlistStatusResult } from './punchlist-item'
import { UpdatePunchlistItemFormData, UpdatePunchlistItemFormErrors, UpdatePunchlistItemResult, UpdatePunchlistItemState, UpdatePunchlistItemValidation } from './update-punchlist-item'

// ==============================================
// MAIN PUNCHLIST ITEM TYPES
// ==============================================
export type {
  // Core interfaces
  PunchlistItem,
  PunchlistItemSummary,
  PunchlistItemWithDetails,
  PunchlistItemFilters,
  PunchlistItemFieldErrors,
  PunchlistItemStats,
  PunchlistItemsState,
  PunchlistItemState,
  GetPunchlistItemsResult,
  GetPunchlistItemResult,
  DeletePunchlistItemResult,
  PunchlistItemFiltersFormData,

  // NEW: Assignment interfaces
  PunchlistItemAssignment,
  AssignmentInput,

  // Enum types
  IssueType,
  PunchlistStatus,
  PunchlistPriority,
  TradeCategory,
  AssignmentRole,

  // Form option interfaces
  IssueTypeOption,
  PunchlistStatusOption,
  PunchlistPriorityOption,
  TradeCategoryOption,
  AssignmentRoleOption,

  // NEW: Assignment management interfaces
  AddAssignmentData,
  RemoveAssignmentData,
  UpdateAssignmentRoleData,
  AssignmentResult
} from './punchlist-item'

export {
  // Enum constants
  ISSUE_TYPE,
  PUNCHLIST_STATUS,
  PUNCHLIST_PRIORITY,
  TRADE_CATEGORY,
  ASSIGNMENT_ROLE,

  // Form option data
  ISSUE_TYPE_OPTIONS,
  PUNCHLIST_STATUS_OPTIONS,
  PUNCHLIST_PRIORITY_OPTIONS,
  TRADE_CATEGORY_OPTIONS,
  ASSIGNMENT_ROLE_OPTIONS,

  // Utility functions
  getPunchlistStatusColor,
  getPunchlistPriorityColor,
  getIssueTypeLabel,
  getTradeCategoryLabel,
  getAssignmentRoleLabel,
  getAssignmentRoleColor,

  // Validation helpers
  isValidPunchlistStatus,
  isValidPunchlistPriority,
  isValidIssueType,
  isValidTradeCategory,
  isValidAssignmentRole,

  // NEW: Assignment helpers
  getPrimaryAssignee,
  getSecondaryAssignees,
  getAssigneesByRole,
  formatAssigneeNames,
  getAssignmentSummary
} from './punchlist-item'

// ==============================================
// CREATE PUNCHLIST ITEM TYPES
// ==============================================
export {
  // Step configuration
  CREATE_PUNCHLIST_ITEM_STEPS,

  // Default values
  DEFAULT_CREATE_PUNCHLIST_ITEM_FORM_DATA,

  // Transformation functions
  transformCreateFormDataToApiData,
  getDefaultCreatePunchlistItemFormData
} from './create-punchlist-item'

export type {
  // Core create interfaces
  CreatePunchlistItemData,
  CreatePunchlistItemResult,
  CreatePunchlistItemFormData,
  CreatePunchlistItemFormErrors,
  CreatePunchlistItemValidation,

  // State types
  CreatePunchlistItemState,

  // Step interfaces
  CreatePunchlistItemStep,

  // Related interfaces
  ProjectMemberForPunchlist,
  ScheduleProjectForPunchlist,
  SubmitCreatePunchlistItemData,

  // File upload interfaces
  PunchlistFileUpload,
  PunchlistFileUploadResult
} from './create-punchlist-item'

// ==============================================
// UPDATE PUNCHLIST ITEM TYPES
// ==============================================
export {
  // Status workflow rules
  PUNCHLIST_STATUS_TRANSITIONS,
  REQUIRED_FIELDS_FOR_STATUS,

  // Default values
  DEFAULT_UPDATE_PUNCHLIST_ITEM_FORM_DATA,

  // Validation rules
  UPDATE_PUNCHLIST_ITEM_VALIDATION_RULES,

  // Utility functions
  isValidStatusTransition,
  getAvailableStatusTransitions,
  getRequiredFieldsForStatus,
  validateStatusChange,
  getStatusTransition,
  trackFormChanges,
  getModifiedFields,
  hasUnsavedChanges,
  transformUpdateFormDataToApiData,
  punchlistItemToUpdateFormData,
  hasFormChanges
} from './update-punchlist-item'

export type {
  // Core update interfaces
  UpdatePunchlistItemData,
  UpdatePunchlistItemResult,
  UpdatePunchlistItemFormData,
  UpdatePunchlistItemFormErrors,
  UpdatePunchlistItemValidation,

  // NEW: Assignment update interfaces
  UpdatePunchlistItemAssignmentData,

  // Quick status update
  QuickUpdatePunchlistStatusData,
  QuickUpdatePunchlistStatusResult,

  // State types
  UpdatePunchlistItemState,

  // Submission interfaces
  SubmitUpdatePunchlistItemData,

  // Status workflow
  PunchlistStatusTransition,
  PunchlistStatusWorkflow,

  // Bulk update
  BulkUpdatePunchlistItemsData,
  BulkUpdatePunchlistItemsResult,

  // Change tracking
  FieldChange
} from './update-punchlist-item'

// ==============================================
// 📸 PHOTO UPLOAD TYPES
// ==============================================
export interface PhotoUploadResult {
  success: boolean
  data?: {
    url: string
    fileName: string
    fileSize: number
  }
  error?: string
}

export interface BulkPhotoUploadResult {
  success: boolean
  data?: {
    uploadedPhotos: Array<{
      url: string
      fileName: string
      fileSize: number
    }>
    failedPhotos: Array<{
      fileName: string
      error: string
    }>
  }
  error?: string
}

// ==============================================
// VALIDATION EXPORTS
// ==============================================

// Create Punchlist Item Validation
export {
  createPunchlistItemSchema,
  validateCreatePunchlistItem,
} from './create-punchlist-item'

// Update Punchlist Item Validation
export {
  updatePunchlistItemSchema,
  quickUpdatePunchlistStatusSchema,
  validateUpdatePunchlistItem,
  validateQuickUpdatePunchlistStatus,
} from './update-punchlist-item'

// Core Validation Functions
export {
  getPunchlistItemsSchema,
  validateGetPunchlistItems,
  formatPunchlistItemErrors,
  transformCreatePunchlistItemData,
} from '@/lib/validations/punchlist/punchlist-items'

// ==============================================
// CONSTANTS EXPORTS
// ==============================================

// Re-export commonly used constants
export { ISSUE_TYPE as PUNCHLIST_ISSUE_TYPES } from './punchlist-item'
export { PUNCHLIST_STATUS as PUNCHLIST_STATUS_TYPES } from './punchlist-item'
export { PUNCHLIST_PRIORITY as PUNCHLIST_PRIORITY_TYPES } from './punchlist-item'
export { TRADE_CATEGORY as PUNCHLIST_TRADE_CATEGORIES } from './punchlist-item'
export { ASSIGNMENT_ROLE as PUNCHLIST_ASSIGNMENT_ROLES } from './punchlist-item'

// ==============================================
// CONVENIENCE TYPE COMBINATIONS
// ==============================================

// Common type combinations for easy importing
export type PunchlistItemFormData = CreatePunchlistItemFormData | UpdatePunchlistItemFormData
export type PunchlistItemFormErrors = CreatePunchlistItemFormErrors | UpdatePunchlistItemFormErrors
export type PunchlistItemValidation = CreatePunchlistItemValidation | UpdatePunchlistItemValidation

// API response types
export type PunchlistItemApiResponse = GetPunchlistItemResult | GetPunchlistItemsResult
export type PunchlistItemMutationResult = CreatePunchlistItemResult | UpdatePunchlistItemResult | QuickUpdatePunchlistStatusResult

// Form state types
export type PunchlistItemFormState = CreatePunchlistItemState | UpdatePunchlistItemState

// Photo upload convenience types
export type PhotoUploadApiResult = PhotoUploadResult | BulkPhotoUploadResult

// ==============================================
// TYPE GUARDS
// ==============================================

// Check if response is for multiple items
export const isPunchlistItemsResponse = (
  response: PunchlistItemApiResponse
): response is GetPunchlistItemsResult => {
  return Array.isArray((response as GetPunchlistItemsResult).data.punchlistItems)
}

// Check if response is for single item
export const isPunchlistItemResponse = (
  response: PunchlistItemApiResponse
): response is GetPunchlistItemResult => {
  return 'punchlistItem' in (response as GetPunchlistItemResult).data
}

// Check if form data is for creating
export const isCreatePunchlistItemFormData = (
  formData: PunchlistItemFormData
): formData is CreatePunchlistItemFormData => {
  return !('id' in formData)
}

// Check if form data is for updating
export const isUpdatePunchlistItemFormData = (
  formData: PunchlistItemFormData
): formData is UpdatePunchlistItemFormData => {
  return 'id' in formData
}

// Check if result is from create operation
export const isCreatePunchlistItemResult = (
  result: PunchlistItemMutationResult
): result is CreatePunchlistItemResult => {
  return 'data' in result && 'punchlistItem' in result.data
}

// Check if result is from update operation
export const isUpdatePunchlistItemResult = (
  result: PunchlistItemMutationResult
): result is UpdatePunchlistItemResult => {
  return 'data' in result && 'punchlistItem' in result.data
}

// Check if result is from quick status update
export const isQuickUpdatePunchlistStatusResult = (
  result: PunchlistItemMutationResult
): result is QuickUpdatePunchlistStatusResult => {
  return 'data' in result && 'punchlistItem' in result.data
}

// Photo upload type guards
export const isPhotoUploadResult = (
  result: PhotoUploadApiResult
): result is PhotoUploadResult => {
  return 'success' in result && 'data' in result && result.data !== undefined
}

export const isBulkPhotoUploadResult = (
  result: PhotoUploadApiResult
): result is BulkPhotoUploadResult => {
  return 'success' in result && 'data' in result && result.data !== undefined && 'uploadedPhotos' in result.data
}