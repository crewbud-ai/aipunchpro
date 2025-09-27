// ==============================================
// types/time-tracking/create-time-entry.ts - Create Time Entry Types
// ==============================================

import type { WorkType, TradeType, TimeEntryFormErrors } from './time-entry'

// ==============================================
// CREATE TIME ENTRY DATA
// ==============================================
export interface CreateTimeEntryData {
  projectId: string
  scheduleProjectId?: string
  
  // Time details
  date: string
  startTime: string
  endTime?: string
  breakMinutes?: number
  
  // Work context
  workType?: WorkType
  trade?: TradeType
  description?: string
  
  // Location (optional)
  clockInLocation?: {
    lat: number
    lng: number
  }
  clockOutLocation?: {
    lat: number
    lng: number
  }
  workLocation?: string
  
  // Additional details (optional)
  equipmentUsed?: string[]
  materialsUsed?: string[]
  weatherConditions?: string
  temperatureF?: number
  workConditions?: string
  
  // Safety & quality (optional)
  safetyIncidents?: string
  ppe?: string[]
  workCompleted?: string
  issuesEncountered?: string
  nextSteps?: string
  qualityRating?: number
}

// ==============================================
// CREATE TIME ENTRY RESULT
// ==============================================
export interface CreateTimeEntryResult {
  success: boolean
  data?: {
    timeEntry: {
      id: string
      projectId: string
      scheduleProjectId?: string
      date: string
      startTime: string
      endTime?: string
      totalHours: number
      status: string
      projectName: string
      scheduleProjectTitle?: string
    }
  }
  error?: string
  message: string
}

// ==============================================
// FORM DATA TYPES
// ==============================================
export interface CreateTimeEntryFormData {
  // Basic info
  projectId: string
  scheduleProjectId: string
  date: string
  startTime: string
  endTime: string
  
  // Work details
  workType: string
  trade: string
  description: string
  
  // Break time
  breakMinutes: string
  
  // Location
  useLocation: boolean
  workLocation: string
  
  // Additional details
  equipmentUsed: string
  materialsUsed: string
  weatherConditions: string
  temperatureF: string
  workConditions: string
  
  // Safety & quality
  safetyIncidents: string
  ppe: string
  workCompleted: string
  issuesEncountered: string
  nextSteps: string
  qualityRating: string
}

// ==============================================
// FORM ERROR TYPES
// ==============================================
export interface CreateTimeEntryFormErrors extends TimeEntryFormErrors {
  date?: string
  startTime?: string
  endTime?: string
  breakMinutes?: string
  workLocation?: string
  equipmentUsed?: string
  materialsUsed?: string
  weatherConditions?: string
  temperatureF?: string
  workConditions?: string
  safetyIncidents?: string
  ppe?: string
  workCompleted?: string
  issuesEncountered?: string
  nextSteps?: string
  qualityRating?: string
}

// ==============================================
// VALIDATION RESULT
// ==============================================
export interface CreateTimeEntryValidation {
  success: boolean
  data?: CreateTimeEntryData
  errors?: CreateTimeEntryFormErrors
}

// ==============================================
// FORM STEP TYPES (if multi-step form needed)
// ==============================================
export interface CreateTimeEntryStep {
  id: string
  title: string
  description: string
  fields: string[]
  isOptional: boolean
}

export type CreateTimeEntryStepId = 'basic' | 'details' | 'additional' | 'safety'

// ==============================================
// FORM STATE TYPES
// ==============================================
export type CreateTimeEntryState = 'idle' | 'loading' | 'success' | 'error'

export interface CreateTimeEntryHookState {
  formData: CreateTimeEntryFormData
  errors: CreateTimeEntryFormErrors
  isLoading: boolean
  canSubmit: boolean
  state: CreateTimeEntryState
  error: string | null
}

// ==============================================
// PROJECT & SCHEDULE PROJECT OPTIONS
// ==============================================
export interface ProjectOptionForTimeEntry {
  id: string
  name: string
  status: string
  projectNumber?: string
  isActive: boolean
}

export interface ScheduleProjectOptionForTimeEntry {
  id: string
  title: string
  status: string
  projectId: string
  startDate: string
  endDate: string
  trade?: string
  isActive: boolean
}

