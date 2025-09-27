// ==============================================
// hooks/time-tracking/use-clock-session.ts - Current Session Management Hook
// ==============================================

import { useState, useCallback, useEffect, useRef } from 'react'
import { timeEntriesApi } from '@/lib/api/time-entries'
import type { 
  ClockSession, 
  ClockSessionState,
  GetCurrentSessionResult 
} from '@/types/time-tracking'

// ==============================================
// HOOK INTERFACE
// ==============================================
interface UseClockSessionReturn extends Omit<ClockSessionState, 'currentSession'> {
  // Custom currentSession type to match API response
  currentSession?: {
    id: string
    projectId: string
    scheduleProjectId?: string
    projectName: string
    scheduleProjectTitle?: string
    startTime: string
    duration: number
    workType?: string
    trade?: string
  }
  
  // Actions
  refreshSession: () => Promise<void>
  clearSession: () => void
  
  // Computed values
  isClocked: boolean
  sessionDuration: number
  formattedDuration: string
  canClockOut: boolean
  
  // Error handling
  clearError: () => void
}

// ==============================================
// MAIN HOOK
// ==============================================
export function useClockSession(): UseClockSessionReturn {
  // ==============================================
  // STATE
  // ==============================================
  const [hasActiveSession, setHasActiveSession] = useState(false)
  const [currentSession, setCurrentSession] = useState<{
    id: string
    projectId: string
    scheduleProjectId?: string
    projectName: string
    scheduleProjectTitle?: string
    startTime: string
    duration: number
    workType?: string
    trade?: string
  } | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  
  // ==============================================
  // REFS FOR CLEANUP
  // ==============================================
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // ==============================================
  // ACTIONS
  // ==============================================
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(undefined)

      const result: GetCurrentSessionResult = await timeEntriesApi.getCurrentSession()

      if (!mountedRef.current) return

      if (result.success && result.data) {
        setHasActiveSession(result.data.hasActiveSession)
        
        // Set session data directly from API response
        setCurrentSession(result.data.session)
      } else {
        setHasActiveSession(false)
        setCurrentSession(undefined)
      }
    } catch (err) {
      if (!mountedRef.current) return
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to get current session'
      setError(errorMessage)
      console.error('Error fetching current session:', err)
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const clearSession = useCallback(() => {
    setHasActiveSession(false)
    setCurrentSession(undefined)
    setError(undefined)
  }, [])

  const clearError = useCallback(() => {
    setError(undefined)
  }, [])

  // ==============================================
  // SESSION DURATION CALCULATION
  // ==============================================
  const calculateDuration = useCallback((session?: { startTime: string }): number => {
    if (!session?.startTime) return 0

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    
    try {
      const start = new Date(`1970-01-01T${session.startTime}`)
      const current = new Date(`1970-01-01T${currentTime}`)
      
      const durationMs = current.getTime() - start.getTime()
      return Math.max(0, Math.floor(durationMs / (1000 * 60))) // minutes
    } catch (error) {
      console.error('Error calculating duration:', error)
      return 0
    }
  }, [])

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const sessionDuration = calculateDuration(currentSession)
  
  const formattedDuration = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours === 0) {
      return `${mins}m`
    }
    
    return `${hours}h ${mins}m`
  }, [])

  const isClocked = hasActiveSession && !!currentSession
  const canClockOut = isClocked && !isLoading
  const durationString = formattedDuration(sessionDuration)

  // ==============================================
  // EFFECTS
  // ==============================================
  
  // Initial load
  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  // Auto-refresh session data every minute when clocked in
  useEffect(() => {
    if (hasActiveSession && currentSession) {
      intervalRef.current = setInterval(() => {
        // Only refresh if we're still mounted and have an active session
        if (mountedRef.current && hasActiveSession) {
          refreshSession()
        }
      }, 60000) // Refresh every minute
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [hasActiveSession, currentSession, refreshSession])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // ==============================================
  // RETURN HOOK STATE AND ACTIONS
  // ==============================================
  return {
    // State
    hasActiveSession,
    currentSession,
    isLoading,
    error,
    
    // Actions
    refreshSession,
    clearSession,
    clearError,
    
    // Computed values
    isClocked,
    sessionDuration,
    formattedDuration: durationString,
    canClockOut,
  }
}

// ==============================================
// ADDITIONAL EXPORT
// ==============================================
export default useClockSession