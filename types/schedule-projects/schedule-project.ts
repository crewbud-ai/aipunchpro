// ==============================================
// types/schedule-projects/schedule-project.ts - Core Schedule Project Types
// ==============================================

// ==============================================
// CORE SCHEDULE PROJECT INTERFACES
// ==============================================
export interface ScheduleProject {
  id: string
  companyId: string
  projectId: string
  title: string
  description?: string
  
  // Timing
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  
  // Assignment (array of project_member IDs)
  assignedProjectMemberIds: string[]
  tradeRequired?: 'electrical' | 'plumbing' | 'framing' | 'drywall' | 'roofing' | 'concrete' | 'hvac' | 'general' | 'management' | 'safety'
  
  // Status & Priority
  status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  progressPercentage: number
  
  // Work Estimates
  estimatedHours?: number
  actualHours: number
  
  // Dependencies
  dependsOn?: string[]
  
  // Location & Details
  location?: string
  notes?: string
  
  // Metadata
  createdBy: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  
  // Related data (populated from joins)
  project?: {
    id: string
    name: string
    status: string
  }
  assignedMembers?: Array<{
    id: string
    userId: string
    user: {
      firstName: string
      lastName: string
      tradeSpecialty?: string
    }
  }>
  creator?: {
    firstName: string
    lastName: string
  }
}

export interface ScheduleProjectSummary {
  id: string
  projectId: string
  title: string
  description?: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  status: ScheduleProject['status']
  priority: ScheduleProject['priority']
  progressPercentage: number
  estimatedHours?: number
  actualHours: number
  location?: string
  tradeRequired?: ScheduleProject['tradeRequired']
  createdAt: string
  updatedAt: string
  
  // Basic related info for list view
  project?: {
    id: string
    name: string
    status: string
  }
  assignedMembers?: Array<{
    id: string
    user: {
      firstName: string
      lastName: string
      tradeSpecialty?: string
    }
  }>
  creator?: {
    firstName: string
    lastName: string
  }
}

// ==============================================
// QUERY INTERFACES
// ==============================================
export interface ScheduleProjectFilters {
  projectId?: string
  status?: ScheduleProject['status']
  priority?: ScheduleProject['priority']
  tradeRequired?: ScheduleProject['tradeRequired']
  assignedToUserId?: string
  startDateFrom?: string
  startDateTo?: string
  search?: string
  sortBy?: 'title' | 'startDate' | 'endDate' | 'status' | 'priority' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// ==============================================
// SCHEDULE PROJECT STATES
// ==============================================
export type ScheduleProjectsState = 
  | 'loading'        // Loading schedule projects list
  | 'loaded'         // Schedule projects loaded successfully
  | 'error'          // Error loading schedule projects
  | 'empty'          // No schedule projects found

export type ScheduleProjectState = 
  | 'loading'        // Loading single schedule project
  | 'loaded'         // Schedule project loaded
  | 'error'          // Error loading schedule project
  | 'not_found'      // Schedule project not found

// ==============================================
// API RESPONSE INTERFACES
// ==============================================
export interface GetScheduleProjectsResult {
  success: boolean
  message: string
  data: {
    scheduleProjects: ScheduleProjectSummary[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
    filters?: {
      projectId?: string
      status?: ScheduleProject['status']
      priority?: ScheduleProject['priority']
      tradeRequired?: ScheduleProject['tradeRequired']
      assignedToUserId?: string
      startDateFrom?: string
      startDateTo?: string
      search?: string
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }
  }
  notifications?: {
    message: string
  }
}

export interface GetScheduleProjectResult {
  success: boolean
  message: string
  data: {
    scheduleProject: ScheduleProject
    dependentSchedules?: Array<{
      id: string
      title: string
      status: string
      startDate: string
      endDate: string
      project: {
        name: string
      }
    }>
  }
  notifications?: {
    message: string
  }
}

export interface DeleteScheduleProjectResult {
  success: boolean
  message: string
  data: {
    deletedScheduleProjectId: string
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// ERROR TYPES
// ==============================================
export interface ScheduleProjectFieldError {
  field: string
  message: string
}

export interface ScheduleProjectFormErrors {
  title?: string
  description?: string
  projectId?: string
  startDate?: string
  endDate?: string
  startTime?: string
  endTime?: string
  assignedProjectMemberIds?: string
  tradeRequired?: string
  status?: string
  priority?: string
  progressPercentage?: string
  estimatedHours?: string
  actualHours?: string
  dependsOn?: string
  location?: string
  notes?: string
  
  // General errors
  general?: string
  submit?: string
}

// ==============================================
// STATISTICS & METRICS
// ==============================================
export interface ScheduleProjectStats {
  total: number
  byStatus: {
    planned: number
    in_progress: number
    completed: number
    delayed: number
    cancelled: number
  }
  byPriority: {
    low: number
    medium: number
    high: number
    critical: number
  }
  byTrade: Record<string, number>
  upcomingCount: number
  overdueCount: number
  completionRate: number
  averageHours: number
}

// ==============================================
// FILTERS FORM DATA (for UI)
// ==============================================
export interface ScheduleProjectFiltersFormData {
  projectId: string
  status: string
  priority: string
  tradeRequired: string
  assignedToUserId: string
  startDateFrom: string
  startDateTo: string
  search: string
  sortBy: 'title' | 'startDate' | 'endDate' | 'status' | 'priority' | 'createdAt'
  sortOrder: 'asc' | 'desc'
}