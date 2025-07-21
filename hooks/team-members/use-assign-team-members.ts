// ==============================================
// File: hooks/team-members/use-assign-team-members.ts
// ==============================================

import { useState, useCallback } from 'react'
import { teamMembersApi } from '@/lib/api/team-members'

// ==============================================
// INTERFACES
// ==============================================
interface AssignmentData {
  userId: string
  projectId: string
  hourlyRate?: number
  overtimeRate?: number
  notes?: string
  status: 'active' | 'inactive'
}

interface AssignTeamMembersState {
  isAssigning: boolean
  assignmentError: string | null
  assignmentSuccess: boolean
  successMessage: string | null
}

interface UseAssignTeamMembersActions {
  assignMembers: (assignments: AssignmentData[]) => Promise<void>
  assignSingleMember: (assignment: AssignmentData) => Promise<void>
  clearError: () => void
  reset: () => void
}

interface UseAssignTeamMembersReturn extends AssignTeamMembersState, UseAssignTeamMembersActions {
  // Computed properties
  hasError: boolean
  canAssign: boolean
}

// ==============================================
// MAIN HOOK
// ==============================================
export const useAssignTeamMembers = () => {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<AssignTeamMembersState>({
    isAssigning: false,
    assignmentError: null,
    assignmentSuccess: false,
    successMessage: null,
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const hasError = !!state.assignmentError
  const canAssign = !state.isAssigning

  // ==============================================
  // ACTIONS
  // ==============================================
  
  // Assign multiple members to a project
  const assignMembers = useCallback(async (assignments: AssignmentData[]) => {
    if (assignments.length === 0) return

    setState(prev => ({
      ...prev,
      isAssigning: true,
      assignmentError: null,
      assignmentSuccess: false,
      successMessage: null,
    }))

    try {
      // Process assignments one by one using the API function
      const results = []
      for (const assignment of assignments) {
        const response = await teamMembersApi.assignToProject(assignment)
        results.push(response)
      }

      setState(prev => ({
        ...prev,
        isAssigning: false,
        assignmentSuccess: true,
        successMessage: `Successfully assigned ${assignments.length} team member${assignments.length !== 1 ? 's' : ''} to the project!`,
      }))

    } catch (error: any) {
      console.error('Assignment error:', error)
      setState(prev => ({
        ...prev,
        isAssigning: false,
        assignmentError: error.message || 'Failed to assign team members. Please try again.',
      }))
    }
  }, [])

  // Assign single member to a project
  const assignSingleMember = useCallback(async (assignment: AssignmentData) => {
    await assignMembers([assignment])
  }, [assignMembers])

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      assignmentError: null,
    }))
  }, [])

  // Reset all state
  const reset = useCallback(() => {
    setState({
      isAssigning: false,
      assignmentError: null,
      assignmentSuccess: false,
      successMessage: null,
    })
  }, [])

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    isAssigning: state.isAssigning,
    assignmentError: state.assignmentError,
    assignmentSuccess: state.assignmentSuccess,
    successMessage: state.successMessage,

    // Computed properties
    hasError,
    canAssign,

    // Actions
    assignMembers,
    assignSingleMember,
    clearError,
    reset,
  }
}