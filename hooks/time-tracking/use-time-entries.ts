// ==============================================
// hooks/time-tracking/use-time-entries.ts - Time Entries Management Hook
// ==============================================

import { useState, useCallback, useEffect, useMemo } from 'react'
import { timeEntriesApi } from '@/lib/api/time-entries'
import type {
  TimeEntrySummary,
  TimeEntryFilters,
  TimeEntriesState,
  GetTimeEntriesResult,
  TimeEntryStats
} from '@/types/time-tracking'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseTimeEntriesState {
  timeEntries: TimeEntrySummary[]
  pagination: {
    total: number
    limit: number
    offset: number
    totalPages: number
    hasMore: boolean
  }
  filters: Partial<TimeEntryFilters>
  state: TimeEntriesState
  error: string | null
}

interface UseTimeEntriesActions {
  loadTimeEntries: (newFilters?: Partial<TimeEntryFilters>) => Promise<void>
  refreshTimeEntries: () => Promise<void>
  updateFilters: (newFilters: Partial<TimeEntryFilters>) => void
  clearFilters: () => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  clearError: () => void
}

interface UseTimeEntriesReturn extends UseTimeEntriesState, UseTimeEntriesActions {
  // Computed properties
  isLoading: boolean
  hasError: boolean
  isEmpty: boolean
  hasTimeEntries: boolean
  timeEntryStats: TimeEntryStats
}

