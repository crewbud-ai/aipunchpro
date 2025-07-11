// ==============================================
// hooks/schedule-projects/use-create-schedule-project.ts - COMPLETE FIXED VERSION
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { scheduleProjectsApi } from '@/lib/api/schedule-projects'
import {
  validateCreateScheduleProject,
  getDefaultCreateScheduleProjectFormData,
  transformCreateFormDataToApiData,
  type CreateScheduleProjectData,
  type CreateScheduleProjectFormData,
  type CreateScheduleProjectState,
  type CreateScheduleProjectResult,
  type ScheduleProjectFormErrors,
} from '@/types/schedule-projects'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseCreateScheduleProjectState {
  state: CreateScheduleProjectState
  result: CreateScheduleProjectResult | null
  errors: ScheduleProjectFormErrors
  formData: CreateScheduleProjectFormData
}

interface UseCreateScheduleProjectActions {
  updateFormData: (field: keyof CreateScheduleProjectFormData, value: any) => void
  updateFormDataBulk: (data: Partial<CreateScheduleProjectFormData>) => void
  clearErrors: () => void
  clearFieldError: (field: string) => void  // FIXED: Now accepts string
  validateForm: () => boolean
  createScheduleProject: (data?: CreateScheduleProjectData) => Promise<void>
  reset: () => void

  // Multi-step form helpers
  goToNextStep: () => void
  goToPrevStep: () => void
  goToStep: (step: number) => void
  markStepComplete: (step: number) => void
}

