// ==============================================
// src/hooks/projects/use-projects.ts - Updated Projects List Hook
// ==============================================

import { useState, useCallback, useEffect, useMemo } from 'react'
import { projectsApi } from '@/lib/api/projects'
import { 
  getDefaultProjectFiltersFormData,
  type ProjectSummary,
  type ProjectFilters,
  type ProjectsState,
  type GetProjectsResult,
  type ProjectStats,
  type ProjectFiltersFormData,
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
  filtersForm: ProjectFiltersFormData
  state: ProjectsState
  error: string | null
}

interface UseProjectsActions {
  loadProjects: (newFilters?: Partial<ProjectFilters>) => Promise<void>
  refreshProjects: () => Promise<void>
  updateFilters: (newFilters: Partial<ProjectFilters>) => void
  updateFiltersForm: (field: keyof ProjectFiltersFormData, value: any) => void
  applyFiltersForm: () => void
  clearFilters: () => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  clearError: () => void
  
  // Enhanced search actions
  searchByLocation: (locationQuery: string) => void
  searchByClient: (clientQuery: string) => void
  filterByManager: (managerId: string | undefined) => void
  sortProjects: (sortBy: ProjectFilters['sortBy'], sortOrder?: ProjectFilters['sortOrder']) => void
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
  hasActiveFilters: boolean
  
  // Enhanced computed properties
  projectsByStatus: Record<string, ProjectSummary[]>
  projectsByPriority: Record<string, ProjectSummary[]>
  totalBudget: number
  totalSpent: number
  averageProgress: number
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
    filtersForm: getDefaultProjectFiltersFormData(),
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

  // Check if any filters are applied
  const hasActiveFilters = useMemo(() => {
    return !!(
      state.filters.status ||
      state.filters.priority ||
      state.filters.search ||
      state.filters.location ||
      state.filters.client ||
      state.filters.managerId
    )
  }, [state.filters])

  // Group projects by status
  const projectsByStatus = useMemo(() => {
    return state.projects.reduce((acc, project) => {
      if (!acc[project.status]) {
        acc[project.status] = []
      }
      acc[project.status].push(project)
      return acc
    }, {} as Record<string, ProjectSummary[]>)
  }, [state.projects])

  // Group projects by priority
  const projectsByPriority = useMemo(() => {
    return state.projects.reduce((acc, project) => {
      if (!acc[project.priority]) {
        acc[project.priority] = []
      }
      acc[project.priority].push(project)
      return acc
    }, {} as Record<string, ProjectSummary[]>)
  }, [state.projects])

  // Calculate totals
  const totalBudget = useMemo(() => {
    return state.projects.reduce((sum, project) => sum + (project.budget || 0), 0)
  }, [state.projects])

  const totalSpent = useMemo(() => {
    return state.projects.reduce((sum, project) => sum + (project.spent || 0), 0)
  }, [state.projects])

  const averageProgress = useMemo(() => {
    if (state.projects.length === 0) return 0
    const totalProgress = state.projects.reduce((sum, project) => sum + (project.progress || 0), 0)
    return Math.round(totalProgress / state.projects.length)
  }, [state.projects])

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
      setState(prev => ({
        ...prev,
        state: 'loading',
        error: null,
      }))

      const finalFilters = { ...state.filters, ...newFilters }

      const response = await projectsApi.getProjects(finalFilters)

