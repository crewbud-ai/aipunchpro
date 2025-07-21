// ==============================================
// hooks/projects/use-project-files.ts - Project Files Hook (Following Existing Patterns)
// ==============================================

import { useState, useCallback } from 'react'
import { projectFilesApi, type ProjectFile, type ProjectFileFilters } from '@/lib/api/project-files'

// ==============================================
// INTERFACES & TYPES
// ==============================================
interface UseProjectFilesState {
    files: ProjectFile[]
    isLoading: boolean
    isUploading: boolean
    uploadProgress: number
    error: string | null
    
    // Enhanced state for optimistic updates
    isUpdating: boolean
    isDeleting: boolean
    lastActionFileId: string | null
}

interface UseProjectFilesActions {
    loadFiles: (projectId: string, filters?: ProjectFileFilters) => Promise<void>
    uploadFile: (projectId: string, file: File, description?: string, version?: string) => Promise<ProjectFile | null>
    updateFile: (projectId: string, fileId: string, updates: {
        version?: string
        description?: string
        isPublic?: boolean
        tags?: string[]
    }) => Promise<void>
    deleteFile: (projectId: string, fileId: string) => Promise<void>
    downloadFile: (file: ProjectFile) => Promise<void>
    refreshFiles: (projectId: string) => Promise<void>
    clearError: () => void
    reset: () => void
    
    // Optimistic update helpers
    optimisticUpdate: (fileId: string, updates: Partial<ProjectFile>) => void
    revertOptimisticUpdate: () => void
}

interface UseProjectFilesReturn extends UseProjectFilesState, UseProjectFilesActions {
    // Computed properties
    hasFiles: boolean
    fileCount: number
    totalSize: number
    blueprintFiles: ProjectFile[]
    
    // Enhanced computed properties
    isProcessing: boolean
    hasError: boolean
    isEmpty: boolean
    
