// ==============================================
// hooks/punchlist-items/use-update-punchlist-item.ts - COMPLETE WITH FILE UPLOAD
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { punchlistItemsApi } from '@/lib/api/punchlist-items'
import { usePunchlistFileUpload } from './use-punchlist-file-upload'
import { toast } from '@/hooks/use-toast'
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

  // Assignment management actions
  addAssignment: (projectMemberId: string, role?: 'primary' | 'secondary' | 'inspector' | 'supervisor') => void
  removeAssignment: (projectMemberId: string) => void
  updateAssignmentRole: (projectMemberId: string, role: 'primary' | 'secondary' | 'inspector' | 'supervisor') => void
  clearAssignments: () => void

  // File upload actions
  addPendingFiles: (files: File[]) => void
  removePendingFile: (index: number) => void
  uploadPhotos: (files?: File[]) => Promise<string[]>
  uploadAttachments: (files?: File[]) => Promise<string[]>
  removePhoto: (photoUrl: string) => void
  removeAttachment: (attachmentUrl: string) => void
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

  // Assignment computed properties
  assignedMemberCount: number
  hasPrimaryAssignee: boolean
  primaryAssignee?: { projectMemberId: string; role: string; projectMemberName?: string }

  // File upload computed properties
  isUploadingFiles: boolean
  hasPendingFiles: boolean
  pendingFiles: File[]
  uploadProgress: number
  uploadError: string | null
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
  assignedMembers: [],
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
  // FILE UPLOAD HOOK INTEGRATION
  // ==============================================
  const fileUpload = usePunchlistFileUpload(
    'punchlist',
    punchlistItemId,
    {
      onUploadSuccess: (urls, type) => {
        setState(prev => {
          const newFormData = {
            ...prev.formData,
            [type]: [...(prev.formData[type] || []), ...urls],
          }
          
          // Check if this creates changes
          const hasChanges = prev.originalPunchlistItem ? 
            hasFormChanges(punchlistItemToUpdateFormData(prev.originalPunchlistItem), newFormData) : true

          return {
            ...prev,
            formData: newFormData,
            hasChanges, // ✅ Update hasChanges when files are uploaded
          }
        })
      },
      onUploadError: (error, type) => {
        setState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [type]: [error],
          },
        }))
      },
    }
  )

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const isLoading = state.state === 'loading'
  const isSuccess = state.state === 'success'
  const isError = state.state === 'error'
  const isIdle = state.state === 'idle'
  const hasErrors = Object.keys(state.errors).length > 0
  const isInitialized = !!state.originalPunchlistItem
  const canSubmit = isInitialized && state.hasChanges && !hasErrors && !isLoading && !fileUpload.isUploading

  // File upload computed properties
  const isUploadingFiles = fileUpload.isUploading
  const hasPendingFiles = fileUpload.hasPendingFiles
  const pendingFiles = fileUpload.pendingFiles
  const uploadProgress = fileUpload.uploadProgress
  const uploadError = fileUpload.error

  // Assignment computed properties
  const assignedMemberCount = state.formData.assignedMembers?.length || 0
  const hasPrimaryAssignee = state.formData.assignedMembers?.some(member => member.role === 'primary') || false
  const primaryAssignee = state.formData.assignedMembers?.find(member => member.role === 'primary')

  // ==============================================
  // INITIALIZE FORM
  // ==============================================
  const initializeForm = useCallback((punchlistItem: PunchlistItemWithDetails) => {
    // Convert null values to empty strings or appropriate defaults
    const formData: UpdatePunchlistItemFormData = {
      id: punchlistItem.id,
      title: punchlistItem.title || '',
      description: punchlistItem.description || '',
      issueType: punchlistItem.issueType || '',
      location: punchlistItem.location || '',
      roomArea: punchlistItem.roomArea || '',
      assignedMembers: punchlistItem.assignedMembers?.map(member => ({
        projectMemberId: member.projectMemberId,
        role: member.role,
        projectMemberName: `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim(),
        projectMemberTrade: member.user?.tradeSpecialty || undefined
      })) || [],
      tradeCategory: punchlistItem.tradeCategory || '',
      priority: punchlistItem.priority || 'medium',
      status: punchlistItem.status || 'open',
      dueDate: punchlistItem.dueDate || '',
      estimatedHours: punchlistItem.estimatedHours || '',
      actualHours: punchlistItem.actualHours || '',
      resolutionNotes: punchlistItem.resolutionNotes || '',
      rejectionReason: punchlistItem.rejectionReason || '',
      requiresInspection: punchlistItem.requiresInspection || false,
      inspectionPassed: punchlistItem.inspectionPassed === null ? '' : punchlistItem.inspectionPassed,
      inspectionNotes: punchlistItem.inspectionNotes || '',
      photos: punchlistItem.photos || [],
      attachments: punchlistItem.attachments || []
    }
    
    setState(prev => ({
      ...prev,
      formData,
      originalPunchlistItem: punchlistItem,
      hasChanges: false,
      errors: {},
      state: 'idle',
    }))
  }, [])

  // ==============================================
  // UPDATE FORM DATA
  // ==============================================
  const updateFormData = useCallback((field: keyof UpdatePunchlistItemFormData, value: any) => {
    setState(prev => {
      const newFormData = {
        ...prev.formData,
        [field]: value,
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

  const updateFormDataBulk = useCallback((data: Partial<UpdatePunchlistItemFormData>) => {
    setState(prev => {
      const newFormData = {
        ...prev.formData,
        ...data,
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
  // ASSIGNMENT MANAGEMENT ACTIONS
  // ==============================================
  const addAssignment = useCallback((projectMemberId: string, role: 'primary' | 'secondary' | 'inspector' | 'supervisor' = 'primary') => {
    setState(prev => {
      const currentAssignments = prev.formData.assignedMembers || []
      
      const existingAssignment = currentAssignments.find(member => member.projectMemberId === projectMemberId)
      if (existingAssignment) {
        return prev
      }

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
      
      if (role === 'primary') {
        updatedAssignments = updatedAssignments.map(member => 
          member.role === 'primary' && member.projectMemberId !== projectMemberId
            ? { ...member, role: 'secondary' }
            : member
        )
      }

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

      // Upload any pending files before submission
      if (fileUpload.hasPendingFiles) {
        const pendingPhotos = fileUpload.pendingFiles.filter(file => file.type.startsWith('image/'))
        const pendingAttachments = fileUpload.pendingFiles.filter(file => !file.type.startsWith('image/'))

        if (pendingPhotos.length > 0) {
          await fileUpload.uploadPhotos(pendingPhotos)
        }

        if (pendingAttachments.length > 0) {
          await fileUpload.uploadAttachments(pendingAttachments)
        }

        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Clean the form data before transformation
      const cleanedFormData = {
        ...state.formData,
        // Convert null/empty strings to undefined for optional enum fields
        tradeCategory: (state.formData.tradeCategory === '' || !state.formData.tradeCategory) 
          ? undefined 
          : state.formData.tradeCategory,
        issueType: (state.formData.issueType === '' || !state.formData.issueType) 
          ? undefined 
          : state.formData.issueType,
        estimatedHours: (state.formData.estimatedHours === '' || state.formData.estimatedHours === null || state.formData.estimatedHours === undefined) 
          ? undefined 
          : state.formData.estimatedHours,
        actualHours: (state.formData.actualHours === '' || state.formData.actualHours === null || state.formData.actualHours === undefined) 
          ? undefined 
          : state.formData.actualHours,
        dueDate: (state.formData.dueDate === '' || !state.formData.dueDate) 
          ? undefined 
          : state.formData.dueDate,
        inspectionPassed: (state.formData.inspectionPassed === '' || state.formData.inspectionPassed === null || state.formData.inspectionPassed === undefined)
          ? undefined 
          : state.formData.inspectionPassed,
      }

      const submissionData = data || transformUpdateFormDataToApiData(cleanedFormData as UpdatePunchlistItemFormData)

      const validation = validateUpdatePunchlistItem(submissionData)
      if (!validation.success) {
        const newErrors: UpdatePunchlistItemFormErrors = {}
        validation.error.errors.forEach((error) => {
          const field = error.path.join('.')
          newErrors[field as keyof UpdatePunchlistItemFormErrors] = [error.message]
        })

        const errorMessages = Object.values(newErrors).filter(Boolean)

        if (errorMessages.length > 0) {
          toast({
            title: "Validation Error",
            description: errorMessages[0]?.[0] || "Failed to update punchlist item.",
            variant: "destructive",
          })

          setState(prev => ({ ...prev, state: 'idle', errors: {} }))
          return
        }
      }

      const response = await punchlistItemsApi.updatePunchlistItem(submissionData)

      if (response.success) {
        setState(prev => ({
          ...prev,
          state: 'success',
          result: response,
          errors: {},
        }))

        toast({
          title: "Success",
          description: response.message || "Punchlist item updated successfully",
        })

        setTimeout(() => {
          router.push(`/dashboard/punchlist/${submissionData.id}`)
        }, 500)
      } else {
        throw new Error(response.message || 'Failed to update punchlist item')
      }
    } catch (error) {
      console.error('Error updating punchlist item:', error)

      let errorMessage = 'Failed to update punchlist item'
      const newErrors: UpdatePunchlistItemFormErrors = {}

      if (error instanceof Error) {
        errorMessage = error.message
        newErrors._form = [error.message]
      } else {
        newErrors._form = ['An unexpected error occurred']
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })

      setState(prev => ({ 
        ...prev, 
        state: 'error',
        errors: newErrors,
      }))
    }
  }, [state.formData, router, fileUpload])

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
    fileUpload.reset()
  }, [punchlistItemId, fileUpload])

  // ==============================================
  // FILE UPLOAD HELPERS
  // ==============================================
  const addPendingFiles = useCallback((files: File[]) => {
    fileUpload.addPendingFiles(files)
  }, [fileUpload])

  const removePendingFile = useCallback((index: number) => {
    fileUpload.removePendingFile(index)
  }, [fileUpload])

  const uploadPhotos = useCallback(async (files?: File[]): Promise<string[]> => {
    return fileUpload.uploadPhotos(files)
  }, [fileUpload])

  const uploadAttachments = useCallback(async (files?: File[]): Promise<string[]> => {
    return fileUpload.uploadAttachments(files)
  }, [fileUpload])

  const removePhoto = useCallback(async (photoUrl: string) => {
    try {
      const deleteResult = await punchlistItemsApi.deleteFile(photoUrl)

      setState(prev => {
        const newFormData = {
          ...prev.formData,
          photos: (prev.formData.photos || []).filter(url => url !== photoUrl),
        }
        
        // Check if this creates changes
        const hasChanges = prev.originalPunchlistItem ? 
          hasFormChanges(punchlistItemToUpdateFormData(prev.originalPunchlistItem), newFormData) : true

        return {
          ...prev,
          formData: newFormData,
          hasChanges, // ✅ Update hasChanges when photos are removed
        }
      })

      if (!deleteResult.success) {
        console.warn('Failed to delete file from storage, but removed from UI:', deleteResult.error)
      }

    } catch (error) {
      console.error('Error removing photo:', error)

      setState(prev => {
        const newFormData = {
          ...prev.formData,
          photos: (prev.formData.photos || []).filter(url => url !== photoUrl),
        }
        
        const hasChanges = prev.originalPunchlistItem ? 
          hasFormChanges(punchlistItemToUpdateFormData(prev.originalPunchlistItem), newFormData) : true

        return {
          ...prev,
          formData: newFormData,
          hasChanges,
        }
      })
    }
  }, [])

  const removeAttachment = useCallback(async (attachmentUrl: string) => {
    try {
      const deleteResult = await punchlistItemsApi.deleteFile(attachmentUrl)

      setState(prev => {
        const newFormData = {
          ...prev.formData,
          attachments: (prev.formData.attachments || []).filter(url => url !== attachmentUrl),
        }
        
        // Check if this creates changes
        const hasChanges = prev.originalPunchlistItem ? 
          hasFormChanges(punchlistItemToUpdateFormData(prev.originalPunchlistItem), newFormData) : true

        return {
          ...prev,
          formData: newFormData,
          hasChanges, // ✅ Update hasChanges when attachments are removed
        }
      })

      if (!deleteResult.success) {
        console.warn('Failed to delete attachment from storage, but removed from UI:', deleteResult.error)
      }

    } catch (error) {
      console.error('Error removing attachment:', error)

      setState(prev => {
        const newFormData = {
          ...prev.formData,
          attachments: (prev.formData.attachments || []).filter(url => url !== attachmentUrl),
        }
        
        const hasChanges = prev.originalPunchlistItem ? 
          hasFormChanges(punchlistItemToUpdateFormData(prev.originalPunchlistItem), newFormData) : true

        return {
          ...prev,
          formData: newFormData,
          hasChanges,
        }
      })
    }
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

    // Assignment computed properties
    assignedMemberCount,
    hasPrimaryAssignee,
    primaryAssignee,

    // File upload computed properties
    isUploadingFiles,
    hasPendingFiles,
    pendingFiles,
    uploadProgress,
    uploadError,

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

    // Assignment management actions
    addAssignment,
    removeAssignment,
    updateAssignmentRole,
    clearAssignments,

    // File upload actions
    addPendingFiles,
    removePendingFile,
    uploadPhotos,
    uploadAttachments,
    removePhoto,
    removeAttachment,
  }
}

export default useUpdatePunchlistItem