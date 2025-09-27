// ==============================================
// hooks/time-tracking/use-clock-in-out.ts - Clock In/Out Actions Hook
// ==============================================

import { useState, useCallback, useEffect } from 'react'
import { timeEntriesApi } from '@/lib/api/time-entries'
import type { 
  ClockInData,
  ClockOutData,
  ClockInResult,
  ClockOutResult,
  ProjectForClockIn,
  ScheduleProjectForClockIn,
  ClockActionState,
  GetClockInOptionsResult 
} from '@/types/time-tracking'

// ==============================================
// HOOK INTERFACE
// ==============================================
interface UseClockInOutReturn extends ClockActionState {
  // Available options
  projects: ProjectForClockIn[]
  scheduleProjects: ScheduleProjectForClockIn[]
  userInfo: any
  
  // Actions
  clockIn: (data: ClockInData) => Promise<ClockInResult | null>
  clockOut: (data: ClockOutData) => Promise<ClockOutResult | null>
  loadClockInOptions: () => Promise<void>
  refreshOptions: () => Promise<void>
  
  // State helpers
  clearError: () => void
  reset: () => void
  
  // Computed values
  hasProjects: boolean
  hasScheduleProjects: boolean
  canClockIn: boolean
}

// ==============================================
// MAIN HOOK
// ==============================================
export function useClockInOut(): UseClockInOutReturn {
  // ==============================================
  // STATE
  // ==============================================
  const [isClockingIn, setIsClockingIn] = useState(false)
  const [isClockingOut, setIsClockingOut] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [error, setError] = useState<string | undefined>()
  
  // Options state
  const [projects, setProjects] = useState<ProjectForClockIn[]>([])
  const [scheduleProjects, setScheduleProjects] = useState<ScheduleProjectForClockIn[]>([])
  const [userInfo, setUserInfo] = useState<any>(null)

  // ==============================================
  // CLOCK IN ACTION
  // ==============================================
  const clockIn = useCallback(async (data: ClockInData): Promise<ClockInResult | null> => {
    try {
      setIsClockingIn(true)
      setError(undefined)

      const result = await timeEntriesApi.clockIn(data)

      if (result.success) {
        // Clear any previous error
        setError(undefined)
        return result
      } else {
        throw new Error(result.message || 'Clock in failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clock in'
      setError(errorMessage)
      console.error('Clock in error:', err)
      return null
    } finally {
      setIsClockingIn(false)
    }
  }, [])

  // ==============================================
  // CLOCK OUT ACTION
  // ==============================================
  const clockOut = useCallback(async (data: ClockOutData): Promise<ClockOutResult | null> => {
    try {
      setIsClockingOut(true)
      setError(undefined)

      const result = await timeEntriesApi.clockOut(data)

      if (result.success) {
        // Clear any previous error
        setError(undefined)
        return result
      } else {
        throw new Error(result.message || 'Clock out failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clock out'
      setError(errorMessage)
      console.error('Clock out error:', err)
      return null
    } finally {
      setIsClockingOut(false)
    }
  }, [])

  // ==============================================
  // LOAD CLOCK IN OPTIONS
  // ==============================================
  const loadClockInOptions = useCallback(async () => {
    try {
      setIsLoadingOptions(true)
      setError(undefined)

      const result: GetClockInOptionsResult = await timeEntriesApi.getClockInOptions()

      if (result.success && result.data) {
        setProjects(result.data.projects || [])
        setScheduleProjects(result.data.scheduleProjects || [])
        setUserInfo(result.data.userInfo || null)
      } else {
        throw new Error(result.message || 'Failed to load options')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load clock in options'
      setError(errorMessage)
      console.error('Load clock in options error:', err)
    } finally {
      setIsLoadingOptions(false)
    }
  }, [])

  // ==============================================
  // UTILITY ACTIONS
  // ==============================================
  const refreshOptions = useCallback(async () => {
    await loadClockInOptions()
  }, [loadClockInOptions])

  const clearError = useCallback(() => {
    setError(undefined)
  }, [])

  const reset = useCallback(() => {
    setIsClockingIn(false)
    setIsClockingOut(false)
    setIsLoadingOptions(false)
    setError(undefined)
  }, [])

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const hasProjects = projects.length > 0
  const hasScheduleProjects = scheduleProjects.length > 0
  const canClockIn = hasProjects && !isClockingIn && !isClockingOut && !isLoadingOptions

  // ==============================================
  // EFFECTS
  // ==============================================
  
  // Load options on mount
  useEffect(() => {
    loadClockInOptions()
  }, [loadClockInOptions])

  // ==============================================
  // RETURN HOOK STATE AND ACTIONS
  // ==============================================
  return {
    // State
    isClockingIn,
    isClockingOut,
    isLoadingOptions,
    error,
    
    // Options
    projects,
    scheduleProjects,
    userInfo,
    
    // Actions
    clockIn,
    clockOut,
    loadClockInOptions,
    refreshOptions,
    clearError,
    reset,
    
    // Computed values
    hasProjects,
    hasScheduleProjects,
    canClockIn,
  }
}

// ==============================================
// ADDITIONAL CONVENIENCE HOOKS
// ==============================================

/**
 * Hook for quick clock in with minimal data
 */
export function useQuickClockIn() {
  const { clockIn, isClockingIn, error, projects } = useClockInOut()
  
  const quickClockIn = useCallback(async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    return await clockIn({
      projectId,
      workType: 'general',
      description: `Working on ${project.name}`,
    })
  }, [clockIn, projects])

  return {
    quickClockIn,
    isClockingIn,
    error,
    projects,
  }
}

/**
 * Hook for quick clock out with minimal data
 */
export function useQuickClockOut() {
  const { clockOut, isClockingOut, error } = useClockInOut()
  
  const quickClockOut = useCallback(async () => {
    return await clockOut({
      description: 'Work completed',
    })
  }, [clockOut])

  return {
    quickClockOut,
    isClockingOut,
    error,
  }
}

// ==============================================
// ADDITIONAL EXPORTS
// ==============================================
export default useClockInOut