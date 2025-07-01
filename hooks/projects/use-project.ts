// ==============================================
// src/hooks/projects/use-project.ts - Updated Single Project Hook
// ==============================================

import { useState, useCallback, useEffect } from 'react'
import { projectsApi } from '@/lib/api/projects'
import type {
  Project,
  ProjectState,
  GetProjectResult,
  ProjectLocation,
  ProjectClient,
} from '@/types/projects'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseProjectState {
  project: Project | null
  state: ProjectState
  error: string | null
  
  // Enhanced state for optimistic updates
  isUpdating: boolean
  lastUpdateField: string | null
}

interface UseProjectActions {
  loadProject: (id: string) => Promise<void>
  refreshProject: () => Promise<void>
  clearError: () => void
  reset: () => void
  
  // Quick update actions (using general updateProject method)
  updateProjectStatus: (status: Project['status'], notes?: string) => Promise<void>
  updateProjectProgress: (progress: number, notes?: string) => Promise<void>
  updateProjectPriority: (priority: Project['priority']) => Promise<void>
  
  // Location and client updates
  updateProjectLocation: (location: ProjectLocation) => Promise<void>
  updateProjectClient: (client: ProjectClient) => Promise<void>
  
  // Optimistic update helpers
  optimisticUpdate: (field: keyof Project, value: any) => void
  revertOptimisticUpdate: () => void
}

interface UseProjectReturn extends UseProjectState, UseProjectActions {
  // Computed properties
  hasProject: boolean
  isLoading: boolean
  isLoaded: boolean
  hasError: boolean
  isNotFound: boolean
  
  // Enhanced computed properties
  projectLocation: ProjectLocation | null
  projectClient: ProjectClient | null
  hasLocation: boolean
  hasClient: boolean
  hasCoordinates: boolean
  isOverBudget: boolean
  budgetUtilization: number
  progressStatus: 'on_track' | 'ahead' | 'behind' | 'not_started'
  daysUntilDeadline: number | null
  isOverdue: boolean
  
