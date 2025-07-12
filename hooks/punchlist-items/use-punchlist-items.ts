// ==============================================
// hooks/punchlist-items/use-punchlist-items.ts - Punchlist Items List Hook
// ==============================================

import { useState, useCallback, useEffect, useMemo } from 'react'
import { punchlistItemsApi } from '@/lib/api/punchlist-items'
import { 
  type PunchlistItemSummary,
  type PunchlistItemFilters,
  type PunchlistItemsState,
  type GetPunchlistItemsResult,
  type PunchlistItemStats,
  type PunchlistItemFiltersFormData,
} from '@/types/punchlist-items'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UsePunchlistItemsState {
  punchlistItems: PunchlistItemSummary[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  filters: PunchlistItemFilters
  filtersForm: PunchlistItemFiltersFormData
  state: PunchlistItemsState
  error: string | null
}

interface UsePunchlistItemsActions {
  loadPunchlistItems: (newFilters?: Partial<PunchlistItemFilters>) => Promise<void>
  refreshPunchlistItems: () => Promise<void>
  updateFilters: (newFilters: Partial<PunchlistItemFilters>) => void
  updateFiltersForm: (field: keyof PunchlistItemFiltersFormData, value: any) => void
  applyFiltersForm: () => void
  clearFilters: () => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  clearError: () => void
  
  // Enhanced search actions
  searchByTitle: (titleQuery: string) => void
  filterByProject: (projectId: string | undefined) => void
  filterByScheduleProject: (scheduleProjectId: string | undefined) => void
  filterByStatus: (status: PunchlistItemFilters['status']) => void
  filterByPriority: (priority: PunchlistItemFilters['priority']) => void
  filterByIssueType: (issueType: PunchlistItemFilters['issueType']) => void
  filterByTrade: (tradeCategory: PunchlistItemFilters['tradeCategory']) => void
  filterByAssignee: (assignedToUserId: string | undefined) => void
  sortPunchlistItems: (sortBy: PunchlistItemFilters['sortBy'], sortOrder?: PunchlistItemFilters['sortOrder']) => void
}

interface UsePunchlistItemsReturn extends UsePunchlistItemsState, UsePunchlistItemsActions {
  // Computed properties
  isEmpty: boolean
  hasPunchlistItems: boolean
  isLoading: boolean
  isLoaded: boolean
  hasError: boolean
  hasNextPage: boolean
  hasPrevPage: boolean
  hasActiveFilters: boolean
  currentPage: number
  totalPages: number
  
  // Analytics
  punchlistItemsByStatus: Record<string, PunchlistItemSummary[]>
  punchlistItemsByPriority: Record<string, PunchlistItemSummary[]>
  punchlistItemsByIssueType: Record<string, PunchlistItemSummary[]>
  overdueItems: PunchlistItemSummary[]
  highPriorityItems: PunchlistItemSummary[]
  requiresInspectionItems: PunchlistItemSummary[]
  totalOpenItems: number
  totalOverdueItems: number
  completionRate: number
}

// ==============================================
// DEFAULT VALUES
// ==============================================
const DEFAULT_PAGINATION = {
  total: 0,
  limit: 20,
  offset: 0,
  hasMore: false,
}

const DEFAULT_FILTERS: PunchlistItemFilters = {
  limit: 20,
  offset: 0,
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

const DEFAULT_FILTERS_FORM: PunchlistItemFiltersFormData = {
  projectId: '',
  relatedScheduleProjectId: '',
  status: '',
  priority: '',
  issueType: '',
  tradeCategory: '',
  assignedToUserId: '',
  reportedBy: '',
  dueDateFrom: '',
  dueDateTo: '',
  requiresInspection: '',
  isOverdue: '',
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

// ==============================================
// MAIN HOOK
// ==============================================
export const usePunchlistItems = (initialFilters: Partial<PunchlistItemFilters> = {}) => {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UsePunchlistItemsState>({
    punchlistItems: [],
    pagination: DEFAULT_PAGINATION,
    filters: { ...DEFAULT_FILTERS, ...initialFilters },
    filtersForm: DEFAULT_FILTERS_FORM,
    state: 'loading',
    error: null,
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const isEmpty = state.punchlistItems.length === 0 && state.state === 'loaded'
  const hasPunchlistItems = state.punchlistItems.length > 0
  const isLoading = state.state === 'loading'
  const isLoaded = state.state === 'loaded' || state.state === 'empty'
  const hasError = state.state === 'error'
  const hasNextPage = state.pagination.hasMore
  const hasPrevPage = state.pagination.offset > 0
  const currentPage = Math.floor(state.pagination.offset / state.pagination.limit) + 1
  const totalPages = Math.ceil(state.pagination.total / state.pagination.limit)

  // Check for active filters
  const hasActiveFilters = useMemo(() => {
    return !!(
      state.filters.projectId ||
      state.filters.relatedScheduleProjectId ||
      state.filters.status ||
      state.filters.priority ||
      state.filters.issueType ||
      state.filters.tradeCategory ||
      state.filters.assignedToUserId ||
      state.filters.reportedBy ||
      state.filters.dueDateFrom ||
      state.filters.dueDateTo ||
      state.filters.requiresInspection !== undefined ||
      state.filters.isOverdue !== undefined ||
      state.filters.search
    )
  }, [state.filters])

  // Analytics - Group items by status
  const punchlistItemsByStatus = useMemo(() => {
    return state.punchlistItems.reduce((acc, item) => {
      const status = item.status || 'unknown'
      if (!acc[status]) acc[status] = []
      acc[status].push(item)
      return acc
    }, {} as Record<string, PunchlistItemSummary[]>)
  }, [state.punchlistItems])

  // Analytics - Group items by priority
  const punchlistItemsByPriority = useMemo(() => {
    return state.punchlistItems.reduce((acc, item) => {
      const priority = item.priority || 'unknown'
      if (!acc[priority]) acc[priority] = []
      acc[priority].push(item)
      return acc
    }, {} as Record<string, PunchlistItemSummary[]>)
  }, [state.punchlistItems])

  // Analytics - Group items by issue type
  const punchlistItemsByIssueType = useMemo(() => {
    return state.punchlistItems.reduce((acc, item) => {
      const issueType = item.issueType || 'unknown'
      if (!acc[issueType]) acc[issueType] = []
      acc[issueType].push(item)
      return acc
    }, {} as Record<string, PunchlistItemSummary[]>)
  }, [state.punchlistItems])

  // Analytics - Overdue items
  const overdueItems = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return state.punchlistItems.filter(item => {
      if (!item.dueDate || item.status === 'completed') return false
      const dueDate = new Date(item.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today
    })
  }, [state.punchlistItems])

  // Analytics - High priority items
  const highPriorityItems = useMemo(() => {
    return state.punchlistItems.filter(item => 
      item.priority === 'high' || item.priority === 'critical'
    )
  }, [state.punchlistItems])

  // Analytics - Items requiring inspection
  const requiresInspectionItems = useMemo(() => {
    return state.punchlistItems.filter(item => 
      item.status === 'pending_review' || 
      (item.requiresInspection && item.status !== 'completed')
    )
  }, [state.punchlistItems])

  // Analytics - Totals
  const totalOpenItems = useMemo(() => {
    return state.punchlistItems.filter(item => 
      item.status !== 'completed' && item.status !== 'rejected'
    ).length
  }, [state.punchlistItems])

  const totalOverdueItems = overdueItems.length

  const completionRate = useMemo(() => {
    if (state.pagination.total === 0) return 0
    const completedItems = state.punchlistItems.filter(item => item.status === 'completed').length
    return Math.round((completedItems / state.pagination.total) * 100)
  }, [state.punchlistItems, state.pagination.total])

  // ==============================================
  // CLEAR ERROR
  // ==============================================
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // ==============================================
  // LOAD PUNCHLIST ITEMS
  // ==============================================
  const loadPunchlistItems = useCallback(async (newFilters?: Partial<PunchlistItemFilters>) => {
    try {
      setState(prev => ({
        ...prev,
        state: 'loading',
        error: null,
      }))

      const filtersToUse = { ...state.filters, ...newFilters }
      const response = await punchlistItemsApi.getPunchlistItems(filtersToUse)

      console.log(response, 'response')

      if (response.success) {
        setState(prev => ({
          ...prev,
          punchlistItems: response.data.punchlistItems,
          pagination: response.data.pagination,
          filters: filtersToUse,
          state: response.data.punchlistItems.length > 0 ? 'loaded' : 'empty',
        }))
      } else {
        setState(prev => ({
          ...prev,
          state: 'error',
          error: 'Failed to load punchlist items',
        }))
      }
    } catch (error) {
      console.error('Error loading punchlist items:', error)
      setState(prev => ({
        ...prev,
        state: 'error',
        error: error instanceof Error ? error.message : 'Failed to load punchlist items',
      }))
    }
  }, [state.filters])

  // ==============================================
  // REFRESH PUNCHLIST ITEMS
  // ==============================================
  const refreshPunchlistItems = useCallback(async () => {
    await loadPunchlistItems(state.filters)
  }, [loadPunchlistItems, state.filters])

  // ==============================================
  // UPDATE FILTERS
  // ==============================================
  const updateFilters = useCallback((newFilters: Partial<PunchlistItemFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }))
  }, [])

  // ==============================================
  // UPDATE FILTERS FORM
  // ==============================================
  const updateFiltersForm = useCallback((field: keyof PunchlistItemFiltersFormData, value: any) => {
    setState(prev => ({
      ...prev,
      filtersForm: { ...prev.filtersForm, [field]: value },
    }))
  }, [])

  // ==============================================
  // APPLY FILTERS FORM
  // ==============================================
  const applyFiltersForm = useCallback(() => {
    const newFilters: Partial<PunchlistItemFilters> = {
      offset: 0, // Reset to first page
    }

    // Convert form values to filter values
    if (state.filtersForm.projectId) newFilters.projectId = state.filtersForm.projectId
    if (state.filtersForm.relatedScheduleProjectId) newFilters.relatedScheduleProjectId = state.filtersForm.relatedScheduleProjectId
    if (state.filtersForm.status) newFilters.status = state.filtersForm.status as any
    if (state.filtersForm.priority) newFilters.priority = state.filtersForm.priority as any
    if (state.filtersForm.issueType) newFilters.issueType = state.filtersForm.issueType as any
    if (state.filtersForm.tradeCategory) newFilters.tradeCategory = state.filtersForm.tradeCategory as any
    if (state.filtersForm.assignedToUserId) newFilters.assignedToUserId = state.filtersForm.assignedToUserId
    if (state.filtersForm.reportedBy) newFilters.reportedBy = state.filtersForm.reportedBy
    if (state.filtersForm.dueDateFrom) newFilters.dueDateFrom = state.filtersForm.dueDateFrom
    if (state.filtersForm.dueDateTo) newFilters.dueDateTo = state.filtersForm.dueDateTo
    if (state.filtersForm.requiresInspection) newFilters.requiresInspection = state.filtersForm.requiresInspection === 'true'
    if (state.filtersForm.isOverdue) newFilters.isOverdue = state.filtersForm.isOverdue === 'true'
    if (state.filtersForm.search) newFilters.search = state.filtersForm.search
    if (state.filtersForm.sortBy) newFilters.sortBy = state.filtersForm.sortBy
    if (state.filtersForm.sortOrder) newFilters.sortOrder = state.filtersForm.sortOrder

    updateFilters(newFilters)
    loadPunchlistItems(newFilters)
  }, [state.filtersForm, updateFilters, loadPunchlistItems])

  // ==============================================
  // CLEAR FILTERS
  // ==============================================
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: DEFAULT_FILTERS,
      filtersForm: DEFAULT_FILTERS_FORM,
    }))
    loadPunchlistItems(DEFAULT_FILTERS)
  }, [loadPunchlistItems])

  // ==============================================
  // PAGINATION
  // ==============================================
  const setPage = useCallback((page: number) => {
    const newOffset = (page - 1) * state.filters.limit!
    updateFilters({ offset: newOffset })
    loadPunchlistItems({ offset: newOffset })
  }, [state.filters.limit, updateFilters, loadPunchlistItems])

  const setLimit = useCallback((limit: number) => {
    updateFilters({ 
      limit, 
      offset: 0  // Reset to first page when changing limit
    })
    loadPunchlistItems({ limit, offset: 0 })
  }, [updateFilters, loadPunchlistItems])

  // ==============================================
  // ENHANCED SEARCH ACTIONS
  // ==============================================
  const searchByTitle = useCallback((titleQuery: string) => {
    updateFiltersForm('search', titleQuery)
    updateFilters({ search: titleQuery, offset: 0 })
    loadPunchlistItems({ search: titleQuery, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadPunchlistItems])

  const filterByProject = useCallback((projectId: string | undefined) => {
    updateFiltersForm('projectId', projectId || '')
    updateFilters({ projectId, offset: 0 })
    loadPunchlistItems({ projectId, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadPunchlistItems])

  const filterByScheduleProject = useCallback((scheduleProjectId: string | undefined) => {
    updateFiltersForm('relatedScheduleProjectId', scheduleProjectId || '')
    updateFilters({ relatedScheduleProjectId: scheduleProjectId, offset: 0 })
    loadPunchlistItems({ relatedScheduleProjectId: scheduleProjectId, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadPunchlistItems])

  const filterByStatus = useCallback((status: PunchlistItemFilters['status']) => {
    updateFiltersForm('status', status || '')
    updateFilters({ status, offset: 0 })
    loadPunchlistItems({ status, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadPunchlistItems])

  const filterByPriority = useCallback((priority: PunchlistItemFilters['priority']) => {
    updateFiltersForm('priority', priority || '')
    updateFilters({ priority, offset: 0 })
    loadPunchlistItems({ priority, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadPunchlistItems])

  const filterByIssueType = useCallback((issueType: PunchlistItemFilters['issueType']) => {
    updateFiltersForm('issueType', issueType || '')
    updateFilters({ issueType, offset: 0 })
    loadPunchlistItems({ issueType, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadPunchlistItems])

  const filterByTrade = useCallback((tradeCategory: PunchlistItemFilters['tradeCategory']) => {
    updateFiltersForm('tradeCategory', tradeCategory || '')
    updateFilters({ tradeCategory, offset: 0 })
    loadPunchlistItems({ tradeCategory, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadPunchlistItems])

  const filterByAssignee = useCallback((assignedToUserId: string | undefined) => {
    updateFiltersForm('assignedToUserId', assignedToUserId || '')
    updateFilters({ assignedToUserId, offset: 0 })
    loadPunchlistItems({ assignedToUserId, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadPunchlistItems])

  const sortPunchlistItems = useCallback((sortBy: PunchlistItemFilters['sortBy'], sortOrder?: PunchlistItemFilters['sortOrder']) => {
    const order = sortOrder || (state.filters.sortOrder === 'asc' ? 'desc' : 'asc')
    updateFiltersForm('sortBy', sortBy || 'createdAt')
    updateFiltersForm('sortOrder', order)
    updateFilters({ sortBy, sortOrder: order, offset: 0 })
    loadPunchlistItems({ sortBy, sortOrder: order, offset: 0 })
  }, [state.filters.sortOrder, updateFiltersForm, updateFilters, loadPunchlistItems])

  // ==============================================
  // EFFECTS
  // ==============================================

  // Load initial data
  useEffect(() => {
    loadPunchlistItems()
  }, []) // Only run on mount

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    punchlistItems: state.punchlistItems,
    pagination: state.pagination,
    filters: state.filters,
    filtersForm: state.filtersForm,
    state: state.state,
    error: state.error,

    // Computed properties
    isEmpty,
    hasPunchlistItems,
    isLoading,
    isLoaded,
    hasError,
    hasNextPage,
    hasPrevPage,
    hasActiveFilters,
    currentPage,
    totalPages,

    // Analytics
    punchlistItemsByStatus,
    punchlistItemsByPriority,
    punchlistItemsByIssueType,
    overdueItems,
    highPriorityItems,
    requiresInspectionItems,
    totalOpenItems,
    totalOverdueItems,
    completionRate,

    // Actions
    loadPunchlistItems,
    refreshPunchlistItems,
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
    filterByScheduleProject,
    filterByStatus,
    filterByPriority,
    filterByIssueType,
    filterByTrade,
    filterByAssignee,
    sortPunchlistItems,
  }
}

// ==============================================
// STATS HOOK
// ==============================================
export const usePunchlistItemStats = (): PunchlistItemStats => {
  const { 
    punchlistItems, 
    punchlistItemsByStatus, 
    punchlistItemsByPriority, 
    punchlistItemsByIssueType,
    overdueItems,
    completionRate,
    pagination
  } = usePunchlistItems()

  return useMemo(() => ({
    total: pagination.total,
    byStatus: {
      open: punchlistItemsByStatus.open?.length || 0,
      assigned: punchlistItemsByStatus.assigned?.length || 0,
      in_progress: punchlistItemsByStatus.in_progress?.length || 0,
      pending_review: punchlistItemsByStatus.pending_review?.length || 0,
      completed: punchlistItemsByStatus.completed?.length || 0,
      rejected: punchlistItemsByStatus.rejected?.length || 0,
      on_hold: punchlistItemsByStatus.on_hold?.length || 0,
    },
    byPriority: {
      low: punchlistItemsByPriority.low?.length || 0,
      medium: punchlistItemsByPriority.medium?.length || 0,
      high: punchlistItemsByPriority.high?.length || 0,
      critical: punchlistItemsByPriority.critical?.length || 0,
    },
    byIssueType: {
      defect: punchlistItemsByIssueType.defect?.length || 0,
      incomplete: punchlistItemsByIssueType.incomplete?.length || 0,
      change_request: punchlistItemsByIssueType.change_request?.length || 0,
      safety: punchlistItemsByIssueType.safety?.length || 0,
      quality: punchlistItemsByIssueType.quality?.length || 0,
      rework: punchlistItemsByIssueType.rework?.length || 0,
    },
    averageResolutionTime: 0, // Would need historical data
    overdueItems: overdueItems.length,
    requiresInspection: punchlistItems.filter(item => 
      item.status === 'pending_review'
    ).length,
    completionRate,
  }), [
    punchlistItems,
    punchlistItemsByStatus,
    punchlistItemsByPriority,
    punchlistItemsByIssueType,
    overdueItems,
    completionRate,
    pagination.total
  ])
}

// Export default
export default usePunchlistItems