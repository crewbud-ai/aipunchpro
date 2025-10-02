// ==============================================
// hooks/time-tracking/use-live-earnings.ts
// Hook to fetch and manage live earnings data
// ==============================================

import { useState, useEffect, useCallback } from 'react'

// ==============================================
// TYPES
// ==============================================

interface ActiveSession {
  id: string
  projectId: string
  projectName: string
  scheduleProjectId?: string
  scheduleProjectTitle?: string
  startTime: string
  date: string
  regularRate: number
  overtimeRate: number
  doubleTimeRate?: number
  breakMinutes?: number
}

interface UseLiveEarningsReturn {
  activeSession: ActiveSession | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// ==============================================
// HOOK
// ==============================================

export function useLiveEarnings(): UseLiveEarningsReturn {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ==============================================
  // FETCH ACTIVE SESSION
  // ==============================================
  const fetchActiveSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/time-entries/current-session')
      
      if (!response.ok) {
        if (response.status === 404) {
          // No active session - this is normal
          setActiveSession(null)
          return
        }
        throw new Error('Failed to fetch active session')
      }

      const result = await response.json()

      if (result.success && result.data) {
        const session = result.data.session

        // Transform API response to ActiveSession format
        const activeSessionData: ActiveSession = {
          id: session.id,
          projectId: session.projectId,
          projectName: session.project?.name || 'Unknown Project',
          scheduleProjectId: session.scheduleProjectId,
          scheduleProjectTitle: session.scheduleProject?.title,
          startTime: session.startTime,
          date: session.date,
          regularRate: session.regularRate || 0,
          overtimeRate: session.overtimeRate || 0,
          doubleTimeRate: session.doubleTimeRate,
          breakMinutes: session.breakMinutes || 0,
        }

        setActiveSession(activeSessionData)
      } else {
        setActiveSession(null)
      }
    } catch (err) {
      console.error('Error fetching active session:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setActiveSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ==============================================
  // EFFECTS
  // ==============================================

  // Fetch on mount
  useEffect(() => {
    fetchActiveSession()
  }, [fetchActiveSession])

  // Refetch every 5 minutes to ensure rates are up to date
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActiveSession()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [fetchActiveSession])

  // ==============================================
  // RETURN
  // ==============================================
  return {
    activeSession,
    isLoading,
    error,
    refetch: fetchActiveSession,
  }
}

export default useLiveEarnings