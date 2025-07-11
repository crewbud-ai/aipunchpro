// ==============================================
// hooks/schedule-projects/use-update-schedule-project.ts - Update Schedule Project Hook
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { scheduleProjectsApi } from '@/lib/api/schedule-projects'
import {
  validateUpdateScheduleProject,
  transformUpdateFormDataToApiData,
  scheduleProjectToUpdateFormData,
  hasFormChanges,
  type ScheduleProject,
  type UpdateScheduleProjectData,
  type UpdateScheduleProjectFormData,
  type UpdateScheduleProjectState,
  type UpdateScheduleProjectResult,
  type ScheduleProjectFormErrors,
} from '@/types/schedule-projects'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseUpdateScheduleProjectState {
  state: UpdateScheduleProjectState
  result: UpdateScheduleProjectResult | null
  errors: ScheduleProjectFormErrors
  formData: UpdateScheduleProjectFormData
  originalScheduleProject: ScheduleProject | null
  hasChanges: boolean
}

interface UseUpdateScheduleProjectActions {
  initializeForm: (scheduleProject: ScheduleProject) => void
  updateFormData: (field: keyof UpdateScheduleProjectFormData, value: any) => void
  updateFormDataBulk: (data: Partial<UpdateScheduleProjectFormData>) => void
  clearErrors: () => void
  clearFieldError: (field: keyof ScheduleProjectFormErrors) => void
  validateForm: () => boolean
  updateScheduleProject: (data?: UpdateScheduleProjectData) => Promise<void>
  resetForm: () => void
  reset: () => void

  // Multi-step form helpers
  goToNextStep: () => void
  goToPrevStep: () => void
  goToStep: (step: number) => void
  markStepComplete: (step: number) => void
}

interface UseUpdateScheduleProjectReturn extends UseUpdateScheduleProjectState, UseUpdateScheduleProjectActions {
  // Computed properties
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
  hasErrors: boolean
  canSubmit: boolean
  isInitialized: boolean

  // Multi-step form computed properties
  currentStep: number
  totalSteps: number
  canGoNext: boolean
  canGoPrev: boolean
  isFirstStep: boolean
  isLastStep: boolean
  progressPercentage: number
}

// ==============================================
// FORM DATA TRANSFORMATION
// ==============================================
function transformFormDataToApiData(formData: UpdateScheduleProjectFormData, scheduleProjectId: string): UpdateScheduleProjectData {
  const data = transformUpdateFormDataToApiData(formData)
  return {
    ...data,
    id: scheduleProjectId,
  }
}

// ==============================================
// VALIDATION HELPERS
// ==============================================
function validateFormData(formData: UpdateScheduleProjectFormData): {
  isValid: boolean
  errors: ScheduleProjectFormErrors
} {
  const result = validateUpdateScheduleProject(transformUpdateFormDataToApiData(formData))

  if (result.success) {
    return { isValid: true, errors: {} }
  }

  // Transform Zod errors to our error format
  const errors: ScheduleProjectFormErrors = {}
  result.error.errors.forEach((error) => {
    const field = error.path[0] as keyof ScheduleProjectFormErrors
    if (field) {
      errors[field] = error.message
    }
  })

  return { isValid: false, errors }
}

// ==============================================
// DEFAULT FORM DATA
// ==============================================
const getDefaultUpdateFormData = (scheduleProjectId: string): UpdateScheduleProjectFormData => ({
  id: scheduleProjectId,
  title: '',
  description: '',
  projectId: '',
  tradeRequired: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  estimatedHours: undefined,
  actualHours: 0,
  assignedProjectMemberIds: [],
  priority: 'medium',
  status: 'planned',
  progressPercentage: 0,
  location: '',
  notes: '',
  dependsOn: [],
})

