// ==============================================
// src/lib/api/projects.ts - Complete Projects API Service
// ==============================================

import { toast } from '@/hooks/use-toast'
import type {
    // Core Types
    Project,
    ProjectSummary,
    ProjectFilters,

    // Create Types
    CreateProjectData,
    CreateProjectResult,

    // Update Types
    UpdateProjectData,
    UpdateProjectResult,

    // Query Types
    GetProjectsResult,
    GetProjectResult,
    DeleteProjectResult,

    // Location Types
    LocationSuggestion,
    PlacesAutocompleteResponse,
    PlacesDetailsResponse,
    LocationDetails,
} from '@/types/projects'

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

            console.error('Projects API Error:', {
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
        console.error('Projects Network Error:', error)
        throw new ApiError(
            0,
            'Network error. Please check your connection and try again.'
        )
    }
}

// ==============================================
// PROJECTS API SERVICE
// ==============================================
export const projectsApi = {
    // ==============================================
    // GET ALL PROJECTS
    // ==============================================
    async getProjects(filters: ProjectFilters = {}): Promise<GetProjectsResult> {
        try {
            // Build query parameters
            const searchParams = new URLSearchParams()

            if (filters.status) searchParams.append('status', filters.status)
            if (filters.priority) searchParams.append('priority', filters.priority)
            if (filters.search) searchParams.append('search', filters.search)
            if (filters.location) searchParams.append('location', filters.location)
            if (filters.client) searchParams.append('client', filters.client)
            if (filters.managerId) searchParams.append('managerId', filters.managerId)
            if (filters.sortBy) searchParams.append('sortBy', filters.sortBy)
            if (filters.sortOrder) searchParams.append('sortOrder', filters.sortOrder)
            if (filters.limit) searchParams.append('limit', filters.limit.toString())
            if (filters.offset) searchParams.append('offset', filters.offset.toString())

            const queryString = searchParams.toString()
            const endpoint = `/api/projects${queryString ? `?${queryString}` : ''}`

            const response = await apiCall<GetProjectsResult>(endpoint, {
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
                    title: "Failed to Load Projects",
                    description: error.message,
                    variant: "destructive",
                })
                throw error
            }

            const networkError = new ApiError(0, 'Failed to load projects')
            toast({
                title: "Network Error",
                description: "Unable to load projects. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // GET SINGLE PROJECT
    // ==============================================
    async getProject(id: string): Promise<GetProjectResult> {
        try {
            if (!id || id.length !== 36) {
                throw new ApiError(400, 'Invalid project ID')
            }

            const response = await apiCall<GetProjectResult>(`/api/projects/${id}`, {
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
                if (error.status === 404) {
                    toast({
                        title: "Project Not Found",
                        description: "The requested project could not be found.",
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Failed to Load Project",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to load project')
            toast({
                title: "Network Error",
                description: "Unable to load project details. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // CREATE PROJECT
    // ==============================================
    async createProject(data: CreateProjectData): Promise<CreateProjectResult> {
        try {
            const response = await apiCall<CreateProjectResult>('/api/projects', {
                method: 'POST',
                body: JSON.stringify(data),
            })

            // Show success toast
            toast({
                title: "Project Created",
                description: response.message || "Project has been created successfully.",
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
                // Handle duplicate name error
                else if (error.status === 409) {
                    toast({
                        title: "Project Name Exists",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                // Handle other API errors
                else {
                    toast({
                        title: "Failed to Create Project",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to create project')
            toast({
                title: "Network Error",
                description: "Unable to create project. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // UPDATE PROJECT (with proper ID handling)
    // ==============================================
    async updateProject(id: string, updates: Partial<UpdateProjectData>): Promise<UpdateProjectResult> {
        try {
            if (!id || id.length !== 36) {
                throw new ApiError(400, 'Invalid project ID')
            }

            // Ensure the ID is included in the updates
            const data: UpdateProjectData = {
                id,
                ...updates
            }

            const response = await apiCall<UpdateProjectResult>(`/api/projects/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            })

            // Show success toast
            toast({
                title: "Project Updated",
                description: response.message || "Project has been updated successfully.",
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
                // Handle not found error
                else if (error.status === 404) {
                    toast({
                        title: "Project Not Found",
                        description: "The project you're trying to update could not be found.",
                        variant: "destructive",
                    })
                }
                // Handle duplicate name error
                else if (error.status === 409) {
                    toast({
                        title: "Project Name Exists",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                // Handle other API errors
                else {
                    toast({
                        title: "Failed to Update Project",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to update project')
            toast({
                title: "Network Error",
                description: "Unable to update project. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // DELETE PROJECT
    // ==============================================
    async deleteProject(id: string): Promise<DeleteProjectResult> {
        try {
            if (!id || id.length !== 36) {
                throw new ApiError(400, 'Invalid project ID')
            }

            const response = await apiCall<DeleteProjectResult>(`/api/projects/${id}`, {
                method: 'DELETE',
            })

            // Show success toast
            toast({
                title: "Project Deleted",
                description: response.message || "Project has been deleted successfully.",
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
                        title: "Project Not Found",
                        description: "The project you're trying to delete could not be found.",
                        variant: "destructive",
                    })
                }
                // Handle dependency error (e.g., project has tasks)
                else if (error.status === 409) {
                    toast({
                        title: "Cannot Delete Project",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                // Handle other API errors
                else {
                    toast({
                        title: "Failed to Delete Project",
                        description: error.message,
                        variant: "destructive",
                    })
                }
                throw error
            }

            const networkError = new ApiError(0, 'Failed to delete project')
            toast({
                title: "Network Error",
                description: "Unable to delete project. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // PLACES API INTEGRATION
    // ==============================================

    // Get location suggestions
    async getLocationSuggestions(query: string): Promise<PlacesAutocompleteResponse> {
        try {
            if (query.length < 3) {
                return {
                    success: true,
                    suggestions: [],
                    message: 'Query too short'
                }
            }

            const response = await apiCall<PlacesAutocompleteResponse>(
                `/api/places/autocomplete?input=${encodeURIComponent(query)}`,
                { method: 'GET' }
            )

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                console.error('Location suggestions error:', error)
                // Don't show toast for location suggestions - handle in UI
                throw error
            }

            throw new ApiError(0, 'Failed to get location suggestions')
        }
    },

    // Get location details
    async getLocationDetails(placeId: string): Promise<PlacesDetailsResponse> {
        try {
            const response = await apiCall<PlacesDetailsResponse>(
                '/api/places/details',
                {
                    method: 'POST',
                    body: JSON.stringify({ place_id: placeId }),
                }
            )

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                console.error('Location details error:', error)
                throw error
            }

            throw new ApiError(0, 'Failed to get location details')
        }
    },


    // ==============================================
    // FREE PLACES API INTEGRATION (Nominatim)
    // ==============================================

    // Get location suggestions using free Nominatim API
    async getLocationSuggestionsFree(query: string): Promise<PlacesAutocompleteResponse> {
        try {
            if (query.length < 3) {
                return {
                    success: true,
                    suggestions: [],
                    message: 'Query too short'
                }
            }

            const response = await apiCall<PlacesAutocompleteResponse>(
                `/api/places/autocomplete-free?input=${encodeURIComponent(query)}`,
                { method: 'GET' }
            )

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                console.error('Free location suggestions error:', error)
                // Don't show toast for location suggestions - handle in UI
                throw error
            }

            throw new ApiError(0, 'Failed to get location suggestions')
        }
    },

    // Get location details for free version (simplified since coordinates come with suggestions)
    async getLocationDetailsFree(placeId: string): Promise<PlacesDetailsResponse> {
        try {
            // For Nominatim, we often don't need a separate details call since coordinates 
            // are included in the autocomplete response. This method is mainly for 
            // compatibility with the existing hook structure.

            // Extract the actual place_id (remove nominatim_ prefix if present)
            const actualPlaceId = placeId.replace('nominatim_', '')

            // Make a reverse geocoding call to get full details if needed
            const nominatimResponse = await fetch(
                `https://nominatim.openstreetmap.org/details.php?place_id=${actualPlaceId}&format=json&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'ProjectManagementApp/1.0 (Contact: dev@yourcompany.com)'
                    }
                }
            )

            if (!nominatimResponse.ok) {
                throw new Error('Failed to get location details from Nominatim')
            }

            const data = await nominatimResponse.json()

            // Transform to expected format with proper type casting
            const place: LocationDetails = {
                place_id: placeId,
                name: (data.localname || data.names?.name || data.addresstags?.name || 'Unknown location') as string,
                formatted_address: data.addresstags ?
                    [
                        data.addresstags['addr:housenumber'],
                        data.addresstags['addr:street'],
                        data.addresstags['addr:city'],
                        data.addresstags['addr:state'],
                        data.addresstags['addr:postcode']
                    ].filter(Boolean).join(', ') :
                    `${data.lat}, ${data.lon}`,
                geometry: {
                    location: {
                        lat: parseFloat(data.lat),
                        lng: parseFloat(data.lon)
                    }
                },
                address_components: data.addresstags ?
                    Object.entries(data.addresstags).map(([key, value]) => ({
                        long_name: String(value || ''), // Cast to string
                        short_name: String(value || ''), // Cast to string  
                        types: [key]
                    })) : []
            }

            return {
                success: true,
                place,
                message: 'Location details retrieved successfully'
            }

        } catch (error) {
            console.error('Free location details error:', error)

            // Return a fallback response - better than failing completely
            return {
                success: true, // Still return success so the UI doesn't break
                place: {
                    place_id: placeId,
                    name: 'Selected Location',
                    formatted_address: 'Location selected (details not available)',
                    geometry: {
                        location: { lat: 0, lng: 0 }
                    },
                    address_components: []
                },
                message: 'Location selected, detailed information not available'
            }
        }
    },

    // ==============================================
    // PROJECT NUMBER GENERATION
    // ==============================================
    async getNextProjectNumber(): Promise<{ success: boolean; projectNumber?: string; message?: string }> {
        try {
            const response = await apiCall<{ success: boolean; projectNumber: string; message: string }>('/api/projects/next-number', {
                method: 'GET',
            })

            return response
        } catch (error) {
            if (error instanceof ApiError) {
                console.error('Project number generation error:', error)
                return {
                    success: false,
                    message: error.message || 'Failed to generate project number'
                }
            }

            return {
                success: false,
                message: 'Failed to generate project number'
            }
        }
    },

    // ==============================================
    // UTILITY METHODS
    // ==============================================

    // Check if project name is available
    async isProjectNameAvailable(name: string): Promise<boolean> {
        try {
            // Use the search functionality to check for exact matches
            const response = await this.getProjects({
                search: name,
                limit: 1
            })

            // Check if exact match exists (case-insensitive)
            const exactMatch = response.data.projects.find(
                project => project.name.toLowerCase() === name.toLowerCase()
            )

            return !exactMatch
        } catch (error) {
            // If there's an error checking availability, assume it's not available for safety
            console.error('Error checking project name availability:', error)
            return false
        }
    },

    // Get project summary stats
    async getProjectStats(): Promise<{
        total: number
        byStatus: Record<string, number>
        byPriority: Record<string, number>
        totalBudget: number
        totalSpent: number
        averageProgress: number
        activeProjects: number
        upcomingDeadlines: number
    }> {
        try {
            // Get all projects to calculate stats
            const response = await this.getProjects({ limit: 1000 })
            const projects = response.data.projects

            const stats = {
                total: projects.length,
                byStatus: {
                    not_started: 0,
                    in_progress: 0,
                    on_track: 0,
                    ahead_of_schedule: 0,
                    behind_schedule: 0,
                    on_hold: 0,
                    completed: 0,
                    cancelled: 0,
                },
                byPriority: {
                    low: 0,
                    medium: 0,
                    high: 0,
                    urgent: 0,
                },
                totalBudget: 0,
                totalSpent: 0,
                averageProgress: 0,
                activeProjects: 0,
                upcomingDeadlines: 0,
            }

            let totalProgress = 0
            const now = new Date()
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

            projects.forEach(project => {
                // Count by status
                if (stats.byStatus[project.status] !== undefined) {
                    stats.byStatus[project.status]++
                }

                // Count by priority
                if (stats.byPriority[project.priority] !== undefined) {
                    stats.byPriority[project.priority]++
                }

                // Sum budget and spent
                stats.totalBudget += project.budget || 0
                stats.totalSpent += project.spent || 0

                // Calculate progress
                totalProgress += project.progress || 0

                // Count active projects
                if (['in_progress', 'on_track', 'ahead_of_schedule', 'behind_schedule'].includes(project.status)) {
                    stats.activeProjects++
                }

                // Count upcoming deadlines
                if (project.endDate) {
                    const deadline = new Date(project.endDate)
                    if (deadline >= now && deadline <= nextWeek) {
                        stats.upcomingDeadlines++
                    }
                }
            })

            // Calculate average progress
            stats.averageProgress = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0

            return stats
        } catch (error) {
            console.error('Error getting project stats:', error)
            return {
                total: 0,
                byStatus: {
                    not_started: 0,
                    in_progress: 0,
                    on_track: 0,
                    ahead_of_schedule: 0,
                    behind_schedule: 0,
                    on_hold: 0,
                    completed: 0,
                    cancelled: 0,
                },
                byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
                totalBudget: 0,
                totalSpent: 0,
                averageProgress: 0,
                activeProjects: 0,
                upcomingDeadlines: 0,
            }
        }
    },

    // ==============================================
    // CONVENIENCE METHODS FOR QUICK UPDATES
    // ==============================================

    // Update just the project status
    async updateProjectStatus(id: string, status: Project['status'], notes?: string): Promise<UpdateProjectResult> {
        return this.updateProject(id, { status })
    },

    // Update just the project progress
    async updateProjectProgress(id: string, progress: number, notes?: string): Promise<UpdateProjectResult> {
        return this.updateProject(id, { progress })
    },

    // Update just the project priority
    async updateProjectPriority(id: string, priority: Project['priority']): Promise<UpdateProjectResult> {
        return this.updateProject(id, { priority })
    },
}