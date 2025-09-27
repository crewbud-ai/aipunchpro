// ==============================================
// lib/api/time-entries.ts - Time Entries API Client
// ==============================================

import { toast } from '@/hooks/use-toast'
import type {
  ClockInData,
  ClockOutData,
  ClockInResult,
  ClockOutResult,
  GetCurrentSessionResult,
  GetClockInOptionsResult,
  CreateTimeEntryData,
  CreateTimeEntryResult,
  GetTimeEntriesResult,
  GetTimeEntryResult,
  TimeEntryFilters
} from '@/types/time-tracking'

import type {
  UpdateTimeEntryInput,
  QuickUpdateTimeEntryStatusInput
} from '@/lib/validations/time-tracking/time-entries'


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
      const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`
      const errorDetails = data.details || []

      console.error('Time Entries API Error:', {
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

    console.error('Network Error:', error)
    throw new ApiError(
      0,
      'Network error. Please check your connection and try again.'
    )
  }
}

// ==============================================
// TIME ENTRIES API CLASS
// ==============================================
export class TimeEntriesApi {
  // ==============================================
  // CLOCK IN/OUT OPERATIONS
  // ==============================================

  /**
   * Clock in user to a project/schedule project
   */
  static async clockIn(data: ClockInData): Promise<ClockInResult> {
    try {
      const result = await apiCall<ClockInResult>('/api/time-entries/clock-in', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      // Show success toast
      toast({
        title: 'Clocked In Successfully',
        description: result.message,
      })

      return result
    } catch (error) {
      if (error instanceof ApiError) {
        // Show error toast
        toast({
          title: 'Clock In Failed',
          description: error.message,
          variant: 'destructive',
        })
      }
      throw error
    }
  }

  /**
   * Clock out user from current session
   */
  static async clockOut(data: ClockOutData): Promise<ClockOutResult> {
    try {
      const result = await apiCall<ClockOutResult>('/api/time-entries/clock-out', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      // Show success toast
      toast({
        title: 'Clocked Out Successfully',
        description: result.message,
      })

      return result
    } catch (error) {
      if (error instanceof ApiError) {
        // Show error toast
        toast({
          title: 'Clock Out Failed',
          description: error.message,
          variant: 'destructive',
        })
      }
      throw error
    }
  }

  /**
   * Get current active session
   */
  static async getCurrentSession(): Promise<GetCurrentSessionResult> {
    try {
      return await apiCall<GetCurrentSessionResult>('/api/time-entries/current-session')
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Failed to get current session:', error.message)
      }
      throw error
    }
  }

  /**
   * Get clock in options (available projects and schedule projects)
   */
  static async getClockInOptions(): Promise<GetClockInOptionsResult> {
    try {
      return await apiCall<GetClockInOptionsResult>('/api/time-entries/clock-in-options')
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Failed to Load Options',
          description: 'Could not load available projects.',
          variant: 'destructive',
        })
      }
      throw error
    }
  }

  /**
   * Force end session (admin only)
   */
  static async forceEndSession(userId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const url = userId 
        ? `/api/time-entries/current-session?userId=${userId}`
        : '/api/time-entries/current-session'

      const result = await apiCall<{ success: boolean; message: string }>(url, {
        method: 'DELETE',
      })

      toast({
        title: 'Session Ended',
        description: result.message,
      })

      return result
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Failed to End Session',
          description: error.message,
          variant: 'destructive',
        })
      }
      throw error
    }
  }

  // ==============================================
  // TIME ENTRIES CRUD OPERATIONS
  // ==============================================

  /**
   * Get list of time entries with filtering
   */
  static async getTimeEntries(filters: Partial<TimeEntryFilters> = {}): Promise<GetTimeEntriesResult> {
    try {
      const queryParams = new URLSearchParams()
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })

      const url = `/api/time-entries${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      return await apiCall<GetTimeEntriesResult>(url)
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Failed to Load Time Entries',
          description: error.message,
          variant: 'destructive',
        })
      }
      throw error
    }
  }

  /**
   * Get single time entry by ID
   */
  static async getTimeEntry(timeEntryId: string): Promise<GetTimeEntryResult> {
    try {
      return await apiCall<GetTimeEntryResult>(`/api/time-entries/${timeEntryId}`)
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Failed to Load Time Entry',
          description: error.message,
          variant: 'destructive',
        })
      }
      throw error
    }
  }

  /**
   * Create manual time entry
   */
  static async createTimeEntry(data: CreateTimeEntryData): Promise<CreateTimeEntryResult> {
    try {
      const result = await apiCall<CreateTimeEntryResult>('/api/time-entries', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      toast({
        title: 'Time Entry Created',
        description: 'Time entry has been created successfully.',
      })

      return result
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Failed to Create Time Entry',
          description: error.message,
          variant: 'destructive',
        })
      }
      throw error
    }
  }

  /**
   * Update time entry
   */
  static async updateTimeEntry(timeEntryId: string, data: UpdateTimeEntryInput): Promise<CreateTimeEntryResult> {
    try {
      const result = await apiCall<CreateTimeEntryResult>(`/api/time-entries/${timeEntryId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })

      toast({
        title: 'Time Entry Updated',
        description: 'Time entry has been updated successfully.',
      })

      return result
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Failed to Update Time Entry',
          description: error.message,
          variant: 'destructive',
        })
      }
      throw error
    }
  }

  /**
   * Quick update time entry status (for approvals)
   */
  static async updateTimeEntryStatus(data: QuickUpdateTimeEntryStatusInput): Promise<CreateTimeEntryResult> {
    try {
      const result = await apiCall<CreateTimeEntryResult>(`/api/time-entries/${data.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })

      const statusMessage = data.status === 'approved' ? 'approved' : 
                           data.status === 'rejected' ? 'rejected' : 'updated'

      toast({
        title: 'Status Updated',
        description: `Time entry has been ${statusMessage}.`,
      })

      return result
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Failed to Update Status',
          description: error.message,
          variant: 'destructive',
        })
      }
      throw error
    }
  }

  /**
   * Delete time entry
   */
  static async deleteTimeEntry(timeEntryId: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await apiCall<{ success: boolean; message: string }>(`/api/time-entries/${timeEntryId}`, {
        method: 'DELETE',
      })

      toast({
        title: 'Time Entry Deleted',
        description: 'Time entry has been deleted successfully.',
      })

      return result
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Failed to Delete Time Entry',
          description: error.message,
          variant: 'destructive',
        })
      }
      throw error
    }
  }

  // ==============================================
  // CONVENIENCE METHODS
  // ==============================================

  /**
   * Get today's time entries for current user
   */
  static async getTodaysTimeEntries(): Promise<GetTimeEntriesResult> {
    const today = new Date().toISOString().split('T')[0]
    
    return this.getTimeEntries({
      dateFrom: today,
      dateTo: today,
      sortBy: 'startTime',
      sortOrder: 'asc'
    })
  }

  /**
   * Get pending time entries (need approval)
   */
  static async getPendingTimeEntries(): Promise<GetTimeEntriesResult> {
    return this.getTimeEntries({
      status: 'pending',
      sortBy: 'date',
      sortOrder: 'desc'
    })
  }

  /**
   * Get active time entries (currently clocked in)
   */
  static async getActiveTimeEntries(): Promise<GetTimeEntriesResult> {
    return this.getTimeEntries({
      status: 'clocked_in',
      sortBy: 'startTime',
      sortOrder: 'asc'
    })
  }

  /**
   * Get time entries for specific user
   */
  static async getUserTimeEntries(userId: string, dateFrom?: string, dateTo?: string): Promise<GetTimeEntriesResult> {
    return this.getTimeEntries({
      userId,
      dateFrom,
      dateTo,
      sortBy: 'date',
      sortOrder: 'desc'
    })
  }

  /**
   * Get time entries for specific project
   */
  static async getProjectTimeEntries(projectId: string, dateFrom?: string, dateTo?: string): Promise<GetTimeEntriesResult> {
    return this.getTimeEntries({
      projectId,
      dateFrom,
      dateTo,
      sortBy: 'date',
      sortOrder: 'desc'
    })
  }

  // ==============================================
  // BULK OPERATIONS
  // ==============================================

  /**
   * Bulk approve time entries
   */
  static async bulkApproveTimeEntries(timeEntryIds: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const result = await apiCall<{ success: boolean; message: string }>('/api/time-entries/bulk-approve', {
        method: 'POST',
        body: JSON.stringify({ timeEntryIds }),
      })

      toast({
        title: 'Time Entries Approved',
        description: `${timeEntryIds.length} time entries have been approved.`,
      })

      return result
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Bulk Approval Failed',
          description: error.message,
          variant: 'destructive',
        })
      }
      throw error
    }
  }

  /**
   * Export time entries to CSV
   */
  static async exportTimeEntries(filters: Partial<TimeEntryFilters> = {}): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams()
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })

      const url = `/api/time-entries/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()

      toast({
        title: 'Export Successful',
        description: 'Time entries have been exported successfully.',
      })

      return blob
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export time entries.',
        variant: 'destructive',
      })
      throw error
    }
  }
}

// ==============================================
// EXPORT DEFAULT API INSTANCE
// ==============================================
export const timeEntriesApi = TimeEntriesApi

// ==============================================
// ADDITIONAL EXPORTS
// ==============================================
export { ApiError }
export type { ClockInData, ClockOutData, CreateTimeEntryData, TimeEntryFilters }