  // Display helpers
  displayLocation: string
  displayClient: string
  clientContactInfo: string
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
    isUpdating: false,
    lastUpdateField: null,
  })

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    initialProjectId || null
  )

  const [originalProject, setOriginalProject] = useState<Project | null>(null)

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const hasProject = state.project !== null
  const isLoading = state.state === 'loading'
  const isLoaded = state.state === 'loaded'
  const hasError = state.state === 'error'
  const isNotFound = state.state === 'not_found'

  // Enhanced computed properties
  const projectLocation = state.project?.location || null
  const projectClient = state.project?.client || null
  const hasLocation = !!projectLocation
  const hasClient = !!projectClient
  const hasCoordinates = !!(projectLocation?.coordinates)

  const isOverBudget = !!(
    state.project?.budget && 
    state.project?.spent && 
    state.project.spent > state.project.budget
  )

  const budgetUtilization = (() => {
    if (!state.project?.budget || !state.project?.spent) return 0
    return Math.round((state.project.spent / state.project.budget) * 100)
  })()

  const progressStatus = (() => {
    if (!state.project) return 'not_started'
    
    const { status, progress = 0 } = state.project
    
    if (status === 'not_started') return 'not_started'
    if (status === 'ahead_of_schedule') return 'ahead'
    if (status === 'behind_schedule') return 'behind'
    
    // Simple heuristic based on progress
    if (progress >= 75) return 'ahead'
    if (progress >= 25) return 'on_track'
    return 'behind'
  })()

  const daysUntilDeadline = (() => {
    if (!state.project?.endDate) return null
    
    const deadline = new Date(state.project.endDate)
    const today = new Date()
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  })()

  const isOverdue = daysUntilDeadline !== null && daysUntilDeadline < 0

  // ==============================================
  // UTILITY FUNCTIONS FOR DISPLAY
  // ==============================================
  const getDisplayLocation = (location: ProjectLocation | null | undefined): string => {
    if (!location) return 'No location set'
    return location.displayName || location.address || 'Unknown location'
  }

  const getDisplayClient = (client: ProjectClient | null | undefined): string => {
    if (!client) return 'No client assigned'
    return client.name || client.contactPerson || client.email || 'Unknown client'
  }

  const getClientContactInfo = (client: ProjectClient | null | undefined): string => {
    if (!client) return ''
    const contacts = []
    if (client.email) contacts.push(client.email)
    if (client.phone) contacts.push(client.phone)
    return contacts.join(' • ')
  }

  // ==============================================
  // OPTIMISTIC UPDATE HELPERS
  // ==============================================
  const optimisticUpdate = useCallback((field: keyof Project, value: any) => {
    if (!state.project) return

    setState(prev => ({
      ...prev,
      project: prev.project ? { ...prev.project, [field]: value } : null,
      isUpdating: true,
      lastUpdateField: field,
    }))
  }, [state.project])

  const revertOptimisticUpdate = useCallback(() => {
    if (originalProject) {
      setState(prev => ({
        ...prev,
        project: originalProject,
        isUpdating: false,
        lastUpdateField: null,
      }))
    }
  }, [originalProject])

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
      isUpdating: false,
      lastUpdateField: null,
    })
    setCurrentProjectId(null)
    setOriginalProject(null)
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
        isUpdating: false,
        lastUpdateField: null,
      }))

      setCurrentProjectId(id)

      const response = await projectsApi.getProject(id)

      if (response.success) {
        const project = response.data.project
        setState(prev => ({
          ...prev,
          project,
          state: 'loaded',
          error: null,
          isUpdating: false,
          lastUpdateField: null,
        }))
        setOriginalProject(project)
      } else {
        setState(prev => ({
          ...prev,
          project: null,
          state: 'error',
          error: response.message || 'Failed to load project',
          isUpdating: false,
          lastUpdateField: null,
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
          isUpdating: false,
          lastUpdateField: null,
        }))
      } else {
        setState(prev => ({
          ...prev,
          project: null,
          state: 'error',
          error: error.message || 'Failed to load project',
          isUpdating: false,
          lastUpdateField: null,
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
  // QUICK UPDATE ACTIONS (using PATCH requests)
  // ==============================================
  const updateProjectStatus = useCallback(async (
    status: Project['status'], 
    notes?: string
  ) => {
    if (!state.project || !currentProjectId) return

    const originalStatus = state.project.status

    try {
      // Optimistic update
      optimisticUpdate('status', status)

      // Use PATCH method for status updates
      const response = await fetch(`/api/projects/${currentProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update_status',
          status,
          notes 
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          project: data.data.project,
          isUpdating: false,
          lastUpdateField: null,
        }))
        setOriginalProject(data.data.project)
      } else {
        optimisticUpdate('status', originalStatus)
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to update project status',
          isUpdating: false,
          lastUpdateField: null,
        }))
      }
    } catch (error: any) {
      console.error('Error updating project status:', error)
      optimisticUpdate('status', originalStatus)
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to update project status',
        isUpdating: false,
        lastUpdateField: null,
      }))
    }
  }, [state.project, currentProjectId, optimisticUpdate])

  const updateProjectProgress = useCallback(async (
    progress: number, 
    notes?: string
  ) => {
    if (!state.project || !currentProjectId) return

    const originalProgress = state.project.progress

    try {
      // Optimistic update
      optimisticUpdate('progress', progress)

      // Use PATCH method for progress updates
      const response = await fetch(`/api/projects/${currentProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update_progress',
          progress,
          notes 
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          project: data.data.project,
          isUpdating: false,
          lastUpdateField: null,
        }))
        setOriginalProject(data.data.project)
      } else {
        optimisticUpdate('progress', originalProgress)
        setState(prev => ({
          ...prev,
          error: data.message || 'Failed to update project progress',
          isUpdating: false,
          lastUpdateField: null,
        }))
      }
    } catch (error: any) {
      console.error('Error updating project progress:', error)
      optimisticUpdate('progress', originalProgress)
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to update project progress',
        isUpdating: false,
        lastUpdateField: null,
      }))
    }
  }, [state.project, currentProjectId, optimisticUpdate])

  const updateProjectPriority = useCallback(async (priority: Project['priority']) => {
    if (!state.project || !currentProjectId) return

    const originalPriority = state.project.priority

    try {
      // Optimistic update
      optimisticUpdate('priority', priority)

      const response = await projectsApi.updateProject(currentProjectId, { priority })

      if (response.success) {
        setState(prev => ({
          ...prev,
          project: response.data.project,
          isUpdating: false,
          lastUpdateField: null,
        }))
        setOriginalProject(response.data.project)
      } else {
        // Revert on failure
        optimisticUpdate('priority', originalPriority)
        setState(prev => ({
          ...prev,
          error: response.message || 'Failed to update project priority',
          isUpdating: false,
          lastUpdateField: null,
        }))
      }
    } catch (error: any) {
      console.error('Error updating project priority:', error)
      // Revert on error
      optimisticUpdate('priority', originalPriority)
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to update project priority',
        isUpdating: false,
        lastUpdateField: null,
      }))
    }
  }, [state.project, currentProjectId, optimisticUpdate])

  // ==============================================
  // LOCATION AND CLIENT UPDATES
  // ==============================================
  const updateProjectLocation = useCallback(async (location: ProjectLocation) => {
    if (!state.project || !currentProjectId) return

    const originalLocation = state.project.location

    try {
      // Optimistic update
      optimisticUpdate('location', location)

      const response = await projectsApi.updateProject(currentProjectId, { location })

      if (response.success) {
        setState(prev => ({
          ...prev,
          project: response.data.project,
          isUpdating: false,
          lastUpdateField: null,
        }))
        setOriginalProject(response.data.project)
      } else {
        // Revert on failure
        optimisticUpdate('location', originalLocation)
        setState(prev => ({
          ...prev,
          error: response.message || 'Failed to update project location',
          isUpdating: false,
          lastUpdateField: null,
        }))
      }
    } catch (error: any) {
      console.error('Error updating project location:', error)
      // Revert on error
      optimisticUpdate('location', originalLocation)
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to update project location',
        isUpdating: false,
        lastUpdateField: null,
      }))
    }
  }, [state.project, currentProjectId, optimisticUpdate])

  const updateProjectClient = useCallback(async (client: ProjectClient) => {
    if (!state.project || !currentProjectId) return

    const originalClient = state.project.client

    try {
      // Optimistic update
      optimisticUpdate('client', client)

      const response = await projectsApi.updateProject(currentProjectId, { client })

      if (response.success) {
        setState(prev => ({
          ...prev,
          project: response.data.project,
          isUpdating: false,
          lastUpdateField: null,
        }))
        setOriginalProject(response.data.project)
      } else {
        // Revert on failure
        optimisticUpdate('client', originalClient)
        setState(prev => ({
          ...prev,
          error: response.message || 'Failed to update project client',
          isUpdating: false,
          lastUpdateField: null,
        }))
      }
    } catch (error: any) {
      console.error('Error updating project client:', error)
      // Revert on error
      optimisticUpdate('client', originalClient)
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to update project client',
        isUpdating: false,
        lastUpdateField: null,
      }))
    }
  }, [state.project, currentProjectId, optimisticUpdate])

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
    isUpdating: state.isUpdating,
    lastUpdateField: state.lastUpdateField,
    
    // Computed properties
    hasProject,
    isLoading,
    isLoaded,
    hasError,
    isNotFound,
    projectLocation,
    projectClient,
    hasLocation,
    hasClient,
    hasCoordinates,
    isOverBudget,
    budgetUtilization,
    progressStatus,
    daysUntilDeadline,
    isOverdue,
    
    // Display helpers
    displayLocation: getDisplayLocation(projectLocation),
    displayClient: getDisplayClient(projectClient), 
    clientContactInfo: getClientContactInfo(projectClient),
    
    // Actions
    loadProject,
    refreshProject,
    clearError,
    reset,
    
    // Quick update actions
    updateProjectStatus,
    updateProjectProgress,
    updateProjectPriority,
    
    // Location and client updates
    updateProjectLocation,
    updateProjectClient,
    
    // Optimistic update helpers
    optimisticUpdate,
    revertOptimisticUpdate,
  } satisfies UseProjectReturn
}