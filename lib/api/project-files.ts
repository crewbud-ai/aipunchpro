// ==============================================
// lib/api/project-files.ts - Project Files API Service (Following Existing Patterns)
// ==============================================

import { toast } from '@/hooks/use-toast'

// ==============================================
// INTERFACES & TYPES
// ==============================================
export interface ProjectFile {
    id: string
    projectId: string
    name: string
    originalName: string
    fileUrl: string
    fileType: string
    fileSize: number
    mimeType: string
    folder: string
    category?: string
    version?: string
    description?: string
    tags?: string[]
    isPublic: boolean
    status: string
    uploadedBy: string
    uploadedAt: string
    createdAt: string
    updatedAt: string
    uploader?: {
        id: string
        firstName: string
        lastName: string
        email: string
    }
}

export interface ProjectFileFilters {
    folder?: string
    category?: string
    status?: string
    search?: string
    sortBy?: 'name' | 'uploadedAt' | 'fileSize' | 'version'
    sortOrder?: 'asc' | 'desc'
    limit?: number
    offset?: number
}

export interface GetProjectFilesResult {
    success: boolean
    message: string
    data: {
        files: ProjectFile[]
        totalCount: number
        pagination: {
            limit: number
            offset: number
            hasMore: boolean
        }
    }
}

export interface UploadProjectFileResult {
    success: boolean
    message: string
    data: {
        file: ProjectFile
    }
}

export interface UpdateProjectFileResult {
    success: boolean
    message: string
    data: {
        file: ProjectFile
    }
}

export interface DeleteProjectFileResult {
    success: boolean
    message: string
}

export interface ProjectFileStatsResult {
    success: boolean
    message: string
    data: {
        totalFiles: number
        totalSize: number
        filesByFolder: Record<string, number>
        filesByCategory: Record<string, number>
    }
}

// ==============================================
// API ERROR CLASS
// ==============================================
class ApiError extends Error {
    status: number
    
    constructor(status: number, message: string) {
        super(message)
        this.status = status
        this.name = 'ApiError'
    }
}

// ==============================================
// API CALL HELPER
// ==============================================
async function apiCall<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        })

        const data = await response.json()

        if (!response.ok) {
            throw new ApiError(response.status, data.message || `HTTP error! status: ${response.status}`)
        }

        return data
    } catch (error) {
        if (error instanceof ApiError) {
            throw error
        }
        
        // Network or other errors
        throw new ApiError(0, 'Network error occurred. Please check your connection and try again.')
    }
}

// ==============================================
// UPLOAD FILE HELPER
// ==============================================
async function uploadFileCall(url: string, formData: FormData): Promise<any> {
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
            throw new ApiError(response.status, data.message || `Upload failed! status: ${response.status}`)
        }

        return data
    } catch (error) {
        if (error instanceof ApiError) {
            throw error
        }
        
        // Network or other errors
        throw new ApiError(0, 'Network error occurred during upload. Please check your connection and try again.')
    }
}

