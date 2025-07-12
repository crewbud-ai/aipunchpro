// ==============================================
// hooks/punchlist-items/use-create-punchlist-item.ts - Create Punchlist Item Hook
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { punchlistItemsApi } from '@/lib/api/punchlist-items'
import {
  validateCreatePunchlistItem,
  getDefaultCreatePunchlistItemFormData,
  transformCreateFormDataToApiData,
  type CreatePunchlistItemData,
  type CreatePunchlistItemFormData,
  type CreatePunchlistItemState,
  type CreatePunchlistItemResult,
  type CreatePunchlistItemFormErrors,
  CREATE_PUNCHLIST_ITEM_STEPS,
} from '@/types/punchlist-items'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseCreatePunchlistItemState {
  state: CreatePunchlistItemState
  result: CreatePunchlistItemResult | null
  errors: CreatePunchlistItemFormErrors
  formData: CreatePunchlistItemFormData
}

interface UseCreatePunchlistItemActions {
  updateFormData: (field: string, value: any) => void
  updateFormDataBulk: (data: Partial<CreatePunchlistItemFormData>) => void
  clearErrors: () => void
  clearFieldError: (field: string) => void
  validateForm: () => boolean
  createPunchlistItem: (data?: CreatePunchlistItemData) => Promise<void>
  reset: () => void

  // Multi-step form helpers
  goToNextStep: () => void
  goToPrevStep: () => void
  goToStep: (step: number) => void
  markStepComplete: (step: number) => void
}

interface UseCreatePunchlistItemReturn extends UseCreatePunchlistItemState, UseCreatePunchlistItemActions {
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
// MAIN HOOK
// ==============================================
export function useCreatePunchlistItem(initialProjectId?: string, initialScheduleProjectId?: string) {
  const router = useRouter()

  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseCreatePunchlistItemState>(() => {
    const defaultData = getDefaultCreatePunchlistItemFormData()
    return {
      state: 'idle',
      result: null,
      errors: {},
      formData: {
        ...defaultData,
        projectId: initialProjectId || defaultData.projectId,
        relatedScheduleProjectId: initialScheduleProjectId || defaultData.relatedScheduleProjectId,
      },
    }
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const isLoading = state.state === 'loading'
  const isSuccess = state.state === 'success'
  const isError = state.state === 'error'
  const isIdle = state.state === 'idle'
  const hasErrors = Object.keys(state.errors).length > 0

  // Multi-step form computed properties
  const currentStep = state.formData.currentStep
  const totalSteps = CREATE_PUNCHLIST_ITEM_STEPS.length
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps
  const progressPercentage = Math.round((currentStep / totalSteps) * 100)

  // Check if current step is valid for navigation
  const currentStepValid = (() => {
    const step = CREATE_PUNCHLIST_ITEM_STEPS.find(s => s.id === currentStep)
    if (!step || !step.validation) return true
    return step.validation(state.formData)
  })()

  const canGoNext = currentStepValid && !isLastStep
  const canGoPrev = !isFirstStep && !isLoading
  const canSubmit = currentStepValid && isLastStep && !hasErrors && !isLoading

  // ==============================================
  // UPDATE FORM DATA
  // ==============================================
  const updateFormData = useCallback((field: string, value: any) => {
    setState(prev => {
      const newFormData = { ...prev.formData, [field]: value }
      
      // Clear field error when value changes
      const newErrors = { ...prev.errors }
      if (newErrors[field as keyof CreatePunchlistItemFormErrors]) {
        delete newErrors[field as keyof CreatePunchlistItemFormErrors]
      }

      return {
        ...prev,
        formData: newFormData,
        errors: newErrors,
      }
    })
  }, [])

  const updateFormDataBulk = useCallback((data: Partial<CreatePunchlistItemFormData>) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...data },
    }))
  }, [])

  // ==============================================
  // CLEAR ERRORS
  // ==============================================
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} }))
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setState(prev => {
      const newErrors = { ...prev.errors }
      delete newErrors[field as keyof CreatePunchlistItemFormErrors]
      return { ...prev, errors: newErrors }
    })
  }, [])

  // ==============================================
  // VALIDATE FORM
  // ==============================================
  const validateForm = useCallback(() => {
    const apiData = transformCreateFormDataToApiData(state.formData)
    const validation = validateCreatePunchlistItem(apiData)

    if (!validation.success) {
      const newErrors: CreatePunchlistItemFormErrors = {}
      
      validation.error.errors.forEach((error) => {
        const field = error.path.join('.')
        newErrors[field as keyof CreatePunchlistItemFormErrors] = error.message
      })

      setState(prev => ({ ...prev, errors: newErrors }))
      return false
    }

    setState(prev => ({ ...prev, errors: {} }))
    return true
  }, [state.formData])

  // ==============================================
  // CREATE PUNCHLIST ITEM
  // ==============================================
  const createPunchlistItem = useCallback(async (data?: CreatePunchlistItemData) => {
    try {
      setState(prev => ({ ...prev, state: 'loading', errors: {} }))

      // Use provided data or transform form data
      const submissionData = data || transformCreateFormDataToApiData(state.formData)

      // Validate before submission
      const validation = validateCreatePunchlistItem(submissionData)
      if (!validation.success) {
        const newErrors: CreatePunchlistItemFormErrors = {}
        validation.error.errors.forEach((error) => {
          const field = error.path.join('.')
          newErrors[field as keyof CreatePunchlistItemFormErrors] = error.message
        })
        setState(prev => ({ ...prev, state: 'error', errors: newErrors }))
        return
      }

      const response = await punchlistItemsApi.createPunchlistItem(submissionData)

      setState(prev => ({ 
        ...prev, 
        state: 'success',
        result: response,
      }))

      // Navigate to the new punchlist item after a short delay
      if (response.data?.punchlistItem?.id) {
        setTimeout(() => {
          router.push(`/dashboard/punchlist/${response.data.punchlistItem.id}`)
        }, 1500)
      }

    } catch (error) {
      console.error('Error creating punchlist item:', error)

      let newErrors: CreatePunchlistItemFormErrors = {}
      
      if (error instanceof Error) {
        // Try to parse validation errors from API response
        if (error.message.includes('Validation failed')) {
          newErrors.general = error.message
        } else {
          newErrors.general = error.message
        }
      } else {
        newErrors.general = 'An unexpected error occurred'
      }

      setState(prev => ({ 
        ...prev, 
        state: 'error',
        errors: newErrors,
      }))
    }
  }, [state.formData, router])

  // ==============================================
  // RESET FORM
  // ==============================================
  const reset = useCallback(() => {
    setState({
      state: 'idle',
      result: null,
      errors: {},
      formData: getDefaultCreatePunchlistItemFormData(),
    })
  }, [])

  // ==============================================
  // MULTI-STEP FORM HELPERS
  // ==============================================
  const goToNextStep = useCallback(() => {
    if (canGoNext) {
      setState(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          currentStep: prev.formData.currentStep + 1,
          completedSteps: [...prev.formData.completedSteps, prev.formData.currentStep]
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
          currentStep: prev.formData.currentStep - 1,
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
    createPunchlistItem,
    reset,

    // Multi-step form helpers
    goToNextStep,
    goToPrevStep,
    goToStep,
    markStepComplete,
  }
}

// Export default
export default useCreatePunchlistItem