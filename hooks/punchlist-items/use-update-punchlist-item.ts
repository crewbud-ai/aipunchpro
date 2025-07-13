// ==============================================
// hooks/punchlist-items/use-update-punchlist-item.ts - UPDATED for Multiple Assignments
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

  // NEW: Assignment management actions
  addAssignment: (projectMemberId: string, role?: 'primary' | 'secondary' | 'inspector' | 'supervisor') => void
  removeAssignment: (projectMemberId: string) => void
  updateAssignmentRole: (projectMemberId: string, role: 'primary' | 'secondary' | 'inspector' | 'supervisor') => void
  clearAssignments: () => void
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

  // NEW: Assignment computed properties
  assignedMemberCount: number
  hasPrimaryAssignee: boolean
  primaryAssignee?: { projectMemberId: string; role: string; projectMemberName?: string }
}

// ==============================================
// DEFAULT FORM DATA
// ==============================================
const getDefaultUpdateFormData = (punchlistItemId: string): UpdatePunchlistItemFormData => ({
  id: punchlistItemId,
  title: '',
  description: '',
  issueType: '', // FIXED: Empty string for form state
  location: '',
  roomArea: '',
  assignedMembers: [], // UPDATED: Now an array
  tradeCategory: '', // FIXED: Empty string for form state
  priority: 'medium',
  status: 'open',
  dueDate: '',
  estimatedHours: '', // FIXED: Empty string for form state
  actualHours: '', // FIXED: Empty string for form state
  resolutionNotes: '',
  rejectionReason: '',
  requiresInspection: false,
  inspectionPassed: '', // FIXED: Empty string for form state
  inspectionNotes: '',
  photos: [],
  attachments: [],
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
  const isLoading = state.state === 'loading'
  const isSuccess = state.state === 'success'
  const isError = state.state === 'error'
  const isIdle = state.state === 'idle'
  const hasErrors = Object.keys(state.errors).length > 0
  const isInitialized = !!state.originalPunchlistItem
  const canSubmit = state.hasChanges && !hasErrors && !isLoading && isInitialized

  // NEW: Assignment computed properties
  const assignedMemberCount = state.formData.assignedMembers?.length || 0
  const hasPrimaryAssignee = state.formData.assignedMembers?.some(member => member.role === 'primary') || false
  const primaryAssignee = state.formData.assignedMembers?.find(member => member.role === 'primary')

  // ==============================================
  // INITIALIZE FORM
  // ==============================================
  const initializeForm = useCallback((punchlistItem: PunchlistItemWithDetails) => {
    const formData = punchlistItemToUpdateFormData(punchlistItem)
    
    setState(prev => ({
      ...prev,
      state: 'idle',
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
        hasFormChanges(punchlistItemToUpdateFormData(prev.originalPunchlistItem), newFormData) : false

      // Clear field error when value changes
      const newErrors = { ...prev.errors }
      if (newErrors[field as keyof UpdatePunchlistItemFormErrors]) {
        delete newErrors[field as keyof UpdatePunchlistItemFormErrors]
      }

      return {
        ...prev,
        formData: newFormData,
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
        hasFormChanges(punchlistItemToUpdateFormData(prev.originalPunchlistItem), newFormData) : false

      return {
        ...prev,
        formData: newFormData,
        hasChanges,
      }
    })
  }, [])

  // ==============================================
  // NEW: ASSIGNMENT MANAGEMENT ACTIONS
  // ==============================================
  const addAssignment = useCallback((projectMemberId: string, role: 'primary' | 'secondary' | 'inspector' | 'supervisor' = 'primary') => {
    setState(prev => {
      const currentAssignments = prev.formData.assignedMembers || []
      
      // Check if member is already assigned
      const existingAssignment = currentAssignments.find(member => member.projectMemberId === projectMemberId)
      if (existingAssignment) {
        return prev // Don't add duplicate
      }

      // If adding a primary role, remove existing primary
      let updatedAssignments = currentAssignments
      if (role === 'primary') {
        updatedAssignments = currentAssignments.map(member => 
          member.role === 'primary' ? { ...member, role: 'secondary' } : member
        )
      }

      const newAssignment = {
        projectMemberId,
        role,
      }

      const newFormData = {
        ...prev.formData,
        assignedMembers: [...updatedAssignments, newAssignment],
      }

      const hasChanges = prev.originalPunchlistItem ? 
        hasFormChanges(punchlistItemToUpdateFormData(prev.originalPunchlistItem), newFormData) : false

      return {
        ...prev,
        formData: newFormData,
        hasChanges,
      }
    })
  }, [])

  const removeAssignment = useCallback((projectMemberId: string) => {
    setState(prev => {
      const newFormData = {
        ...prev.formData,
        assignedMembers: (prev.formData.assignedMembers || []).filter(
          member => member.projectMemberId !== projectMemberId
        ),
      }

      const hasChanges = prev.originalPunchlistItem ? 
        hasFormChanges(punchlistItemToUpdateFormData(prev.originalPunchlistItem), newFormData) : false

      return {
        ...prev,
        formData: newFormData,
        hasChanges,
      }
    })
  }, [])

  const updateAssignmentRole = useCallback((projectMemberId: string, role: 'primary' | 'secondary' | 'inspector' | 'supervisor') => {
    setState(prev => {
      let updatedAssignments = prev.formData.assignedMembers || []
      
      // If changing to primary, remove existing primary role from others
      if (role === 'primary') {
        updatedAssignments = updatedAssignments.map(member => 
          member.role === 'primary' && member.projectMemberId !== projectMemberId
            ? { ...member, role: 'secondary' }
            : member
        )
      }

      // Update the specific assignment
      updatedAssignments = updatedAssignments.map(member => 
        member.projectMemberId === projectMemberId
          ? { ...member, role }
          : member
      )

      const newFormData = {
        ...prev.formData,
        assignedMembers: updatedAssignments,
      }

      const hasChanges = prev.originalPunchlistItem ? 
        hasFormChanges(punchlistItemToUpdateFormData(prev.originalPunchlistItem), newFormData) : false

      return {
        ...prev,
        formData: newFormData,
        hasChanges,
      }
    })
  }, [])

  const clearAssignments = useCallback(() => {
    setState(prev => {
      const newFormData = {
        ...prev.formData,
        assignedMembers: [],
      }

      const hasChanges = prev.originalPunchlistItem ? 
        hasFormChanges(punchlistItemToUpdateFormData(prev.originalPunchlistItem), newFormData) : false

      return {
        ...prev,
        formData: newFormData,
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
        newErrors[field as keyof UpdatePunchlistItemFormErrors] = [error.message]
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
      setState(prev => ({ ...prev, state: 'loading', errors: {} }))

      // Use provided data or transform form data
      const submissionData = data || transformUpdateFormDataToApiData(state.formData)

      // Validate before submission
      const validation = validateUpdatePunchlistItem(submissionData)
      if (!validation.success) {
        const newErrors: UpdatePunchlistItemFormErrors = {}
        validation.error.errors.forEach((error) => {
          const field = error.path.join('.')
          newErrors[field as keyof UpdatePunchlistItemFormErrors] = [error.message]
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
          newErrors._form = [error.message]
        } else {
          newErrors._form = [error.message]
        }
      } else {
        newErrors._form = ['An unexpected error occurred']
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
        state: 'idle',
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

    // NEW: Assignment computed properties
    assignedMemberCount,
    hasPrimaryAssignee,
    primaryAssignee,

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

    // NEW: Assignment management actions
    addAssignment,
    removeAssignment,
    updateAssignmentRole,
    clearAssignments,
  }
}

export default useUpdatePunchlistItem