// ==============================================
// lib/api/schedule-projects.ts - Complete Schedule Projects API Service
// ==============================================

import { toast } from '@/hooks/use-toast'
import type {
    // Core Types
    ScheduleProject,
    ScheduleProjectSummary,
    ScheduleProjectFilters,

    // Create Types
    CreateScheduleProjectData,
    CreateScheduleProjectResult,

    // Update Types
    UpdateScheduleProjectData,
    UpdateScheduleProjectResult,
    QuickUpdateScheduleStatusData,
    QuickUpdateScheduleStatusResult,

    // Query Types
    GetScheduleProjectsResult,
    GetScheduleProjectResult,
    DeleteScheduleProjectResult,
} from '@/types/schedule-projects'

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

            console.error('Schedule Projects API Error:', {
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
        console.error('Schedule Projects Network Error:', error)
        throw new ApiError(
            0,
            'Network error. Please check your connection and try again.'
        )
    }
}

// ==============================================
// SCHEDULE PROJECTS API SERVICE
// ==============================================
export const scheduleProjectsApi = {
    // ==============================================
    // GET ALL SCHEDULE PROJECTS
    // ==============================================
    async getScheduleProjects(filters: ScheduleProjectFilters = {}): Promise<GetScheduleProjectsResult> {
        try {
            // Build query parameters
            const searchParams = new URLSearchParams()

            if (filters.projectId) searchParams.append('projectId', filters.projectId)
            if (filters.status) searchParams.append('status', filters.status)
            if (filters.priority) searchParams.append('priority', filters.priority)
            if (filters.tradeRequired) searchParams.append('tradeRequired', filters.tradeRequired)
            if (filters.assignedToUserId) searchParams.append('assignedToUserId', filters.assignedToUserId)
            if (filters.startDateFrom) searchParams.append('startDateFrom', filters.startDateFrom)
            if (filters.startDateTo) searchParams.append('startDateTo', filters.startDateTo)
            if (filters.search) searchParams.append('search', filters.search)
            if (filters.sortBy) searchParams.append('sortBy', filters.sortBy)
            if (filters.sortOrder) searchParams.append('sortOrder', filters.sortOrder)
            if (filters.limit) searchParams.append('limit', filters.limit.toString())
            if (filters.offset) searchParams.append('offset', filters.offset.toString())

            const queryString = searchParams.toString()
            const endpoint = `/api/schedule-projects${queryString ? `?${queryString}` : ''}`

            const response = await apiCall<GetScheduleProjectsResult>(endpoint, {
                method: 'GET',
            })

            // Usually we don't show success toasts for GET operations
            // Only show if explicitly provided in response
            if (response.notifications?.message) {
                toast({
                    title: "Info",
                    description: response.notifications.message,
                })
            }

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: "Failed to Load Schedule Projects",
                    description: error.message,
                    variant: "destructive",
                })
                throw error
            }

            const networkError = new ApiError(0, 'Failed to load schedule projects')
            toast({
                title: "Network Error",
                description: "Unable to load schedule projects. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // GET SINGLE SCHEDULE PROJECT
    // ==============================================
    async getScheduleProject(id: string): Promise<GetScheduleProjectResult> {
        try {
            const response = await apiCall<GetScheduleProjectResult>(`/api/schedule-projects/${id}`, {
                method: 'GET',
            })

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
                        title: "Schedule Project Not Found",
                        description: "The requested schedule project could not be found.",
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Failed to Load Schedule Project",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to load schedule project')
            toast({
                title: "Network Error",
                description: "Unable to load schedule project details. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // CREATE SCHEDULE PROJECT
    // ==============================================
    async createScheduleProject(data: CreateScheduleProjectData): Promise<CreateScheduleProjectResult> {
        try {
            const response = await apiCall<CreateScheduleProjectResult>('/api/schedule-projects', {
                method: 'POST',
                body: JSON.stringify(data),
            })

            // Show success toast
            toast({
                title: "Schedule Project Created",
                description: response.message || "The schedule project has been created successfully.",
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
                    console.warn('Schedule project creation validation error:', error.details)
                } else {
                    toast({
                        title: "Failed to Create Schedule Project",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to create schedule project')
            toast({
                title: "Network Error",
                description: "Unable to create schedule project. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // UPDATE SCHEDULE PROJECT
    // ==============================================
    async updateScheduleProject(data: UpdateScheduleProjectData): Promise<UpdateScheduleProjectResult> {
        try {
            const response = await apiCall<UpdateScheduleProjectResult>(`/api/schedule-projects/${data.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            })

            // Show success toast
            toast({
                title: "Schedule Project Updated",
                description: response.message || "The schedule project has been updated successfully.",
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
                    console.warn('Schedule project update validation error:', error.details)
                } else if (error.status === 404) {
                    toast({
                        title: "Schedule Project Not Found",
                        description: "The schedule project you're trying to update could not be found.",
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Failed to Update Schedule Project",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to update schedule project')
            toast({
                title: "Network Error",
                description: "Unable to update schedule project. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // QUICK UPDATE SCHEDULE STATUS
    // ==============================================
    async updateScheduleStatus(data: QuickUpdateScheduleStatusData): Promise<QuickUpdateScheduleStatusResult> {
        try {
            const response = await apiCall<QuickUpdateScheduleStatusResult>(`/api/schedule-projects/${data.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            })

            // Show success toast
            toast({
                title: "Status Updated",
                description: response.message || "The schedule project status has been updated successfully.",
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
                        title: "Schedule Project Not Found",
                        description: "The schedule project you're trying to update could not be found.",
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

            const networkError = new ApiError(0, 'Failed to update schedule project status')
            toast({
                title: "Network Error",
                description: "Unable to update status. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // DELETE SCHEDULE PROJECT
    // ==============================================
    async deleteScheduleProject(id: string): Promise<DeleteScheduleProjectResult> {
        try {
            const response = await apiCall<DeleteScheduleProjectResult>(`/api/schedule-projects/${id}`, {
                method: 'DELETE',
            })

            // Show success toast
            toast({
                title: "Schedule Project Deleted",
                description: response.message || "The schedule project has been deleted successfully.",
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
                        title: "Schedule Project Not Found",
                        description: "The schedule project you're trying to delete could not be found.",
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Failed to Delete Schedule Project",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to delete schedule project')
            toast({
                title: "Network Error",
                description: "Unable to delete schedule project. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },
}

// ==============================================
// EXPORT FOR CONVENIENCE
// ==============================================
export default scheduleProjectsApi