// ==============================================
// app/api/time-entries/[id]/approve/route.ts - Approve Time Entry API Route
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { TimeEntriesDatabaseService } from '@/lib/database/services/time-entries'

// ==============================================
// POST /api/time-entries/[id]/approve - Approve Time Entry
// ==============================================
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
          message: 'You must be logged in to approve time entries.',
        },
        { status: 401 }
      )
    }

    // Check if user has admin privileges
    if (!['super_admin', 'admin', 'project_manager'].includes(userRole || '')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
          message: 'Only administrators can approve time entries.',
        },
        { status: 403 }
      )
    }

    const timeEntryId = params.id

    // Create service instance
    const timeEntriesService = new TimeEntriesDatabaseService(true, false)

    // Approve the time entry
    const approvedEntry = await timeEntriesService.approveTimeEntry(
      timeEntryId,
      userId,
      companyId
    )

    if (!approvedEntry) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Time entry not found or cannot be approved.',
        },
        { status: 404 }
      )
    }

    // Transform response
    const response = {
      id: approvedEntry.id,
      status: approvedEntry.status,
      approvedBy: approvedEntry.approved_by,
      approvedAt: approvedEntry.approved_at,
      totalPay: approvedEntry.total_pay ? parseFloat(approvedEntry.total_pay) : 0,
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Time entry approved successfully',
        data: response,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Approve time entry error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: error.message,
          },
          { status: 404 }
        )
      }

      if (error.message.includes('already approved')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Already approved',
            message: error.message,
          },
          { status: 409 }
        )
      }

      if (error.message.includes('active time entry')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid state',
            message: error.message,
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while approving the time entry.',
      },
      { status: 500 }
    )
  }
}