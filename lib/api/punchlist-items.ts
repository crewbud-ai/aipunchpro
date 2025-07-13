// ==============================================
// lib/api/punchlist-items.ts - Complete Punchlist Items API Service
// ==============================================

import { toast } from '@/hooks/use-toast'
import type {
    // Core Types
    PunchlistItem,
    PunchlistItemSummary,
    PunchlistItemWithDetails,
    PunchlistItemFilters,

    // Create Types
    CreatePunchlistItemData,
    CreatePunchlistItemResult,

    // Update Types
    UpdatePunchlistItemData,
    UpdatePunchlistItemResult,
    QuickUpdatePunchlistStatusData,
    QuickUpdatePunchlistStatusResult,

    // Query Types
    GetPunchlistItemsResult,
    GetPunchlistItemResult,
    DeletePunchlistItemResult,

    PhotoUploadResult,
    BulkPhotoUploadResult,
} from '@/types/punchlist-items';
import { createBrowserClient } from '@/lib/supabase/client'

// ==============================================
// API CLIENT CONFIGURATION
// ==============================================
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

class ApiError extends Error {
    constructor(
        public status: number,
        public message: string,
        public details?: any[]
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

// ==============================================
// GENERIC API CLIENT
// ==============================================
async function apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const config: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    }

    try {
        const response = await fetch(url, config)
        const data = await response.json()

        if (!response.ok) {
            // Create detailed error based on response structure
            const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`
            const errorDetails = data.details || []

            console.error('Punchlist Items API Error:', {
                status: response.status,
                message: errorMessage,
                details: errorDetails,
                url,
                data
            })

            throw new ApiError(
                response.status,
                errorMessage,
                errorDetails
            )
        }

        return data
    } catch (error) {
        if (error instanceof ApiError) {
            throw error
        }

        // Network or other errors
        console.error('Punchlist Items Network Error:', error)
        throw new ApiError(
            0,
            'Network error. Please check your connection and try again.'
        )
    }
}

async function apiUpload<T>(
    endpoint: string,
    formData: FormData
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
            const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`
            const errorDetails = data.details || []

            console.error('Upload API Error:', {
                status: response.status,
                message: errorMessage,
                details: errorDetails,
                url,
                data
            })

            throw new ApiError(
                response.status,
                errorMessage,
                errorDetails
            )
        }

        return data
    } catch (error) {
        if (error instanceof ApiError) {
            throw error
        }

        // ✅ Same network error handling as your apiCall
        console.error('Upload Network Error:', error)
        throw new ApiError(
            0,
            'Network error. Please check your connection and try again.'
        )
    }
}

