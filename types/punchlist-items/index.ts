// ==============================================
// types/punchlist-items/index.ts - Punchlist Items Types Export
// ==============================================

// ==============================================
// IMPORT ALL TYPES FIRST
// ==============================================
import type {
  CreatePunchlistItemFormData,
  CreatePunchlistItemFormErrors,
  CreatePunchlistItemValidation,
  CreatePunchlistItemState,
  CreatePunchlistItemResult
} from './create-punchlist-item'

import type {
  UpdatePunchlistItemFormData,
  UpdatePunchlistItemFormErrors,
  UpdatePunchlistItemValidation,
  UpdatePunchlistItemState,
  UpdatePunchlistItemResult,
  QuickUpdatePunchlistStatusResult
} from './update-punchlist-item'

import type {
  GetPunchlistItemsResult,
  GetPunchlistItemResult
} from './punchlist-item'

// ✅ FIXED: Import from upload-photos.ts (note: you had 'upload-photes' - typo)
import type {
  BulkPhotoUploadResult,
  PhotoUploadResult
} from './upload-photos'

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
  PunchlistItemFieldError,
  PunchlistItemStats,
  PunchlistItemsState,
  PunchlistItemState,
  GetPunchlistItemsResult,
  GetPunchlistItemResult,
  DeletePunchlistItemResult,
  PunchlistItemFiltersFormData,

  // Enum types
  IssueType,
  PunchlistStatus,
  PunchlistPriority,
  TradeCategory,

  // Form option interfaces
  IssueTypeOption,
  PunchlistStatusOption,
  PunchlistPriorityOption,
  TradeCategoryOption
} from './punchlist-item'

export {
  // Enum constants
  ISSUE_TYPE,
  PUNCHLIST_STATUS,
  PUNCHLIST_PRIORITY,
  TRADE_CATEGORY,

  // Form option data
  ISSUE_TYPE_OPTIONS,
  PUNCHLIST_STATUS_OPTIONS,
  PUNCHLIST_PRIORITY_OPTIONS,
  TRADE_CATEGORY_OPTIONS,

  // Utility functions
  getPunchlistStatusColor,
  getPunchlistPriorityColor,
  getIssueTypeLabel,
  getTradeCategoryLabel,

  // Validation helpers
  isValidPunchlistStatus,
  isValidPunchlistPriority,
  isValidIssueType,
  isValidTradeCategory
} from './punchlist-item'

// ==============================================
// CREATE PUNCHLIST ITEM TYPES
// ==============================================
export {
  // Step configuration
  CREATE_PUNCHLIST_ITEM_STEPS,

  // Default values
  DEFAULT_CREATE_PUNCHLIST_ITEM_FORM_DATA,

  // Validation rules
  CREATE_PUNCHLIST_ITEM_VALIDATION_RULES,

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
  PunchlistFileUploadResult,

  // Utility types
  FieldValidationState,
  StepCompletionStatus,
  FormSubmissionState
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
// 📸 PHOTO UPLOAD TYPES (NEW SECTION)
// ==============================================
export type {
  // Photo upload result types
  PhotoUploadResult,
  BulkPhotoUploadResult,
} from './upload-photos'

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
export { PUNCHLIST_STATUS as PUNCHLIST_STATUSES } from './punchlist-item'
export { PUNCHLIST_PRIORITY as PUNCHLIST_PRIORITIES } from './punchlist-item'
export { TRADE_CATEGORY as PUNCHLIST_TRADE_CATEGORIES } from './punchlist-item'

// ==============================================
// RE-EXPORT CONVENIENCE TYPES
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

// 📸 Photo upload convenience types
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

// 📸 Photo upload type guards
export const isPhotoUploadResult = (
  result: PhotoUploadApiResult
): result is PhotoUploadResult => {
  return 'data' in result && result.data !== undefined && 'url' in result.data
}

export const isBulkPhotoUploadResult = (
  result: PhotoUploadApiResult
): result is BulkPhotoUploadResult => {
  return 'data' in result && result.data !== undefined && 'uploadedPhotos' in result.data
}