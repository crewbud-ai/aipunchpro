// ==============================================
// types/reports/payroll.ts - Payroll Report Types
// ==============================================

// ==============================================
// ENUMS & CONSTANTS
// ==============================================
export const PAYROLL_REPORT_STATUS = {
  ALL: 'all',
  PENDING: 'pending',
  APPROVED: 'approved',
  CLOCKED_OUT: 'clocked_out'
} as const

export const PAYROLL_GROUP_BY = {
  PERSON: 'person',
  PROJECT: 'project',
  COST_CODE: 'cost_code',
  DATE: 'date'
} as const

export const PAYROLL_DATE_RANGE_PRESET = {
  THIS_WEEK: 'this-week',
  LAST_WEEK: 'last-week',
  THIS_MONTH: 'this-month',
  LAST_MONTH: 'last-month',
  THIS_QUARTER: 'this-quarter',
  THIS_YEAR: 'this-year',
  CUSTOM: 'custom'
} as const

// ==============================================
// TYPE DEFINITIONS
// ==============================================
export type PayrollReportStatus = typeof PAYROLL_REPORT_STATUS[keyof typeof PAYROLL_REPORT_STATUS]
export type PayrollGroupBy = typeof PAYROLL_GROUP_BY[keyof typeof PAYROLL_GROUP_BY]
export type PayrollDateRangePreset = typeof PAYROLL_DATE_RANGE_PRESET[keyof typeof PAYROLL_DATE_RANGE_PRESET]

// ==============================================
// FILTER INTERFACES
// ==============================================
export interface PayrollReportFilters {
  // Required
  startDate: string  // YYYY-MM-DD format
  endDate: string    // YYYY-MM-DD format
  
  // Optional filters
  projectId?: string
  userId?: string
  status?: PayrollReportStatus
  
  // Options
  includeNotes?: boolean
  includeDetailedEntries?: boolean
}

// UI Form version
export interface PayrollReportFiltersFormData {
  dateRangePreset: PayrollDateRangePreset
  startDate: string
  endDate: string
  projectIds: string[]  // Multi-select
  userIds: string[]     // Multi-select
  status: string
  includeNotes: boolean
  includeDetailedEntries: boolean
}

// ==============================================
// TIME BY PERSON (Employee Breakdown)
// ==============================================
export interface PayrollReportByPerson {
  userId: string
  userName: string
  userEmail: string
  tradeSpecialty?: string
  
  // Hours breakdown
  regularHours: number
  overtimeHours: number
  doubleTimeHours: number
  totalHours: number
  
  // Payment breakdown
  regularPay: number
  overtimePay: number
  doubleTimePay: number
  totalPay: number
  
  // Additional info
  totalEntries: number
  projectsWorked: number
  projectNames: string[]  // Array of project names
  
  // Average rates (for reference)
  avgRegularRate: number
  avgOvertimeRate: number
  avgDoubleTimeRate: number
}

// ==============================================
// TIME BY PROJECT (Project Breakdown)
// ==============================================
export interface PayrollReportByProject {
  projectId: string
  projectName: string
  projectNumber?: string
  projectStatus: string
  
  // Hours totals
  totalHours: number
  regularHours: number
  overtimeHours: number
  doubleTimeHours: number
  
  // Cost totals
  totalCost: number
  regularCost: number
  overtimeCost: number
  doubleTimeCost: number
  
  // Workers info
  workersCount: number
  workerNames: string[]
  
  // Averages
  avgHoursPerWorker: number
  avgCostPerHour: number
  
  // Additional
  totalEntries: number
}

// ==============================================
// TIME BY COST CODE (Trade/Work Type)
// ==============================================
export interface PayrollReportByCostCode {
  costCode: string       // trade or workType
  costCodeType: 'trade' | 'work_type'
  costCodeLabel: string  // Display name
  
  // Hours
  totalHours: number
  regularHours: number
  overtimeHours: number
  doubleTimeHours: number
  
  // Cost
  totalCost: number
  
  // Statistics
  percentOfTotal: number  // % of total hours
  workersCount: number
  projectsCount: number
  entriesCount: number
  
  // Average
  avgCostPerHour: number
}

