// ==============================================
// hooks/punchlist-items/use-update-punchlist-item.ts - Update Punchlist Item Hook
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { punchlistItemsApi } from '@/lib/api/punchlist-items'
import {
  validateUpdatePunchlistItem,
  transformUpdateFormDataToApiData,
  punchlistItemToUpdateFormData,
  hasFormChanges,
  type PunchlistItemWithDetails,
  type UpdatePunchlistItemData,
  type UpdatePunchlistItemFormData,
  type UpdatePunchlistItemState,
  type UpdatePunchlistItemResult,
  type UpdatePunchlistItemFormErrors,
} from '@/types/punchlist-items'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseUpdatePunchlistItemState {
  state: UpdatePunchlistItemState
  result: UpdatePunchlistItemResult | null
  errors: UpdatePunchlistItemFormErrors
  formData: UpdatePunchlistItemFormData
  originalPunchlistItem: PunchlistItemWithDetails | null
  hasChanges: boolean
}

interface UseUpdatePunchlistItemActions {
  initializeForm: (punchlistItem: PunchlistItemWithDetails) => void
  updateFormData: (field: keyof UpdatePunchlistItemFormData, value: any) => void
  updateFormDataBulk: (data: Partial<UpdatePunchlistItemFormData>) => void
  clearErrors: () => void
  clearFieldError: (field: keyof UpdatePunchlistItemFormErrors) => void
  validateForm: () => boolean
  updatePunchlistItem: (data?: UpdatePunchlistItemData) => Promise<void>
  resetForm: () => void
  reset: () => void
}

interface UseUpdatePunchlistItemReturn extends UseUpdatePunchlistItemState, UseUpdatePunchlistItemActions {
  // Computed properties
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
  hasErrors: boolean
  canSubmit: boolean
  isInitialized: boolean
}

// ==============================================
// DEFAULT FORM DATA
// ==============================================
const getDefaultUpdateFormData = (punchlistItemId: string): UpdatePunchlistItemFormData => ({
  id: punchlistItemId,
  title: '',
  description: '',
  issueType: '',
  location: '',
  roomArea: '',
  assignedProjectMemberId: '',
  tradeCategory: '',
  priority: 'medium',
  status: 'open',
  dueDate: '',
  estimatedHours: '',
  actualHours: '',
  resolutionNotes: '',
  rejectionReason: '',
  requiresInspection: false,
  inspectionPassed: '',
  inspectionNotes: '',
  photos: [],
  attachments: [],
  hasUnsavedChanges: false,
  modifiedFields: [],
  originalData: undefined,
})

