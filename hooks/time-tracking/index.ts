// ==============================================
// hooks/time-tracking/index.ts - Time Tracking Hooks Exports
// ==============================================

// Re-export all time tracking hooks
export * from './use-clock-session'
export * from './use-clock-in-out'
export * from './use-time-entries'
export * from './use-recent-entries'

// ==============================================
// CONVENIENCE EXPORTS FOR COMMON HOOKS
// ==============================================

// Main hooks
export { default as useClockSession } from './use-clock-session'
export { default as useClockInOut } from './use-clock-in-out'
export { default as useTimeEntries } from './use-time-entries'
export { default as useRecentEntries } from './use-recent-entries'

// Specialized hooks from use-clock-in-out
export { useQuickClockIn, useQuickClockOut } from './use-clock-in-out'

// Specialized hooks from use-time-entries
export { 
  useTodaysTimeEntries,
  usePendingTimeEntries,
  useUserTimeEntries,
  useProjectTimeEntries
} from './use-time-entries'