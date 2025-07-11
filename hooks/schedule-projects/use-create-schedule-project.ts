// ==============================================
// hooks/schedule-projects/use-create-schedule-project.ts - Create Schedule Project Hook (FIXED)
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
  clearFieldError: (field: keyof ScheduleProjectFormErrors) => void
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
// MAIN HOOK - EXACT SAME PATTERN AS PROJECT HOOK
// ==============================================
export function useCreateScheduleProject() {
  const router = useRouter()

  // ==============================================
  // STATE - SINGLE STATE OBJECT LIKE PROJECT HOOK
  // ==============================================
  const [state, setState] = useState<UseCreateScheduleProjectState>({
    state: 'idle',
    result: null,
    errors: {},
    formData: getDefaultCreateScheduleProjectFormData(),
  })

  // ==============================================
  // COMPUTED PROPERTIES - EXACT SAME PATTERN
  // ==============================================
  const isLoading = state.state === 'loading'
  const isSuccess = state.state === 'success'
  const isError = state.state === 'error'
  const isIdle = state.state === 'idle'
  const hasErrors = Object.keys(state.errors).length > 0
  const canSubmit = Boolean(
    state.formData.title.trim().length > 0 &&
    state.formData.projectId.length > 0 &&
    state.formData.assignedProjectMemberIds.length > 0 &&
    !isLoading
  )

  // Multi-step form computed values
  const currentStep = state.formData.currentStep
  const totalSteps = 3
  const canGoNext = currentStep < totalSteps
  const canGoPrev = currentStep > 1
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps
  const progressPercentage = (currentStep / totalSteps) * 100

  // ==============================================
  // FORM DATA MANAGEMENT - EXACT SAME PATTERN AS PROJECT HOOK
  // ==============================================
  const updateFormData = useCallback((field: keyof CreateScheduleProjectFormData, value: any) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      // Clear field error when user starts typing
      errors: { ...prev.errors, [field]: undefined },
    }))
  }, [])

  const updateFormDataBulk = useCallback((data: Partial<CreateScheduleProjectFormData>) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...data },
    }))
  }, [])

  // ==============================================
  // ERROR MANAGEMENT - EXACT SAME PATTERN
  // ==============================================
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
    }))
  }, [])

  const clearFieldError = useCallback((field: keyof ScheduleProjectFormErrors) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: undefined },
    }))
  }, [])

  // ==============================================
  // FORM VALIDATION - EXACT SAME PATTERN
  // ==============================================
  const validateForm = useCallback(() => {
    const validation = validateCreateScheduleProject(transformCreateFormDataToApiData(state.formData))

    if (!validation.success) {
      const newErrors: ScheduleProjectFormErrors = {}
      validation.error.errors.forEach((error: any) => {
        const fieldPath = error.path.join('.')
        newErrors[fieldPath as keyof ScheduleProjectFormErrors] = error.message
      })

      setState(prev => ({
        ...prev,
        errors: newErrors,
      }))
      return false
    }

    setState(prev => ({
      ...prev,
      errors: {},
    }))
    return true
  }, [state.formData])

  // ==============================================
  // CREATE SCHEDULE PROJECT - EXACT SAME PATTERN
  // ==============================================
  const createScheduleProject = useCallback(async (data?: CreateScheduleProjectData) => {
    try {
      setState(prev => ({
        ...prev,
        state: 'loading',
        errors: {},
      }))

      // Use provided data or transform form data
      const scheduleProjectData = data || transformCreateFormDataToApiData(state.formData)

      // Validate data before sending
      const validation = validateCreateScheduleProject(scheduleProjectData)
      if (!validation.success) {
        const newErrors: ScheduleProjectFormErrors = {}
        validation.error.errors.forEach((error: any) => {
          const fieldPath = error.path.join('.')
          newErrors[fieldPath as keyof ScheduleProjectFormErrors] = error.message
        })

        setState(prev => ({
          ...prev,
          state: 'error',
          errors: newErrors,
        }))
        return
      }

      const response = await scheduleProjectsApi.createScheduleProject(scheduleProjectData)

      if (response.success) {
        setState(prev => ({
          ...prev,
          state: 'success',
          result: response,
          errors: {},
        }))

        // Navigate to the new schedule project
        router.push(`/dashboard/schedule/${response.data.scheduleProject.id}`)
      } else {
        setState(prev => ({
          ...prev,
          state: 'error',
          errors: { general: response.message || 'Failed to create schedule project' },
        }))
      }
    } catch (error: any) {
      console.error('Error creating schedule project:', error)

      setState(prev => ({
        ...prev,
        state: 'error',
        errors: { general: error.message || 'Failed to create schedule project' },
      }))
    }
  }, [state.formData, router])

  // ==============================================
  // MULTI-STEP FORM HELPERS
  // ==============================================
  const goToNextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        currentStep: prev.formData.currentStep + 1,
        completedSteps: [...prev.formData.completedSteps, prev.formData.currentStep]
          .filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
      },
    }))
  }, [])

  const goToPrevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        currentStep: prev.formData.currentStep - 1,
      },
    }))
  }, [])

  const goToStep = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        currentStep: step,
      },
    }))
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
  // RESET - EXACT SAME PATTERN
  // ==============================================
  const reset = useCallback(() => {
    setState({
      state: 'idle',
      result: null,
      errors: {},
      formData: getDefaultCreateScheduleProjectFormData(),
    })
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
    canSubmit,

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
    clearFieldError,
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