// ==============================================
// MAIN HOOK
// ==============================================
export function useUpdateScheduleProject(scheduleProjectId?: string) {
  const router = useRouter()

  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseUpdateScheduleProjectState>({
    state: 'idle',
    result: null,
    errors: {},
    formData: scheduleProjectId ? getDefaultUpdateFormData(scheduleProjectId) : getDefaultUpdateFormData(''),
    originalScheduleProject: null,
    hasChanges: false,
  })

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const isLoading = state.state === 'loading'
  const isSuccess = state.state === 'success'
  const isError = state.state === 'error'
  const isIdle = state.state === 'idle'
  const hasErrors = Object.keys(state.errors).length > 0
  const canSubmit = !isLoading && !hasErrors && state.hasChanges
  const isInitialized = state.originalScheduleProject !== null

  // Multi-step form computed values
  const currentStep = state.formData.currentStep || 1
  const totalSteps = 3
  const canGoNext = currentStep < totalSteps
  const canGoPrev = currentStep > 1
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps
  const progressPercentage = (currentStep / totalSteps) * 100

  // ==============================================
  // ACTIONS
  // ==============================================

  // Initialize form with existing schedule project data
  const initializeForm = useCallback((scheduleProject: ScheduleProject) => {
    const formData = scheduleProjectToUpdateFormData(scheduleProject)
    
    setState(prev => ({
      ...prev,
      formData,
      originalScheduleProject: scheduleProject,
      hasChanges: false,
      errors: {},
      state: 'idle',
    }))
  }, [])

  // Update single form field
  const updateFormData = useCallback((field: keyof UpdateScheduleProjectFormData, value: any) => {
    setState(prev => {
      const newFormData = {
        ...prev.formData,
        [field]: value,
      }

      // Check if form has changes compared to original
      const hasChanges = prev.originalScheduleProject ? 
        hasFormChanges(newFormData, prev.originalScheduleProject) : false

      return {
        ...prev,
        formData: newFormData,
        hasChanges,
        // Clear field error when updating
        errors: {
          ...prev.errors,
          [field]: undefined,
        },
      }
    })
  }, [])

  // Update multiple form fields at once
  const updateFormDataBulk = useCallback((data: Partial<UpdateScheduleProjectFormData>) => {
    setState(prev => {
      const newFormData = {
        ...prev.formData,
        ...data,
      }

      // Check if form has changes compared to original
      const hasChanges = prev.originalScheduleProject ? 
        hasFormChanges(newFormData, prev.originalScheduleProject) : false

      return {
        ...prev,
        formData: newFormData,
        hasChanges,
      }
    })
  }, [])

  // Clear all errors
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
    }))
  }, [])

  // Clear specific field error
  const clearFieldError = useCallback((field: keyof ScheduleProjectFormErrors) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: undefined,
      },
    }))
  }, [])

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const { isValid, errors } = validateFormData(state.formData)
    
    if (!isValid) {
      setState(prev => ({
        ...prev,
        errors,
      }))
    }

    return isValid
  }, [state.formData])

  // Update schedule project
  const updateScheduleProject = useCallback(async (data?: UpdateScheduleProjectData) => {
    try {
      setState(prev => ({
        ...prev,
        state: 'loading',
        errors: {},
      }))

      // Use provided data or transform form data
      const scheduleProjectData = data || transformFormDataToApiData(state.formData, state.formData.id)

      // Validate before sending
      if (!data) {
        const validation = validateUpdateScheduleProject(transformUpdateFormDataToApiData(state.formData))
        if (!validation.success) {
          const errors: ScheduleProjectFormErrors = {}
          validation.error.errors.forEach((error) => {
            const field = error.path[0] as keyof ScheduleProjectFormErrors
            if (field) {
              errors[field] = error.message
            }
          })

          setState(prev => ({
            ...prev,
            state: 'error',
            errors,
          }))
          return
        }
      }

      // Call API
      const result = await scheduleProjectsApi.updateScheduleProject(scheduleProjectData)

      setState(prev => ({
        ...prev,
        state: 'success',
        result,
        errors: {},
        originalScheduleProject: result.data.scheduleProject,
        hasChanges: false,
      }))

      // Navigate back to the schedule project details
      router.push(`/dashboard/schedule/${scheduleProjectData.id}`)

    } catch (error) {
      console.error('Error updating schedule project:', error)

      let errors: ScheduleProjectFormErrors = {}

      if (error instanceof Error) {
        // Handle API validation errors
        if ('details' in error && Array.isArray((error as any).details)) {
          (error as any).details.forEach((detail: any) => {
            if (detail.field) {
              errors[detail.field as keyof ScheduleProjectFormErrors] = detail.message
            }
          })
        } else {
          errors.general = error.message
        }
      } else {
        errors.general = 'An unexpected error occurred while updating the schedule project'
      }

      setState(prev => ({
        ...prev,
        state: 'error',
        errors,
      }))
    }
  }, [state.formData, router])

  // Reset form to original values
  const resetForm = useCallback(() => {
    if (state.originalScheduleProject) {
      const formData = scheduleProjectToUpdateFormData(state.originalScheduleProject)
      setState(prev => ({
        ...prev,
        formData,
        hasChanges: false,
        errors: {},
        state: 'idle',
      }))
    }
  }, [state.originalScheduleProject])

  // Reset entire state
  const reset = useCallback(() => {
    setState({
      state: 'idle',
      result: null,
      errors: {},
      formData: scheduleProjectId ? getDefaultUpdateFormData(scheduleProjectId) : getDefaultUpdateFormData(''),
      originalScheduleProject: null,
      hasChanges: false,
    })
  }, [scheduleProjectId])

  // ==============================================
  // MULTI-STEP FORM HELPERS
  // ==============================================

  const goToNextStep = useCallback(() => {
    if (canGoNext) {
      setState(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          currentStep: (prev.formData.currentStep || 1) + 1,
          completedSteps: [...(prev.formData.completedSteps || []), prev.formData.currentStep || 1]
            .filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
        },
      }))
    }
  }, [canGoNext])

  const goToPrevStep = useCallback(() => {
    if (canGoPrev) {
      setState(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          currentStep: (prev.formData.currentStep || 1) - 1,
        },
      }))
    }
  }, [canGoPrev])

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setState(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          currentStep: step,
        },
      }))
    }
  }, [totalSteps])

  const markStepComplete = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        completedSteps: [...(prev.formData.completedSteps || []), step]
          .filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
      },
    }))
  }, [])

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    state: state.state,
    result: state.result,
    errors: state.errors,
    formData: state.formData,
    originalScheduleProject: state.originalScheduleProject,
    hasChanges: state.hasChanges,

    // Computed properties
    isLoading,
    isSuccess,
    isError,
    isIdle,
    hasErrors,
    canSubmit,
    isInitialized,

    // Multi-step form computed properties
    currentStep,
    totalSteps,
    canGoNext,
    canGoPrev,
    isFirstStep,
    isLastStep,
    progressPercentage,

    // Actions
    initializeForm,
    updateFormData,
    updateFormDataBulk,
    clearErrors,
    clearFieldError,
    validateForm,
    updateScheduleProject,
    resetForm,
    reset,

    // Multi-step form helpers
    goToNextStep,
    goToPrevStep,
    goToStep,
    markStepComplete,
  }
}

// Export default
export default useUpdateScheduleProject