    // Display helpers
    formattedTotalSize: string
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ==============================================
// MAIN HOOK
// ==============================================
export function useProjectFiles(): UseProjectFilesReturn {
    // ==============================================
    // STATE
    // ==============================================
    const [state, setState] = useState<UseProjectFilesState>({
        files: [],
        isLoading: false,
        isUploading: false,
        uploadProgress: 0,
        error: null,
        isUpdating: false,
        isDeleting: false,
        lastActionFileId: null,
    })

    // Store original files for optimistic updates
    const [originalFiles, setOriginalFiles] = useState<ProjectFile[]>([])

    // ==============================================
    // COMPUTED PROPERTIES
    // ==============================================
    const hasFiles = state.files.length > 0
    const fileCount = state.files.length
    const totalSize = state.files.reduce((total, file) => total + file.fileSize, 0)
    const blueprintFiles = state.files.filter(file => file.folder === 'blueprints')
    const isProcessing = state.isLoading || state.isUploading || state.isUpdating || state.isDeleting
    const hasError = !!state.error
    const isEmpty = !hasFiles && !state.isLoading
    const formattedTotalSize = formatFileSize(totalSize)

    // ==============================================
    // ACTIONS
    // ==============================================
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }))
    }, [])

    const reset = useCallback(() => {
        setState({
            files: [],
            isLoading: false,
            isUploading: false,
            uploadProgress: 0,
            error: null,
            isUpdating: false,
            isDeleting: false,
            lastActionFileId: null,
        })
        setOriginalFiles([])
    }, [])

    const optimisticUpdate = useCallback((fileId: string, updates: Partial<ProjectFile>) => {
        setState(prev => ({
            ...prev,
            files: prev.files.map(file => 
                file.id === fileId ? { ...file, ...updates } : file
            ),
            lastActionFileId: fileId,
        }))
    }, [])

    const revertOptimisticUpdate = useCallback(() => {
        setState(prev => ({
            ...prev,
            files: originalFiles,
            lastActionFileId: null,
        }))
    }, [originalFiles])

    const loadFiles = useCallback(async (projectId: string, filters: ProjectFileFilters = {}) => {
        if (!projectId) {
            setState(prev => ({ ...prev, error: 'Project ID is required' }))
            return
        }

        try {
            setState(prev => ({ 
                ...prev, 
                isLoading: true, 
                error: null 
            }))

            const response = await projectFilesApi.getProjectFiles(projectId, filters)

            if (response.success) {
                setState(prev => ({
                    ...prev,
                    files: response.data.files,
                    isLoading: false,
                }))
                setOriginalFiles(response.data.files)
            } else {
                setState(prev => ({
                    ...prev,
                    files: [],
                    isLoading: false,
                    error: response.message || 'Failed to load files',
                }))
            }
        } catch (error: any) {
            console.error('Error loading project files:', error)
            setState(prev => ({
                ...prev,
                files: [],
                isLoading: false,
                error: error.message || 'Failed to load project files',
            }))
        }
    }, [])

    const refreshFiles = useCallback(async (projectId: string) => {
        await loadFiles(projectId)
    }, [loadFiles])

    const uploadFile = useCallback(async (
        projectId: string, 
        file: File, 
        description: string = '', 
        version: string = '1.0'
    ): Promise<ProjectFile | null> => {
        if (!projectId || !file) {
            setState(prev => ({ 
                ...prev, 
                error: 'Project ID and file are required' 
            }))
            return null
        }

        try {
            setState(prev => ({ 
                ...prev, 
                isUploading: true, 
                uploadProgress: 0, 
                error: null 
            }))

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setState(prev => ({
                    ...prev,
                    uploadProgress: Math.min(prev.uploadProgress + 10, 90)
                }))
            }, 200)

            try {
                const response = await projectFilesApi.uploadProjectFile(
                    projectId, 
                    file, 
                    description, 
                    version
                )

                clearInterval(progressInterval)

                if (response.success) {
                    setState(prev => ({
                        ...prev,
                        files: [response.data.file, ...prev.files],
                        isUploading: false,
                        uploadProgress: 100,
                        lastActionFileId: response.data.file.id,
                    }))
                    setOriginalFiles(prev => [response.data.file, ...prev])

                    // Reset progress after a short delay
                    setTimeout(() => {
                        setState(prev => ({ ...prev, uploadProgress: 0 }))
                    }, 1000)

                    return response.data.file
                } else {
                    setState(prev => ({
                        ...prev,
                        isUploading: false,
                        uploadProgress: 0,
                        error: response.message || 'Upload failed',
                    }))
                    return null
                }
            } finally {
                clearInterval(progressInterval)
            }
        } catch (error: any) {
            console.error('Error uploading file:', error)
            setState(prev => ({
                ...prev,
                isUploading: false,
                uploadProgress: 0,
                error: error.message || 'Failed to upload file',
            }))
            
            return null
        }
    }, [])

    const updateFile = useCallback(async (
        projectId: string,
        fileId: string,
        updates: {
            version?: string
            description?: string
            isPublic?: boolean
            tags?: string[]
        }
    ) => {
        if (!projectId || !fileId) {
            setState(prev => ({ 
                ...prev, 
                error: 'Project ID and file ID are required' 
            }))
            return
        }

        try {
            setState(prev => ({ 
                ...prev, 
                isUpdating: true, 
                error: null,
                lastActionFileId: fileId,
            }))

            // Optimistic update
            optimisticUpdate(fileId, updates)

            const response = await projectFilesApi.updateProjectFile(projectId, fileId, updates)

            if (response.success) {
                setState(prev => ({
                    ...prev,
                    files: prev.files.map(file => 
                        file.id === fileId ? response.data.file : file
                    ),
                    isUpdating: false,
                }))
                setOriginalFiles(prev => prev.map(file => 
                    file.id === fileId ? response.data.file : file
                ))
            } else {
                // Revert optimistic update
                revertOptimisticUpdate()
                setState(prev => ({
                    ...prev,
                    isUpdating: false,
                    error: response.message || 'Update failed',
                }))
            }
        } catch (error: any) {
            console.error('Error updating file:', error)
            
            // Revert optimistic update
            revertOptimisticUpdate()
            setState(prev => ({
                ...prev,
                isUpdating: false,
                error: error.message || 'Failed to update file',
            }))
        }
    }, [optimisticUpdate, revertOptimisticUpdate])

    const deleteFile = useCallback(async (projectId: string, fileId: string) => {
        if (!projectId || !fileId) {
            setState(prev => ({ 
                ...prev, 
                error: 'Project ID and file ID are required' 
            }))
            return
        }

        try {
            setState(prev => ({ 
                ...prev, 
                isDeleting: true, 
                error: null,
                lastActionFileId: fileId,
            }))

            // Don't do optimistic removal - wait for API response
            const response = await projectFilesApi.deleteProjectFile(projectId, fileId)

            if (response.success) {
                // Only remove from state after successful deletion
                setState(prev => ({
                    ...prev,
                    files: prev.files.filter(file => file.id !== fileId),
                    isDeleting: false,
                }))
                setOriginalFiles(prev => prev.filter(file => file.id !== fileId))
            } else {
                setState(prev => ({
                    ...prev,
                    isDeleting: false,
                    error: response.message || 'Delete failed',
                }))
            }
        } catch (error: any) {
            console.error('Error deleting file:', error)
            setState(prev => ({
                ...prev,
                isDeleting: false,
                error: error.message || 'Failed to delete file',
            }))
        }
    }, [])

    const downloadFile = useCallback(async (file: ProjectFile) => {
        try {
            await projectFilesApi.downloadProjectFile(file)
        } catch (error: any) {
            console.error('Error downloading file:', error)
            setState(prev => ({
                ...prev,
                error: error.message || 'Failed to download file',
            }))
        }
    }, [])

    // ==============================================
    // RETURN HOOK INTERFACE
    // ==============================================
    return {
        // State
        files: state.files,
        isLoading: state.isLoading,
        isUploading: state.isUploading,
        uploadProgress: state.uploadProgress,
        error: state.error,
        isUpdating: state.isUpdating,
        isDeleting: state.isDeleting,
        lastActionFileId: state.lastActionFileId,

        // Computed properties
        hasFiles,
        fileCount,
        totalSize,
        blueprintFiles,
        isProcessing,
        hasError,
        isEmpty,
        formattedTotalSize,

        // Actions
        loadFiles,
        uploadFile,
        updateFile,
        deleteFile,
        downloadFile,
        refreshFiles,
        clearError,
        reset,
        optimisticUpdate,
        revertOptimisticUpdate,
    }
}