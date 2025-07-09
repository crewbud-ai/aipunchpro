// ==============================================
// src/hooks/team-members/use-team-members.ts - Team Members List Hook
// ==============================================

import { useState, useCallback, useEffect, useMemo } from 'react'
import { teamMembersApi } from '@/lib/api/team-members'
import { 
  getDefaultTeamMemberFiltersFormData,
  type TeamMemberSummary,
  type TeamMemberFilters,
  type TeamMembersState,
  type GetTeamMembersResult,
  type TeamMemberStats,
  type TeamMemberFiltersFormData,
} from '@/types/team-members'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseTeamMembersState {
  teamMembers: TeamMemberSummary[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  filters: TeamMemberFilters
  filtersForm: TeamMemberFiltersFormData
  state: TeamMembersState
  error: string | null
}

interface UseTeamMembersActions {
  loadTeamMembers: (newFilters?: Partial<TeamMemberFilters>) => Promise<void>
  refreshTeamMembers: () => Promise<void>
  updateFilters: (newFilters: Partial<TeamMemberFilters>) => void
  updateFiltersForm: (field: keyof TeamMemberFiltersFormData, value: any) => void
  applyFiltersForm: () => void
  clearFilters: () => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  clearError: () => void
  
  // Enhanced search actions
  searchByName: (nameQuery: string) => void
  filterByRole: (role: TeamMemberFilters['role']) => void
  filterByTrade: (tradeSpecialty: TeamMemberFilters['tradeSpecialty']) => void
  filterByStatus: (status: TeamMemberFilters['status']) => void
  filterByAssignmentStatus: (assignmentStatus: TeamMemberFilters['assignmentStatus']) => void
  filterByProject: (projectId: string | undefined) => void
  sortTeamMembers: (sortBy: TeamMemberFilters['sortBy'], sortOrder?: TeamMemberFilters['sortOrder']) => void
}

interface UseTeamMembersReturn extends UseTeamMembersState, UseTeamMembersActions {
  // Computed properties
  isEmpty: boolean
  hasTeamMembers: boolean
  isLoading: boolean
  isLoaded: boolean
  hasError: boolean
  hasNextPage: boolean
  hasPrevPage: boolean
  hasActiveFilters: boolean
  
  // Data analytics
  teamMembersByRole: Array<{ role: string; members: TeamMemberSummary[] }>
  teamMembersByTrade: Array<{ trade: string; members: TeamMemberSummary[] }>
  teamMembersByStatus: Array<{ status: string; members: TeamMemberSummary[] }>
  activeMembers: TeamMemberSummary[]
  assignedMembers: TeamMemberSummary[]
  unassignedMembers: TeamMemberSummary[]
  averageHourlyRate: number
  totalActiveMembers: number
  totalAssignedMembers: number
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

const DEFAULT_FILTERS: TeamMemberFilters = {
  limit: 20,
  offset: 0,
  sortBy: 'firstName',
  sortOrder: 'asc',
}

// ==============================================
// MAIN HOOK
// ==============================================
export const useTeamMembers = () => {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseTeamMembersState>({
    teamMembers: [],
    pagination: DEFAULT_PAGINATION,
    filters: DEFAULT_FILTERS,
    filtersForm: getDefaultTeamMemberFiltersFormData(),
    state: 'loading',
    error: null,
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const isEmpty = state.teamMembers.length === 0 && state.state === 'loaded'
  const hasTeamMembers = state.teamMembers.length > 0
  const isLoading = state.state === 'loading'
  const isLoaded = state.state === 'loaded' || state.state === 'empty'
  const hasError = state.state === 'error'
  const hasNextPage = state.pagination.hasMore
  const hasPrevPage = state.pagination.offset > 0

  // Check for active filters
  const hasActiveFilters = useMemo(() => {
    return !!(
      state.filters.role ||
      state.filters.status ||
      state.filters.assignmentStatus ||
      state.filters.tradeSpecialty ||
      state.filters.projectId ||
      state.filters.search
    )
  }, [state.filters])

  // Data analytics computed properties
  const teamMembersByRole = useMemo(() => {
    const grouped = state.teamMembers.reduce((acc, member) => {
      const role = member.role
      if (!acc[role]) acc[role] = []
      acc[role].push(member)
      return acc
    }, {} as Record<string, TeamMemberSummary[]>)

    return Object.entries(grouped).map(([role, members]) => ({ role, members }))
  }, [state.teamMembers])

  const teamMembersByTrade = useMemo(() => {
    const grouped = state.teamMembers.reduce((acc, member) => {
      const trade = member.tradeSpecialty || 'No Specialty'
      if (!acc[trade]) acc[trade] = []
      acc[trade].push(member)
      return acc
    }, {} as Record<string, TeamMemberSummary[]>)

    return Object.entries(grouped).map(([trade, members]) => ({ trade, members }))
  }, [state.teamMembers])

  const teamMembersByStatus = useMemo(() => {
    const grouped = state.teamMembers.reduce((acc, member) => {
      const status = member.assignmentStatus
      if (!acc[status]) acc[status] = []
      acc[status].push(member)
      return acc
    }, {} as Record<string, TeamMemberSummary[]>)

    return Object.entries(grouped).map(([status, members]) => ({ status, members }))
  }, [state.teamMembers])

  const activeMembers = useMemo(() => 
    state.teamMembers.filter(member => member.isActive),
    [state.teamMembers]
  )

  const assignedMembers = useMemo(() => 
    state.teamMembers.filter(member => member.assignmentStatus === 'assigned'),
    [state.teamMembers]
  )

  const unassignedMembers = useMemo(() => 
    state.teamMembers.filter(member => member.assignmentStatus === 'not_assigned'),
    [state.teamMembers]
  )

  const averageHourlyRate = useMemo(() => {
    const membersWithRates = state.teamMembers.filter(member => member.hourlyRate)
    if (membersWithRates.length === 0) return 0
    
    const total = membersWithRates.reduce((sum, member) => sum + (member.hourlyRate || 0), 0)
    return total / membersWithRates.length
  }, [state.teamMembers])

  const totalActiveMembers = activeMembers.length
  const totalAssignedMembers = assignedMembers.length

  // ==============================================
  // CLEAR ERROR
  // ==============================================
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      state: prev.state === 'error' ? 'loaded' : prev.state,
    }))
  }, [])

  // ==============================================
  // LOAD TEAM MEMBERS
  // ==============================================
  const loadTeamMembers = useCallback(async (newFilters?: Partial<TeamMemberFilters>) => {
    try {
      setState(prev => ({
        ...prev,
        state: 'loading',
        error: null,
      }))

      const filtersToUse = { ...state.filters, ...newFilters }
      const response = await teamMembersApi.getTeamMembers(filtersToUse)

      if (response.success) {
        setState(prev => ({
          ...prev,
          teamMembers: response.data.teamMembers,
          pagination: response.data.pagination,
          filters: filtersToUse,
          state: response.data.teamMembers.length > 0 ? 'loaded' : 'empty',
          error: null,
        }))
      } else {
        setState(prev => ({
          ...prev,
          teamMembers: [],
          pagination: DEFAULT_PAGINATION,
          state: 'error',
          error: response.message || 'Failed to load team members',
        }))
      }
    } catch (error: any) {
      console.error('Error loading team members:', error)
      setState(prev => ({
        ...prev,
        teamMembers: [],
        pagination: DEFAULT_PAGINATION,
        state: 'error',
        error: error.message || 'Failed to load team members',
      }))
    }
  }, [state.filters])

  // ==============================================
  // REFRESH TEAM MEMBERS
  // ==============================================
  const refreshTeamMembers = useCallback(async () => {
    await loadTeamMembers()
  }, [loadTeamMembers])

  // ==============================================
  // FILTER MANAGEMENT
  // ==============================================
  const updateFilters = useCallback((newFilters: Partial<TeamMemberFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }))
  }, [])

  const updateFiltersForm = useCallback((field: keyof TeamMemberFiltersFormData, value: any) => {
    setState(prev => ({
      ...prev,
      filtersForm: { ...prev.filtersForm, [field]: value },
    }))
  }, [])

  const applyFiltersForm = useCallback(() => {
    const formFilters = state.filtersForm
    const apiFilters: Partial<TeamMemberFilters> = {
      role: formFilters.role,
      status: formFilters.status,
      assignmentStatus: formFilters.assignmentStatus,
      tradeSpecialty: formFilters.tradeSpecialty,
      projectId: formFilters.projectId,
      search: formFilters.search || undefined,
      sortBy: formFilters.sortBy,
      sortOrder: formFilters.sortOrder,
      offset: 0, // Reset to first page when applying filters
    }

    updateFilters(apiFilters)
    loadTeamMembers(apiFilters)
  }, [state.filtersForm, updateFilters, loadTeamMembers])

  const clearFilters = useCallback(() => {
    const clearedFilters = { ...DEFAULT_FILTERS }
    const clearedFiltersForm = getDefaultTeamMemberFiltersFormData()

    setState(prev => ({
      ...prev,
      filters: clearedFilters,
      filtersForm: clearedFiltersForm,
    }))

    loadTeamMembers(clearedFilters)
  }, [loadTeamMembers])

  // ==============================================
  // PAGINATION
  // ==============================================
  const setPage = useCallback((page: number) => {
    const newOffset = (page - 1) * state.filters.limit!
    updateFilters({ offset: newOffset })
    loadTeamMembers({ offset: newOffset })
  }, [state.filters.limit, updateFilters, loadTeamMembers])

  const setLimit = useCallback((limit: number) => {
    updateFilters({ 
      limit, 
      offset: 0  // Reset to first page when changing limit
    })
    loadTeamMembers({ limit, offset: 0 })
  }, [updateFilters, loadTeamMembers])

  // ==============================================
  // ENHANCED SEARCH ACTIONS
  // ==============================================
  const searchByName = useCallback((nameQuery: string) => {
    updateFiltersForm('search', nameQuery)
    updateFilters({ search: nameQuery, offset: 0 })
    loadTeamMembers({ search: nameQuery, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadTeamMembers])

  const filterByRole = useCallback((role: TeamMemberFilters['role']) => {
    updateFiltersForm('role', role)
    updateFilters({ role, offset: 0 })
    loadTeamMembers({ role, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadTeamMembers])

  const filterByTrade = useCallback((tradeSpecialty: TeamMemberFilters['tradeSpecialty']) => {
    updateFiltersForm('tradeSpecialty', tradeSpecialty)
    updateFilters({ tradeSpecialty, offset: 0 })
    loadTeamMembers({ tradeSpecialty, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadTeamMembers])

  const filterByStatus = useCallback((status: TeamMemberFilters['status']) => {
    updateFiltersForm('status', status)
    updateFilters({ status, offset: 0 })
    loadTeamMembers({ status, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadTeamMembers])

  const filterByAssignmentStatus = useCallback((assignmentStatus: TeamMemberFilters['assignmentStatus']) => {
    updateFiltersForm('assignmentStatus', assignmentStatus)
    updateFilters({ assignmentStatus, offset: 0 })
    loadTeamMembers({ assignmentStatus, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadTeamMembers])

  const filterByProject = useCallback((projectId: string | undefined) => {
    updateFiltersForm('projectId', projectId)
    updateFilters({ projectId, offset: 0 })
    loadTeamMembers({ projectId, offset: 0 })
  }, [updateFiltersForm, updateFilters, loadTeamMembers])

  const sortTeamMembers = useCallback((
    sortBy: TeamMemberFilters['sortBy'], 
    sortOrder: TeamMemberFilters['sortOrder'] = 'asc'
  ) => {
    updateFiltersForm('sortBy', sortBy)
    updateFiltersForm('sortOrder', sortOrder)
    updateFilters({ sortBy, sortOrder })
    loadTeamMembers({ sortBy, sortOrder })
  }, [updateFiltersForm, updateFilters, loadTeamMembers])

  // ==============================================
  // INITIAL LOAD
  // ==============================================
  useEffect(() => {
    loadTeamMembers()
  }, []) // Only run on mount

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    teamMembers: state.teamMembers,
    pagination: state.pagination,
    filters: state.filters,
    filtersForm: state.filtersForm,
    state: state.state,
    error: state.error,
    
    // Computed properties
    isEmpty,
    hasTeamMembers,
    isLoading,
    isLoaded,
    hasError,
    hasNextPage,
    hasPrevPage,
    hasActiveFilters,
    teamMembersByRole,
    teamMembersByTrade,
    teamMembersByStatus,
    activeMembers,
    assignedMembers,
    unassignedMembers,
    averageHourlyRate,
    totalActiveMembers,
    totalAssignedMembers,
    
    // Actions
    loadTeamMembers,
    refreshTeamMembers,
    updateFilters,
    updateFiltersForm,
    applyFiltersForm,
    clearFilters,
    setPage,
    setLimit,
    clearError,
    
    // Enhanced search actions
    searchByName,
    filterByRole,
    filterByTrade,
    filterByStatus,
    filterByAssignmentStatus,
    filterByProject,
    sortTeamMembers,
  } satisfies UseTeamMembersReturn
}

// ==============================================
// TEAM MEMBER STATS HOOK
// ==============================================
export const useTeamMemberStats = () => {
  const [stats, setStats] = useState<TeamMemberStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await teamMembersApi.getTeamMemberStats()
      
      if (response.success) {
        setStats(response.data)
      } else {
        setError('Failed to load team member statistics')
      }
    } catch (error: any) {
      console.error('Error loading team member stats:', error)
      setError(error.message || 'Failed to load team member statistics')
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
    loadStats,
    refreshStats,
  }
}

// ==============================================
// EMAIL AVAILABILITY CHECK HOOK
// ==============================================
export const useTeamMemberEmailCheck = () => {
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheckedEmail, setLastCheckedEmail] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)

  const checkEmailAvailability = useCallback(async (email: string, excludeId?: string) => {
    if (!email || email === lastCheckedEmail) {
      return isAvailable
    }

    try {
      setIsChecking(true)
      const response = await teamMembersApi.checkEmailAvailability(email, excludeId)
      
      setIsAvailable(response.available)
      setLastCheckedEmail(email)
      
      return response.available
    } catch (error) {
      console.error('Error checking email availability:', error)
      setIsAvailable(false)
      return false
    } finally {
      setIsChecking(false)
    }
  }, [lastCheckedEmail, isAvailable])

  const resetCheck = useCallback(() => {
    setIsChecking(false)
    setLastCheckedEmail('')
    setIsAvailable(true)
  }, [])

  return {
    isChecking,
    isAvailable,
    lastCheckedEmail,
    checkEmailAvailability,
    resetCheck,
  }
}