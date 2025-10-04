// ==============================================
// types/dashboard/index.ts
// Dashboard Types and Interfaces
// ==============================================

// ==============================================
// DASHBOARD STATE
// ==============================================
export type DashboardState = 'loading' | 'loaded' | 'error' | 'empty'

// ==============================================
// PROJECT STATS
// ==============================================
export interface DashboardProjectStats {
  total: number
  active: number
  completed: number
  delayed: number
  onHold: number
  completionRate: number
}

// ==============================================
// TEAM STATS
// ==============================================
export interface DashboardTeamStats {
  total: number
  active: number
  assigned: number
  available: number
  utilizationRate: number
}

// ==============================================
// TIME TRACKING STATS
// ==============================================
export interface DashboardTimeStats {
  todayHours: number
  weekHours: number
  activeSessions: number
  pendingApprovals: number
}

// ==============================================
// PAYROLL STATS
// ==============================================
export interface DashboardPayrollStats {
  pending: number
  approved: number
  weekTotal: number
  totalPaid: number
}

// ==============================================
// BUDGET STATS
// ==============================================
export interface DashboardBudgetStats {
  total: number
  spent: number
  remaining: number
  utilizationPercent: number
}

// ==============================================
// COMPREHENSIVE DASHBOARD STATS
// ==============================================
export interface DashboardStats {
  projects: DashboardProjectStats
  team: DashboardTeamStats
  time: DashboardTimeStats
  payroll: DashboardPayrollStats
  budget: DashboardBudgetStats
}

// ==============================================
// DASHBOARD ALERT TYPES
// ==============================================
export type DashboardAlertType = 'info' | 'warning' | 'error' | 'success'
export type DashboardAlertPriority = 'low' | 'medium' | 'high' | 'critical'

export interface DashboardAlert {
  id: string
  type: DashboardAlertType
  priority: DashboardAlertPriority
  title: string
  message: string
  actionLabel?: string
  actionUrl?: string
  dismissible: boolean
  timestamp: string
}

// ==============================================
// QUICK STAT CARD
// ==============================================
export interface QuickStatCard {
  id: string
  title: string
  value: string | number
  subtitle?: string
  icon: string
  color: string
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  link?: string
}

// ==============================================
// ACTIVITY ITEM
// ==============================================
export interface DashboardActivity {
  id: string
  type: 'project' | 'team' | 'time' | 'payroll' | 'task'
  title: string
  description: string
  timestamp: string
  user?: {
    id: string
    name: string
    avatar?: string
  }
  metadata?: Record<string, any>
}

// ==============================================
// DASHBOARD FILTERS
// ==============================================
export interface DashboardFilters {
  dateRange?: {
    from: string
    to: string
  }
  projectIds?: string[]
  teamMemberIds?: string[]
  includeCompleted?: boolean
  includeArchived?: boolean
}

// ==============================================
// DASHBOARD VIEW PREFERENCES
// ==============================================
export interface DashboardViewPreferences {
  layout: 'default' | 'compact' | 'detailed'
  visibleSections: {
    projects: boolean
    team: boolean
    timeTracking: boolean
    payroll: boolean
    budget: boolean
    alerts: boolean
    quickStats: boolean
    recentActivity: boolean
  }
  refreshInterval?: number // in seconds
  defaultDateRange: 'today' | 'week' | 'month' | 'quarter' | 'year'
}

// ==============================================
// UTILITY TYPE GUARDS
// ==============================================
export function isDashboardLoading(state: DashboardState): state is 'loading' {
  return state === 'loading'
}

export function isDashboardLoaded(state: DashboardState): state is 'loaded' {
  return state === 'loaded'
}

export function isDashboardError(state: DashboardState): state is 'error' {
  return state === 'error'
}

export function isDashboardEmpty(state: DashboardState): state is 'empty' {
  return state === 'empty'
}

// ==============================================
// ALERT PRIORITY HELPERS
// ==============================================
export function getAlertColorClass(type: DashboardAlertType): string {
  switch (type) {
    case 'error':
      return 'border-red-200 bg-red-50 text-red-800'
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 text-yellow-800'
    case 'success':
      return 'border-green-200 bg-green-50 text-green-800'
    case 'info':
    default:
      return 'border-blue-200 bg-blue-50 text-blue-800'
  }
}

export function getAlertIconColor(type: DashboardAlertType): string {
  switch (type) {
    case 'error':
      return 'text-red-600'
    case 'warning':
      return 'text-yellow-600'
    case 'success':
      return 'text-green-600'
    case 'info':
    default:
      return 'text-blue-600'
  }
}

export function shouldShowAlertBadge(priority: DashboardAlertPriority): boolean {
  return priority === 'high' || priority === 'critical'
}

// ==============================================
// STAT FORMATTING HELPERS
// ==============================================
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatHours(hours: number, decimals: number = 1): string {
  return `${hours.toFixed(decimals)}h`
}

export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}