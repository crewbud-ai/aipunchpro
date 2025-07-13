// ==============================================
// hooks/punchlist-items/use-create-punchlist-item.ts - Create Punchlist Item Hook
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { punchlistItemsApi } from '@/lib/api/punchlist-items'
import { usePunchlistFileUpload } from './use-punchlist-file-upload' // ✅ ADD THIS IMPORT
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

    // ✅ ADD: File upload actions
    addPendingFiles: (files: File[]) => void
    removePendingFile: (index: number) => void
    uploadPhotos: (files?: File[]) => Promise<string[]>
    uploadAttachments: (files?: File[]) => Promise<string[]>
    removePhoto: (photoUrl: string) => void
    removeAttachment: (attachmentUrl: string) => void
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

    // ✅ ADD: File upload computed properties
    isUploadingFiles: boolean
    hasPendingFiles: boolean
    pendingFiles: File[]
    uploadProgress: number
    uploadError: string | null
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
    // ✅ ADD: FILE UPLOAD HOOK INTEGRATION
    // ==============================================
    const fileUpload = usePunchlistFileUpload(
        'punchlist',
        undefined,
        {
            onUploadSuccess: (urls, type) => {
                // Sync uploaded URLs with form data
                setState(prev => ({
                    ...prev,
                    formData: {
                        ...prev.formData,
                        [type]: [...(prev.formData[type] || []), ...urls],
                    },
                }))
            },
            onUploadError: (error, type) => {
                // Sync upload errors with form errors
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

    // FIXED: Allow free navigation between steps (don't block based on validation)
    const canGoNext = !isLastStep && !isLoading && !fileUpload.isUploading // ✅ ADD: Don't allow next if uploading
    const canGoPrev = !isFirstStep && !isLoading && !fileUpload.isUploading // ✅ ADD: Don't allow prev if uploading
    const canSubmit = currentStepValid && isLastStep && !hasErrors && !isLoading && !fileUpload.isUploading // ✅ ADD: Don't allow submit if uploading

    // ✅ ADD: File upload computed properties
    const isUploadingFiles = fileUpload.isUploading
    const hasPendingFiles = fileUpload.hasPendingFiles
    const pendingFiles = fileUpload.pendingFiles
    const uploadProgress = fileUpload.uploadProgress
    const uploadError = fileUpload.error

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
        fileUpload.clearError() // ✅ ADD: Clear upload errors too
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

            // ✅ ADD: Upload any pending files before submission
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
        fileUpload.reset() // ✅ ADD: Reset upload state too
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
    // ✅ ADD: FILE UPLOAD HELPERS
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

            // Remove from form data (regardless of deletion success to improve UX)
            setState(prev => ({
                ...prev,
                formData: {
                    ...prev.formData,
                    photos: prev.formData.photos.filter(url => url !== photoUrl),
                },
            }))

            // Log if deletion failed but don't block UI update
            if (!deleteResult.success) {
                console.warn('Failed to delete file from storage, but removed from UI:', deleteResult.error)
            }

        } catch (error) {
            console.error('Error removing photo:', error)

            // Still remove from UI even if deletion fails
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
            // Delete from Supabase Storage first
            const deleteResult = await punchlistItemsApi.deleteFile(attachmentUrl)

            // Remove from form data
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

            // Still remove from UI even if deletion fails
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

        // ✅ ADD: File upload computed properties
        isUploadingFiles,
        hasPendingFiles,
        pendingFiles,
        uploadProgress,
        uploadError,

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

        // ✅ ADD: File upload actions
        addPendingFiles,
        removePendingFile,
        uploadPhotos,
        uploadAttachments,
        removePhoto,
        removeAttachment,
    }
}

// Export default
export default useCreatePunchlistItem