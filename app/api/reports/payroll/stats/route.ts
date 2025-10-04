// ==============================================
// app/api/reports/payroll/stats/route.ts - Quick Stats API Route
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validatePayrollStatsQuery,
  formatPayrollReportErrors,
} from '@/lib/validations/reports/payroll-reports'
import { PayrollReportsDatabaseService } from '@/lib/database/services/payroll-reports'

// ==============================================
// GET /api/reports/payroll/stats - Get Quick Payroll Stats
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
          message: 'You must be logged in to view payroll stats.',
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
          message: 'Only administrators can view payroll stats.',
        },
        { status: 403 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = {
      projectId: url.searchParams.get('projectId'),
      userId: url.searchParams.get('userId'),
    }

    // Validate query parameters
    const validation = validatePayrollStatsQuery(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          message: 'Please provide valid parameters.',
          details: formatPayrollReportErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // Create service instance
    const reportsService = new PayrollReportsDatabaseService(true, false, false)

    // Get quick stats
    const stats = await reportsService.getPayrollStats(
      companyId,
      {
        projectId: validation.data.projectId || undefined,
        userId: validation.data.userId || undefined,
      }
    )

    return NextResponse.json(
      {
        success: true,
        message: 'Payroll stats retrieved successfully',
        data: stats,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error fetching payroll stats:', error)

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database error',
            message: 'Unable to fetch payroll stats.',
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching payroll stats.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// OPTIONS /api/reports/payroll/stats - CORS
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