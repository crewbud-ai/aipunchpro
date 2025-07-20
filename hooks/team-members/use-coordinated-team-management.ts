// ==============================================
// hooks/team-members/use-coordinated-team-management.ts - Team Member Coordination Hooks
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ==============================================
// TYPES
// ==============================================
interface DeactivationImpactAnalysis {
  teamMember: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    isActive: boolean
  }
  currentAssignments: {
    projects: Array<{
      id: string
      name: string
      status: string
      role: string
    }>
    scheduleProjects: Array<{
      id: string
      title: string
      status: string
      projectName: string
    }>
    punchlistItems: Array<{
      id: string
      title: string
      status: string
      priority: string
      projectName: string
    }>
  }
  impactAssessment: {
    criticalAssignments: number
    activeWorkItems: number
    recommendedReassignments: Array<{
      type: 'project' | 'schedule' | 'punchlist'
      itemId: string
      title: string
      suggestedAssignee?: {
        id: string
        name: string
        reason: string
      }
    }>
    warningMessages: string[]
  }
  suggestedReassignees: Array<{
    id: string
    name: string
    role: string
    tradeSpecialty?: string
    currentWorkload: number
    compatibility: number
  }>
}

interface DeactivationRequest {
  teamMemberId: string
  reason: string
  notes?: string
  skipAssignmentRemoval?: boolean
  effectiveDate?: string
  reassignmentPlan?: {
    projects?: Array<{
      projectId: string
      newAssigneeId?: string
    }>
    scheduleProjects?: Array<{
      scheduleProjectId: string
      newAssigneeId?: string
    }>
    punchlistItems?: Array<{
      punchlistItemId: string
      newAssigneeId?: string
    }>
  }
}

interface DeactivationResult {
  success: boolean
  data?: {
    teamMember: any
    removedAssignments: {
      projects: number
      scheduleProjects: number
      punchlistItems: number
    }
    totalAffected: number
    deactivationDetails: {
      reason: string
      notes?: string
      effectiveDate: string
      deactivatedBy: string
      deactivatedAt: string
    }
  }
  message: string
  error?: string
}

type TeamManagementState = 
  | 'idle'
  | 'analyzing'
  | 'deactivating'
  | 'reactivating'
  | 'success'
  | 'error'

