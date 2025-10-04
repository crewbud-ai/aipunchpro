// ==============================================
// app/api/reports/payroll/export/route.ts - CSV Export API Route
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

    // Check if user has admin privileges
    if (!['super_admin', 'admin'].includes(userRole || '')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
          message: 'Only administrators can export payroll reports.',
        },
        { status: 403 }
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

    // Create service instance
    const reportsService = new PayrollReportsDatabaseService(true, false, false)

    // Prepare filters
    const filters = {
      startDate: validation.data.startDate,
      endDate: validation.data.endDate,
      projectId: validation.data.projectId || undefined,
      userId: validation.data.userId || undefined,
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
    if (report.summary.totalEntries === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No data',
          message: 'No time entries found for the selected period.',
        },
        { status: 404 }
      )
    }

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