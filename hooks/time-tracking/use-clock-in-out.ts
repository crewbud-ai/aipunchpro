// ==============================================
// hooks/time-tracking/use-clock-in-out.ts - UPDATED FOR SIMPLIFIED CLOCK IN
// ==============================================

import { useState, useCallback, useEffect } from 'react'
import { TimeEntriesApi } from '@/lib/api/time-entries'
import type { 
  ClockInData,
  ClockOutData,
  ClockInResult,
  ClockOutResult,
  ProjectForClockIn,
  ScheduleProjectForClockIn,
  GetClockInOptionsResult 
} from '@/types/time-tracking'

// ==============================================
// HOOK RETURN TYPE
// ==============================================
interface UseClockInOutReturn {
  // Loading states
  isClockingIn: boolean
  isClockingOut: boolean
  isLoadingOptions: boolean
  
  // Data
  projects: ProjectForClockIn[]
  scheduleProjects: ScheduleProjectForClockIn[]
  userInfo: any
  error?: string
  
  // Actions
  clockIn: (data: ClockInData) => Promise<ClockInResult | null>
  clockOut: (data: ClockOutData) => Promise<ClockOutResult | null>
  loadClockInOptions: () => Promise<void>
  refreshOptions: () => Promise<void>
  clearError: () => void
  reset: () => void
  
  // Computed
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
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [error, setError] = useState<string>()
  
  const [projects, setProjects] = useState<ProjectForClockIn[]>([])
  const [scheduleProjects, setScheduleProjects] = useState<ScheduleProjectForClockIn[]>([])
  const [userInfo, setUserInfo] = useState<any>(null)

  // ==============================================
  // LOAD CLOCK IN OPTIONS
  // ==============================================
  const loadClockInOptions = useCallback(async () => {
    try {
      setIsLoadingOptions(true)
      setError(undefined)

      const result: GetClockInOptionsResult = await TimeEntriesApi.getClockInOptions()

      if (result.success && result.data) {
        setProjects(result.data.projects || [])
        setScheduleProjects(result.data.scheduleProjects || [])
        setUserInfo(result.data.userInfo || null)
        setError(undefined)
      } else {
        setProjects([])
        setScheduleProjects([])
        setUserInfo(null)
        
        if (result.message && !result.message.toLowerCase().includes('no projects')) {
          setError(result.message)
        }
      }
    } catch (err) {
      console.error('Failed to load clock-in options:', err)
      
      const message = err instanceof Error ? err.message : 'Failed to load options'
      
      if (message.includes('403') || message.toLowerCase().includes('not assigned')) {
        setProjects([])
        setScheduleProjects([])
        setUserInfo(null)
      } else {
        setError(message)
      }
    } finally {
      setIsLoadingOptions(false)
    }
  }, [])

  // ==============================================
  // CLOCK IN - SIMPLIFIED
  // ==============================================
  const clockIn = useCallback(async (data: ClockInData): Promise<ClockInResult | null> => {
    try {
      setIsClockingIn(true)
      setError(undefined)

      const result = await TimeEntriesApi.clockIn(data)

      if (result.success) {
        return result
      } else {
        setError(result.message || 'Clock in failed')
        return null
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clock in'
      setError(message)
      console.error('Clock in error:', err)
      return null
    } finally {
      setIsClockingIn(false)
    }
  }, [])

  // ==============================================
  // CLOCK OUT - SIMPLIFIED
  // ==============================================
  const clockOut = useCallback(async (data: ClockOutData): Promise<ClockOutResult | null> => {
    try {
      setIsClockingOut(true)
      setError(undefined)

      const result = await TimeEntriesApi.clockOut(data)

      if (result.success) {
        return result
      } else {
        setError(result.message || 'Clock out failed')
        return null
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clock out'
      setError(message)
      console.error('Clock out error:', err)
      return null
    } finally {
      setIsClockingOut(false)
    }
  }, [])

  // ==============================================
  // UTILITY FUNCTIONS
  // ==============================================
  const refreshOptions = useCallback(() => {
    return loadClockInOptions()
  }, [loadClockInOptions])

  const clearError = useCallback(() => {
    setError(undefined)
  }, [])

  const reset = useCallback(() => {
    setIsClockingIn(false)
    setIsClockingOut(false)
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
  useEffect(() => {
    loadClockInOptions()
  }, [loadClockInOptions])

  // ==============================================
  // RETURN
  // ==============================================
  return {
    isClockingIn,
    isClockingOut,
    isLoadingOptions,
    projects,
    scheduleProjects,
    userInfo,
    error,
    clockIn,
    clockOut,
    loadClockInOptions,
    refreshOptions,
    clearError,
    reset,
    hasProjects,
    hasScheduleProjects,
    canClockIn,
  }
}

// ==============================================
// CONVENIENCE HOOKS - UPDATED FOR SIMPLIFIED INTERFACE
// ==============================================

/**
 * Quick clock in with minimal data - SIMPLIFIED
 */
export function useQuickClockIn() {
  const { clockIn, isClockingIn, error, projects } = useClockInOut()
  
  const quickClockIn = useCallback(async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    // SIMPLIFIED: Only projectId and description
    return await clockIn({
      projectId,
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
 * Quick clock out with minimal data - SIMPLIFIED
 */
export function useQuickClockOut() {
  const { clockOut, isClockingOut, error } = useClockInOut()
  
  const quickClockOut = useCallback(async () => {
    // SIMPLIFIED: Only description
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
// DEFAULT EXPORT
// ==============================================
export default useClockInOut