// ==============================================
// app/api/reports/payroll/export/route.ts - CSV Export API Route
// UPDATED: Allow members to export their own data
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateExportPayrollCSV,
  formatPayrollReportErrors,
} from '@/lib/validations/reports/payroll-reports'
import { PayrollReportsDatabaseService } from '@/lib/database/services/payroll-reports'
import { generatePayrollCSV } from '@/lib/reports/exporters/payroll-csv'

// ==============================================
// POST /api/reports/payroll/export - Export Payroll CSV
// ==============================================
export async function POST(request: NextRequest) {
  try {
    // Get user info from middleware
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')
    const userRole = request.headers.get('x-user-role')

    console.log(userRole, 'userRole')

    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to export payroll reports.',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate request body
    const validation = validateExportPayrollCSV(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid export parameters',
          message: 'Please provide valid export parameters.',
          details: formatPayrollReportErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // UPDATED: Permission check - Allow members to export their own data
    const isAdmin = ['super_admin', 'admin'].includes(userRole || '')
    const requestedUserId = validation.data.userId
    const isExportingOwnData = requestedUserId === userId

    // If not admin, they can ONLY export their own data
    if (!isAdmin) {
      // Members must specify a userId
      if (!requestedUserId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient permissions',
            message: 'You can only export your own timesheet data.',
          },
          { status: 403 }
        )
      }

      // Members can only export their own data
      if (!isExportingOwnData) {
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient permissions',
            message: 'You can only export your own timesheet data.',
          },
          { status: 403 }
        )
      }
    }

    // Create service instance
    const reportsService = new PayrollReportsDatabaseService(true, false, false)

    // Prepare filters
    const filters = {
      startDate: validation.data.startDate,
      endDate: validation.data.endDate,
      projectId: validation.data.projectId || undefined,
      // SECURITY: Force userId for non-admins to prevent data leakage
      userId: isAdmin ? (validation.data.userId || undefined) : userId,
      status: validation.data.status || 'all',
      includeNotes: validation.data.includeNotes ?? true,
      includeDetailedEntries: validation.data.includeDetailedEntries ?? true,
    }

    // Generate the payroll report
    const report = await reportsService.getPayrollReport(
      companyId,
      userId,
      filters
    )

    // Check if report has data
    // if (report.summary.totalEntries === 0) {
    //   return NextResponse.json(
    //     {
    //       success: true,
    //       error: 'No data',
    //       message: 'No time entries found for the selected period.',
    //     },
    //     { status: 200 }
    //   )
    // }

    // Generate CSV content
    const csvOptions = {
      includeNotes: validation.data.includeNotes ?? true,
      includeDetailedEntries: validation.data.includeDetailedEntries ?? true,
      filename: validation.data.filename || `payroll-report-${filters.startDate}-to-${filters.endDate}`
    }

    const csvContent = generatePayrollCSV(report, csvOptions)

    // Set filename
    const filename = `${csvOptions.filename}.csv`

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Error exporting payroll CSV:', error)

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database error',
            message: 'Unable to fetch payroll data for export.',
          },
          { status: 500 }
        )
      }

      if (error.message.includes('CSV generation')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Export error',
            message: 'Failed to generate CSV file.',
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while exporting the report.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// OPTIONS /api/reports/payroll/export - CORS
// ==============================================
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}