// ==============================================
// hooks/time-tracking/use-recent-entries.ts - Recent Time Entries Hook
// ==============================================

import { useState, useCallback, useEffect } from 'react'
import { TimeEntriesApi } from '@/lib/api/time-entries'
import type { TimeEntrySummary } from '@/types/time-tracking'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseRecentEntriesReturn {
  recentEntries: (TimeEntrySummary & { createdAt?: string })[]
  isLoading: boolean
  error: string | null
  hasEntries: boolean
  refreshRecentEntries: () => Promise<void>
  clearError: () => void
}

// ==============================================
// MAIN HOOK
// ==============================================
export function useRecentEntries(limit: number = 5): UseRecentEntriesReturn {
  const [recentEntries, setRecentEntries] = useState<TimeEntrySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ==============================================
  // LOAD RECENT ENTRIES
  // ==============================================
  const loadRecentEntries = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await TimeEntriesApi.getRecentEntries(limit)

      if (result.success && result.data) {
        setRecentEntries(result.data)
      } else {
        setRecentEntries([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recent entries'
      setError(errorMessage)
      setRecentEntries([])
      console.error('Load recent entries error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  // ==============================================
  // REFRESH ACTION
  // ==============================================
  const refreshRecentEntries = useCallback(async () => {
    await loadRecentEntries()
  }, [loadRecentEntries])

  // ==============================================
  // CLEAR ERROR ACTION
  // ==============================================
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const hasEntries = recentEntries.length > 0

  // ==============================================
  // INITIAL LOAD
  // ==============================================
  useEffect(() => {
    loadRecentEntries()
  }, [loadRecentEntries])

  // ==============================================
  // RETURN HOOK STATE AND ACTIONS
  // ==============================================
  return {
    recentEntries,
    isLoading,
    error,
    hasEntries,
    refreshRecentEntries,
    clearError,
  }
}

export default useRecentEntries