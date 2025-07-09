// ==============================================
// src/hooks/team-members/use-delete-team-member.ts - Delete Team Member Hook
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { teamMembersApi } from '@/lib/api/team-members'
import type {
  TeamMember,
  DeleteTeamMemberResult,
} from '@/types/team-members'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseDeleteTeamMemberState {
  isDeleting: boolean
  deleteResult: DeleteTeamMemberResult | null
  error: string | null
  
  // Confirmation dialog state
  showConfirmDialog: boolean
  teamMemberToDelete: TeamMember | null
}

interface UseDeleteTeamMemberActions {
  deleteTeamMember: (teamMemberId: string) => Promise<void>
  confirmDelete: (teamMember: TeamMember) => void
  cancelDelete: () => void
  executeDelete: () => Promise<void>
  clearError: () => void
  reset: () => void
}

interface UseDeleteTeamMemberReturn extends UseDeleteTeamMemberState, UseDeleteTeamMemberActions {
  // Computed properties
  hasError: boolean
  isSuccess: boolean
  canDelete: boolean
}

// ==============================================
// MAIN HOOK
// ==============================================
export const useDeleteTeamMember = () => {
  const router = useRouter()

  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseDeleteTeamMemberState>({
    isDeleting: false,
    deleteResult: null,
    error: null,
    showConfirmDialog: false,
    teamMemberToDelete: null,
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const hasError = !!state.error
  const isSuccess = !!state.deleteResult?.success
  const canDelete = !state.isDeleting && !!state.teamMemberToDelete

  // ==============================================
  // CLEAR ERROR
  // ==============================================
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // ==============================================
  // DIRECT DELETE (without confirmation dialog)
  // ==============================================
  const deleteTeamMember = useCallback(async (teamMemberId: string) => {
    if (!teamMemberId) {
      setState(prev => ({ ...prev, error: 'Team member ID is required' }))
      return
    }

    try {
      setState(prev => ({
        ...prev,
        isDeleting: true,
        error: null,
        deleteResult: null,
      }))

      const response = await teamMembersApi.deleteTeamMember(teamMemberId)

      setState(prev => ({
        ...prev,
        isDeleting: false,
        deleteResult: response,
        error: null,
      }))

      // Optionally redirect to team list after successful deletion
      if (response.success) {
        setTimeout(() => {
          router.push('/dashboard/team')
        }, 1500)
      }

    } catch (error: any) {
      console.error('Error deleting team member:', error)
      
      setState(prev => ({
        ...prev,
        isDeleting: false,
        error: error.message || 'Failed to delete team member',
        deleteResult: null,
      }))
    }
  }, [router])

  // ==============================================
  // CONFIRMATION DIALOG METHODS
  // ==============================================
  const confirmDelete = useCallback((teamMember: TeamMember) => {
    setState(prev => ({
      ...prev,
      showConfirmDialog: true,
      teamMemberToDelete: teamMember,
      error: null,
    }))
  }, [])

  const cancelDelete = useCallback(() => {
    setState(prev => ({
      ...prev,
      showConfirmDialog: false,
      teamMemberToDelete: null,
      error: null,
    }))
  }, [])

  const executeDelete = useCallback(async () => {
    if (!state.teamMemberToDelete) {
      setState(prev => ({ ...prev, error: 'No team member selected for deletion' }))
      return
    }

    try {
      setState(prev => ({
        ...prev,
        isDeleting: true,
        error: null,
        deleteResult: null,
      }))

      const response = await teamMembersApi.deleteTeamMember(state.teamMemberToDelete.id)

      setState(prev => ({
        ...prev,
        isDeleting: false,
        deleteResult: response,
        showConfirmDialog: false,
        teamMemberToDelete: null,
        error: null,
      }))

      // Optionally redirect to team list after successful deletion
      if (response.success) {
        setTimeout(() => {
          router.push('/dashboard/team')
        }, 1500)
      }

    } catch (error: any) {
      console.error('Error deleting team member:', error)
      
      setState(prev => ({
        ...prev,
        isDeleting: false,
        error: error.message || 'Failed to delete team member',
        deleteResult: null,
        // Keep dialog open to show error
      }))
    }
  }, [state.teamMemberToDelete, router])

  // ==============================================
  // RESET
  // ==============================================
  const reset = useCallback(() => {
    setState({
      isDeleting: false,
      deleteResult: null,
      error: null,
      showConfirmDialog: false,
      teamMemberToDelete: null,
    })
  }, [])

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    isDeleting: state.isDeleting,
    deleteResult: state.deleteResult,
    error: state.error,
    showConfirmDialog: state.showConfirmDialog,
    teamMemberToDelete: state.teamMemberToDelete,

    // Computed properties
    hasError,
    isSuccess,
    canDelete,

    // Actions
    deleteTeamMember,
    confirmDelete,
    cancelDelete,
    executeDelete,
    clearError,
    reset,
  } satisfies UseDeleteTeamMemberReturn
}

// ==============================================
// BULK DELETE HOOK (for selecting multiple team members)
// ==============================================
export const useBulkDeleteTeamMembers = () => {
  const [state, setState] = useState({
    isDeleting: false,
    selectedTeamMembers: [] as TeamMember[],
    deleteResults: [] as DeleteTeamMemberResult[],
    errors: [] as string[],
    showConfirmDialog: false,
  })

  const selectTeamMember = useCallback((teamMember: TeamMember) => {
    setState(prev => ({
      ...prev,
      selectedTeamMembers: [...prev.selectedTeamMembers, teamMember],
    }))
  }, [])

  const deselectTeamMember = useCallback((teamMemberId: string) => {
    setState(prev => ({
      ...prev,
      selectedTeamMembers: prev.selectedTeamMembers.filter(tm => tm.id !== teamMemberId),
    }))
  }, [])

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedTeamMembers: [],
    }))
  }, [])

  const confirmBulkDelete = useCallback(() => {
    setState(prev => ({
      ...prev,
      showConfirmDialog: true,
      errors: [],
    }))
  }, [])

  const cancelBulkDelete = useCallback(() => {
    setState(prev => ({
      ...prev,
      showConfirmDialog: false,
    }))
  }, [])

  const executeBulkDelete = useCallback(async () => {
    if (state.selectedTeamMembers.length === 0) {
      setState(prev => ({ ...prev, errors: ['No team members selected'] }))
      return
    }

    try {
      setState(prev => ({
        ...prev,
        isDeleting: true,
        errors: [],
        deleteResults: [],
      }))

      const deletePromises = state.selectedTeamMembers.map(teamMember =>
        teamMembersApi.deleteTeamMember(teamMember.id)
      )

      const results = await Promise.allSettled(deletePromises)
      
      const deleteResults: DeleteTeamMemberResult[] = []
      const errors: string[] = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          deleteResults.push(result.value)
        } else {
          const teamMemberName = `${state.selectedTeamMembers[index].firstName} ${state.selectedTeamMembers[index].lastName}`
          errors.push(`Failed to delete ${teamMemberName}: ${result.reason.message}`)
        }
      })

      setState(prev => ({
        ...prev,
        isDeleting: false,
        deleteResults,
        errors,
        showConfirmDialog: false,
        selectedTeamMembers: [],
      }))

    } catch (error: any) {
      console.error('Error in bulk delete:', error)
      setState(prev => ({
        ...prev,
        isDeleting: false,
        errors: [error.message || 'Failed to delete team members'],
      }))
    }
  }, [state.selectedTeamMembers])

  const reset = useCallback(() => {
    setState({
      isDeleting: false,
      selectedTeamMembers: [],
      deleteResults: [],
      errors: [],
      showConfirmDialog: false,
    })
  }, [])

  return {
    // State
    isDeleting: state.isDeleting,
    selectedTeamMembers: state.selectedTeamMembers,
    deleteResults: state.deleteResults,
    errors: state.errors,
    showConfirmDialog: state.showConfirmDialog,

    // Computed properties
    hasSelection: state.selectedTeamMembers.length > 0,
    selectionCount: state.selectedTeamMembers.length,
    hasErrors: state.errors.length > 0,
    hasResults: state.deleteResults.length > 0,

    // Actions
    selectTeamMember,
    deselectTeamMember,
    clearSelection,
    confirmBulkDelete,
    cancelBulkDelete,
    executeBulkDelete,
    reset,
  }
}