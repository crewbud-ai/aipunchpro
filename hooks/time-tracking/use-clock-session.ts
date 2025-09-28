// ==============================================
// hooks/time-tracking/use-clock-session.ts - FIXED VERSION
// Resolves infinite loading issue
// ==============================================

import { useState, useCallback, useEffect, useRef } from 'react'
import { TimeEntriesApi } from '@/lib/api/time-entries' // FIXED: Import the class directly
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
// MAIN HOOK - FIXED VERSION
// ==============================================
export function useClockSession(): UseClockSessionReturn {
  console.log('useClockSession: Hook initialized')
  
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
  // ACTIONS - FIXED: Proper error handling and API usage
  // ==============================================
  const refreshSession = useCallback(async () => {
    console.log('useClockSession: refreshSession called')
    
    try {
      setIsLoading(true)
      setError(undefined)

      console.log('useClockSession: Calling API...')
      
      // FIXED: Use TimeEntriesApi class method directly
      const result: GetCurrentSessionResult = await TimeEntriesApi.getCurrentSession()
      
      console.log('useClockSession: API Response:', result)

      if (!mountedRef.current) {
        console.log('useClockSession: Component unmounted, skipping update')
        return
      }

      // FIXED: Handle both success and failure cases properly
      if (result.success) {
        console.log('useClockSession: API success')
        if (result.data) {
          console.log('useClockSession: Setting session data:', result.data)
          setHasActiveSession(result.data.hasActiveSession || false)
          setCurrentSession(result.data.session || undefined)
        } else {
          console.log('useClockSession: No data in response')
          setHasActiveSession(false)
          setCurrentSession(undefined)
        }
        setError(undefined) // Clear any previous errors
      } else {
        console.log('useClockSession: API failed:', result.message)
        setHasActiveSession(false)
        setCurrentSession(undefined)
        // Don't set error for "no active session" - that's normal
        if (result.message && !result.message.includes('No active')) {
          setError(result.message)
        }
      }
    } catch (err) {
      console.error('useClockSession: Error:', err)
      if (!mountedRef.current) return
      
      // FIXED: Better error handling
      const errorMessage = err instanceof Error ? err.message : 'Failed to get current session'
      
      // Only set error state if it's not a normal "no session" scenario
      if (!errorMessage.includes('No active') && !errorMessage.includes('404')) {
        setError(errorMessage)
      }
      
      // Set default state
      setHasActiveSession(false)
      setCurrentSession(undefined)
    } finally {
      console.log('useClockSession: Setting isLoading to false')
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const clearSession = useCallback(() => {
    console.log('useClockSession: clearSession called')
    setHasActiveSession(false)
    setCurrentSession(undefined)
    setError(undefined)
  }, [])

  const clearError = useCallback(() => {
    console.log('useClockSession: clearError called')
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
  // EFFECTS - FIXED: Proper dependency management
  // ==============================================
  
  // Initial load with proper cleanup
  useEffect(() => {
    console.log('useClockSession: Initial effect triggered')
    
    let mounted = true
    mountedRef.current = true

    // FIXED: Call refreshSession directly to avoid circular dependencies
    const loadSession = async () => {
      if (!mounted) return
      
      try {
        setIsLoading(true)
        setError(undefined)

        const result: GetCurrentSessionResult = await TimeEntriesApi.getCurrentSession()
        
        if (!mounted) return

        if (result.success) {
          if (result.data) {
            setHasActiveSession(result.data.hasActiveSession || false)
            setCurrentSession(result.data.session || undefined)
          } else {
            setHasActiveSession(false)
            setCurrentSession(undefined)
          }
          setError(undefined)
        } else {
          setHasActiveSession(false)
          setCurrentSession(undefined)
          if (result.message && !result.message.includes('No active')) {
            setError(result.message)
          }
        }
      } catch (err) {
        if (!mounted) return
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to get current session'
        
        if (!errorMessage.includes('No active') && !errorMessage.includes('404')) {
          setError(errorMessage)
        }
        
        setHasActiveSession(false)
        setCurrentSession(undefined)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadSession()

    return () => {
      mounted = false
      mountedRef.current = false
    }
  }, []) // FIXED: No dependencies to prevent infinite loops

  // Auto-refresh when active - FIXED: Better interval management
  useEffect(() => {
    if (hasActiveSession && currentSession && !isLoading) {
      console.log('useClockSession: Setting up auto-refresh')
      
      intervalRef.current = setInterval(async () => {
        if (mountedRef.current && hasActiveSession) {
          try {
            const result = await TimeEntriesApi.getCurrentSession()
            if (mountedRef.current && result.success && result.data) {
              setHasActiveSession(result.data.hasActiveSession || false)
              setCurrentSession(result.data.session || undefined)
            }
          } catch (err) {
            console.error('Auto-refresh error:', err)
          }
        }
      }, 60000) // Refresh every minute
    } else {
      if (intervalRef.current) {
        console.log('useClockSession: Clearing auto-refresh')
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
  }, [hasActiveSession, currentSession, isLoading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('useClockSession: Cleanup on unmount')
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // ==============================================
  // DEBUG LOGGING
  // ==============================================
  useEffect(() => {
    console.log('useClockSession: State update:', { 
      isLoading, 
      hasActiveSession, 
      currentSession: !!currentSession, 
      error 
    })
  }, [isLoading, hasActiveSession, currentSession, error])

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

export default useClockSession