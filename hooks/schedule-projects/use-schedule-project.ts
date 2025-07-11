// ==============================================
// hooks/schedule-projects/use-schedule-project.ts - Individual Schedule Project Hook
// ==============================================

import { useState, useCallback, useEffect } from 'react'
import { scheduleProjectsApi } from '@/lib/api/schedule-projects'
import {
  type ScheduleProject,
  type ScheduleProjectState,
  type GetScheduleProjectResult,
  type QuickUpdateScheduleStatusData,
} from '@/types/schedule-projects'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseScheduleProjectState {
  scheduleProject: ScheduleProject | null
  dependentSchedules: Array<{
    id: string
    title: string
    status: string
    startDate: string
    endDate: string
    project: {
      name: string
    }
  }>
  state: ScheduleProjectState
  error: string | null
}

interface UseScheduleProjectActions {
  loadScheduleProject: (id: string) => Promise<void>
  refreshScheduleProject: () => Promise<void>
  clearError: () => void
  reset: () => void

  // Quick status update
  updateStatus: (data: QuickUpdateScheduleStatusData) => Promise<void>
}

interface UseScheduleProjectReturn extends UseScheduleProjectState, UseScheduleProjectActions {
  // Computed properties
  isLoading: boolean
  isLoaded: boolean
  isError: boolean
  isNotFound: boolean
  hasScheduleProject: boolean
  hasDependentSchedules: boolean
}

// ==============================================
// MAIN HOOK
// ==============================================
export function useScheduleProject(initialId?: string) {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseScheduleProjectState>({
    scheduleProject: null,
    dependentSchedules: [],
    state: initialId ? 'loading' : 'not_found',
    error: null,
  })

  const [currentId, setCurrentId] = useState<string | null>(initialId || null)

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const isLoading = state.state === 'loading'
  const isLoaded = state.state === 'loaded'
  const isError = state.state === 'error'
  const isNotFound = state.state === 'not_found'
  const hasScheduleProject = state.scheduleProject !== null
  const hasDependentSchedules = state.dependentSchedules.length > 0

  // ==============================================
  // ACTIONS
  // ==============================================

  // Load schedule project by ID
  const loadScheduleProject = useCallback(async (id: string) => {
    try {
      setState(prev => ({
        ...prev,
        state: 'loading',
        error: null,
      }))

      setCurrentId(id)

      const result = await scheduleProjectsApi.getScheduleProject(id)

      setState(prev => ({
        ...prev,
        scheduleProject: result.data.scheduleProject,
        dependentSchedules: result.data.dependentSchedules || [],
        state: 'loaded',
        error: null,
      }))

    } catch (error) {
      console.error('Error loading schedule project:', error)
      
      // Handle different error types
      let newState: ScheduleProjectState = 'error'
      let errorMessage = 'Failed to load schedule project'

      if (error instanceof Error) {
        // Check if it's a 404 error (API errors should have status property)
        if ('status' in error && (error as any).status === 404) {
          newState = 'not_found'
          errorMessage = 'Schedule project not found'
        } else {
          errorMessage = error.message
        }
      }

      setState(prev => ({
        ...prev,
        state: newState,
        error: errorMessage,
        scheduleProject: null,
        dependentSchedules: [],
      }))
    }
  }, [])

  // Refresh current schedule project
  const refreshScheduleProject = useCallback(async () => {
    if (currentId) {
      await loadScheduleProject(currentId)
    }
  }, [currentId, loadScheduleProject])

  // Quick status update
  const updateStatus = useCallback(async (data: QuickUpdateScheduleStatusData) => {
    try {
      setState(prev => ({ ...prev, error: null }))

      const result = await scheduleProjectsApi.updateScheduleStatus(data)

      // Update the current schedule project with the updated data
      setState(prev => ({
        ...prev,
        scheduleProject: result.data.scheduleProject,
      }))

    } catch (error) {
      console.error('Error updating schedule project status:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status'
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }))

      // Re-throw so the calling component can handle it if needed
      throw error
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Reset state
  const reset = useCallback(() => {
    setState({
      scheduleProject: null,
      dependentSchedules: [],
      state: 'not_found',
      error: null,
    })
    setCurrentId(null)
  }, [])

  // ==============================================
  // EFFECTS
  // ==============================================

  // Load initial data if ID provided
  useEffect(() => {
    if (initialId) {
      loadScheduleProject(initialId)
    }
  }, [initialId, loadScheduleProject])

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    scheduleProject: state.scheduleProject,
    dependentSchedules: state.dependentSchedules,
    state: state.state,
    error: state.error,

    // Computed values
    isLoading,
    isLoaded,
    isError,
    isNotFound,
    hasScheduleProject,
    hasDependentSchedules,

    // Actions
    loadScheduleProject,
    refreshScheduleProject,
    updateStatus,
    clearError,
    reset,
  }
}

// Export default
export default useScheduleProject