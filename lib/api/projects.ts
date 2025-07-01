// ==============================================
// src/lib/api/projects.ts - Projects API Service
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
                description: response.message || `${data.name} has been created successfully.`,
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
    // UPDATE PROJECT
    // ==============================================
    async updateProject(data: UpdateProjectData): Promise<UpdateProjectResult> {
        try {
            if (!data.id || data.id.length !== 36) {
                throw new ApiError(400, 'Invalid project ID')
            }

            const response = await apiCall<UpdateProjectResult>(`/api/projects/${data.id}`, {
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
    // UTILITY METHODS
    // ==============================================
    
    // Check if project name is available
    async isProjectNameAvailable(name: string): Promise<boolean> {
        try {
            // This would typically be a separate endpoint, but we can use the search functionality
            const response = await this.getProjects({ 
                search: name,
                limit: 1 
            })
            
            // Check if exact match exists
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
    }> {
        try {
            // Get all projects to calculate stats
            const response = await this.getProjects({ limit: 1000 })
            const projects = response.data.projects

            const stats = {
                total: projects.length,
                byStatus: {
                    planning: 0,
                    active: 0,
                    on_hold: 0,
                    completed: 0,
                },
                byPriority: {
                    low: 0,
                    medium: 0,
                    high: 0,
                },
            }

            projects.forEach(project => {
                stats.byStatus[project.status]++
                stats.byPriority[project.priority]++
            })

            return stats
        } catch (error) {
            console.error('Error getting project stats:', error)
            return {
                total: 0,
                byStatus: { planning: 0, active: 0, on_hold: 0, completed: 0 },
                byPriority: { low: 0, medium: 0, high: 0 },
            }
        }
    },
}