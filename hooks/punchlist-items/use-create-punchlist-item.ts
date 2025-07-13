// ==============================================
// hooks/punchlist-items/use-create-punchlist-item.ts - UPDATED for Multiple Assignments
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { punchlistItemsApi } from '@/lib/api/punchlist-items'
import { usePunchlistFileUpload } from './use-punchlist-file-upload'
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

    // File upload actions
    addPendingFiles: (files: File[]) => void
    removePendingFile: (index: number) => void
    uploadPhotos: (files?: File[]) => Promise<string[]>
    uploadAttachments: (files?: File[]) => Promise<string[]>
    removePhoto: (photoUrl: string) => void
    removeAttachment: (attachmentUrl: string) => void

    // NEW: Assignment management actions
    addAssignment: (projectMemberId: string, role?: 'primary' | 'secondary' | 'inspector' | 'supervisor') => void
    removeAssignment: (projectMemberId: string) => void
    updateAssignmentRole: (projectMemberId: string, role: 'primary' | 'secondary' | 'inspector' | 'supervisor') => void
    clearAssignments: () => void
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

    // File upload computed properties
    isUploadingFiles: boolean
    hasPendingFiles: boolean
    pendingFiles: File[]
    uploadProgress: number
    uploadError: string | null

    // NEW: Assignment computed properties
    assignedMemberCount: number
    hasPrimaryAssignee: boolean
    primaryAssignee?: { projectMemberId: string; role: string }
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
    // FILE UPLOAD HOOK INTEGRATION
    // ==============================================
    const fileUpload = usePunchlistFileUpload(
        'punchlist',
        undefined,
        {
            onUploadSuccess: (urls, type) => {
                setState(prev => ({
                    ...prev,
                    formData: {
                        ...prev.formData,
                        [type]: [...(prev.formData[type] || []), ...urls],
                    },
                }))
            },
            onUploadError: (error, type) => {
                setState(prev => ({
                    ...prev,
                    errors: {
                        ...prev.errors,
                        [type]: error,
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

    const canGoNext = !isLastStep && !isLoading && !fileUpload.isUploading
    const canGoPrev = !isFirstStep && !isLoading && !fileUpload.isUploading
    const canSubmit = currentStepValid && isLastStep && !hasErrors && !isLoading && !fileUpload.isUploading

    // File upload computed properties
    const isUploadingFiles = fileUpload.isUploading
    const hasPendingFiles = fileUpload.hasPendingFiles
    const pendingFiles = fileUpload.pendingFiles
    const uploadProgress = fileUpload.uploadProgress
    const uploadError = fileUpload.error

    // NEW: Assignment computed properties
    const assignedMemberCount = state.formData.assignedMembers?.length || 0
    const hasPrimaryAssignee = state.formData.assignedMembers?.some(member => member.role === 'primary') || false
    const primaryAssignee = state.formData.assignedMembers?.find(member => member.role === 'primary')

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

            return {
                ...prev,
                formData: {
                    ...prev.formData,
                    assignedMembers: [...updatedAssignments, newAssignment],
                },
            }
        })
    }, [])

    const removeAssignment = useCallback((projectMemberId: string) => {
        setState(prev => ({
            ...prev,
            formData: {
                ...prev.formData,
                assignedMembers: (prev.formData.assignedMembers || []).filter(
                    member => member.projectMemberId !== projectMemberId
                ),
            },
        }))
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

            return {
                ...prev,
                formData: {
                    ...prev.formData,
                    assignedMembers: updatedAssignments,
                },
            }
        })
    }, [])

    const clearAssignments = useCallback(() => {
        setState(prev => ({
            ...prev,
            formData: {
                ...prev.formData,
                assignedMembers: [],
            },
        }))
    }, [])

    // ==============================================
    // CLEAR ERRORS
    // ==============================================
    const clearErrors = useCallback(() => {
        setState(prev => ({ ...prev, errors: {} }))
        fileUpload.clearError()
    }, [fileUpload])

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

                // Wait for state to sync
                await new Promise(resolve => setTimeout(resolve, 100))
            }

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
                
                // Show validation errors in toast instead of form
                const errorMessages = Object.values(newErrors).filter(Boolean)
                if (errorMessages.length > 0) {
                    // You can replace this with your toast implementation
                    console.error('Validation Errors:', errorMessages)
                    // For now, just show first error - replace with your toast
                    alert(`Validation Error: ${errorMessages[0]}`)
                }
                
                setState(prev => ({ ...prev, state: 'idle', errors: {} })) // FIXED: Reset to idle instead of error
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

            let errorMessage = 'An unexpected error occurred'

            if (error instanceof Error) {
                errorMessage = error.message
                
                // Check if it's a validation error from API
                if (error.message.includes('Validation failed') || error.message.includes('validation')) {
                    // Show in toast instead of form
                    console.error('API Validation Error:', error.message)
                    // Replace with your toast implementation
                    alert(`Validation Error: ${error.message}`)
                    
                    setState(prev => ({ ...prev, state: 'idle', errors: {} })) // FIXED: Reset to idle
                    return
                }
            }

            // For other errors, show in toast as well
            console.error('Create Error:', errorMessage)
            // Replace with your toast implementation  
            alert(`Error: ${errorMessage}`)
            
            setState(prev => ({ ...prev, state: 'idle', errors: {} })) // FIXED: Reset to idle instead of error
        }
    }, [state.formData, router, fileUpload])

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
        fileUpload.reset()
    }, [fileUpload])

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

            setState(prev => ({
                ...prev,
                formData: {
                    ...prev.formData,
                    photos: prev.formData.photos.filter(url => url !== photoUrl),
                },
            }))

            if (!deleteResult.success) {
                console.warn('Failed to delete file from storage, but removed from UI:', deleteResult.error)
            }

        } catch (error) {
            console.error('Error removing photo:', error)

            setState(prev => ({
                ...prev,
                formData: {
                    ...prev.formData,
                    photos: prev.formData.photos.filter(url => url !== photoUrl),
                },
            }))
        }
    }, [])

    const removeAttachment = useCallback(async (attachmentUrl: string) => {
        try {
            const deleteResult = await punchlistItemsApi.deleteFile(attachmentUrl)

            setState(prev => ({
                ...prev,
                formData: {
                    ...prev.formData,
                    attachments: (prev.formData.attachments || []).filter(url => url !== attachmentUrl),
                },
            }))

            if (!deleteResult.success) {
                console.warn('Failed to delete attachment from storage, but removed from UI:', deleteResult.error)
            }

        } catch (error) {
            console.error('Error removing attachment:', error)

            setState(prev => ({
                ...prev,
                formData: {
                    ...prev.formData,
                    attachments: (prev.formData.attachments || []).filter(url => url !== attachmentUrl),
                },
            }))
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

        // File upload computed properties
        isUploadingFiles,
        hasPendingFiles,
        pendingFiles,
        uploadProgress,
        uploadError,

        // NEW: Assignment computed properties
        assignedMemberCount,
        hasPrimaryAssignee,
        primaryAssignee,

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

        // File upload actions
        addPendingFiles,
        removePendingFile,
        uploadPhotos,
        uploadAttachments,
        removePhoto,
        removeAttachment,

        // NEW: Assignment management actions
        addAssignment,
        removeAssignment,
        updateAssignmentRole,
        clearAssignments,
    }
}

export default useCreatePunchlistItem