// ==============================================
// STEP CONFIGURATION
// ==============================================
export const CREATE_TIME_ENTRY_STEPS: CreateTimeEntryStep[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Project, date, and time details',
    fields: ['projectId', 'scheduleProjectId', 'date', 'startTime', 'endTime'],
    isOptional: false
  },
  {
    id: 'details',
    title: 'Work Details',
    description: 'Work type, trade, and description',
    fields: ['workType', 'trade', 'description', 'breakMinutes'],
    isOptional: false
  },
  {
    id: 'additional',
    title: 'Additional Information',
    description: 'Equipment, materials, and conditions',
    fields: ['equipmentUsed', 'materialsUsed', 'weatherConditions', 'temperatureF', 'workConditions'],
    isOptional: true
  },
  {
    id: 'safety',
    title: 'Safety & Quality',
    description: 'Safety incidents and work quality notes',
    fields: ['safetyIncidents', 'ppe', 'workCompleted', 'issuesEncountered', 'nextSteps', 'qualityRating'],
    isOptional: true
  }
]

// ==============================================
// DEFAULT FORM DATA
// ==============================================
export const DEFAULT_CREATE_TIME_ENTRY_FORM_DATA: CreateTimeEntryFormData = {
  projectId: '',
  scheduleProjectId: '',
  date: new Date().toISOString().split('T')[0], // Today's date
  startTime: '',
  endTime: '',
  workType: '',
  trade: '',
  description: '',
  breakMinutes: '0',
  useLocation: false,
  workLocation: '',
  equipmentUsed: '',
  materialsUsed: '',
  weatherConditions: '',
  temperatureF: '',
  workConditions: '',
  safetyIncidents: '',
  ppe: '',
  workCompleted: '',
  issuesEncountered: '',
  nextSteps: '',
  qualityRating: ''
}

// ==============================================
// TRANSFORMATION HELPERS
// ==============================================
export const transformCreateFormDataToApiData = (formData: CreateTimeEntryFormData): CreateTimeEntryData => {
  const data: CreateTimeEntryData = {
    projectId: formData.projectId,
    date: formData.date,
    startTime: formData.startTime,
    workType: formData.workType as WorkType || undefined,
    trade: formData.trade as TradeType || undefined,
    description: formData.description || undefined,
    breakMinutes: formData.breakMinutes ? parseInt(formData.breakMinutes) : 0
  }

  // Add optional fields if provided
  if (formData.scheduleProjectId) {
    data.scheduleProjectId = formData.scheduleProjectId
  }
  
  if (formData.endTime) {
    data.endTime = formData.endTime
  }
  
  if (formData.workLocation) {
    data.workLocation = formData.workLocation
  }
  
  if (formData.equipmentUsed) {
    data.equipmentUsed = formData.equipmentUsed.split(',').map(item => item.trim()).filter(Boolean)
  }
  
  if (formData.materialsUsed) {
    data.materialsUsed = formData.materialsUsed.split(',').map(item => item.trim()).filter(Boolean)
  }
  
  if (formData.weatherConditions) {
    data.weatherConditions = formData.weatherConditions
  }
  
  if (formData.temperatureF) {
    data.temperatureF = parseInt(formData.temperatureF)
  }
  
  if (formData.workConditions) {
    data.workConditions = formData.workConditions
  }
  
  if (formData.safetyIncidents) {
    data.safetyIncidents = formData.safetyIncidents
  }
  
  if (formData.ppe) {
    data.ppe = formData.ppe.split(',').map(item => item.trim()).filter(Boolean)
  }
  
  if (formData.workCompleted) {
    data.workCompleted = formData.workCompleted
  }
  
  if (formData.issuesEncountered) {
    data.issuesEncountered = formData.issuesEncountered
  }
  
  if (formData.nextSteps) {
    data.nextSteps = formData.nextSteps
  }
  
  if (formData.qualityRating) {
    data.qualityRating = parseInt(formData.qualityRating)
  }

  return data
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
export const getDefaultCreateTimeEntryFormData = (): CreateTimeEntryFormData => ({
  ...DEFAULT_CREATE_TIME_ENTRY_FORM_DATA
})

export const calculateTotalHours = (startTime: string, endTime: string, breakMinutes: number = 0): number => {
  if (!startTime || !endTime) return 0
  
  const start = new Date(`1970-01-01T${startTime}`)
  const end = new Date(`1970-01-01T${endTime}`)
  
  const diffMs = end.getTime() - start.getTime()
  const totalMinutes = Math.floor(diffMs / (1000 * 60)) - breakMinutes
  
  return Math.max(0, totalMinutes / 60) // Convert to hours, ensure non-negative
}