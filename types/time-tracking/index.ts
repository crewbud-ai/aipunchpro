// ==============================================
// types/time-tracking/index.ts - Time Tracking Types Exports
// ==============================================

// Re-export all time tracking types
export * from './time-entry'
export * from './clock-session'
export * from './create-time-entry'

// ==============================================
// CONVENIENCE EXPORTS FOR COMMON TYPES
// ==============================================

// Core Time Entry Types
export type {
  TimeEntry,
  TimeEntrySummary,
  TimeEntryWithDetails,
  TimeEntryFilters,
  TimeEntryFormErrors,
  TimeEntryFieldError,
  TimeEntryStats,
  TimeEntriesState,
  TimeEntryState,
  GetTimeEntriesResult,
  GetTimeEntryResult,
  ClockSession,
  TimeEntryStatus,
  WorkType,
  TradeType
} from './time-entry'

// Clock Session Types
export type {
  ClockInData,
  ClockOutData,
  ClockInResult,
  ClockOutResult,
  GetCurrentSessionResult,
  ProjectForClockIn,
  ScheduleProjectForClockIn,
  GetClockInOptionsResult,
  ClockSessionState,
  ClockActionState,
  ClockInFormData,
  ClockOutFormData,
  ClockInFormErrors,
  ClockOutFormErrors,
  ClockInValidation,
  ClockOutValidation,
  TimeTrackingWidgetState,
  ClockActionType,
  ClockActionEvent
} from './clock-session'

// Create Time Entry Types
export type {
  CreateTimeEntryData,
  CreateTimeEntryResult,
  CreateTimeEntryFormData,
  CreateTimeEntryFormErrors,
  CreateTimeEntryValidation,
  CreateTimeEntryStep,
  CreateTimeEntryStepId,
  CreateTimeEntryState,
  CreateTimeEntryHookState,
  ProjectOptionForTimeEntry,
  ScheduleProjectOptionForTimeEntry
} from './create-time-entry'

// ==============================================
// CONSTANTS EXPORTS
// ==============================================

// Re-export commonly used constants
export { TIME_ENTRY_STATUS as TIME_ENTRY_STATUSES } from './time-entry'
export { WORK_TYPE as WORK_TYPES } from './time-entry'
export { TRADE_TYPE as TRADE_TYPES } from './time-entry'

// Form configuration exports
export { 
  CREATE_TIME_ENTRY_STEPS,
  DEFAULT_CREATE_TIME_ENTRY_FORM_DATA
} from './create-time-entry'

export {
  DEFAULT_CLOCK_IN_FORM_DATA,
  DEFAULT_CLOCK_OUT_FORM_DATA
} from './clock-session'

// ==============================================
// UTILITY FUNCTIONS EXPORTS
// ==============================================

// Time Entry utilities
export {
  getTimeEntryStatusColor,
  getWorkTypeLabel,
  getTradeTypeLabel,
  isValidTimeEntryStatus,
  isValidWorkType,
  isValidTradeType,
  calculateSessionDuration,
  formatDuration
} from './time-entry'

// Create Time Entry utilities
export {
  transformCreateFormDataToApiData,
  getDefaultCreateTimeEntryFormData,
  calculateTotalHours
} from './create-time-entry'

// ==============================================
// CONVENIENCE TYPE COMBINATIONS
// ==============================================

// Common type combinations for easy importing
export type TimeEntryFormData = CreateTimeEntryFormData
export type TimeEntryApiResponse = GetTimeEntriesResult | GetTimeEntryResult
export type ClockActionResult = ClockInResult | ClockOutResult

// Form state types
export type TimeEntryHookReturn = CreateTimeEntryHookState

// Clock session types
export type ClockSessionHookReturn = ClockSessionState & ClockActionState

// ==============================================
// TYPE GUARDS
// ==============================================

// Check if response is for multiple entries
export const isTimeEntriesResponse = (
  response: TimeEntryApiResponse
): response is GetTimeEntriesResult => {
  return Array.isArray((response as GetTimeEntriesResult).data.timeEntries)
}

// Check if response is for single entry
export const isTimeEntryResponse = (
  response: TimeEntryApiResponse
): response is GetTimeEntryResult => {
  return 'timeEntry' in (response as GetTimeEntryResult).data
}

import { ClockActionState, ClockInResult, ClockOutResult, ClockSessionState } from './clock-session'
import { CreateTimeEntryFormData, CreateTimeEntryHookState } from './create-time-entry'
// Import types for type guards
import type { ClockSession, GetTimeEntriesResult, GetTimeEntryResult, TimeEntry } from './time-entry'

// Check if user has active session
export const hasActiveSession = (session?: ClockSession): session is ClockSession => {
  return session !== undefined && session.status === 'clocked_in'
}

// Check if time entry is currently active
export const isActiveTimeEntry = (timeEntry: TimeEntry): boolean => {
  return timeEntry.status === 'clocked_in'
}

// Check if time entry needs approval
export const needsApproval = (timeEntry: TimeEntry): boolean => {
  return timeEntry.status === 'pending'
}

// ==============================================
// FORM OPTION DATA
// ==============================================

// Work type options for forms
export const WORK_TYPE_OPTIONS = [
  { value: 'installation', label: 'Installation' },
  { value: 'repair', label: 'Repair' },
  { value: 'cleanup', label: 'Cleanup' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'setup', label: 'Setup' },
  { value: 'demolition', label: 'Demolition' },
  { value: 'general', label: 'General Work' }
]

// Trade type options for forms
export const TRADE_TYPE_OPTIONS = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'framing', label: 'Framing' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'painting', label: 'Painting' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'general', label: 'General' }
]

// Status options for forms/filters
export const TIME_ENTRY_STATUS_OPTIONS = [
  { value: 'clocked_in', label: 'Clocked In', color: 'bg-green-100 text-green-800' },
  { value: 'clocked_out', label: 'Clocked Out', color: 'bg-blue-100 text-blue-800' },
  { value: 'pending', label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'modified', label: 'Modified', color: 'bg-orange-100 text-orange-800' }
]

// Quality rating options
export const QUALITY_RATING_OPTIONS = [
  { value: '1', label: '1 - Poor' },
  { value: '2', label: '2 - Fair' },
  { value: '3', label: '3 - Good' },
  { value: '4', label: '4 - Very Good' },
  { value: '5', label: '5 - Excellent' }
]