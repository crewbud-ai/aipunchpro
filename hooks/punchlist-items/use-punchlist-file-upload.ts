// ==============================================
// hooks/punchlist-items/use-punchlist-file-upload.ts - MATCHING YOUR EXACT STYLE
// ==============================================

import { useState, useCallback } from 'react'
import { punchlistItemsApi } from '@/lib/api/punchlist-items'

// ==============================================
// HOOK INTERFACES (MATCHING YOUR PATTERN)
// ==============================================
interface UsePunchlistFileUploadState {
    uploadState: 'idle' | 'uploading' | 'success' | 'error'
    uploadProgress: number
    pendingFiles: File[]
    error: string | null
    category: string
    entityId?: string
}

interface UsePunchlistFileUploadActions {
    addPendingFiles: (files: File[]) => void
    removePendingFile: (index: number) => void
    clearPendingFiles: () => void
    uploadPhotos: (files?: File[]) => Promise<string[]>
    uploadAttachments: (files?: File[]) => Promise<string[]>
    uploadPendingFiles: (type: 'photos' | 'attachments') => Promise<string[]>
    clearError: () => void
    reset: () => void
}

interface UsePunchlistFileUploadReturn extends UsePunchlistFileUploadState, UsePunchlistFileUploadActions {
    // Computed properties (matching your pattern)
    isUploading: boolean
    isSuccess: boolean
    isError: boolean
    isIdle: boolean
    hasError: boolean
    hasPendingFiles: boolean
    pendingFileCount: number
}

