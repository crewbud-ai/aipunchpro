// ==============================================
// src/lib/api/team-members.ts - Complete Team Members API Service
// ==============================================

import { toast } from '@/hooks/use-toast'
import type {
    // Core Types
    TeamMember,
    TeamMemberSummary,
    TeamMemberFilters,

    // Create Types
    CreateTeamMemberData,
    CreateTeamMemberResult,

    // Update Types
    UpdateTeamMemberData,
    UpdateTeamMemberResult,
    UpdateTeamMemberStatusData,
    UpdateTeamMemberStatusResult,

    // Query Types
    GetTeamMembersResult,
    GetTeamMemberResult,
    DeleteTeamMemberResult,
} from '@/types/team-members'

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

            console.error('Team Members API Error:', {
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
        console.error('Team Members Network Error:', error)
        throw new ApiError(
            0,
            'Network error. Please check your connection and try again.'
        )
    }
}

// ==============================================
// TEAM MEMBERS API SERVICE
// ==============================================
export const teamMembersApi = {
    // ==============================================
    // GET ALL TEAM MEMBERS
    // ==============================================
    async getTeamMembers(filters: TeamMemberFilters = {}): Promise<GetTeamMembersResult> {
        try {
            // Build query parameters
            const searchParams = new URLSearchParams()

            if (filters.role) searchParams.append('role', filters.role)
            if (filters.status) searchParams.append('status', filters.status)
            if (filters.assignmentStatus) searchParams.append('assignmentStatus', filters.assignmentStatus)
            if (filters.tradeSpecialty) searchParams.append('tradeSpecialty', filters.tradeSpecialty)
            if (filters.projectId) searchParams.append('projectId', filters.projectId)
            if (filters.search) searchParams.append('search', filters.search)
            if (filters.sortBy) searchParams.append('sortBy', filters.sortBy)
            if (filters.sortOrder) searchParams.append('sortOrder', filters.sortOrder)
            if (filters.limit) searchParams.append('limit', filters.limit.toString())
            if (filters.offset) searchParams.append('offset', filters.offset.toString())

            const queryString = searchParams.toString()
            const endpoint = `/api/team-members${queryString ? `?${queryString}` : ''}`

            const response = await apiCall<GetTeamMembersResult>(endpoint, {
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
                    title: "Failed to Load Team Members",
                    description: error.message,
                    variant: "destructive",
                })
                throw error
            }

            const networkError = new ApiError(0, 'Failed to load team members')
            toast({
                title: "Network Error",
                description: "Unable to load team members. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // GET SINGLE TEAM MEMBER
    // ==============================================
    async getTeamMember(id: string): Promise<GetTeamMemberResult> {
        try {
            if (!id || id.length !== 36) {
                throw new ApiError(400, 'Invalid team member ID')
            }

            const response = await apiCall<GetTeamMemberResult>(`/api/team-members/${id}`, {
                method: 'GET',
            })

            // Show additional notification if provided
            if (response.notifications?.message) {
                toast({
                    title: "Info",
                    description: response.notifications.message,
                })
            }

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                // Handle not found error
                if (error.status === 404) {
                    toast({
                        title: "Team Member Not Found",
                        description: error.message,
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Failed to Load Team Member",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to load team member')
            toast({
                title: "Network Error",
                description: "Unable to load team member details. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // CREATE TEAM MEMBER
    // ==============================================
    async createTeamMember(data: CreateTeamMemberData): Promise<CreateTeamMemberResult> {
        try {
            const response = await apiCall<CreateTeamMemberResult>('/api/team-members', {
                method: 'POST',
                body: JSON.stringify(data),
            })

            // Show success toast
            toast({
                title: "Team Member Added",
                description: response.message || "Team member has been added successfully.",
            })

            // Show additional notification if provided
            if (response.notifications?.message) {
                toast({
                    title: "Email Notification",
                    description: response.notifications.message,
                })
            }

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                // Handle validation errors
                if (error.status === 400 && error.details) {
                    toast({
                        title: "Validation Error",
                        description: "Please check the form for errors and try again.",
                        variant: "destructive",
                    })
                }
                // Handle duplicate email error
                else if (error.status === 409) {
                    toast({
                        title: "Email Already Exists",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                // Handle other API errors
                else {
                    toast({
                        title: "Failed to Add Team Member",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to create team member')
            toast({
                title: "Network Error",
                description: "Unable to add team member. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // UPDATE TEAM MEMBER (with proper ID handling)
    // ==============================================
    async updateTeamMember(id: string, updates: Partial<UpdateTeamMemberData>): Promise<UpdateTeamMemberResult> {
        try {
            if (!id || id.length !== 36) {
                throw new ApiError(400, 'Invalid team member ID')
            }

            // Ensure the ID is included in the updates
            const data: UpdateTeamMemberData = {
                id,
                ...updates
            }

            const response = await apiCall<UpdateTeamMemberResult>(`/api/team-members/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            })

            // Show success toast
            toast({
                title: "Team Member Updated",
                description: response.message || "Team member has been updated successfully.",
            })

            // Show additional notification if provided
            if (response.notifications?.message) {
                toast({
                    title: "Info",
                    description: response.notifications.message,
                })
            }

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                // Handle validation errors
                if (error.status === 400 && error.details) {
                    toast({
                        title: "Validation Error",
                        description: "Please check the form for errors and try again.",
                        variant: "destructive",
                    })
                }
                // Handle duplicate email error
                else if (error.status === 409) {
                    toast({
                        title: "Email Already Exists",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                // Handle not found error
                else if (error.status === 404) {
                    toast({
                        title: "Team Member Not Found",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                // Handle other API errors
                else {
                    toast({
                        title: "Failed to Update Team Member",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to update team member')
            toast({
                title: "Network Error",
                description: "Unable to update team member. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },



    // ==============================================
    // UPDATE TEAM MEMBER STATUS (activate/deactivate)
    // ==============================================
    async updateTeamMemberStatus(data: UpdateTeamMemberStatusData): Promise<UpdateTeamMemberStatusResult> {
        try {
            if (!data.id || data.id.length !== 36) {
                throw new ApiError(400, 'Invalid team member ID')
            }

            const response = await apiCall<UpdateTeamMemberStatusResult>(`/api/team-members/${data.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            })

            // Show success toast
            const statusText = data.isActive ? 'activated' : 'deactivated'
            toast({
                title: "Status Updated",
                description: `Team member has been ${statusText} successfully.`,
            })

            // Show additional notification if provided
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
                    title: "Status Update Failed",
                    description: error.message,
                    variant: "destructive",
                })
                throw error
            }

            const networkError = new ApiError(0, 'Failed to update team member status')
            toast({
                title: "Network Error",
                description: "Unable to update team member status. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // DELETE TEAM MEMBER (deactivate)
    // ==============================================
    async deleteTeamMember(id: string): Promise<DeleteTeamMemberResult> {
        try {
            if (!id || id.length !== 36) {
                throw new ApiError(400, 'Invalid team member ID')
            }

            const response = await apiCall<DeleteTeamMemberResult>(`/api/team-members/${id}`, {
                method: 'DELETE',
            })

            // Show success toast
            toast({
                title: "Team Member Removed",
                description: response.message || "Team member has been deactivated successfully.",
            })

            // Show additional notification if provided
            if (response.notifications?.message) {
                toast({
                    title: "Info",
                    description: response.notifications.message,
                })
            }

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                // Handle not found error
                if (error.status === 404) {
                    toast({
                        title: "Team Member Not Found",
                        description: error.message,
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Failed to Remove Team Member",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to remove team member')
            toast({
                title: "Network Error",
                description: "Unable to remove team member. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // CHECK EMAIL AVAILABILITY
    // ==============================================
    async checkEmailAvailability(email: string, excludeId?: string): Promise<{ available: boolean }> {
        try {
            const searchParams = new URLSearchParams()
            searchParams.append('email', email)
            if (excludeId) {
                searchParams.append('excludeId', excludeId)
            }

            const response = await apiCall<{ available: boolean }>(`/api/team-members/check-email?${searchParams.toString()}`, {
                method: 'GET',
            })

            return response

        } catch (error) {
            // For email checking, we don't want to show error toasts
            // Just return unavailable and let the form handle it
            return { available: false }
        }
    },

    // ==============================================
    // TEAM MEMBER STATISTICS
    // ==============================================
    async getTeamMemberStats(): Promise<{
        success: boolean
        data: {
            totalMembers: number
            activeMembers: number
            inactiveMembers: number
            assignedMembers: number
            unassignedMembers: number
            membersByRole: Array<{ role: string; count: number }>
            membersByTrade: Array<{ trade: string; count: number }>
            averageHourlyRate?: number
            recentlyAdded: number
        }
    }> {
        try {
            const response = await apiCall<{
                success: boolean
                data: {
                    totalMembers: number
                    activeMembers: number
                    inactiveMembers: number
                    assignedMembers: number
                    unassignedMembers: number
                    membersByRole: Array<{ role: string; count: number }>
                    membersByTrade: Array<{ trade: string; count: number }>
                    averageHourlyRate?: number
                    recentlyAdded: number
                }
            }>('/api/team-members/stats', {
                method: 'GET',
            })

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: "Failed to Load Statistics",
                    description: error.message,
                    variant: "destructive",
                })
                throw error
            }

            const networkError = new ApiError(0, 'Failed to load team member statistics')
            toast({
                title: "Network Error",
                description: "Unable to load statistics. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },
}