interface UseCreateScheduleProjectReturn extends UseCreateScheduleProjectState, UseCreateScheduleProjectActions {
  // Computed properties
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
  hasErrors: boolean
  canSubmit: boolean

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
// VALIDATION HELPERS
// ==============================================
function validateFormData(formData: CreateScheduleProjectFormData): {
  isValid: boolean
  errors: ScheduleProjectFormErrors
} {
  const result = validateCreateScheduleProject(transformCreateFormDataToApiData(formData))

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

// FIXED: Helper function to validate current step
function getCurrentStepValidation(
  formData: CreateScheduleProjectFormData, 
  errors: ScheduleProjectFormErrors, 
  currentStep: number
): boolean {
  // Check if there are any errors for current step fields
  const stepFields = getStepFields(currentStep)
  const hasCurrentStepErrors = stepFields.some(field => errors[field as keyof ScheduleProjectFormErrors])

  if (hasCurrentStepErrors) return false

  // Check required fields for current step
  switch (currentStep) {
    case 1:
      return formData.title.trim().length > 0 && formData.projectId.length > 0
    case 2:
      return formData.startDate.length > 0 && formData.endDate.length > 0
    case 3:
      return formData.assignedProjectMemberIds.length > 0
    default:
      return false
  }
}

// Helper to get fields for each step
function getStepFields(step: number): string[] {
  switch (step) {
    case 1:
      return ['title', 'projectId', 'description', 'tradeRequired']
    case 2:
      return ['startDate', 'endDate', 'startTime', 'endTime', 'estimatedHours']
    case 3:
      return ['assignedProjectMemberIds', 'priority', 'location', 'notes']
    default:
      return []
  }
}

// ==============================================
// MAIN HOOK
// ==============================================
export function useCreateScheduleProject() {
  const router = useRouter()

  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseCreateScheduleProjectState>({
    state: 'idle',
    result: null,
    errors: {},
    formData: getDefaultCreateScheduleProjectFormData(),
  })

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const isLoading = state.state === 'loading'
  const isSuccess = state.state === 'success'
  const isError = state.state === 'error'
  const isIdle = state.state === 'idle'
  const hasErrors = Object.keys(state.errors).length > 0

  // Multi-step form computed values
  const currentStep = state.formData.currentStep
  const totalSteps = 3
  const canGoNext = currentStep < totalSteps
  const canGoPrev = currentStep > 1
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps
  const progressPercentage = (currentStep / totalSteps) * 100

  // FIXED: Proper canSubmit logic
  const canSubmit = !isLoading && getCurrentStepValidation(state.formData, state.errors, currentStep)

  // ==============================================
  // ACTIONS - ALL FIXED WITH PROPER STATE UPDATES
  // ==============================================

  // Update single form field
  const updateFormData = useCallback((field: keyof CreateScheduleProjectFormData, value: any) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value,
      },
    }))
  }, [])

  // Update multiple form fields at once
  const updateFormDataBulk = useCallback((data: Partial<CreateScheduleProjectFormData>) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        ...data,
      },
    }))
  }, [])

  // Clear all errors
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
    }))
  }, [])

  // FIXED: Clear specific field error - now accepts string
  const clearFieldError = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: undefined,
      },
    }))
  }, [])

  // FIXED: Validate entire form
  const validateForm = useCallback((): boolean => {
    let isValid = false
    
    setState(prev => {
      const { isValid: formIsValid, errors } = validateFormData(prev.formData)
      isValid = formIsValid
      
      if (!formIsValid) {
        return {
          ...prev,
          errors,
        }
      }
      
      return prev
    })

    return isValid
  }, [])

  // FIXED: Create schedule project - simplest approach
  const createScheduleProject = useCallback(async (data?: CreateScheduleProjectData) => {
    try {
      // Capture current form data before any state changes
      const currentFormData = state.formData
      
      setState(prev => ({
        ...prev,
        state: 'loading',
        errors: {},
      }))

      // Use provided data or transform current form data
      const scheduleProjectData = data || transformCreateFormDataToApiData(currentFormData)

      // Validate before sending
      if (!data) {
        const validation = validateCreateScheduleProject(scheduleProjectData)
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
      const result = await scheduleProjectsApi.createScheduleProject(scheduleProjectData)

      setState(prev => ({
        ...prev,
        state: 'success',
        result,
        errors: {},
      }))

      // Navigate to the created schedule project or back to list
      const scheduleProjectId = result.data.scheduleProject.id
      router.push(`/dashboard/schedule/${scheduleProjectId}`)

    } catch (error) {
      console.error('Error creating schedule project:', error)

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
        errors.general = 'An unexpected error occurred while creating the schedule project'
      }

      setState(prev => ({
        ...prev,
        state: 'error',
        errors,
      }))
    }
  }, [router, state.formData])

  // Reset form
  const reset = useCallback(() => {
    setState({
      state: 'idle',
      result: null,
      errors: {},
      formData: getDefaultCreateScheduleProjectFormData(),
    })
  }, [])

  // ==============================================
  // MULTI-STEP FORM HELPERS
  // ==============================================

  const goToNextStep = useCallback(() => {
    setState(prev => {
      if (prev.formData.currentStep < totalSteps) {
        return {
          ...prev,
          formData: {
            ...prev.formData,
            currentStep: prev.formData.currentStep + 1,
            completedSteps: [...prev.formData.completedSteps, prev.formData.currentStep]
              .filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
          },
        }
      }
      return prev
    })
  }, [])

  const goToPrevStep = useCallback(() => {
    setState(prev => {
      if (prev.formData.currentStep > 1) {
        return {
          ...prev,
          formData: {
            ...prev.formData,
            currentStep: prev.formData.currentStep - 1,
          },
        }
      }
      return prev
    })
  }, [])

  const goToStep = useCallback((step: number) => {
    setState(prev => {
      if (step >= 1 && step <= totalSteps) {
        return {
          ...prev,
          formData: {
            ...prev.formData,
            currentStep: step,
          },
        }
      }
      return prev
    })
  }, [])

  const markStepComplete = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        completedSteps: [...prev.formData.completedSteps, step]
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

    // Computed properties
    isLoading,
    isSuccess,
    isError,
    isIdle,
    hasErrors,
    canSubmit, // FIXED: Now properly validates current step

    // Multi-step form computed properties
    currentStep,
    totalSteps,
    canGoNext,
    canGoPrev,
    isFirstStep,
    isLastStep,
    progressPercentage,

    // Actions
    updateFormData,
    updateFormDataBulk,
    clearErrors,
    clearFieldError, // FIXED: Now accepts string
    validateForm,
    createScheduleProject,
    reset,

    // Multi-step form helpers
    goToNextStep,
    goToPrevStep,
    goToStep,
    markStepComplete,
  }
}

// Export default
export default useCreateScheduleProject