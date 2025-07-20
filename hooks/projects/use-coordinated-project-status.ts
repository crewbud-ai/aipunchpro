// ==============================================
// hooks/projects/use-coordinated-project-status.ts - Project Status Coordination Hooks
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ==============================================
// TYPES
// ==============================================
type ProjectStatus = 'not_started' | 'in_progress' | 'on_track' | 'ahead_of_schedule' | 'behind_schedule' | 'on_hold' | 'completed' | 'cancelled'

interface CoordinatedProjectStatusUpdate {
  projectId: string
  status: ProjectStatus
  notes?: string
  actualStartDate?: string
  actualEndDate?: string
  skipChildValidation?: boolean
}

interface CoordinatedProjectStatusResult {
  success: boolean
  data?: {
    project: any
    cascadeResults: {
      scheduleProjectsUpdated: number
      scheduleProjectsSkipped: number
      updatedScheduleProjects: Array<{
        id: string
        title: string
        newStatus: string
      }>
    }
  }
  message: string
  error?: string
}

type CoordinatedProjectStatusState = 
  | 'idle'
  | 'updating'
  | 'success'
  | 'error'

// ==============================================
// COORDINATED PROJECT STATUS UPDATE HOOK
// ==============================================
export const useCoordinatedProjectStatus = () => {
  const [state, setState] = useState<CoordinatedProjectStatusState>('idle')
  const [result, setResult] = useState<CoordinatedProjectStatusResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Update project status with coordination
  const updateProjectStatusCoordinated = useCallback(async (
    updateData: CoordinatedProjectStatusUpdate
  ): Promise<CoordinatedProjectStatusResult> => {
    try {
      setState('updating')
      setError(null)

      const response = await fetch(`/api/projects/${updateData.projectId}/status-coordinated`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: updateData.status,
          notes: updateData.notes,
          actualStartDate: updateData.actualStartDate,
          actualEndDate: updateData.actualEndDate,
          skipChildValidation: updateData.skipChildValidation
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update project status')
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

  // Check project status consistency
  const checkProjectStatusConsistency = useCallback(async (
    projectId: string
  ): Promise<{
    success: boolean
    data?: {
      statusConsistency: {
        isConsistent: boolean
        inconsistencies: Array<{
          type: string
          message: string
          items?: any[]
        }>
      }
    }
    message: string
    error?: string
  }> => {
    try {
      setState('updating')
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/status-coordinated`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to check project status consistency')
      }

      setState('success')
      
      return {
        success: true,
        data: responseData.data,
        message: responseData.message
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setState('error')
      setError(errorMessage)

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
    setResult(null)
    setError(null)
  }, [])

  // Computed values
  const isIdle = state === 'idle'
  const isUpdating = state === 'updating'
  const isSuccess = state === 'success'
  const isError = state === 'error'
  const hasResult = result !== null

  return {
    // State
    state,
    result,
    error,

    // Computed values
    isIdle,
    isUpdating,
    isSuccess,
    isError,
    hasResult,

    // Actions
    updateProjectStatusCoordinated,
    checkProjectStatusConsistency,
    reset,
  }
}

// ==============================================
// COORDINATED PROJECT STATUS VALIDATION HOOK
// ==============================================
export const useProjectStatusValidation = () => {
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'complete'>('idle')
  const [validationResult, setValidationResult] = useState<{
    canChange: boolean
    reasons: string[]
    childEntityCounts: {
      scheduleProjects: Record<string, number>
      punchlistItems: Record<string, number>
      activeTeamMembers: number
    }
  } | null>(null)

  const validateStatusChange = useCallback(async (
    projectId: string,
    newStatus: ProjectStatus
  ) => {
    try {
      setValidationState('validating')

      // This would call a validation endpoint (you'd need to create this)
      const response = await fetch(`/api/projects/${projectId}/validate-status-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newStatus }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to validate status change')
      }

      setValidationResult(responseData.data)
      setValidationState('complete')

      return responseData.data

    } catch (err) {
      console.error('Status validation error:', err)
      setValidationState('idle')
      setValidationResult(null)
      return null
    }
  }, [])

  const resetValidation = useCallback(() => {
    setValidationState('idle')
    setValidationResult(null)
  }, [])

  return {
    validationState,
    validationResult,
    validateStatusChange,
    resetValidation,
    isValidating: validationState === 'validating',
    hasValidationResult: validationResult !== null,
  }
}

// ==============================================
// BULK PROJECT STATUS UPDATE HOOK
// ==============================================
export const useBulkProjectStatusUpdate = () => {
  const [state, setState] = useState<'idle' | 'updating' | 'success' | 'error'>('idle')
  const [results, setResults] = useState<{
    successful: string[]
    failed: Array<{ projectId: string; error: string }>
    totalProcessed: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateMultipleProjectStatus = useCallback(async (
    updates: Array<{
      projectId: string
      status: ProjectStatus
      notes?: string
    }>
  ) => {
    try {
      setState('updating')
      setError(null)

      const successful = []
      const failed = []

      // Process updates sequentially to avoid overwhelming the system
      for (const update of updates) {
        try {
          const response = await fetch(`/api/projects/${update.projectId}/status-coordinated`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: update.status,
              notes: update.notes,
              skipChildValidation: true // Skip validation for bulk updates
            }),
          })

          if (response.ok) {
            successful.push(update.projectId)
          } else {
            const errorData = await response.json()
            failed.push({
              projectId: update.projectId,
              error: errorData.message || 'Update failed'
            })
          }
        } catch (err) {
          failed.push({
            projectId: update.projectId,
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        }
      }

      const results = {
        successful,
        failed,
        totalProcessed: updates.length
      }

      setResults(results)
      setState('success')

      return results

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk update failed'
      setState('error')
      setError(errorMessage)
      setResults(null)

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
    updateMultipleProjectStatus,
    reset,
    isUpdating: state === 'updating',
    isSuccess: state === 'success',
    isError: state === 'error',
    hasResults: results !== null,
  }
}

// ==============================================
// EXPORT ALL HOOKS
// ==============================================
export default useCoordinatedProjectStatus