// ==============================================
// MAIN HOOK (MATCHING YOUR STYLE)
// ==============================================
export function usePunchlistFileUpload(
    category: string = 'punchlist',
    entityId?: string,
    callbacks?: {
        onUploadSuccess?: (urls: string[], type: 'photos' | 'attachments') => void
        onUploadError?: (error: string, type: 'photos' | 'attachments') => void
        onUploadProgress?: (progress: number) => void
    }) {
    // ==============================================
    // STATE (MATCHING YOUR INITIALIZATION PATTERN)
    // ==============================================
    const [state, setState] = useState<UsePunchlistFileUploadState>(() => ({
        uploadState: 'idle',
        uploadProgress: 0,
        pendingFiles: [],
        error: null,
        category,
        entityId,
    }))

    // ==============================================
    // COMPUTED PROPERTIES (MATCHING YOUR DIRECT STYLE)
    // ==============================================
    const isUploading = state.uploadState === 'uploading'
    const isSuccess = state.uploadState === 'success'
    const isError = state.uploadState === 'error'
    const isIdle = state.uploadState === 'idle'
    const hasError = state.error !== null
    const hasPendingFiles = state.pendingFiles.length > 0
    const pendingFileCount = state.pendingFiles.length

    // ==============================================
    // FILE MANAGEMENT (MATCHING YOUR CALLBACK STYLE)
    // ==============================================
    const addPendingFiles = useCallback((files: File[]) => {
        setState(prev => ({
            ...prev,
            pendingFiles: [...prev.pendingFiles, ...files],
            error: null,
        }))
    }, [])

    const removePendingFile = useCallback((index: number) => {
        setState(prev => ({
            ...prev,
            pendingFiles: prev.pendingFiles.filter((_, i) => i !== index),
        }))
    }, [])

    const clearPendingFiles = useCallback(() => {
        setState(prev => ({
            ...prev,
            pendingFiles: [],
        }))
    }, [])

    // ==============================================
    // UPLOAD PHOTOS (MATCHING YOUR ERROR HANDLING PATTERN)
    // ==============================================
    const uploadPhotos = useCallback(async (files?: File[]): Promise<string[]> => {
        try {
            setState(prev => ({ ...prev, uploadState: 'uploading', uploadProgress: 0, error: null }))

            const filesToUpload = files || state.pendingFiles.filter(file => file.type.startsWith('image/'))

            if (filesToUpload.length === 0) {
                setState(prev => ({ ...prev, uploadState: 'idle' }))
                return []
            }

            const totalFiles = filesToUpload.length
            let completedFiles = 0
            const uploadedUrls: string[] = []

            callbacks?.onUploadProgress?.(0)

            for (const file of filesToUpload) {
                try {
                    const progressBefore = Math.round((completedFiles / totalFiles) * 100)
                    setState(prev => ({ ...prev, uploadProgress: progressBefore }))
                    callbacks?.onUploadProgress?.(progressBefore)

                    // ✅ FIXED: Use state.category and state.entityId
                    const result = await punchlistItemsApi.uploadFiles([file], 'photos', state.category, state.entityId)

                    if (result.success && result.urls.length > 0) {
                        uploadedUrls.push(...result.urls)
                    }

                    completedFiles++

                    const progressAfter = Math.round((completedFiles / totalFiles) * 100)
                    setState(prev => ({ ...prev, uploadProgress: progressAfter }))
                    callbacks?.onUploadProgress?.(progressAfter)

                } catch (error) {
                    console.error(`Failed to upload ${file.name}:`, error)
                    completedFiles++
                }
            }

            if (uploadedUrls.length > 0) {
                setState(prev => ({
                    ...prev,
                    uploadState: 'success',
                    uploadProgress: 100,
                    pendingFiles: prev.pendingFiles.filter(pendingFile =>
                        !filesToUpload.some(uploadedFile => uploadedFile.name === pendingFile.name)
                    ),
                }))

                callbacks?.onUploadSuccess?.(uploadedUrls, 'photos')
                callbacks?.onUploadProgress?.(100)

                return uploadedUrls
            } else {
                const errorMessage = 'Failed to upload photos'
                setState(prev => ({ ...prev, uploadState: 'error', error: errorMessage }))
                callbacks?.onUploadError?.(errorMessage, 'photos')
                return []
            }

        } catch (error) {
            console.error('Error uploading photos:', error)

            let errorMessage = 'Failed to upload photos'
            if (error instanceof Error) {
                errorMessage = error.message
            }

            setState(prev => ({ ...prev, uploadState: 'error', error: errorMessage }))
            callbacks?.onUploadError?.(errorMessage, 'photos')
            return []
        } finally {
            setTimeout(() => {
                setState(prev => ({ ...prev, uploadState: 'idle', uploadProgress: 0 }))
            }, 2000)
        }
    }, [state.pendingFiles, state.category, state.entityId, callbacks])



    // ==============================================
    // UPLOAD ATTACHMENTS (MATCHING YOUR PATTERN)
    // ==============================================
    const uploadAttachments = useCallback(async (files?: File[]): Promise<string[]> => {
        try {
            setState(prev => ({ ...prev, uploadState: 'uploading', uploadProgress: 0, error: null }))

            const filesToUpload = files || state.pendingFiles

            if (filesToUpload.length === 0) {
                setState(prev => ({ ...prev, uploadState: 'idle' }))
                return []
            }

            const totalFiles = filesToUpload.length
            let completedFiles = 0
            const uploadedUrls: string[] = []

            callbacks?.onUploadProgress?.(0)

            for (const file of filesToUpload) {
                try {
                    const progressBefore = Math.round((completedFiles / totalFiles) * 100)
                    setState(prev => ({ ...prev, uploadProgress: progressBefore }))
                    callbacks?.onUploadProgress?.(progressBefore)

                    // ✅ FIXED: Use state.category and state.entityId
                    const result = await punchlistItemsApi.uploadFiles([file], 'attachments', state.category, state.entityId)

                    if (result.success && result.urls.length > 0) {
                        uploadedUrls.push(...result.urls)
                    }

                    completedFiles++

                    const progressAfter = Math.round((completedFiles / totalFiles) * 100)
                    setState(prev => ({ ...prev, uploadProgress: progressAfter }))
                    callbacks?.onUploadProgress?.(progressAfter)

                } catch (error) {
                    console.error(`Failed to upload ${file.name}:`, error)
                    completedFiles++
                }
            }

            if (uploadedUrls.length > 0) {
                setState(prev => ({
                    ...prev,
                    uploadState: 'success',
                    uploadProgress: 100,
                    pendingFiles: prev.pendingFiles.filter(pendingFile =>
                        !filesToUpload.some(uploadedFile => uploadedFile.name === pendingFile.name)
                    ),
                }))

                callbacks?.onUploadSuccess?.(uploadedUrls, 'attachments')
                callbacks?.onUploadProgress?.(100)

                return uploadedUrls
            } else {
                const errorMessage = 'Failed to upload attachments'
                setState(prev => ({ ...prev, uploadState: 'error', error: errorMessage }))
                callbacks?.onUploadError?.(errorMessage, 'attachments')
                return []
            }

        } catch (error) {
            console.error('Error uploading attachments:', error)

            let errorMessage = 'Failed to upload attachments'
            if (error instanceof Error) {
                errorMessage = error.message
            }

            setState(prev => ({ ...prev, uploadState: 'error', error: errorMessage }))
            callbacks?.onUploadError?.(errorMessage, 'attachments')
            return []
        } finally {
            setTimeout(() => {
                setState(prev => ({ ...prev, uploadState: 'idle', uploadProgress: 0 }))
            }, 2000)
        }
    }, [state.pendingFiles, state.category, state.entityId, callbacks])

    // ==============================================
    // UPLOAD PENDING FILES (MATCHING YOUR PATTERN)
    // ==============================================
    const uploadPendingFiles = useCallback(async (type: 'photos' | 'attachments'): Promise<string[]> => {
        if (type === 'photos') {
            return uploadPhotos()
        } else {
            return uploadAttachments()
        }
    }, [uploadPhotos, uploadAttachments])

    // ==============================================
    // CLEAR ERROR (MATCHING YOUR PATTERN)
    // ==============================================
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }))
    }, [])

    // ==============================================
    // RESET (MATCHING YOUR PATTERN)
    // ==============================================
    const reset = useCallback(() => {
        setState({
            uploadState: 'idle',
            uploadProgress: 0,
            pendingFiles: [],
            error: null,
            category: 'punchlist',
            entityId: undefined,
        })
    }, [])

    // ==============================================
    // RETURN HOOK INTERFACE (MATCHING YOUR EXACT PATTERN)
    // ==============================================
    return {
        // State
        uploadState: state.uploadState,
        uploadProgress: state.uploadProgress,
        pendingFiles: state.pendingFiles,
        error: state.error,
        category: state.category,
        entityId: state.entityId,

        // Computed properties
        isUploading,
        isSuccess,
        isError,
        isIdle,
        hasError,
        hasPendingFiles,
        pendingFileCount,

        // Actions
        addPendingFiles,
        removePendingFile,
        clearPendingFiles,
        uploadPhotos,
        uploadAttachments,
        uploadPendingFiles,
        clearError,
        reset,
    }
}

// Export default (matching your pattern)
export default usePunchlistFileUpload