// ==============================================
// File: hooks/team-members/use-remove-team-member.ts
// ==============================================

import { teamMembersApi } from '@/lib/api/team-members'
import { useState, useCallback } from 'react'

// ==============================================
// INTERFACES
// ==============================================
interface RemoveFromProjectData {
  userId: string
  projectId: string
  reason?: string
  lastWorkingDay?: string
}

interface RemoveTeamMemberState {
  isRemoving: boolean
  removeError: string | null
  removeSuccess: boolean
  successMessage: string | null
}

interface UseRemoveTeamMemberActions {
  removeFromProject: (data: RemoveFromProjectData) => Promise<void>
  clearError: () => void
  reset: () => void
}

interface UseRemoveTeamMemberReturn extends RemoveTeamMemberState, UseRemoveTeamMemberActions {
  // Computed properties
  hasError: boolean
  canRemove: boolean
}

// ==============================================
// MAIN HOOK
// ==============================================
export const useRemoveTeamMember = () => {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<RemoveTeamMemberState>({
    isRemoving: false,
    removeError: null,
    removeSuccess: false,
    successMessage: null,
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const hasError = !!state.removeError
  const canRemove = !state.isRemoving

  // ==============================================
  // ACTIONS
  // ==============================================
  
  // Remove team member from project
  const removeFromProject = useCallback(async (data: RemoveFromProjectData) => {
    setState(prev => ({
      ...prev,
      isRemoving: true,
      removeError: null,
      removeSuccess: false,
      successMessage: null,
    }))

    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        userId: data.userId,
      })

      if (data.reason) {
        queryParams.append('reason', data.reason)
      }

      if (data.lastWorkingDay) {
        queryParams.append('lastWorkingDay', data.lastWorkingDay)
      }

      const response = await teamMembersApi.removeFromProject(data)

      if (!response.success) {
        const error = await response
        throw new Error(error.message || 'Failed to remove team member from project')
      }

      const result = await response;

      setState(prev => ({
        ...prev,
        isRemoving: false,
        removeSuccess: true,
        successMessage: result.notifications?.message || 'Team member removed from project successfully!',
      }))

    } catch (error) {
      console.error('Remove team member error:', error)
      setState(prev => ({
        ...prev,
        isRemoving: false,
        removeError: error instanceof Error ? error.message : 'Failed to remove team member from project. Please try again.',
      }))
    }
  }, [])

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      removeError: null,
    }))
  }, [])

  // Reset all state
  const reset = useCallback(() => {
    setState({
      isRemoving: false,
      removeError: null,
      removeSuccess: false,
      successMessage: null,
    })
  }, [])

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    isRemoving: state.isRemoving,
    removeError: state.removeError,
    removeSuccess: state.removeSuccess,
    successMessage: state.successMessage,

    // Computed properties
    hasError,
    canRemove,

    // Actions
    removeFromProject,
    clearError,
    reset,
  }
}