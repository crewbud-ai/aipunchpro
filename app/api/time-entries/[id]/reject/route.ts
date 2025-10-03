// ==============================================
// app/api/time-entries/[id]/reject/route.ts
// Reject Time Entry API Route
// ==============================================

import { TimeEntriesDatabaseService } from "@/lib/database/services/time-entries"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to reject time entries.',
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
          message: 'Only administrators can reject time entries.',
        },
        { status: 403 }
      )
    }

    const timeEntryId = params.id
    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'A reason is required to reject a time entry.',
        },
        { status: 400 }
      )
    }

    // Create service instance
    const timeEntriesService = new TimeEntriesDatabaseService(true, false)

    // Reject the time entry
    const rejectedEntry = await timeEntriesService.rejectTimeEntry(
      timeEntryId,
      userId,
      companyId,
      reason
    )

    if (!rejectedEntry) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Time entry not found or cannot be rejected.',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Time entry rejected successfully',
        data: {
          id: rejectedEntry.id,
          status: rejectedEntry.status,
          rejectionReason: rejectedEntry.rejection_reason,
          rejectedBy: userId,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Reject time entry error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while rejecting the time entry.',
      },
      { status: 500 }
    )
  }
}