// ==============================================
// MAIN HOOK
// ==============================================
export function useTimeEntries(): UseTimeEntriesReturn {
  // ==============================================
  // STATE
  // ==============================================
  const [timeEntries, setTimeEntries] = useState<TimeEntrySummary[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    totalPages: 0,
    hasMore: false,
  })
  const [filters, setFilters] = useState<Partial<TimeEntryFilters>>({
    sortBy: 'date',
    sortOrder: 'desc',
  })
  const [state, setState] = useState<TimeEntriesState>('loading')
  const [error, setError] = useState<string | null>(null)

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const isLoading = state === 'loading'
  const hasError = state === 'error'
  const isEmpty = state === 'empty'
  const hasTimeEntries = timeEntries.length > 0

  // Time entry statistics
  const timeEntryStats = useMemo<TimeEntryStats>(() => {
    const stats = {
      totalEntries: timeEntries.length,
      byStatus: {
        clocked_in: timeEntries.filter(t => t.status === 'clocked_in').length,
        clocked_out: timeEntries.filter(t => t.status === 'clocked_out').length,
        pending: timeEntries.filter(t => t.status === 'pending').length,
        approved: timeEntries.filter(t => t.status === 'approved').length,
        rejected: timeEntries.filter(t => t.status === 'rejected').length,
      },
      totalHours: timeEntries.reduce((sum, t) => sum + t.totalHours, 0),
      regularHours: 0, // Would need to be calculated from detailed data
      overtimeHours: 0, // Would need to be calculated from detailed data
      todayHours: 0,
      todayStatus: 'not_started' as 'not_started' | 'clocked_in' | 'completed',
      weekHours: 0,
      weekDays: 0, // Add missing weekDays property
    }

    // Calculate today's hours
    const today = new Date().toISOString().split('T')[0]
    const todayEntries = timeEntries.filter(t => t.date === today)
    stats.todayHours = todayEntries.reduce((sum, t) => sum + t.totalHours, 0)

    // Determine today's status
    const hasActiveToday = todayEntries.some(t => t.status === 'clocked_in')
    const hasCompletedToday = todayEntries.some(t => t.status === 'clocked_out' || t.status === 'approved')

    if (hasActiveToday) {
      stats.todayStatus = 'clocked_in'
    } else if (hasCompletedToday) {
      stats.todayStatus = 'completed'
    } else {
      stats.todayStatus = 'not_started'
    }

    // Calculate this week's hours and days
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0]

    const weekEntries = timeEntries.filter(t => t.date >= startOfWeekStr)
    stats.weekHours = weekEntries.reduce((sum, t) => sum + t.totalHours, 0)

    // Calculate unique days worked this week
    const uniqueDays = new Set(weekEntries.map(t => t.date))
    stats.weekDays = uniqueDays.size

    return stats
  }, [timeEntries])

  // ==============================================
  // ACTIONS
  // ==============================================
  const loadTimeEntries = useCallback(async (newFilters?: Partial<TimeEntryFilters>) => {
    try {
      setState('loading')
      setError(null)

      const searchFilters = newFilters ? { ...filters, ...newFilters } : filters

      // Add pagination to filters
      const filtersWithPagination: Partial<TimeEntryFilters> = {
        ...searchFilters,
        sortBy: (searchFilters.sortBy || 'date') as 'date' | 'startTime' | 'totalHours' | 'status' | 'createdAt',
        sortOrder: (searchFilters.sortOrder || 'desc') as 'asc' | 'desc',
        limit: pagination.limit,
        offset: pagination.offset,
      }

      const result: GetTimeEntriesResult = await timeEntriesApi.getTimeEntries(filtersWithPagination)

      if (result.success && result.data) {
        const { timeEntries: entries, totalCount, pagination: paginationData } = result.data

        setTimeEntries(entries)
        setPagination({
          total: totalCount,
          limit: paginationData.limit,
          offset: paginationData.offset,
          totalPages: Math.ceil(totalCount / paginationData.limit),
          hasMore: paginationData.hasMore,
        })

        if (newFilters) {
          setFilters(searchFilters)
        }

        setState(entries.length === 0 ? 'empty' : 'loaded')
      } else {
        throw new Error(result.message || 'Failed to load time entries')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setState('error')
      setError(errorMessage)
      console.error('Load time entries error:', err)
    }
  }, [filters, pagination.limit, pagination.offset])

  const refreshTimeEntries = useCallback(async () => {
    await loadTimeEntries()
  }, [loadTimeEntries])

  const updateFilters = useCallback((newFilters: Partial<TimeEntryFilters>) => {
    // Reset pagination when filters change
    setPagination(prev => ({ ...prev, offset: 0 }))
    loadTimeEntries(newFilters)
  }, [loadTimeEntries])

  const clearFilters = useCallback(() => {
    const defaultFilters: Partial<TimeEntryFilters> = {
      sortBy: 'date',
      sortOrder: 'desc',
    }
    setPagination(prev => ({ ...prev, offset: 0 }))
    setFilters(defaultFilters)
    loadTimeEntries(defaultFilters)
  }, [loadTimeEntries])

  const setPage = useCallback((page: number) => {
    const newOffset = (page - 1) * pagination.limit
    setPagination(prev => ({ ...prev, offset: newOffset }))

    // Load with new pagination
    loadTimeEntries()
  }, [pagination.limit, loadTimeEntries])

  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, offset: 0 }))

    // Load with new pagination
    loadTimeEntries()
  }, [loadTimeEntries])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // ==============================================
  // EFFECTS
  // ==============================================

  // Initial load
  useEffect(() => {
    loadTimeEntries()
  }, []) // Only run on mount

  // ==============================================
  // RETURN HOOK STATE AND ACTIONS
  // ==============================================
  return {
    // State
    timeEntries,
    pagination,
    filters,
    state,
    error,

    // Computed properties
    isLoading,
    hasError,
    isEmpty,
    hasTimeEntries,
    timeEntryStats,

    // Actions
    loadTimeEntries,
    refreshTimeEntries,
    updateFilters,
    clearFilters,
    setPage,
    setLimit,
    clearError,
  }
}

// ==============================================
// CONVENIENCE HOOKS
// ==============================================

/**
 * Hook for today's time entries
 */
export function useTodaysTimeEntries() {
  const today = new Date().toISOString().split('T')[0]

  const filters = useMemo(() => ({
    dateFrom: today,
    dateTo: today,
    sortBy: 'startTime' as const,
    sortOrder: 'asc' as const,
  }), [today])

  return useTimeEntries()
}

/**
 * Hook for pending time entries (need approval)
 */
export function usePendingTimeEntries() {
  const filters = useMemo(() => ({
    status: 'pending' as const,
    sortBy: 'date' as const,
    sortOrder: 'desc' as const,
  }), [])

  return useTimeEntries()
}

/**
 * Hook for user's time entries
 */
export function useUserTimeEntries(userId: string) {
  const filters = useMemo(() => ({
    userId,
    sortBy: 'date' as const,
    sortOrder: 'desc' as const,
  }), [userId])

  return useTimeEntries()
}

/**
 * Hook for project time entries
 */
export function useProjectTimeEntries(projectId: string) {
  const filters = useMemo(() => ({
    projectId,
    sortBy: 'date' as const,
    sortOrder: 'desc' as const,
  }), [projectId])

  return useTimeEntries()
}

// ==============================================
// ADDITIONAL EXPORTS
// ==============================================
export default useTimeEntries