// ==============================================
// types/time-tracking/time-entry.ts - Core Time Entry Types
// ==============================================

// ==============================================
// ENUMS & CONSTANTS
// ==============================================
export const TIME_ENTRY_STATUS = {
  CLOCKED_IN: 'clocked_in',
  CLOCKED_OUT: 'clocked_out', 
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  MODIFIED: 'modified'
} as const

export const WORK_TYPE = {
  INSTALLATION: 'installation',
  REPAIR: 'repair', 
  CLEANUP: 'cleanup',
  INSPECTION: 'inspection',
  MAINTENANCE: 'maintenance',
  SETUP: 'setup',
  DEMOLITION: 'demolition',
  GENERAL: 'general'
} as const

export const TRADE_TYPE = {
  ELECTRICAL: 'electrical',
  PLUMBING: 'plumbing', 
  HVAC: 'hvac',
  FRAMING: 'framing',
  DRYWALL: 'drywall',
  FLOORING: 'flooring',
  PAINTING: 'painting',
  ROOFING: 'roofing',
  CONCRETE: 'concrete',
  MASONRY: 'masonry',
  LANDSCAPING: 'landscaping',
  GENERAL: 'general'
} as const

// ==============================================
// TYPE DEFINITIONS
// ==============================================
export type TimeEntryStatus = typeof TIME_ENTRY_STATUS[keyof typeof TIME_ENTRY_STATUS]
export type WorkType = typeof WORK_TYPE[keyof typeof WORK_TYPE]
export type TradeType = typeof TRADE_TYPE[keyof typeof TRADE_TYPE]

// ==============================================
// CORE TIME ENTRY INTERFACE
// ==============================================
export interface TimeEntry {
  id: string
  companyId: string
  projectId: string
  scheduleProjectId?: string
  
  // Worker Information
  userId: string
  workerName?: string
  isSystemUser: boolean
  
  // Time Details
  date: string
  startTime?: string  // Clock in time
  endTime?: string    // Clock out time
  breakMinutes: number
  
  // Calculated Hours
  regularHours: number
  overtimeHours: number
  doubleTimeHours: number
  totalHours: number
  
  // Rates & Pay
  regularRate?: number
  overtimeRate?: number
  doubleTimeRate?: number
  totalPay?: number
  
  // Work Context
  description?: string
  workType?: WorkType
  trade?: TradeType
  
  // Location
  clockInLocation?: { lat: number; lng: number }
  clockOutLocation?: { lat: number; lng: number }
  workLocation?: string
  
  // Status & Approval
  status: TimeEntryStatus
  submittedAt?: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  
  // Additional Details
  equipmentUsed?: string[]
  materialsUsed?: string[]
  weatherConditions?: string
  temperatureF?: number
  workConditions?: string
  
  // Safety & Quality
  safetyIncidents?: string
  ppe?: string[]
  workCompleted?: string
  issuesEncountered?: string
  nextSteps?: string
  qualityRating?: number
  
  // Metadata
  createdBy?: string
  lastModifiedBy?: string
  createdAt: string
  updatedAt: string
}

// ==============================================
// TIME ENTRY WITH RELATIONSHIPS
// ==============================================
export interface TimeEntryWithDetails extends TimeEntry {
  // Project relationship
  project?: {
    id: string
    name: string
    status: string
    projectNumber?: string
  }
  
  // Schedule project relationship
  scheduleProject?: {
    id: string
    title: string
    status: string
    startDate: string
    endDate: string
  }
  
  // Worker details
  worker?: {
    id: string
    firstName: string
    lastName: string
    email: string
    tradeSpecialty?: string
  }
  
  // Approver details
  approver?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

// ==============================================
// SUMMARY INTERFACE (for lists)
// ==============================================
export interface TimeEntrySummary {
  id: string
  companyId: string
  projectId: string
  scheduleProjectId?: string
  
  // Worker info
  userId: string
  workerName: string
  
  // Time summary
  date: string
  startTime?: string
  endTime?: string
  totalHours: number
  
  // Work info
  workType?: WorkType
  trade?: TradeType
  status: TimeEntryStatus
  
  // Project info
  projectName: string
  scheduleProjectTitle?: string
  
