// ==============================================
// src/hooks/projects/use-delete-project.ts - Delete Project Hook
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { projectsApi } from '@/lib/api/projects'
import type { DeleteProjectResult } from '@/types/projects'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseDeleteProjectState {
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  error: string | null
  result: DeleteProjectResult | null
}

interface UseDeleteProjectActions {
  deleteProject: (projectId: string) => Promise<void>
  reset: () => void
}

interface UseDeleteProjectReturn extends UseDeleteProjectState, UseDeleteProjectActions {}

// ==============================================
// MAIN HOOK
// ==============================================
export const useDeleteProject = () => {
  const router = useRouter()
  
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseDeleteProjectState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    result: null,
  })

  // ==============================================
  // DELETE PROJECT
  // ==============================================
  const deleteProject = useCallback(async (projectId: string) => {
    if (!projectId || projectId.trim() === '') {
      setState(prev => ({
        ...prev,
        isError: true,
        error: 'Project ID is required',
      }))
      return
    }

    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        isError: false,
        error: null,
        result: null,
      }))

      // Call the delete API
      const response = await projectsApi.deleteProject(projectId)

      setState(prev => ({
        ...prev,
        isLoading: false,
        isSuccess: true,
        result: response,
      }))

      // Auto-redirect to projects list after successful deletion
      // Small delay to show success state
      setTimeout(() => {
        router.push('/dashboard/projects')
      }, 1000)

    } catch (error: any) {
      console.error('Error deleting project:', error)

      setState(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: error.message || 'Failed to delete project',
      }))
    }
  }, [router])

  // ==============================================
  // RESET
  // ==============================================
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      result: null,
    })
  }, [])

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    isLoading: state.isLoading,
    isSuccess: state.isSuccess,
    isError: state.isError,
    error: state.error,
    result: state.result,

    // Actions
    deleteProject,
    reset,
  } satisfies UseDeleteProjectReturn
}