// ==============================================
// PROJECT FILES API SERVICE
// ==============================================
export const projectFilesApi = {
    // ==============================================
    // GET PROJECT FILES
    // ==============================================
    async getProjectFiles(projectId: string, filters: ProjectFileFilters = {}): Promise<GetProjectFilesResult> {
        try {
            if (!projectId || projectId.length !== 36) {
                throw new ApiError(400, 'Invalid project ID')
            }

            // Build query parameters
            const searchParams = new URLSearchParams()

            if (filters.folder) searchParams.append('folder', filters.folder)
            if (filters.category) searchParams.append('category', filters.category)
            if (filters.status) searchParams.append('status', filters.status)
            if (filters.search) searchParams.append('search', filters.search)
            if (filters.sortBy) searchParams.append('sortBy', filters.sortBy)
            if (filters.sortOrder) searchParams.append('sortOrder', filters.sortOrder)
            if (filters.limit) searchParams.append('limit', filters.limit.toString())
            if (filters.offset) searchParams.append('offset', filters.offset.toString())

            const queryString = searchParams.toString()
            const endpoint = `/api/projects/${projectId}/files${queryString ? `?${queryString}` : ''}`

            const response = await apiCall<GetProjectFilesResult>(endpoint, {
                method: 'GET',
            })

            // Usually we don't show success toasts for GET operations
            return response

        } catch (error) {
            if (error instanceof ApiError) {
                if (error.status === 404) {
                    toast({
                        title: "Project Not Found",
                        description: "The requested project could not be found.",
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Failed to Load Files",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to load project files')
            toast({
                title: "Network Error",
                description: "Unable to load project files. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // UPLOAD PROJECT FILE
    // ==============================================
    async uploadProjectFile(
        projectId: string, 
        file: File, 
        description?: string, 
        version?: string
    ): Promise<UploadProjectFileResult> {
        try {
            if (!projectId || projectId.length !== 36) {
                throw new ApiError(400, 'Invalid project ID')
            }

            if (!file) {
                throw new ApiError(400, 'File is required')
            }

            // Validate file type (PDF only)
            if (file.type !== 'application/pdf') {
                throw new ApiError(400, 'Only PDF files are allowed for blueprints')
            }

            // Validate file size (10MB max)
            const maxSize = 10 * 1024 * 1024 // 10MB
            if (file.size > maxSize) {
                throw new ApiError(400, `File size must be less than ${maxSize / (1024 * 1024)}MB`)
            }

            // Create form data
            const formData = new FormData()
            formData.append('file', file)
            if (description) formData.append('description', description)
            if (version) formData.append('version', version)

            const response = await uploadFileCall(
                `/api/projects/${projectId}/files`,
                formData
            )

            // Show success toast
            toast({
                title: "File Uploaded",
                description: response.message || "Blueprint has been uploaded successfully.",
            })

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: "Upload Failed",
                    description: error.message,
                    variant: "destructive",
                })
                throw error
            }

            const networkError = new ApiError(0, 'Failed to upload file')
            toast({
                title: "Network Error",
                description: "Unable to upload file. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // UPDATE PROJECT FILE
    // ==============================================
    async updateProjectFile(
        projectId: string,
        fileId: string,
        updates: {
            version?: string
            description?: string
            isPublic?: boolean
            tags?: string[]
        }
    ): Promise<UpdateProjectFileResult> {
        try {
            if (!projectId || projectId.length !== 36) {
                throw new ApiError(400, 'Invalid project ID')
            }

            if (!fileId || fileId.length !== 36) {
                throw new ApiError(400, 'Invalid file ID')
            }

            const response = await apiCall<UpdateProjectFileResult>(`/api/projects/${projectId}/files/${fileId}`, {
                method: 'PUT',
                body: JSON.stringify(updates),
            })

            // Show success toast
            toast({
                title: "File Updated",
                description: response.message || "File has been updated successfully.",
            })

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: "Update Failed",
                    description: error.message,
                    variant: "destructive",
                })
                throw error
            }

            const networkError = new ApiError(0, 'Failed to update file')
            toast({
                title: "Network Error",
                description: "Unable to update file. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // DELETE PROJECT FILE
    // ==============================================
    async deleteProjectFile(projectId: string, fileId: string): Promise<DeleteProjectFileResult> {
        try {
            if (!projectId || projectId.length !== 36) {
                throw new ApiError(400, 'Invalid project ID')
            }

            if (!fileId || fileId.length !== 36) {
                throw new ApiError(400, 'Invalid file ID')
            }

            const response = await apiCall<DeleteProjectFileResult>(`/api/projects/${projectId}/files/${fileId}`, {
                method: 'DELETE',
            })

            // Show success toast
            toast({
                title: "File Deleted",
                description: response.message || "File has been deleted successfully.",
            })

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                if (error.status === 404) {
                    toast({
                        title: "File Not Found",
                        description: "The file you are trying to delete could not be found.",
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Delete Failed",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to delete file')
            toast({
                title: "Network Error",
                description: "Unable to delete file. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // DOWNLOAD PROJECT FILE
    // ==============================================
    async downloadProjectFile(file: ProjectFile): Promise<void> {
        try {
            // Create a temporary link and trigger download
            const link = document.createElement('a')
            link.href = file.fileUrl
            link.download = file.originalName
            link.target = '_blank'
            
            // Append to body, click, and remove
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast({
                title: "Download Started",
                description: `Downloading ${file.originalName}...`,
            })

        } catch (error) {
            toast({
                title: "Download Failed",
                description: "Unable to download file. Please try again.",
                variant: "destructive",
            })
        }
    },

    // ==============================================
    // GET PROJECT FILE STATS
    // ==============================================
    async getProjectFileStats(projectId: string): Promise<ProjectFileStatsResult> {
        try {
            if (!projectId || projectId.length !== 36) {
                throw new ApiError(400, 'Invalid project ID')
            }

            const response = await apiCall<ProjectFileStatsResult>(`/api/projects/${projectId}/files/stats`, {
                method: 'GET',
            })

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: "Failed to Load Stats",
                    description: error.message,
                    variant: "destructive",
                })
                throw error
            }

            const networkError = new ApiError(0, 'Failed to load file stats')
            toast({
                title: "Network Error",
                description: "Unable to load file statistics. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },
}