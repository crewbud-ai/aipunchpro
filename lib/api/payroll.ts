// ==============================================
// lib/api/reports/payroll.ts - Payroll Reports API Client
// ==============================================

import { toast } from '@/hooks/use-toast'
import type {
    PayrollReportFilters,
    GetPayrollReportResult,
    GetPayrollStatsResult,
    ExportPayrollCSVResult,
} from '@/types/reports'

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

        console.log(data, 'Data')
        console.log(response.ok, 'response')

        if (!response.ok) {
            // Create detailed error based on response structure
            const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`
            const errorDetails = data.details || []

            console.error('Payroll Reports API Error:', {
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
        console.error('Payroll Reports Network Error:', error)
        throw new ApiError(
            0,
            'Network error. Please check your connection and try again.'
        )
    }
}

// ==============================================
// PAYROLL REPORTS API SERVICE
// ==============================================
export const payrollReportsApi = {
    // ==============================================
    // GET PAYROLL REPORT
    // ==============================================
    async getPayrollReport(
        filters: PayrollReportFilters
    ): Promise<GetPayrollReportResult> {
        try {
            // Build query parameters
            const searchParams = new URLSearchParams()

            searchParams.append('startDate', filters.startDate)
            searchParams.append('endDate', filters.endDate)

            if (filters.projectId) {
                searchParams.append('projectId', filters.projectId)
            }

            if (filters.userId) {
                searchParams.append('userId', filters.userId)
            }

            if (filters.status && filters.status !== 'all') {
                searchParams.append('status', filters.status)
            }

            if (filters.includeNotes !== undefined) {
                searchParams.append('includeNotes', String(filters.includeNotes))
            }

            if (filters.includeDetailedEntries !== undefined) {
                searchParams.append('includeDetailedEntries', String(filters.includeDetailedEntries))
            }

            const queryString = searchParams.toString()
            const endpoint = `/api/reports/payroll${queryString ? `?${queryString}` : ''}`

            const response = await apiCall<GetPayrollReportResult>(endpoint, {
                method: 'GET',
            })

            // Success toast
            toast({
                title: "Report Generated",
                description: "Payroll report has been generated successfully.",
            })

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: "Failed to Generate Report",
                    description: error.message,
                    variant: "destructive",
                })
                throw error
            }

            const networkError = new ApiError(0, 'Failed to generate payroll report')
            toast({
                title: "Network Error",
                description: "Unable to generate report. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // EXPORT PAYROLL CSV
    // ==============================================
    async exportPayrollCSV(
        filters: PayrollReportFilters,
        filename?: string
    ): Promise<ExportPayrollCSVResult> {
        try {
            const requestBody = {
                startDate: filters.startDate,
                endDate: filters.endDate,
                projectId: filters.projectId,
                userId: filters.userId,
                status: filters.status,
                includeNotes: filters.includeNotes ?? true,
                includeDetailedEntries: filters.includeDetailedEntries ?? true,
                filename: filename || `payroll-report-${filters.startDate}-to-${filters.endDate}`
            }

            const endpoint = `/api/reports/payroll/export`
            const url = `${API_BASE_URL}${endpoint}`

            // FIXED: Don't parse as JSON, handle as blob/text
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            })

            // Check if response is successful
            if (!response.ok) {
                // Try to parse error as JSON
                try {
                    const errorData = await response.json()
                    throw new ApiError(
                        response.status,
                        errorData.message || errorData.error || 'Failed to export CSV',
                        errorData.details
                    )
                } catch (e) {
                    // If JSON parsing fails, use status text
                    throw new ApiError(
                        response.status,
                        `Failed to export CSV: ${response.statusText}`
                    )
                }
            }

            // FIXED: Get the CSV content as text (not JSON)
            const csvContent = await response.text()

            // Create a blob and download it
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const downloadUrl = window.URL.createObjectURL(blob)

            link.href = downloadUrl
            link.download = `${requestBody.filename}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)

            // Success toast
            toast({
                title: "Export Successful",
                description: "Payroll report has been exported to CSV.",
            })

            return {
                success: true,
                message: 'CSV exported successfully',
                data: {
                    filename: `${requestBody.filename}.csv`
                }
            }

        } catch (error) {
            if (error instanceof ApiError) {
                toast({
                    title: "Failed to Export CSV",
                    description: error.message,
                    variant: "destructive",
                })
                throw error
            }

            const networkError = new ApiError(0, 'Failed to export payroll CSV')
            toast({
                title: "Export Failed",
                description: "Unable to export CSV. Please try again.",
                variant: "destructive",
            })
            throw networkError
        }
    },

    // ==============================================
    // GET PAYROLL STATS (For Dashboard)
    // ==============================================
    async getPayrollStats(
        filters?: { projectId?: string; userId?: string }
    ): Promise<GetPayrollStatsResult> {
        try {
            // Build query parameters
            const searchParams = new URLSearchParams()

            if (filters?.projectId) {
                searchParams.append('projectId', filters.projectId)
            }

            if (filters?.userId) {
                searchParams.append('userId', filters.userId)
            }

            const queryString = searchParams.toString()
            const endpoint = `/api/reports/payroll/stats${queryString ? `?${queryString}` : ''}`

            const response = await apiCall<GetPayrollStatsResult>(endpoint, {
                method: 'GET',
            })

            return response

        } catch (error) {
            if (error instanceof ApiError) {
                console.error('Failed to fetch payroll stats:', error.message)
                throw error
            }

            throw new ApiError(0, 'Failed to fetch payroll statistics')
        }
    },

    // ==============================================
    // DOWNLOAD REPORT AS PDF (Future Enhancement)
    // ==============================================
    async exportPayrollPDF(
        filters: PayrollReportFilters,
        filename?: string
    ): Promise<ExportPayrollCSVResult> {
        // Placeholder for future PDF export functionality
        toast({
            title: "Coming Soon",
            description: "PDF export will be available in a future update.",
            variant: "default",
        })

        return {
            success: false,
            message: 'PDF export not yet implemented',
            error: 'Feature not available'
        }
    },

    // ==============================================
    // VALIDATE DATE RANGE (Helper)
    // ==============================================
    validateDateRange(startDate: string, endDate: string): {
        isValid: boolean
        error?: string
    } {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const now = new Date()

        // Check if dates are valid
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return {
                isValid: false,
                error: 'Invalid date format'
            }
        }

        // Check if end is after start
        if (end < start) {
            return {
                isValid: false,
                error: 'End date must be after start date'
            }
        }

        // Check if dates are not in future
        if (start > now || end > now) {
            return {
                isValid: false,
                error: 'Dates cannot be in the future'
            }
        }

        // Check if range is not too large (1 year max)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays > 366) {
            return {
                isValid: false,
                error: 'Date range cannot exceed 1 year'
            }
        }

        return { isValid: true }
    },

    // ==============================================
    // GET DEFAULT FILTERS (Helper)
    // ==============================================
    getDefaultFilters(): PayrollReportFilters {
        // Default to current month
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        return {
            startDate: startOfMonth.toISOString().split('T')[0],
            endDate: endOfMonth.toISOString().split('T')[0],
            status: 'all',
            includeNotes: true,
            includeDetailedEntries: true
        }
    },

    // ==============================================
    // GET DATE RANGE FROM PRESET (Helper)
    // ==============================================
    getDateRangeFromPreset(preset: string): {
        startDate: string
        endDate: string
    } {
        const now = new Date()

        switch (preset) {
            case 'this-week': {
                const dayOfWeek = now.getDay()
                const startOfWeek = new Date(now)
                startOfWeek.setDate(now.getDate() - dayOfWeek)
                const endOfWeek = new Date(startOfWeek)
                endOfWeek.setDate(startOfWeek.getDate() + 6)

                return {
                    startDate: startOfWeek.toISOString().split('T')[0],
                    endDate: endOfWeek.toISOString().split('T')[0]
                }
            }

            case 'last-week': {
                const dayOfWeek = now.getDay()
                const startOfLastWeek = new Date(now)
                startOfLastWeek.setDate(now.getDate() - dayOfWeek - 7)
                const endOfLastWeek = new Date(startOfLastWeek)
                endOfLastWeek.setDate(startOfLastWeek.getDate() + 6)

                return {
                    startDate: startOfLastWeek.toISOString().split('T')[0],
                    endDate: endOfLastWeek.toISOString().split('T')[0]
                }
            }

            case 'this-month': {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

                return {
                    startDate: startOfMonth.toISOString().split('T')[0],
                    endDate: endOfMonth.toISOString().split('T')[0]
                }
            }

            case 'last-month': {
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

                return {
                    startDate: startOfLastMonth.toISOString().split('T')[0],
                    endDate: endOfLastMonth.toISOString().split('T')[0]
                }
            }

            case 'this-quarter': {
                const quarter = Math.floor(now.getMonth() / 3)
                const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1)
                const endOfQuarter = new Date(now.getFullYear(), (quarter + 1) * 3, 0)

                return {
                    startDate: startOfQuarter.toISOString().split('T')[0],
                    endDate: endOfQuarter.toISOString().split('T')[0]
                }
            }

            case 'this-year': {
                const startOfYear = new Date(now.getFullYear(), 0, 1)
                const endOfYear = new Date(now.getFullYear(), 11, 31)

                return {
                    startDate: startOfYear.toISOString().split('T')[0],
                    endDate: endOfYear.toISOString().split('T')[0]
                }
            }

            default:
                return this.getDefaultFilters()
        }
    },
}

// ==============================================
// DEFAULT EXPORT
// ==============================================
export default payrollReportsApi

// ==============================================
// CONVENIENCE FUNCTIONS
// ==============================================

/**
 * Generate payroll report with default filters
 */
export const generatePayrollReport = async (
    startDate: string,
    endDate: string
) => {
    return payrollReportsApi.getPayrollReport({
        startDate,
        endDate,
        status: 'all',
        includeNotes: true,
        includeDetailedEntries: true
    })
}

/**
 * Export current month payroll to CSV
 */
export const exportCurrentMonthPayroll = async () => {
    const filters = payrollReportsApi.getDefaultFilters()
    return payrollReportsApi.exportPayrollCSV(filters)
}

/**
 * Get this week's payroll stats
 */
export const getThisWeekStats = async () => {
    return payrollReportsApi.getPayrollStats()
}