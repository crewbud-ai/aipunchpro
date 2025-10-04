// ==============================================
// app/api/reports/payroll/route.ts - Payroll Report API Route
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validatePayrollReportQuery,
  formatPayrollReportErrors,
} from '@/lib/validations/reports/payroll-reports'
import { PayrollReportsDatabaseService } from '@/lib/database/services/payroll-reports'

// ==============================================
// GET /api/reports/payroll - Get Payroll Report
// ==============================================
export async function GET(request: NextRequest) {
  try {
    // Get user info from middleware
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to view payroll reports.',
        },
        { status: 401 }
      )
    }

    // Check if user has admin privileges
    if (!['super_admin', 'admin'].includes(userRole || '')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
          message: 'Only administrators can view payroll reports.',
        },
        { status: 403 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = {
      startDate: url.searchParams.get('startDate'),
      endDate: url.searchParams.get('endDate'),
      projectId: url.searchParams.get('projectId'),
      userId: url.searchParams.get('userId'),
      status: url.searchParams.get('status'),
      includeNotes: url.searchParams.get('includeNotes'),
      includeDetailedEntries: url.searchParams.get('includeDetailedEntries'),
    }

    // Validate query parameters
    const validation = validatePayrollReportQuery(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          message: 'Please provide valid report parameters.',
          details: formatPayrollReportErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // Create service instance
    const reportsService = new PayrollReportsDatabaseService(true, false, false)

    // Prepare filters for database service
    const filters = {
      startDate: validation.data.startDate,
      endDate: validation.data.endDate,
      projectId: validation.data.projectId || undefined,
      userId: validation.data.userId || undefined,
      status: validation.data.status || 'all',
      includeNotes: validation.data.includeNotes ?? true,
      includeDetailedEntries: validation.data.includeDetailedEntries ?? true,
    }

    // Generate the complete payroll report
    const report = await reportsService.getPayrollReport(
      companyId,
      userId,
      filters
    )

    // Check if report has data
    const hasData = report.summary.totalEntries > 0

    return NextResponse.json(
      {
        success: true,
        message: hasData
          ? 'Payroll report generated successfully'
          : 'No time entries found for the selected period',
        data: {
          report,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error generating payroll report:', error)

    // Check for specific error types
    if (error instanceof Error) {
      // Database errors
      if (error.message.includes('Failed to fetch')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database error',
            message: 'Unable to fetch payroll data. Please try again.',
          },
          { status: 500 }
        )
      }

      // Date range errors
      if (error.message.includes('date')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid date range',
            message: error.message,
          },
          { status: 400 }
        )
      }
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while generating the payroll report.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// OPTIONS /api/reports/payroll - CORS Support
// ==============================================
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}