// ==============================================
// COORDINATED TEAM MEMBER DEACTIVATION HOOK
// ==============================================
export const useCoordinatedTeamDeactivation = () => {
  const [state, setState] = useState<TeamManagementState>('idle')
  const [impactAnalysis, setImpactAnalysis] = useState<DeactivationImpactAnalysis | null>(null)
  const [result, setResult] = useState<DeactivationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Analyze deactivation impact
  const analyzeDeactivationImpact = useCallback(async (
    teamMemberId: string
  ): Promise<DeactivationImpactAnalysis | null> => {
    try {
      setState('analyzing')
      setError(null)

      const response = await fetch(`/api/team-members/${teamMemberId}/deactivate-coordinated`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to analyze deactivation impact')
      }

      setState('success')
      setImpactAnalysis(responseData.data)
      
      return responseData.data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setState('error')
      setError(errorMessage)
      setImpactAnalysis(null)

      return null
    }
  }, [])

  // Deactivate team member with coordination
  const deactivateTeamMember = useCallback(async (
    deactivationData: DeactivationRequest
  ): Promise<DeactivationResult> => {
    try {
      setState('deactivating')
      setError(null)

      const response = await fetch(`/api/team-members/${deactivationData.teamMemberId}/deactivate-coordinated`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: deactivationData.reason,
          notes: deactivationData.notes,
          skipAssignmentRemoval: deactivationData.skipAssignmentRemoval,
          effectiveDate: deactivationData.effectiveDate,
          reassignmentPlan: deactivationData.reassignmentPlan
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to deactivate team member')
      }

      setState('success')
      setResult(responseData)
      
      return {
        success: true,
        data: responseData.data,
        message: responseData.message
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setState('error')
      setError(errorMessage)
      setResult(null)

      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      }
    }
  }, [])

  // Reactivate team member
  const reactivateTeamMember = useCallback(async (
    teamMemberId: string,
    reactivationData: {
      reason: string
      notes?: string
      restoreAssignments?: boolean
    }
  ): Promise<DeactivationResult> => {
    try {
      setState('reactivating')
      setError(null)

      const response = await fetch(`/api/team-members/${teamMemberId}/deactivate-coordinated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reactivationData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to reactivate team member')
      }

      setState('success')
      setResult(responseData)
      
      return {
        success: true,
        data: responseData.data,
        message: responseData.message
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setState('error')
      setError(errorMessage)
      setResult(null)

      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      }
    }
  }, [])

  // Reset hook state
  const reset = useCallback(() => {
    setState('idle')
    setImpactAnalysis(null)
    setResult(null)
    setError(null)
  }, [])

  // Computed values
  const isIdle = state === 'idle'
  const isAnalyzing = state === 'analyzing'
  const isDeactivating = state === 'deactivating'
  const isReactivating = state === 'reactivating'
  const isSuccess = state === 'success'
  const isError = state === 'error'
  const hasImpactAnalysis = impactAnalysis !== null
  const hasResult = result !== null
  const isLoading = isAnalyzing || isDeactivating || isReactivating

  return {
    // State
    state,
    impactAnalysis,
    result,
    error,

    // Computed values
    isIdle,
    isAnalyzing,
    isDeactivating,
    isReactivating,
    isSuccess,
    isError,
    hasImpactAnalysis,
    hasResult,
    isLoading,

    // Actions
    analyzeDeactivationImpact,
    deactivateTeamMember,
    reactivateTeamMember,
    reset,
  }
}

// ==============================================
// TEAM ASSIGNMENT COORDINATION HOOK
// ==============================================
export const useTeamAssignmentCoordination = () => {
  const [state, setState] = useState<'idle' | 'updating' | 'success' | 'error'>('idle')
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Reassign team member across all modules
  const reassignTeamMemberWork = useCallback(async (
    fromTeamMemberId: string,
    toTeamMemberId: string,
    options: {
      projects?: string[]
      scheduleProjects?: string[]
      punchlistItems?: string[]
      transferRole?: boolean
      effectiveDate?: string
      notes?: string
    }
  ) => {
    try {
      setState('updating')
      setError(null)

      // This would call a bulk reassignment endpoint (you'd need to create this)
      const response = await fetch(`/api/team-members/reassign-work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromTeamMemberId,
          toTeamMemberId,
          ...options
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to reassign team member work')
      }

      setState('success')
      setResults(responseData.data)

      return responseData.data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setState('error')
      setError(errorMessage)
      setResults(null)

      return null
    }
  }, [])

  // Get assignment suggestions for replacement
  const getReplacementSuggestions = useCallback(async (
    teamMemberId: string,
    workType: 'projects' | 'schedules' | 'punchlist' | 'all' = 'all'
  ) => {
    try {
      const response = await fetch(`/api/team-members/${teamMemberId}/replacement-suggestions?workType=${workType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to get replacement suggestions')
      }

      return responseData.data

    } catch (err) {
      console.error('Error getting replacement suggestions:', err)
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setResults(null)
    setError(null)
  }, [])

  return {
    state,
    results,
    error,
    reassignTeamMemberWork,
    getReplacementSuggestions,
    reset,
    isUpdating: state === 'updating',
    isSuccess: state === 'success',
    isError: state === 'error',
    hasResults: results !== null,
  }
}

// ==============================================
// BULK TEAM OPERATIONS HOOK
// ==============================================
export const useBulkTeamOperations = () => {
  const [state, setState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [results, setResults] = useState<{
    successful: string[]
    failed: Array<{ teamMemberId: string; error: string }>
    totalProcessed: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Bulk deactivate team members
  const bulkDeactivateTeamMembers = useCallback(async (
    deactivations: Array<{
      teamMemberId: string
      reason: string
      notes?: string
    }>
  ) => {
    try {
      setState('processing')
      setError(null)

      const successful = []
      const failed = []

      // Process deactivations sequentially to maintain data consistency
      for (const deactivation of deactivations) {
        try {
          const response = await fetch(`/api/team-members/${deactivation.teamMemberId}/deactivate-coordinated`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reason: deactivation.reason,
              notes: deactivation.notes,
              skipAssignmentRemoval: false // Always remove assignments in bulk operations
            }),
          })

          if (response.ok) {
            successful.push(deactivation.teamMemberId)
          } else {
            const errorData = await response.json()
            failed.push({
              teamMemberId: deactivation.teamMemberId,
              error: errorData.message || 'Deactivation failed'
            })
          }
        } catch (err) {
          failed.push({
            teamMemberId: deactivation.teamMemberId,
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        }
      }

      const results = {
        successful,
        failed,
        totalProcessed: deactivations.length
      }

      setResults(results)
      setState('success')

      return results

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk deactivation failed'
      setState('error')
      setError(errorMessage)
      setResults(null)

      return null
    }
  }, [])

  // Bulk change team member roles
  const bulkChangeTeamMemberRoles = useCallback(async (
    roleChanges: Array<{
      teamMemberId: string
      newRole: string
      reason?: string
    }>
  ) => {
    // This would implement bulk role changes with cascade effects
    // Similar pattern to bulk deactivation
    console.log('Bulk role changes:', roleChanges)
    return null
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setResults(null)
    setError(null)
  }, [])

  return {
    state,
    results,
    error,
    bulkDeactivateTeamMembers,
    bulkChangeTeamMemberRoles,
    reset,
    isProcessing: state === 'processing',
    isSuccess: state === 'success',
    isError: state === 'error',
    hasResults: results !== null,
  }
}

// ==============================================
// EXPORT ALL HOOKS
// ==============================================
export default useCoordinatedTeamDeactivation