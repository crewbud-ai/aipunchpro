// ==============================================
// src/hooks/projects/use-projects.ts - Projects List Hook
// ==============================================

import { useState, useCallback, useEffect } from 'react'
import { projectsApi } from '@/lib/api/projects'
import type {
  ProjectSummary,
  ProjectFilters,
  ProjectsState,
  GetProjectsResult,
  ProjectStats,
} from '@/types/projects'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseProjectsState {
  projects: ProjectSummary[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  filters: ProjectFilters
  state: ProjectsState
  error: string | null
}

interface UseProjectsActions {
  loadProjects: (newFilters?: Partial<ProjectFilters>) => Promise<void>
  refreshProjects: () => Promise<void>
  updateFilters: (newFilters: Partial<ProjectFilters>) => void
  clearFilters: () => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  clearError: () => void
}

interface UseProjectsReturn extends UseProjectsState, UseProjectsActions {
  // Computed properties
  isEmpty: boolean
  hasProjects: boolean
  isLoading: boolean
  isLoaded: boolean
  hasError: boolean
  hasNextPage: boolean
  hasPrevPage: boolean
}

// ==============================================
// DEFAULT VALUES
// ==============================================
const DEFAULT_FILTERS: ProjectFilters = {
  limit: 20,
  offset: 0,
  sortBy: 'created_at',
  sortOrder: 'desc',
}

const DEFAULT_PAGINATION = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
}

// ==============================================
// MAIN HOOK
// ==============================================
export const useProjects = (initialFilters: Partial<ProjectFilters> = {}) => {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseProjectsState>({
    projects: [],
    pagination: DEFAULT_PAGINATION,
    filters: { ...DEFAULT_FILTERS, ...initialFilters },
    state: 'loading',
    error: null,
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const isEmpty = state.state === 'empty'
  const hasProjects = state.projects.length > 0
  const isLoading = state.state === 'loading'
  const isLoaded = state.state === 'loaded'
  const hasError = state.state === 'error'
  const hasNextPage = state.pagination.page < state.pagination.totalPages
  const hasPrevPage = state.pagination.page > 1

  // ==============================================
  // CLEAR ERROR
  // ==============================================
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      state: prev.projects.length > 0 ? 'loaded' : 'empty',
    }))
  }, [])

  // ==============================================
  // LOAD PROJECTS
  // ==============================================
  const loadProjects = useCallback(async (newFilters: Partial<ProjectFilters> = {}) => {
    try {
      const finalFilters = { ...state.filters, ...newFilters }
      
      setState(prev => ({
        ...prev,
        state: 'loading',
        error: null,
        filters: finalFilters,
      }))

      const response = await projectsApi.getProjects(finalFilters)

      if (response.success) {
        setState(prev => ({
          ...prev,
          projects: response.data.projects,
          pagination: response.data.pagination,
          state: response.data.projects.length > 0 ? 'loaded' : 'empty',
          error: null,
        }))
      } else {
        setState(prev => ({
          ...prev,
          state: 'error',
          error: response.message || 'Failed to load projects',
        }))
      }
    } catch (error: any) {
      console.error('Error loading projects:', error)
      setState(prev => ({
        ...prev,
        state: 'error',
        error: error.message || 'Failed to load projects',
      }))
    }
  }, [state.filters])

  // ==============================================
  // REFRESH PROJECTS
  // ==============================================
  const refreshProjects = useCallback(async () => {
    await loadProjects()
  }, [loadProjects])

  // ==============================================
  // UPDATE FILTERS
  // ==============================================
  const updateFilters = useCallback((newFilters: Partial<ProjectFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters }
    
    // Reset to first page when filters change (except for pagination changes)
    if (!('offset' in newFilters) && !('limit' in newFilters)) {
      updatedFilters.offset = 0
    }

    setState(prev => ({
      ...prev,
      filters: updatedFilters,
    }))

    // Load projects with new filters
    loadProjects(updatedFilters)
  }, [state.filters, loadProjects])

  // ==============================================
  // CLEAR FILTERS
  // ==============================================
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      limit: state.filters.limit || DEFAULT_FILTERS.limit,
      offset: 0,
      sortBy: DEFAULT_FILTERS.sortBy,
      sortOrder: DEFAULT_FILTERS.sortOrder,
    }

    setState(prev => ({
      ...prev,
      filters: clearedFilters,
    }))

    loadProjects(clearedFilters)
  }, [state.filters.limit, loadProjects])

  // ==============================================
  // PAGINATION HELPERS
  // ==============================================
  const setPage = useCallback((page: number) => {
    const newOffset = (page - 1) * (state.filters.limit || DEFAULT_FILTERS.limit!)
    updateFilters({ offset: newOffset })
  }, [state.filters.limit, updateFilters])

  const setLimit = useCallback((limit: number) => {
    updateFilters({ 
      limit, 
      offset: 0  // Reset to first page when changing limit
    })
  }, [updateFilters])

  // ==============================================
  // INITIAL LOAD
  // ==============================================
  useEffect(() => {
    loadProjects()
  }, []) // Only run on mount

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    projects: state.projects,
    pagination: state.pagination,
    filters: state.filters,
    state: state.state,
    error: state.error,
    
    // Computed properties
    isEmpty,
    hasProjects,
    isLoading,
    isLoaded,
    hasError,
    hasNextPage,
    hasPrevPage,
    
    // Actions
    loadProjects,
    refreshProjects,
    updateFilters,
    clearFilters,
    setPage,
    setLimit,
    clearError,
  } satisfies UseProjectsReturn
}

// ==============================================
// PROJECTS STATS HOOK
// ==============================================
export const useProjectStats = () => {
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const statsData = await projectsApi.getProjectStats()
      
      const projectStats: ProjectStats = {
        total: statsData.total,
        planning: statsData.byStatus.not_started,
        active: statsData.byStatus.in_progress,
        onHold: statsData.byStatus.ahead_of_schedule + statsData.byStatus.behind_schedule,
        completed: statsData.byStatus.completed,
        totalBudget: 0, // Will need to be calculated from API
        totalSpent: 0,  // Will need to be calculated from API
        averageProgress: 0, // Will need to be calculated from API
      }
      
      setStats(projectStats)
    } catch (error: any) {
      console.error('Error loading project stats:', error)
      setError(error.message || 'Failed to load project statistics')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return {
    stats,
    isLoading,
    error,
    reload: loadStats,
    clearError: () => setError(null),
  }
}

// ==============================================
// PROJECT NAME AVAILABILITY HOOK
// ==============================================
export const useProjectNameCheck = () => {
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [lastCheckedName, setLastCheckedName] = useState<string>('')

  const checkNameAvailability = useCallback(async (name: string) => {
    if (!name.trim()) {
      setIsAvailable(null)
      setLastCheckedName('')
      return
    }

    try {
      setIsChecking(true)
      setLastCheckedName(name)
      
      const available = await projectsApi.isProjectNameAvailable(name)
      setIsAvailable(available)
    } catch (error) {
      console.error('Error checking name availability:', error)
      setIsAvailable(null)
    } finally {
      setIsChecking(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsAvailable(null)
    setLastCheckedName('')
    setIsChecking(false)
  }, [])

  return {
    isChecking,
    isAvailable,
    lastCheckedName,
    checkNameAvailability,
    reset,
  }
}