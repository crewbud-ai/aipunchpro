// ==============================================
// types/time-tracking/clock-session.ts - Clock In/Out Session Types
// ==============================================

import type { WorkType, TradeType } from './time-entry'

// ==============================================
// CLOCK IN/OUT DATA TYPES
// ==============================================
export interface ClockInData {
  projectId: string
  scheduleProjectId?: string
  description?: string
}

export interface ClockOutData {
  description?: string
  workCompleted?: string
  issuesEncountered?: string
}

// ==============================================
// CLOCK IN/OUT RESULT TYPES
// ==============================================
export interface ClockInResult {
  success: boolean
  data?: {
    timeEntry: {
      id: string
      projectId: string
      scheduleProjectId?: string
      startTime: string
      status: 'clocked_in'
    }
    session: {
      id: string
      projectName: string
      scheduleProjectTitle?: string
      startTime: string
      duration: number
    }
  }
  error?: string
  message: string
}

export interface ClockOutResult {
  success: boolean
  data?: {
    timeEntry: {
      id: string
      startTime: string
      endTime: string
      totalHours: number
      status: 'clocked_out'
    }
    summary: {
      totalHours: number
      regularHours: number
      overtimeHours: number
      projectName: string
    }
  }
  error?: string
  message: string
}

// ==============================================
// CURRENT SESSION TYPES
// ==============================================
export interface GetCurrentSessionResult {
  success: boolean
  data?: {
    hasActiveSession: boolean
    session?: {
      id: string
      userId: string
      projectId: string
      scheduleProjectId?: string
      startTime: string
      duration: number
      projectName: string
      scheduleProjectTitle?: string
      status: 'clocked_in'
    }
  }
  error?: string
  message: string
}

// ==============================================
// PROJECT SELECTION TYPES (for clock in)
// ==============================================
export interface ProjectForClockIn {
  id: string
  name: string
  status: string
  projectNumber?: string
  // User's role in this project
  memberRole?: string
  isActive: boolean
}

export interface ScheduleProjectForClockIn {
  id: string
  projectId: string
  title: string
  status: string
  startDate: string
  endDate: string
  trade?: string
  priority?: string
  isActive: boolean
}

export interface GetClockInOptionsResult {
  success: boolean
  data?: {
    projects: ProjectForClockIn[]
    scheduleProjects: ScheduleProjectForClockIn[]
    userInfo: {
      id: string
      name: string
      tradeSpecialty?: string
    }
  }
  error?: string
  message: string
}

// ==============================================
// CLOCK SESSION STATE TYPES
// ==============================================
export interface ClockSessionState {
  hasActiveSession: boolean
  currentSession?: {
    id: string
    projectId: string
    scheduleProjectId?: string
    projectName: string
    scheduleProjectTitle?: string
    startTime: string
    duration: number
  }
  isLoading: boolean
  error?: string
}

// ==============================================
// CLOCK ACTION STATE TYPES
// ==============================================
export interface ClockActionState {
  isClockingIn: boolean
  isClockingOut: boolean
  isLoadingOptions: boolean
  error?: string
}

// ==============================================
// FORM DATA TYPES
// ==============================================
export interface ClockInFormData {
  projectId: string
  scheduleProjectId: string
  workType: string
  trade: string
  description: string
  useLocation: boolean
}

export interface ClockOutFormData {
  description: string
  workCompleted: string
  issuesEncountered: string
  useLocation: boolean
}

// ==============================================
// FORM ERROR TYPES
// ==============================================
export interface ClockInFormErrors {
  projectId?: string
  scheduleProjectId?: string
  workType?: string
  trade?: string
  description?: string
  general?: string
}

export interface ClockOutFormErrors {
  description?: string
  workCompleted?: string
  issuesEncountered?: string
  general?: string
}

// ==============================================
// VALIDATION RESULT TYPES
// ==============================================
export interface ClockInValidation {
  success: boolean
  data?: ClockInData
  errors?: ClockInFormErrors
}

export interface ClockOutValidation {
  success: boolean
  data?: ClockOutData
  errors?: ClockOutFormErrors
}

// ==============================================
// TIME TRACKING WIDGET STATE
// ==============================================
export interface TimeTrackingWidgetState {
  // Session state
  hasActiveSession: boolean
  currentSession?: {
    id: string
    projectName: string
    scheduleProjectTitle?: string
    startTime: string
    duration: number
    formattedDuration: string
  }
  
  // UI state
  showClockInModal: boolean
  showClockOutModal: boolean
  isLoading: boolean
  
  // Options
  availableProjects: ProjectForClockIn[]
  availableScheduleProjects: ScheduleProjectForClockIn[]
  
  // Recent entries (for quick access)
  recentEntries: Array<{
    id: string
    date: string
    projectName: string
    totalHours: number
    status: string
  }>
  
  error?: string
}

// ==============================================
// UTILITY TYPES
// ==============================================
export type ClockActionType = 'clock_in' | 'clock_out' | 'switch_project'

export interface ClockActionEvent {
  type: ClockActionType
  timestamp: string
  projectId: string
  scheduleProjectId?: string
  success: boolean
  error?: string
}

// ==============================================
// DEFAULT VALUES
// ==============================================
export const DEFAULT_CLOCK_IN_FORM_DATA: ClockInFormData = {
  projectId: '',
  scheduleProjectId: '',
  workType: '',
  trade: '',
  description: '',
  useLocation: false
}

export const DEFAULT_CLOCK_OUT_FORM_DATA: ClockOutFormData = {
  description: '',
  workCompleted: '',
  issuesEncountered: '',
  useLocation: false
}