// ==============================================
// src/hooks/projects/use-project.ts - Single Project Hook
// ==============================================

import { useState, useCallback, useEffect } from 'react'
import { projectsApi } from '@/lib/api/projects'
import type {
  Project,
  ProjectState,
  GetProjectResult,
} from '@/types/projects'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseProjectState {
  project: Project | null
  state: ProjectState
  error: string | null
}

interface UseProjectActions {
  loadProject: (id: string) => Promise<void>
  refreshProject: () => Promise<void>
  clearError: () => void
  reset: () => void
}

interface UseProjectReturn extends UseProjectState, UseProjectActions {
  // Computed properties
  hasProject: boolean
  isLoading: boolean
  isLoaded: boolean
  hasError: boolean
  isNotFound: boolean
}

// ==============================================
// MAIN HOOK
// ==============================================
export const useProject = (initialProjectId?: string) => {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseProjectState>({
    project: null,
    state: initialProjectId ? 'loading' : 'loaded',
    error: null,
  })

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    initialProjectId || null
  )

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const hasProject = state.project !== null
  const isLoading = state.state === 'loading'
  const isLoaded = state.state === 'loaded'
  const hasError = state.state === 'error'
  const isNotFound = state.state === 'not_found'

  // ==============================================
  // CLEAR ERROR
  // ==============================================
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      state: prev.project ? 'loaded' : 'loaded',
    }))
  }, [])

  // ==============================================
  // RESET STATE
  // ==============================================
  const reset = useCallback(() => {
    setState({
      project: null,
      state: 'loaded',
      error: null,
    })
    setCurrentProjectId(null)
  }, [])

  // ==============================================
  // LOAD PROJECT
  // ==============================================
  const loadProject = useCallback(async (id: string) => {
    if (!id) {
      setState(prev => ({
        ...prev,
        state: 'error',
        error: 'Project ID is required',
      }))
      return
    }

    try {
      setState(prev => ({
        ...prev,
        state: 'loading',
        error: null,
      }))

      setCurrentProjectId(id)

      const response = await projectsApi.getProject(id)

      if (response.success) {
        setState(prev => ({
          ...prev,
          project: response.data.project,
          state: 'loaded',
          error: null,
        }))
      } else {
        setState(prev => ({
          ...prev,
          project: null,
          state: 'error',
          error: response.message || 'Failed to load project',
        }))
      }
    } catch (error: any) {
      console.error('Error loading project:', error)
      
      // Handle specific error cases
      if (error.status === 404) {
        setState(prev => ({
          ...prev,
          project: null,
          state: 'not_found',
          error: 'Project not found',
        }))
      } else {
        setState(prev => ({
          ...prev,
          project: null,
          state: 'error',
          error: error.message || 'Failed to load project',
        }))
      }
    }
  }, [])

  // ==============================================
  // REFRESH PROJECT
  // ==============================================
  const refreshProject = useCallback(async () => {
    if (currentProjectId) {
      await loadProject(currentProjectId)
    }
  }, [currentProjectId, loadProject])

  // ==============================================
  // INITIAL LOAD
  // ==============================================
  useEffect(() => {
    if (initialProjectId) {
      loadProject(initialProjectId)
    }
  }, [initialProjectId, loadProject])

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    project: state.project,
    state: state.state,
    error: state.error,
    
    // Computed properties
    hasProject,
    isLoading,
    isLoaded,
    hasError,
    isNotFound,
    
    // Actions
    loadProject,
    refreshProject,
    clearError,
    reset,
  } satisfies UseProjectReturn
}