// ==============================================
// hooks/schedule-projects/index.ts - Schedule Projects Hooks Exports
// ==============================================

// Re-export all schedule project hooks
export * from './use-schedule-projects'
export * from './use-schedule-project'
export * from './use-create-schedule-project'
export * from './use-update-schedule-project'
// Note: We'll add delete hook later

// ==============================================
// CONVENIENCE EXPORTS FOR COMMON HOOKS
// ==============================================

// Main hooks
export { useScheduleProjects } from './use-schedule-projects'
export { useScheduleProject } from './use-schedule-project'
export { useCreateScheduleProject } from './use-create-schedule-project'
export { useUpdateScheduleProject } from './use-update-schedule-project'

// Utility hooks
export { useScheduleProjectStats } from './use-schedule-projects'