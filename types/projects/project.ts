// ==============================================
// src/types/projects/project.ts - Core Project Types
// ==============================================

// ==============================================
// CORE PROJECT INTERFACES
// ==============================================
export interface Project {
  id: string
  companyId: string
  name: string
  description?: string
  projectNumber?: string
  status: 'not_started' | 'in_progress' | 'on_track' | 'ahead_of_schedule' | 'behind_schedule' | 'completed'
  priority: 'low' | 'medium' | 'high'
  budget?: number
  spent?: number
  progress?: number
  startDate?: string
  endDate?: string
  estimatedHours?: number
  actualHours?: number
  location?: string
  address?: string
  clientName?: string
  clientContact?: string
  tags?: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ProjectSummary {
  id: string
  name: string
  description?: string
  status: Project['status']
  priority: Project['priority']
  progress?: number
  budget?: number
  spent?: number
  startDate?: string
  endDate?: string
  clientName?: string
  createdAt: string
}

// ==============================================
// QUERY INTERFACES
// ==============================================
export interface ProjectFilters {
  status?: Project['status']
  priority?: Project['priority']
  search?: string
  sortBy?: 'name' | 'created_at' | 'start_date' | 'progress'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// ==============================================
// PROJECT STATES
// ==============================================
export type ProjectsState = 
  | 'loading'        // Loading projects list
  | 'loaded'         // Projects loaded successfully
  | 'error'          // Error loading projects
  | 'empty'          // No projects found

export type ProjectState = 
  | 'loading'        // Loading single project
  | 'loaded'         // Project loaded
  | 'error'          // Error loading project
  | 'not_found'      // Project not found

// ==============================================
// API RESPONSE INTERFACES
// ==============================================
export interface GetProjectsResult {
  success: boolean
  message: string
  data: {
    projects: ProjectSummary[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
    filters: {
      status?: Project['status']
      priority?: Project['priority']
      search?: string
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }
  }
  notifications?: {
    message: string
  }
}

export interface GetProjectResult {
  success: boolean
  message: string
  data: {
    project: Project
  }
  notifications?: {
    message: string
  }
}

export interface DeleteProjectResult {
  success: boolean
  message: string
  data: {
    deletedProjectId: string
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// ERROR TYPES
// ==============================================
export interface ProjectFieldError {
  field: string
  message: string
}

export interface ProjectFormErrors {
  name?: string
  description?: string
  projectNumber?: string
  status?: string
  priority?: string
  budget?: string
  startDate?: string
  endDate?: string
  estimatedHours?: string
  actualHours?: string
  spent?: string
  progress?: string
  location?: string
  address?: string
  clientName?: string
  clientContact?: string
  tags?: string
  general?: string
}

// ==============================================
// UTILITY TYPES
// ==============================================
export interface ProjectStats {
  total: number
  planning: number
  active: number
  onHold: number
  completed: number
  totalBudget: number
  totalSpent: number
  averageProgress: number
}