// ==============================================
// OVERTIME SUMMARY
// ==============================================
export interface OvertimeSummary {
  userId: string
  userName: string
  userEmail: string
  
  // OT hours
  overtimeHours: number
  doubleTimeHours: number
  totalOTHours: number  // OT + DT
  
  // OT pay
  overtimePay: number
  doubleTimePay: number
  totalOTPay: number
  
  // OT percentage
  percentOT: number  // OT hours / total hours * 100
  
  // Days with OT
  daysWithOT: number
  
  // Projects with OT
  projectsWithOT: string[]
}

// ==============================================
// DETAILED ENTRY (For CSV with notes)
// ==============================================
export interface DetailedPayrollEntry {
  id: string
  date: string
  
  // Worker
  userName: string
  userEmail: string
  
  // Project
  projectName: string
  projectNumber?: string
  scheduleProjectTitle?: string
  
  // Time
  startTime: string
  endTime?: string
  breakMinutes: number
  
  // Hours breakdown
  regularHours: number
  overtimeHours: number
  doubleTimeHours: number
  totalHours: number
  
  // Rates
  regularRate: number
  overtimeRate: number
  doubleTimeRate: number
  
  // Pay breakdown
  regularPay: number
  overtimePay: number
  doubleTimePay: number
  totalPay: number
  
  // Work details
  workType?: string
  trade?: string
  description?: string
  workCompleted?: string
  issuesEncountered?: string
  
  // Status
  status: string
  approvedBy?: string
  approvedAt?: string
}

// ==============================================
// TOTAL HOURS SUMMARY (Overall Statistics)
// ==============================================
export interface TotalHoursSummary {
  // Date range
  startDate: string
  endDate: string
  totalDays: number
  
  // Counts
  totalEntries: number
  totalWorkers: number
  totalProjects: number
  
  // Hours breakdown
  totalRegularHours: number
  totalOvertimeHours: number
  totalDoubleTimeHours: number
  grandTotalHours: number
  
  // Cost breakdown
  totalRegularCost: number
  totalOvertimeCost: number
  totalDoubleTimeCost: number
  grandTotalCost: number
  
  // Averages
  avgHoursPerWorker: number
  avgHoursPerEntry: number
  avgCostPerHour: number
  avgCostPerWorker: number
  
  // Percentages
  percentRegularHours: number
  percentOvertimeHours: number
  percentDoubleTimeHours: number
  
  // Status breakdown
  pendingEntries: number
  approvedEntries: number
  pendingCost: number
  approvedCost: number
}

// ==============================================
// COMPLETE PAYROLL REPORT (All sections combined)
// ==============================================
export interface PayrollReport {
  // Summary section
  summary: TotalHoursSummary
  
  // Breakdown sections
  byPerson: PayrollReportByPerson[]
  byProject: PayrollReportByProject[]
  byCostCode: PayrollReportByCostCode[]
  
  // Overtime section
  overtimeSummary: OvertimeSummary[]
  
  // Detailed entries (optional, for CSV)
  detailedEntries?: DetailedPayrollEntry[]
  
  // Metadata
  generatedAt: string
  generatedBy: string
  filters: PayrollReportFilters
}

// ==============================================
// API RESPONSE INTERFACES
// ==============================================
export interface GetPayrollReportResult {
  success: boolean
  message: string
  data: {
    report: PayrollReport
  }
}

export interface GetPayrollStatsResult {
  success: boolean
  message: string
  data: {
    thisWeekHours: number
    thisWeekCost: number
    pendingApprovalsCost: number
    topWorkers: Array<{
      userId: string
      userName: string
      totalHours: number
      totalPay: number
    }>
    topProjects: Array<{
      projectId: string
      projectName: string
      totalHours: number
      totalCost: number
    }>
  }
}

export interface ExportPayrollCSVResult {
  success: boolean
  message: string
  data?: {
    filename: string
    url?: string
  }
  error?: string
}

// ==============================================
// CSV EXPORT INTERFACES
// ==============================================
export interface PayrollCSVOptions {
  includeNotes: boolean
  includeDetailedEntries: boolean
  filename?: string
}

export interface PayrollCSVData {
  headers: string[]
  rows: string[][]
}

