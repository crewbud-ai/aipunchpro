// ==============================================
// hooks/schedule-projects/use-schedule-projects.ts - Schedule Projects List Hook
// ==============================================

import { useState, useCallback, useEffect, useMemo } from 'react'
import { scheduleProjectsApi } from '@/lib/api/schedule-projects'
import { 
  type ScheduleProjectSummary,
  type ScheduleProjectFilters,
  type ScheduleProjectsState,
  type GetScheduleProjectsResult,
  type ScheduleProjectStats,
  type ScheduleProjectFiltersFormData,
} from '@/types/schedule-projects'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseScheduleProjectsState {
  scheduleProjects: ScheduleProjectSummary[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  filters: ScheduleProjectFilters
  filtersForm: ScheduleProjectFiltersFormData
  state: ScheduleProjectsState
  error: string | null
}

interface UseScheduleProjectsActions {
  loadScheduleProjects: (newFilters?: Partial<ScheduleProjectFilters>) => Promise<void>
  refreshScheduleProjects: () => Promise<void>
  updateFilters: (newFilters: Partial<ScheduleProjectFilters>) => void
  updateFiltersForm: (field: keyof ScheduleProjectFiltersFormData, value: any) => void
  applyFiltersForm: () => void
  clearFilters: () => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  clearError: () => void
  
  // Enhanced search actions
  searchByTitle: (titleQuery: string) => void
  filterByProject: (projectId: string | undefined) => void
  filterByStatus: (status: ScheduleProjectFilters['status']) => void
  filterByPriority: (priority: ScheduleProjectFilters['priority']) => void
  filterByTrade: (tradeRequired: ScheduleProjectFilters['tradeRequired']) => void
  filterByAssignedUser: (userId: string | undefined) => void
  filterByDateRange: (startDate?: string, endDate?: string) => void
  sortScheduleProjects: (sortBy: ScheduleProjectFilters['sortBy'], sortOrder?: ScheduleProjectFilters['sortOrder']) => void
}

interface UseScheduleProjectsReturn extends UseScheduleProjectsState, UseScheduleProjectsActions {
  // Computed properties
  isLoading: boolean
  isLoaded: boolean
  isError: boolean
  isEmpty: boolean
  hasScheduleProjects: boolean
  hasFilters: boolean
  totalPages: number
  currentPage: number
  hasPrevPage: boolean
  hasNextPage: boolean
}

// ==============================================
// DEFAULT VALUES
// ==============================================
const DEFAULT_FILTERS: ScheduleProjectFilters = {
  sortBy: 'startDate',
  sortOrder: 'asc',
  limit: 20,
  offset: 0,
}

const DEFAULT_FILTERS_FORM: ScheduleProjectFiltersFormData = {
  projectId: '',
  status: '',
  priority: '',
  tradeRequired: '',
  assignedToUserId: '',
  startDateFrom: '',
  startDateTo: '',
  search: '',
  sortBy: 'startDate',
  sortOrder: 'asc',
}

// ==============================================
// MAIN HOOK
// ==============================================
export function useScheduleProjects() {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseScheduleProjectsState>({
    scheduleProjects: [],
    pagination: {
      total: 0,
      limit: DEFAULT_FILTERS.limit!,
      offset: DEFAULT_FILTERS.offset!,
      hasMore: false,
    },
    filters: { ...DEFAULT_FILTERS },
    filtersForm: { ...DEFAULT_FILTERS_FORM },
    state: 'loading',
    error: null,
  })

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const computed = useMemo(() => {
    const { scheduleProjects, pagination, state: currentState, error, filters } = state

    return {
      isLoading: currentState === 'loading',
      isLoaded: currentState === 'loaded',
      isError: currentState === 'error',
      isEmpty: currentState === 'empty',
      hasScheduleProjects: scheduleProjects.length > 0,
      hasFilters: Object.values(filters).some(value => 
        value !== undefined && value !== '' && value !== null
      ),
      totalPages: Math.ceil(pagination.total / pagination.limit),
      currentPage: Math.floor(pagination.offset / pagination.limit) + 1,
      hasPrevPage: pagination.offset > 0,
      hasNextPage: pagination.hasMore,
    }
  }, [state])

  // ==============================================
  // ACTIONS
  // ==============================================

  // Load schedule projects with filters
  const loadScheduleProjects = useCallback(async (newFilters?: Partial<ScheduleProjectFilters>) => {
    try {
      setState(prev => ({
        ...prev,
        state: 'loading',
        error: null,
        filters: newFilters ? { ...prev.filters, ...newFilters } : prev.filters,
      }))

      const filtersToUse = newFilters ? { ...state.filters, ...newFilters } : state.filters
      const result = await scheduleProjectsApi.getScheduleProjects(filtersToUse)

      setState(prev => ({
        ...prev,
        scheduleProjects: result.data.scheduleProjects,
        pagination: result.data.pagination,
        state: result.data.scheduleProjects.length > 0 ? 'loaded' : 'empty',
        error: null,
      }))

    } catch (error) {
      console.error('Error loading schedule projects:', error)
      setState(prev => ({
        ...prev,
        state: 'error',
        error: error instanceof Error ? error.message : 'Failed to load schedule projects',
        scheduleProjects: [],
        pagination: { total: 0, limit: prev.pagination.limit, offset: 0, hasMore: false },
      }))
    }
  }, [state.filters])

  // Refresh current data
  const refreshScheduleProjects = useCallback(async () => {
    await loadScheduleProjects()
  }, [loadScheduleProjects])

  // Update filters and reload
  const updateFilters = useCallback((newFilters: Partial<ScheduleProjectFilters>) => {
    // Reset offset when changing filters (except when changing pagination)
    const filtersWithReset = 'offset' in newFilters ? newFilters : { ...newFilters, offset: 0 }
    loadScheduleProjects(filtersWithReset)
  }, [loadScheduleProjects])

  // Update filters form (for UI state)
  const updateFiltersForm = useCallback((field: keyof ScheduleProjectFiltersFormData, value: any) => {
    setState(prev => ({
      ...prev,
      filtersForm: {
        ...prev.filtersForm,
        [field]: value,
      }
    }))
  }, [])

  // Apply filters from form to actual filters
  const applyFiltersForm = useCallback(() => {
    const { filtersForm } = state
    const newFilters: Partial<ScheduleProjectFilters> = {
      offset: 0, // Reset to first page
    }

    // Only include non-empty values
    if (filtersForm.projectId) newFilters.projectId = filtersForm.projectId
    if (filtersForm.status) newFilters.status = filtersForm.status as ScheduleProjectFilters['status']
    if (filtersForm.priority) newFilters.priority = filtersForm.priority as ScheduleProjectFilters['priority']
    if (filtersForm.tradeRequired) newFilters.tradeRequired = filtersForm.tradeRequired as ScheduleProjectFilters['tradeRequired']
    if (filtersForm.assignedToUserId) newFilters.assignedToUserId = filtersForm.assignedToUserId
    if (filtersForm.startDateFrom) newFilters.startDateFrom = filtersForm.startDateFrom
    if (filtersForm.startDateTo) newFilters.startDateTo = filtersForm.startDateTo
    if (filtersForm.search) newFilters.search = filtersForm.search
    if (filtersForm.sortBy) newFilters.sortBy = filtersForm.sortBy
    if (filtersForm.sortOrder) newFilters.sortOrder = filtersForm.sortOrder

    updateFilters(newFilters)
  }, [state.filtersForm, updateFilters])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filtersForm: { ...DEFAULT_FILTERS_FORM },
    }))
    updateFilters({ ...DEFAULT_FILTERS })
  }, [updateFilters])

  // Pagination helpers
  const setPage = useCallback((page: number) => {
    const newOffset = (page - 1) * state.pagination.limit
    updateFilters({ offset: newOffset })
  }, [state.pagination.limit, updateFilters])

  const setLimit = useCallback((limit: number) => {
    updateFilters({ limit, offset: 0 })
  }, [updateFilters])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // ==============================================
  // ENHANCED SEARCH ACTIONS
  // ==============================================

  const searchByTitle = useCallback((titleQuery: string) => {
    updateFilters({ search: titleQuery || undefined, offset: 0 })
  }, [updateFilters])

  const filterByProject = useCallback((projectId: string | undefined) => {
    updateFilters({ projectId, offset: 0 })
  }, [updateFilters])

  const filterByStatus = useCallback((status: ScheduleProjectFilters['status']) => {
    updateFilters({ status, offset: 0 })
  }, [updateFilters])

  const filterByPriority = useCallback((priority: ScheduleProjectFilters['priority']) => {
    updateFilters({ priority, offset: 0 })
  }, [updateFilters])

  const filterByTrade = useCallback((tradeRequired: ScheduleProjectFilters['tradeRequired']) => {
    updateFilters({ tradeRequired, offset: 0 })
  }, [updateFilters])

  const filterByAssignedUser = useCallback((userId: string | undefined) => {
    updateFilters({ assignedToUserId: userId, offset: 0 })
  }, [updateFilters])

  const filterByDateRange = useCallback((startDate?: string, endDate?: string) => {
    updateFilters({ startDateFrom: startDate, startDateTo: endDate, offset: 0 })
  }, [updateFilters])

  const sortScheduleProjects = useCallback((
    sortBy: ScheduleProjectFilters['sortBy'], 
    sortOrder: ScheduleProjectFilters['sortOrder'] = 'asc'
  ) => {
    updateFilters({ sortBy, sortOrder })
  }, [updateFilters])

  // ==============================================
  // EFFECTS
  // ==============================================

  // Load initial data
  useEffect(() => {
    loadScheduleProjects()
  }, []) // Only run once on mount

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    ...state,
    
    // Computed values
    ...computed,
    
    // Actions
    loadScheduleProjects,
    refreshScheduleProjects,
    updateFilters,
    updateFiltersForm,
    applyFiltersForm,
    clearFilters,
    setPage,
    setLimit,
    clearError,
    
    // Enhanced search actions
    searchByTitle,
    filterByProject,
    filterByStatus,
    filterByPriority,
    filterByTrade,
    filterByAssignedUser,
    filterByDateRange,
    sortScheduleProjects,
  }
}

// ==============================================
// ADDITIONAL UTILITY HOOKS
// ==============================================

// Hook for schedule project statistics
export function useScheduleProjectStats() {
  const [stats, setStats] = useState<ScheduleProjectStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Note: We'll need to implement this API endpoint
      // const result = await scheduleProjectsApi.getScheduleProjectStats()
      // setStats(result.data.stats)
      
      // For now, return mock data
      setStats({
        total: 0,
        byStatus: {
          planned: 0,
          in_progress: 0,
          completed: 0,
          delayed: 0,
          cancelled: 0,
        },
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        },
        byTrade: {},
        upcomingCount: 0,
        overdueCount: 0,
        completionRate: 0,
        averageHours: 0,
      })
    } catch (err) {
      console.error('Error loading schedule project stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load statistics')
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
    refreshStats: loadStats,
  }
}

// Export default
export default useScheduleProjects