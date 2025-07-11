// ==============================================
// types/schedule-projects/index.ts - Schedule Projects Types Exports
// ==============================================

// Re-export all schedule project types
export * from './schedule-project'
export * from './create-schedule-project'
export * from './update-schedule-project'

// ==============================================
// CONVENIENCE EXPORTS FOR COMMON TYPES
// ==============================================

// Core Schedule Project Types
export type {
  ScheduleProject,
  ScheduleProjectSummary,
  ScheduleProjectFilters,
  ScheduleProjectFormErrors,
  ScheduleProjectFieldError,
  ScheduleProjectStats,
  ScheduleProjectsState,
  ScheduleProjectState,
  GetScheduleProjectsResult,
  GetScheduleProjectResult,
  DeleteScheduleProjectResult,
  ScheduleProjectFiltersFormData,
} from './schedule-project'

// Create Schedule Project Types
export type {
  CreateScheduleProjectData,
  CreateScheduleProjectResult,
  CreateScheduleProjectState,
  CreateScheduleProjectFormData,
  CreateScheduleProjectFormStep,
} from './create-schedule-project'

// Update Schedule Project Types
export type {
  UpdateScheduleProjectData,
  UpdateScheduleProjectResult,
  UpdateScheduleProjectState,
  UpdateScheduleProjectFormData,
  UpdateScheduleProjectFormStep,
  QuickUpdateScheduleStatusData,
  QuickUpdateScheduleStatusResult,
} from './update-schedule-project'

// ==============================================
// VALIDATION EXPORTS
// ==============================================

// Create Schedule Project Validation
export {
  createScheduleProjectSchema,
  validateCreateScheduleProject,
  getDefaultCreateScheduleProjectFormData,
  CREATE_SCHEDULE_PROJECT_FORM_STEPS,
  TRADE_REQUIRED,
  SCHEDULE_STATUS,
  SCHEDULE_PRIORITY,
  transformCreateFormDataToApiData,
} from './create-schedule-project'

// Update Schedule Project Validation
export {
  updateScheduleProjectSchema,
  quickUpdateScheduleStatusSchema,
  scheduleProjectFiltersSchema,
  validateUpdateScheduleProject,
  validateQuickUpdateScheduleStatus,
  validateScheduleProjectFilters,
  UPDATE_SCHEDULE_PROJECT_FORM_STEPS,
  transformUpdateFormDataToApiData,
  scheduleProjectToUpdateFormData,
  hasFormChanges,
} from './update-schedule-project'

// ==============================================
// CONSTANTS EXPORTS
// ==============================================

// Re-export commonly used constants
export { TRADE_REQUIRED as SCHEDULE_TRADES } from './create-schedule-project'
export { SCHEDULE_STATUS as SCHEDULE_STATUSES } from './create-schedule-project'
export { SCHEDULE_PRIORITY as SCHEDULE_PRIORITIES } from './create-schedule-project'