export interface PayrollCSVSection {
  title: string
  data: PayrollCSVData
}

// ==============================================
// FORM ERROR TYPES
// ==============================================
export interface PayrollReportFieldError {
  field: string
  message: string
}

export interface PayrollReportFormErrors {
  startDate?: string
  endDate?: string
  dateRange?: string
  projectId?: string
  userId?: string
  status?: string
  general?: string
}

// ==============================================
// STATE TYPES
// ==============================================
export type PayrollReportState = 'idle' | 'loading' | 'loaded' | 'error' | 'exporting'

export interface PayrollReportHookState {
  report: PayrollReport | null
  filters: PayrollReportFiltersFormData
  state: PayrollReportState
  error: string | null
  isLoading: boolean
  isExporting: boolean
  hasReport: boolean
  isEmpty: boolean
}

// ==============================================
// UTILITY TYPES
// ==============================================

// For select dropdowns
export interface PayrollFilterOption {
  value: string
  label: string
}

// For date range presets
export interface DateRangePreset {
  value: PayrollDateRangePreset
  label: string
  getDateRange: () => { startDate: string; endDate: string }
}

// ==============================================
// VALIDATION RESULT
// ==============================================
export interface PayrollReportValidation {
  success: boolean
  data?: PayrollReportFilters
  errors?: PayrollReportFormErrors
}

// ==============================================
// HELPER FUNCTIONS TYPE EXPORTS
// ==============================================
export type PayrollReportStatusLabel = {
  [K in PayrollReportStatus]: string
}

export type PayrollGroupByLabel = {
  [K in PayrollGroupBy]: string
}

// ==============================================
// CONSTANTS EXPORTS FOR USE IN COMPONENTS
// ==============================================
export const PAYROLL_STATUS_LABELS: PayrollReportStatusLabel = {
  all: 'All Statuses',
  pending: 'Pending',
  approved: 'Approved',
  clocked_out: 'Clocked Out'
}

export const GROUP_BY_LABELS: PayrollGroupByLabel = {
  person: 'By Person',
  project: 'By Project',
  cost_code: 'By Cost Code',
  date: 'By Date'
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    value: 'this-week',
    label: 'This Week',
    getDateRange: () => {
      const now = new Date()
      const dayOfWeek = now.getDay()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - dayOfWeek)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      return {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0]
      }
    }
  },
  {
    value: 'last-week',
    label: 'Last Week',
    getDateRange: () => {
      const now = new Date()
      const dayOfWeek = now.getDay()
      const startOfLastWeek = new Date(now)
      startOfLastWeek.setDate(now.getDate() - dayOfWeek - 7)
      const endOfLastWeek = new Date(startOfLastWeek)
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6)
      
      return {
        startDate: startOfLastWeek.toISOString().split('T')[0],
        endDate: endOfLastWeek.toISOString().split('T')[0]
      }
    }
  },
  {
    value: 'this-month',
    label: 'This Month',
    getDateRange: () => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      return {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0]
      }
    }
  },
  {
    value: 'last-month',
    label: 'Last Month',
    getDateRange: () => {
      const now = new Date()
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      
      return {
        startDate: startOfLastMonth.toISOString().split('T')[0],
        endDate: endOfLastMonth.toISOString().split('T')[0]
      }
    }
  },
  {
    value: 'this-quarter',
    label: 'This Quarter',
    getDateRange: () => {
      const now = new Date()
      const quarter = Math.floor(now.getMonth() / 3)
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1)
      const endOfQuarter = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
      
      return {
        startDate: startOfQuarter.toISOString().split('T')[0],
        endDate: endOfQuarter.toISOString().split('T')[0]
      }
    }
  },
  {
    value: 'this-year',
    label: 'This Year',
    getDateRange: () => {
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const endOfYear = new Date(now.getFullYear(), 11, 31)
      
      return {
        startDate: startOfYear.toISOString().split('T')[0],
        endDate: endOfYear.toISOString().split('T')[0]
      }
    }
  },
  {
    value: 'custom',
    label: 'Custom Range',
    getDateRange: () => ({
      startDate: '',
      endDate: ''
    })
  }
]