// ==============================================
// MAIN HOOK
// ==============================================
export function useUpdatePunchlistItem(punchlistItemId?: string) {
  const router = useRouter()

  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseUpdatePunchlistItemState>({
    state: 'idle',
    result: null,
    errors: {},
    formData: getDefaultUpdateFormData(punchlistItemId || ''),
    originalPunchlistItem: null,
    hasChanges: false,
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const isLoading = state.state === 'loading' || state.state === 'saving'
  const isSuccess = state.state === 'success'
  const isError = state.state === 'error'
  const isIdle = state.state === 'idle'
  const hasErrors = Object.keys(state.errors).length > 0
  const isInitialized = !!state.originalPunchlistItem
  const canSubmit = state.hasChanges && !hasErrors && !isLoading && isInitialized

  // ==============================================
  // INITIALIZE FORM
  // ==============================================
  const initializeForm = useCallback((punchlistItem: PunchlistItemWithDetails) => {
    const formData = punchlistItemToUpdateFormData(punchlistItem)
    
    setState(prev => ({
      ...prev,
      state: 'editing',
      formData,
      originalPunchlistItem: punchlistItem,
      hasChanges: false,
      errors: {},
    }))
  }, [])

  // ==============================================
  // UPDATE FORM DATA
  // ==============================================
  const updateFormData = useCallback((field: keyof UpdatePunchlistItemFormData, value: any) => {
    setState(prev => {
      const newFormData = { ...prev.formData, [field]: value }
      
      // Check if there are changes compared to original
      const hasChanges = prev.originalPunchlistItem ? 
        hasFormChanges(prev.originalPunchlistItem, newFormData) : false

      // Clear field error when value changes
      const newErrors = { ...prev.errors }
      if (newErrors[field as keyof UpdatePunchlistItemFormErrors]) {
        delete newErrors[field as keyof UpdatePunchlistItemFormErrors]
      }

      return {
        ...prev,
        formData: {
          ...newFormData,
          hasUnsavedChanges: hasChanges,
        },
        hasChanges,
        errors: newErrors,
      }
    })
  }, [])

  const updateFormDataBulk = useCallback((data: Partial<UpdatePunchlistItemFormData>) => {
    setState(prev => {
      const newFormData = { ...prev.formData, ...data }
      
      // Check if there are changes compared to original
      const hasChanges = prev.originalPunchlistItem ? 
        hasFormChanges(prev.originalPunchlistItem, newFormData) : false

      return {
        ...prev,
        formData: {
          ...newFormData,
          hasUnsavedChanges: hasChanges,
        },
        hasChanges,
      }
    })
  }, [])

  // ==============================================
  // CLEAR ERRORS
  // ==============================================
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} }))
  }, [])

  const clearFieldError = useCallback((field: keyof UpdatePunchlistItemFormErrors) => {
    setState(prev => {
      const newErrors = { ...prev.errors }
      delete newErrors[field]
      return { ...prev, errors: newErrors }
    })
  }, [])

  // ==============================================
  // VALIDATE FORM
  // ==============================================
  const validateForm = useCallback(() => {
    if (!state.originalPunchlistItem) return false

    const apiData = transformUpdateFormDataToApiData(state.formData)
    const validation = validateUpdatePunchlistItem(apiData)

    if (!validation.success) {
      const newErrors: UpdatePunchlistItemFormErrors = {}
      
      validation.error.errors.forEach((error) => {
        const field = error.path.join('.')
        newErrors[field as keyof UpdatePunchlistItemFormErrors] = error.message
      })

      setState(prev => ({ ...prev, errors: newErrors }))
      return false
    }

    setState(prev => ({ ...prev, errors: {} }))
    return true
  }, [state.formData, state.originalPunchlistItem])

  // ==============================================
  // UPDATE PUNCHLIST ITEM
  // ==============================================
  const updatePunchlistItem = useCallback(async (data?: UpdatePunchlistItemData) => {
    try {
      setState(prev => ({ ...prev, state: 'saving', errors: {} }))

      // Use provided data or transform form data
      const submissionData = data || transformUpdateFormDataToApiData(state.formData)

      // Validate before submission
      const validation = validateUpdatePunchlistItem(submissionData)
      if (!validation.success) {
        const newErrors: UpdatePunchlistItemFormErrors = {}
        validation.error.errors.forEach((error) => {
          const field = error.path.join('.')
          newErrors[field as keyof UpdatePunchlistItemFormErrors] = error.message
        })
        setState(prev => ({ ...prev, state: 'error', errors: newErrors }))
        return
      }

      const response = await punchlistItemsApi.updatePunchlistItem(submissionData)

      setState(prev => ({ 
        ...prev, 
        state: 'success',
        result: response,
        hasChanges: false,
        formData: {
          ...prev.formData,
          hasUnsavedChanges: false,
        },
      }))

      // Update the original data with the new data
      if (response.data?.punchlistItem) {
        setState(prev => ({
          ...prev,
          originalPunchlistItem: response.data.punchlistItem,
          formData: punchlistItemToUpdateFormData(response.data.punchlistItem),
        }))
      }

    } catch (error) {
      console.error('Error updating punchlist item:', error)

      let newErrors: UpdatePunchlistItemFormErrors = {}
      
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
  }, [state.formData])

  // ==============================================
  // RESET FORM
  // ==============================================
  const resetForm = useCallback(() => {
    if (state.originalPunchlistItem) {
      const formData = punchlistItemToUpdateFormData(state.originalPunchlistItem)
      setState(prev => ({
        ...prev,
        formData,
        hasChanges: false,
        errors: {},
        state: 'editing',
      }))
    }
  }, [state.originalPunchlistItem])

  const reset = useCallback(() => {
    setState({
      state: 'idle',
      result: null,
      errors: {},
      formData: getDefaultUpdateFormData(punchlistItemId || ''),
      originalPunchlistItem: null,
      hasChanges: false,
    })
  }, [punchlistItemId])

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    state: state.state,
    result: state.result,
    errors: state.errors,
    formData: state.formData,
    originalPunchlistItem: state.originalPunchlistItem,
    hasChanges: state.hasChanges,

    // Computed properties
    isLoading,
    isSuccess,
    isError,
    isIdle,
    hasErrors,
    canSubmit,
    isInitialized,

    // Actions
    initializeForm,
    updateFormData,
    updateFormDataBulk,
    clearErrors,
    clearFieldError,
    validateForm,
    updatePunchlistItem,
    resetForm,
    reset,
  }
}

// Export default
export default useUpdatePunchlistItem