  // Quick status
  isActive: boolean  // status === 'clocked_in'
  needsApproval: boolean  // status === 'pending'
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

// ==============================================
// FILTER & QUERY INTERFACES
// ==============================================
export interface TimeEntryFilters {
  userId?: string
  projectId?: string
  scheduleProjectId?: string
  status?: TimeEntryStatus
  workType?: WorkType
  trade?: TradeType
  dateFrom?: string
  dateTo?: string
  search?: string
  needsApproval?: boolean
  isActive?: boolean
  sortBy?: 'date' | 'startTime' | 'totalHours' | 'status' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// ==============================================
// API RESPONSE INTERFACES
// ==============================================
export interface GetTimeEntriesResult {
  success: boolean
  data: {
    timeEntries: TimeEntrySummary[]
    totalCount: number
    pagination: {
      limit: number
      offset: number
      hasMore: boolean
    }
  }
  message: string
}

export interface GetTimeEntryResult {
  success: boolean
  data: {
    timeEntry: TimeEntryWithDetails
  }
  message: string
}

// ==============================================
// CLOCK SESSION INTERFACE (for active sessions)
// ==============================================
export interface ClockSession {
  id: string
  userId: string
  projectId: string
  scheduleProjectId?: string
  
  // Session details
  startTime: string
  currentDuration: number  // minutes
  status: 'clocked_in'
  
  // Work context
  workType?: WorkType
  trade?: TradeType
  description?: string
  
  // Project info
  projectName: string
  scheduleProjectTitle?: string
  
  // Location
  clockInLocation?: { lat: number; lng: number }
  
  // Timestamps
  clockedInAt: string
}

// ==============================================
// TIME ENTRY STATISTICS
// ==============================================
export interface TimeEntryStats {
  totalEntries: number
  activeSession?: ClockSession
  
  // Status breakdown
  byStatus: {
    clocked_in: number
    clocked_out: number
    pending: number
    approved: number
    rejected: number
  }
  
  // Time summary (for current period)
  totalHours: number
  regularHours: number
  overtimeHours: number
  
  // Today's summary
  todayHours: number
  todayStatus: 'not_started' | 'clocked_in' | 'completed'
  
  // This week summary
  weekHours: number
  weekDays: number
}

// ==============================================
// FORM ERROR TYPES
// ==============================================
export interface TimeEntryFieldError {
  field: string
  message: string
}

export interface TimeEntryFormErrors {
  projectId?: string
  scheduleProjectId?: string
  workType?: string
  trade?: string
  description?: string
  general?: string
}

// ==============================================
// STATE TYPES
// ==============================================
export type TimeEntriesState = 'loading' | 'loaded' | 'error' | 'empty'
export type TimeEntryState = 'loading' | 'loaded' | 'error' | 'not_found'

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
export const getTimeEntryStatusColor = (status: TimeEntryStatus): string => {
  switch (status) {
    case 'clocked_in':
      return 'bg-green-100 text-green-800'
    case 'clocked_out':
      return 'bg-blue-100 text-blue-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'approved':
      return 'bg-emerald-100 text-emerald-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    case 'modified':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const getWorkTypeLabel = (workType: WorkType): string => {
  switch (workType) {
    case 'installation':
      return 'Installation'
    case 'repair':
      return 'Repair'
    case 'cleanup':
      return 'Cleanup'
    case 'inspection':
      return 'Inspection'
    case 'maintenance':
      return 'Maintenance'
    case 'setup':
      return 'Setup'
    case 'demolition':
      return 'Demolition'
    case 'general':
      return 'General Work'
    default:
      return 'Unknown'
  }
}

export const getTradeTypeLabel = (trade: TradeType): string => {
  switch (trade) {
    case 'electrical':
      return 'Electrical'
    case 'plumbing':
      return 'Plumbing'
    case 'hvac':
      return 'HVAC'
    case 'framing':
      return 'Framing'
    case 'drywall':
      return 'Drywall'
    case 'flooring':
      return 'Flooring'
    case 'painting':
      return 'Painting'
    case 'roofing':
      return 'Roofing'
    case 'concrete':
      return 'Concrete'
    case 'masonry':
      return 'Masonry'
    case 'landscaping':
      return 'Landscaping'
    case 'general':
      return 'General'
    default:
      return 'Unknown'
  }
}

// ==============================================
// VALIDATION HELPERS
// ==============================================
export const isValidTimeEntryStatus = (status: string): status is TimeEntryStatus => {
  return Object.values(TIME_ENTRY_STATUS).includes(status as TimeEntryStatus)
}

export const isValidWorkType = (workType: string): workType is WorkType => {
  return Object.values(WORK_TYPE).includes(workType as WorkType)
}

export const isValidTradeType = (trade: string): trade is TradeType => {
  return Object.values(TRADE_TYPE).includes(trade as TradeType)
}

// ==============================================
// TIME CALCULATION HELPERS
// ==============================================
export const calculateSessionDuration = (startTime: string): number => {
  const start = new Date(`1970-01-01T${startTime}`)
  const now = new Date()
  const currentTime = new Date(`1970-01-01T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`)
  
  const diffMs = currentTime.getTime() - start.getTime()
  return Math.floor(diffMs / (1000 * 60)) // minutes
}

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) {
    return `${mins}m`
  }
  
  return `${hours}h ${mins}m`
}