// ==============================================
// EXPORT API SERVICE OBJECT
// ==============================================
export const punchlistItemsApi = {
    // ==============================================
    // GET ALL PUNCHLIST ITEMS
    // ==============================================
    async getPunchlistItems(filters: PunchlistItemFilters = {}): Promise<GetPunchlistItemsResult> {
        try {
            // Build query parameters
            const params = new URLSearchParams()

            // Basic filters
            if (filters.projectId) params.append('projectId', filters.projectId)
            if (filters.relatedScheduleProjectId) params.append('relatedScheduleProjectId', filters.relatedScheduleProjectId)
            if (filters.status) params.append('status', filters.status)
            if (filters.priority) params.append('priority', filters.priority)
            if (filters.issueType) params.append('issueType', filters.issueType)
            if (filters.tradeCategory) params.append('tradeCategory', filters.tradeCategory)

            // Assignment filters
            if (filters.assignedToUserId) params.append('assignedToUserId', filters.assignedToUserId)
            if (filters.reportedBy) params.append('reportedBy', filters.reportedBy)

            // Date filters
            if (filters.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom)
            if (filters.dueDateTo) params.append('dueDateTo', filters.dueDateTo)
            if (filters.createdFrom) params.append('createdFrom', filters.createdFrom)
            if (filters.createdTo) params.append('createdTo', filters.createdTo)

            // Special filters
            if (filters.requiresInspection !== undefined) {
                params.append('requiresInspection', filters.requiresInspection.toString())
            }
            if (filters.isOverdue !== undefined) {
                params.append('isOverdue', filters.isOverdue.toString())
            }
            if (filters.hasPhotos !== undefined) {
                params.append('hasPhotos', filters.hasPhotos.toString())
            }

            // Search
            if (filters.search) params.append('search', filters.search)

            // Pagination & Sorting
            if (filters.limit) params.append('limit', filters.limit.toString())
            if (filters.offset) params.append('offset', filters.offset.toString())
            if (filters.sortBy) params.append('sortBy', filters.sortBy)
            if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

            const response = await apiCall<GetPunchlistItemsResult>(`/api/punchlist-items?${params.toString()}`)
            return response

        } catch (error) {
            if (error instanceof ApiError) {
                // For query parameter errors, we usually don't show toast since filters will handle it
                if (error.status === 400) {
                    console.warn('Punchlist items query validation error:', error.details)
                } else {
                    toast({
                        title: "Failed to Load Punchlist Items",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to fetch punchlist items')
            toast({
                title: "Network Error",
                description: "Unable to load punchlist items. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // GET PUNCHLIST ITEM BY ID
    // ==============================================
    async getPunchlistItem(id: string): Promise<GetPunchlistItemResult> {
        try {
            if (!id || id.trim() === '') {
                throw new ApiError(400, 'Punchlist item ID is required')
            }

            const response = await apiCall<GetPunchlistItemResult>(`/api/punchlist-items/${id}`)
            return response

        } catch (error) {
            if (error instanceof ApiError) {
                if (error.status === 404) {
                    toast({
                        title: "Punchlist Item Not Found",
                        description: "The punchlist item you're looking for could not be found.",
                        variant: "destructive",
                    })
                } else if (error.status !== 400) {
                    toast({
                        title: "Failed to Load Punchlist Item",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to fetch punchlist item')
            toast({
                title: "Network Error",
                description: "Unable to load punchlist item. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // CREATE PUNCHLIST ITEM
    // ==============================================
    async createPunchlistItem(data: CreatePunchlistItemData): Promise<CreatePunchlistItemResult> {
        try {
            const response = await apiCall<CreatePunchlistItemResult>('/api/punchlist-items', {
                method: 'POST',
                body: JSON.stringify(data),
            })

            // Show success toast
            toast({
                title: "Punchlist Item Created",
                description: response.message || "The punchlist item has been created successfully.",
            })

            // Show additional notifications if provided
            if (response.notifications?.message) {
                toast({
                    title: "Info",
                    description: response.notifications.message,
                })
            }

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                // For validation errors, we usually don't show toast since the form will handle it
                if (error.status === 400) {
                    console.warn('Punchlist item creation validation error:', error.details)
                } else {
                    toast({
                        title: "Failed to Create Punchlist Item",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to create punchlist item')
            toast({
                title: "Network Error",
                description: "Unable to create punchlist item. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // UPDATE PUNCHLIST ITEM
    // ==============================================
    async updatePunchlistItem(data: UpdatePunchlistItemData): Promise<UpdatePunchlistItemResult> {
        try {
            const { id, ...updateData } = data

            const response = await apiCall<UpdatePunchlistItemResult>(`/api/punchlist-items/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(updateData),
            })

            // Show success toast
            toast({
                title: "Punchlist Item Updated",
                description: response.message || "The punchlist item has been updated successfully.",
            })

            // Show additional notifications if provided
            if (response.notifications?.message) {
                toast({
                    title: "Info",
                    description: response.notifications.message,
                })
            }

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                // For validation errors, we usually don't show toast since the form will handle it
                if (error.status === 400) {
                    console.warn('Punchlist item update validation error:', error.details)
                } else if (error.status === 404) {
                    toast({
                        title: "Punchlist Item Not Found",
                        description: "The punchlist item you're trying to update could not be found.",
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Failed to Update Punchlist Item",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to update punchlist item')
            toast({
                title: "Network Error",
                description: "Unable to update punchlist item. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // QUICK UPDATE PUNCHLIST ITEM STATUS
    // ==============================================
    async updatePunchlistStatus(data: QuickUpdatePunchlistStatusData): Promise<QuickUpdatePunchlistStatusResult> {
        try {
            const { id, ...statusData } = data

            const response = await apiCall<QuickUpdatePunchlistStatusResult>(`/api/punchlist-items/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify(statusData),
            })

            // Show success toast
            toast({
                title: "Status Updated",
                description: response.message || "Punchlist item status has been updated successfully.",
            })

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                // For validation errors, we usually don't show toast since the form will handle it
                if (error.status === 400) {
                    console.warn('Punchlist item status update validation error:', error.details)
                } else if (error.status === 404) {
                    toast({
                        title: "Punchlist Item Not Found",
                        description: "The punchlist item you're trying to update could not be found.",
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Failed to Update Status",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to update punchlist item status')
            toast({
                title: "Network Error",
                description: "Unable to update status. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // DELETE PUNCHLIST ITEM
    // ==============================================
    async deletePunchlistItem(id: string): Promise<DeletePunchlistItemResult> {
        try {
            if (!id || id.trim() === '') {
                throw new ApiError(400, 'Punchlist item ID is required')
            }

            const response = await apiCall<DeletePunchlistItemResult>(`/api/punchlist-items/${id}`, {
                method: 'DELETE',
            })

            // Show success toast
            toast({
                title: "Punchlist Item Deleted",
                description: response.message || "The punchlist item has been deleted successfully.",
            })

            // Show additional notifications if provided
            if (response.notifications?.message) {
                toast({
                    title: "Info",
                    description: response.notifications.message,
                })
            }

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                if (error.status === 404) {
                    toast({
                        title: "Punchlist Item Not Found",
                        description: "The punchlist item you're trying to delete could not be found.",
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Failed to Delete Punchlist Item",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to delete punchlist item')
            toast({
                title: "Network Error",
                description: "Unable to delete punchlist item. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // UPLOAD PUNCHLIST ITEM FILES
    // ==============================================
    async uploadFiles(
        files: File[],
        type: 'photos' | 'attachments' | 'documents' | 'avatars' = 'photos',
        category: string = 'punchlist',
        entityId?: string
    ): Promise<{ success: boolean; urls: string[]; errors?: string[] }> {
        try {
            if (!files || files.length === 0) {
                throw new ApiError(400, 'No files provided for upload')
            }

            const uploadResults = await Promise.allSettled(
                files.map(async (file) => {
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('type', type)
                    formData.append('category', category)

                    if (entityId) {
                        formData.append('entityId', entityId)
                    }

                    // Note: For FormData, we need to remove Content-Type header to let browser set it
                    const response = await apiCall<{
                        success: boolean
                        url: string
                        fileName: string
                        fileSize: number
                        fileType: string
                        message: string
                    }>('/api/upload', {
                        method: 'POST',
                        headers: {
                            // Remove Content-Type for FormData - let browser set it
                        },
                        body: formData,
                    })

                    if (!response.success) {
                        throw new Error(response.message || 'Upload failed')
                    }

                    return response.url
                })
            )

            const urls: string[] = []
            const errors: string[] = []

            uploadResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    urls.push(result.value)
                } else {
                    errors.push(`File ${files[index].name}: ${result.reason}`)
                }
            })

            if (urls.length > 0) {
                toast({
                    title: "Files Uploaded",
                    description: `Successfully uploaded ${urls.length} file(s).`,
                })
            }

            if (errors.length > 0) {
                toast({
                    title: "Some Files Failed",
                    description: `${errors.length} file(s) failed to upload.`,
                    variant: "destructive",
                })
            }

            return {
                success: urls.length > 0,
                urls,
                errors: errors.length > 0 ? errors : undefined
            }
        } catch (error) {
            console.error('Error uploading files:', error)
            toast({
                title: "Upload Failed",
                description: "Unable to upload files. Please try again.",
                variant: "destructive",
            })
            throw error
        }
    },

    async deleteFile(fileUrl: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (!fileUrl) {
                throw new ApiError(400, 'File URL is required')
            }

            // Use your existing apiCall helper for consistency
            const response = await apiCall<{
                success: boolean
                message: string
            }>('/api/upload', {
                method: 'DELETE',
                body: JSON.stringify({ url: fileUrl }),
            })

            if (response.success) {
                toast({
                    title: "File Deleted",
                    description: "File has been removed successfully.",
                })
            }

            return { success: response.success }

        } catch (error) {
            console.error('Error deleting file:', error)

            const errorMessage = error instanceof Error ? error.message : 'Failed to delete file'

            toast({
                title: "Delete Failed",
                description: errorMessage,
                variant: "destructive",
            })

            return {
                success: false,
                error: errorMessage
            }
        }
    },
} as const

// ==============================================
// DEFAULT EXPORT
// ==============================================
export default punchlistItemsApi

// ==============================================
// CONVENIENCE FUNCTIONS
// ==============================================

// Get punchlist items by project
export const getPunchlistItemsByProject = async (
    projectId: string,
    additionalFilters: Omit<PunchlistItemFilters, 'projectId'> = {}
) => {
    return punchlistItemsApi.getPunchlistItems({ ...additionalFilters, projectId })
}

// Get punchlist items by schedule project
export const getPunchlistItemsByScheduleProject = async (
    relatedScheduleProjectId: string,
    additionalFilters: Omit<PunchlistItemFilters, 'relatedScheduleProjectId'> = {}
) => {
    return punchlistItemsApi.getPunchlistItems({ ...additionalFilters, relatedScheduleProjectId })
}

// Get punchlist items by status
export const getPunchlistItemsByStatus = async (
    status: string,
    additionalFilters: Omit<PunchlistItemFilters, 'status'> = {}
) => {
    return punchlistItemsApi.getPunchlistItems({ ...additionalFilters, status: status as any })
}

// Get overdue punchlist items
export const getOverduePunchlistItems = async (
    additionalFilters: Omit<PunchlistItemFilters, 'isOverdue'> = {}
) => {
    return punchlistItemsApi.getPunchlistItems({ ...additionalFilters, isOverdue: true })
}

// Get punchlist items requiring inspection
export const getPunchlistItemsRequiringInspection = async (
    additionalFilters: Omit<PunchlistItemFilters, 'requiresInspection'> = {}
) => {
    return punchlistItemsApi.getPunchlistItems({ ...additionalFilters, requiresInspection: true })
}