      if (response.success) {
        const { projects, pagination } = response.data

        setState(prev => ({
          ...prev,
          projects,
          pagination: {
            total: pagination.total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: pagination.totalPages,
          },
          filters: finalFilters,
          state: projects.length > 0 ? 'loaded' : 'empty',
          error: null,
        }))
      } else {
        setState(prev => ({
          ...prev,
          projects: [],
          pagination: DEFAULT_PAGINATION,
          state: 'error',
          error: response.message || 'Failed to load projects',
        }))
      }
    } catch (error: any) {
      console.error('Error loading projects:', error)
      setState(prev => ({
        ...prev,
        projects: [],
        pagination: DEFAULT_PAGINATION,
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
  // FILTER MANAGEMENT
  // ==============================================
  const updateFilters = useCallback((newFilters: Partial<ProjectFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }))
  }, [])

  const updateFiltersForm = useCallback((field: keyof ProjectFiltersFormData, value: any) => {
    setState(prev => ({
      ...prev,
      filtersForm: { ...prev.filtersForm, [field]: value },
    }))
  }, [])

  const applyFiltersForm = useCallback(() => {
    const formFilters = state.filtersForm
    const apiFilters: Partial<ProjectFilters> = {
      status: formFilters.status,
      priority: formFilters.priority,
      search: formFilters.search || undefined,
      location: formFilters.location || undefined,
      client: formFilters.client || undefined,
      managerId: formFilters.managerId,
      sortBy: formFilters.sortBy,
      sortOrder: formFilters.sortOrder,
      offset: 0, // Reset to first page when applying filters
    }

    updateFilters(apiFilters)
    loadProjects(apiFilters)
  }, [state.filtersForm, updateFilters, loadProjects])

  const clearFilters = useCallback(() => {
    const clearedFilters = { ...DEFAULT_FILTERS }
    const clearedFiltersForm = getDefaultProjectFiltersFormData()

    setState(prev => ({
      ...prev,
      filters: clearedFilters,
      filtersForm: clearedFiltersForm,
    }))

    loadProjects(clearedFilters)
  }, [loadProjects])

  // ==============================================
  // PAGINATION
  // ==============================================
  const setPage = useCallback((page: number) => {
    const newOffset = (page - 1) * state.filters.limit!
    updateFilters({ offset: newOffset })
    loadProjects({ offset: newOffset })
  }, [state.filters.limit, updateFilters, loadProjects])

  const setLimit = useCallback((limit: number) => {
    updateFilters({ 
      limit, 
      offset: 0  // Reset to first page when changing limit
    })
    loadProjects({ limit, offset: 0 })
  }, [updateFilters, loadProjects])

  // ==============================================
  // ENHANCED SEARCH ACTIONS
  // ==============================================
  const searchByLocation = useCallback((locationQuery: string) => {
    updateFiltersForm('location', locationQuery)
    updateFilters({ location: locationQuery, offset: 0 })
    loadProjects({ location: locationQuery, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadProjects])

  const searchByClient = useCallback((clientQuery: string) => {
    updateFiltersForm('client', clientQuery)
    updateFilters({ client: clientQuery, offset: 0 })
    loadProjects({ client: clientQuery, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadProjects])

  const filterByManager = useCallback((managerId: string | undefined) => {
    updateFiltersForm('managerId', managerId)
    updateFilters({ managerId, offset: 0 })
    loadProjects({ managerId, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadProjects])

  const sortProjects = useCallback((
    sortBy: ProjectFilters['sortBy'], 
    sortOrder: ProjectFilters['sortOrder'] = 'desc'
  ) => {
    updateFiltersForm('sortBy', sortBy)
    updateFiltersForm('sortOrder', sortOrder)
    updateFilters({ sortBy, sortOrder })
    loadProjects({ sortBy, sortOrder })
  }, [updateFiltersForm, updateFilters, loadProjects])

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
    filtersForm: state.filtersForm,
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
    hasActiveFilters,
    projectsByStatus,
    projectsByPriority,
    totalBudget,
    totalSpent,
    averageProgress,
    
    // Actions
    loadProjects,
    refreshProjects,
    updateFilters,
    updateFiltersForm,
    applyFiltersForm,
    clearFilters,
    setPage,
    setLimit,
    clearError,
    
    // Enhanced search actions
    searchByLocation,
    searchByClient,
    filterByManager,
    sortProjects,
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
      
      const response = await projectsApi.getProjectStats()
      
      // Handle direct stats response (no wrapper)
      if (response && typeof response === 'object' && 'total' in response) {
        setStats(response as ProjectStats)
      } else {
        setError('Invalid response format from stats API')
      }
    } catch (error: any) {
      console.error('Error loading project stats:', error)
      setError(error.message || 'Failed to load project statistics')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshStats = useCallback(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return {
    stats,
    isLoading,
    error,
    refreshStats,
    hasStats: stats !== null,
    clearError: () => setError(null),
  }
}

// ==============================================
// PROJECT NAME CHECK HOOK
// ==============================================
export const useProjectNameCheck = () => {
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [lastChecked, setLastChecked] = useState('')

  const checkNameAvailability = useCallback(async (name: string) => {
    if (!name.trim() || name.length < 2) {
      setIsAvailable(null)
      setLastChecked('')
      return
    }

    if (name === lastChecked) {
      return // Already checked this name
    }

    try {
      setIsChecking(true)
      
      const response = await fetch(`/api/projects/check-name?name=${encodeURIComponent(name)}`)
      const data = await response.json()

      setIsAvailable(data.available)
      setLastChecked(name)
    } catch (error) {
      console.error('Error checking name availability:', error)
      setIsAvailable(null)
    } finally {
      setIsChecking(false)
    }
  }, [lastChecked])

  const reset = useCallback(() => {
    setIsChecking(false)
    setIsAvailable(null)
    setLastChecked('')
  }, [])

  return {
    isChecking,
    isAvailable,
    lastChecked,
    checkNameAvailability,
    reset,
  }
}