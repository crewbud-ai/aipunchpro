// ==============================================
// hooks/schedule-projects/use-coordinated-schedule-status.ts - Schedule Project Status Coordination Hooks
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ==============================================
// TYPES
// ==============================================
type ScheduleProjectStatus = 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'

interface CoordinatedScheduleStatusUpdate {
  scheduleProjectId: string
  status: ScheduleProjectStatus
  progressPercentage?: number
  actualHours?: number
  notes?: string
  skipDependencyValidation?: boolean
  skipProjectSync?: boolean
}

interface CoordinatedScheduleStatusResult {
  success: boolean
  data?: {
    scheduleProject: any
    projectSync: {
      updated: boolean
      previousStatus?: string
      newStatus?: string
      reason?: string
    }
    syncPerformed: boolean
  }
  message: string
  error?: string
}

interface BlockingAnalysisResult {
  success: boolean
  data?: {
    canComplete: boolean
    blockingCount: number
    blockingItems: Array<{
      id: string
      title: string
      status: string
      priority: string
    }>
  }
  message: string
  error?: string
}

type CoordinatedScheduleStatusState = 
  | 'idle'
  | 'updating'
  | 'checking'
  | 'success'
  | 'error'

// ==============================================
// COORDINATED SCHEDULE STATUS UPDATE HOOK
// ==============================================
export const useCoordinatedScheduleStatus = () => {
  const [state, setState] = useState<CoordinatedScheduleStatusState>('idle')
  const [result, setResult] = useState<CoordinatedScheduleStatusResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Update schedule project status with coordination
  const updateScheduleStatusCoordinated = useCallback(async (
    updateData: CoordinatedScheduleStatusUpdate
  ): Promise<CoordinatedScheduleStatusResult> => {
    try {
      setState('updating')
      setError(null)

      const response = await fetch(`/api/schedule-projects/${updateData.scheduleProjectId}/status-coordinated`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: updateData.status,
          progressPercentage: updateData.progressPercentage,
          actualHours: updateData.actualHours,
          notes: updateData.notes,
          skipDependencyValidation: updateData.skipDependencyValidation,
          skipProjectSync: updateData.skipProjectSync
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update schedule project status')
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

  // Check completion blocking status
  const checkCompletionBlocking = useCallback(async (
    scheduleProjectId: string
  ): Promise<BlockingAnalysisResult> => {
    try {
      setState('checking')
      setError(null)

      const response = await fetch(`/api/schedule-projects/${scheduleProjectId}/status-coordinated`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to check completion blocking status')
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
  const isChecking = state === 'checking'
  const isSuccess = state === 'success'
  const isError = state === 'error'
  const hasResult = result !== null
  const isLoading = isUpdating || isChecking

  return {
    // State
    state,
    result,
    error,

    // Computed values
    isIdle,
    isUpdating,
    isChecking,
    isSuccess,
    isError,
    hasResult,
    isLoading,

    // Actions
    updateScheduleStatusCoordinated,
    checkCompletionBlocking,
    reset,
  }
}

// ==============================================
// SCHEDULE PROJECT DEPENDENCY VALIDATION HOOK
// ==============================================
export const useScheduleDependencyValidation = () => {
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'complete'>('idle')
  const [validationResult, setValidationResult] = useState<{
    canComplete: boolean
    blockingReasons: string[]
    dependencyStatus: { completed: number; total: number }
  } | null>(null)

  const validateDependencies = useCallback(async (
    scheduleProjectId: string,
    targetStatus: ScheduleProjectStatus
  ) => {
    try {
      setValidationState('validating')

      // This would call a dependency validation endpoint (you'd need to create this)
      const response = await fetch(`/api/schedule-projects/${scheduleProjectId}/validate-dependencies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetStatus }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to validate dependencies')
      }

      setValidationResult(responseData.data)
      setValidationState('complete')

      return responseData.data

    } catch (err) {
      console.error('Dependency validation error:', err)
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
    validateDependencies,
    resetValidation,
    isValidating: validationState === 'validating',
    hasValidationResult: validationResult !== null,
  }
}

// ==============================================
// BULK SCHEDULE STATUS UPDATE HOOK
// ==============================================
export const useBulkScheduleStatusUpdate = () => {
  const [state, setState] = useState<'idle' | 'updating' | 'success' | 'error'>('idle')
  const [results, setResults] = useState<{
    successful: string[]
    failed: Array<{ scheduleProjectId: string; error: string }>
    totalProcessed: number
    projectSyncResults: Array<{
      projectId: string
      syncPerformed: boolean
      newStatus?: string
    }>
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateMultipleScheduleStatus = useCallback(async (
    updates: Array<{
      scheduleProjectId: string
      status: ScheduleProjectStatus
      notes?: string
      skipProjectSync?: boolean
    }>
  ) => {
    try {
      setState('updating')
      setError(null)

      const successful = []
      const failed = []
      const projectSyncResults = []

      // Process updates sequentially to maintain consistency
      for (const update of updates) {
        try {
          const response = await fetch(`/api/schedule-projects/${update.scheduleProjectId}/status-coordinated`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: update.status,
              notes: update.notes,
              skipDependencyValidation: true, // Skip validation for bulk updates
              skipProjectSync: update.skipProjectSync
            }),
          })

          if (response.ok) {
            const responseData = await response.json()
            successful.push(update.scheduleProjectId)
            
            // Track project sync results
            if (responseData.data?.projectSync) {
              projectSyncResults.push({
                projectId: responseData.data.scheduleProject.project_id,
                syncPerformed: responseData.data.syncPerformed,
                newStatus: responseData.data.projectSync.newStatus
              })
            }
          } else {
            const errorData = await response.json()
            failed.push({
              scheduleProjectId: update.scheduleProjectId,
              error: errorData.message || 'Update failed'
            })
          }
        } catch (err) {
          failed.push({
            scheduleProjectId: update.scheduleProjectId,
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        }
      }

      const results = {
        successful,
        failed,
        totalProcessed: updates.length,
        projectSyncResults
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
    updateMultipleScheduleStatus,
    reset,
    isUpdating: state === 'updating',
    isSuccess: state === 'success',
    isError: state === 'error',
    hasResults: results !== null,
  }
}

// ==============================================
// SCHEDULE PROJECT COMPLETION READINESS HOOK
// ==============================================
export const useScheduleCompletionReadiness = () => {
  const [readinessState, setReadinessState] = useState<'idle' | 'checking' | 'complete'>('idle')
  const [readinessData, setReadinessData] = useState<{
    canComplete: boolean
    punchlistBlocking: {
      criticalCount: number
      highCount: number
      blockingItems: any[]
    }
    dependencyBlocking: {
      incompleteDependencies: number
      totalDependencies: number
    }
    recommendations: string[]
  } | null>(null)

  const checkCompletionReadiness = useCallback(async (
    scheduleProjectId: string
  ) => {
    try {
      setReadinessState('checking')

      // This combines punchlist blocking check and dependency validation
      const [blockingCheck, dependencyCheck] = await Promise.all([
        fetch(`/api/schedule-projects/${scheduleProjectId}/status-coordinated`).then(r => r.json()),
        fetch(`/api/schedule-projects/${scheduleProjectId}/validate-dependencies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetStatus: 'completed' })
        }).then(r => r.json()).catch(() => ({ data: { blockingReasons: [], dependencyStatus: { completed: 0, total: 0 } } }))
      ])

      const readinessData = {
        canComplete: blockingCheck.data?.canComplete && dependencyCheck.data?.blockingReasons?.length === 0,
        punchlistBlocking: {
          criticalCount: blockingCheck.data?.blockingItems?.filter((item: any) => item.priority === 'critical').length || 0,
          highCount: blockingCheck.data?.blockingItems?.filter((item: any) => item.priority === 'high').length || 0,
          blockingItems: blockingCheck.data?.blockingItems || []
        },
        dependencyBlocking: {
          incompleteDependencies: dependencyCheck.data?.dependencyStatus?.total - dependencyCheck.data?.dependencyStatus?.completed || 0,
          totalDependencies: dependencyCheck.data?.dependencyStatus?.total || 0
        },
        recommendations: [
          ...(blockingCheck.data?.blockingItems?.length > 0 ? [`Resolve ${blockingCheck.data.blockingItems.length} blocking punchlist item(s)`] : []),
          ...(dependencyCheck.data?.blockingReasons || [])
        ]
      }

      setReadinessData(readinessData)
      setReadinessState('complete')

      return readinessData

    } catch (err) {
      console.error('Completion readiness check error:', err)
      setReadinessState('idle')
      setReadinessData(null)
      return null
    }
  }, [])

  const resetReadiness = useCallback(() => {
    setReadinessState('idle')
    setReadinessData(null)
  }, [])

  return {
    readinessState,
    readinessData,
    checkCompletionReadiness,
    resetReadiness,
    isChecking: readinessState === 'checking',
    hasReadinessData: readinessData !== null,
  }
}

// ==============================================
// EXPORT ALL HOOKS
// ==============================================
export default useCoordinatedScheduleStatus