// ==============================================
// app/api/time-entries/clock-out/route.ts - Clock Out API Route
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateClockOut,
  formatTimeEntryErrors,
} from '@/lib/validations/time-tracking/time-entries'
import { TimeEntriesDatabaseService } from '@/lib/database/services/time-entries'

// ==============================================
// POST /api/time-entries/clock-out - Clock Out User
// ==============================================
export async function POST(request: NextRequest) {
  try {
    // Get user info from middleware
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')

    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to clock out.',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate input data
    const validation = validateClockOut(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formatTimeEntryErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // Create service instance
    const timeEntriesService = new TimeEntriesDatabaseService(true, false)

    // Get user's active session
    const activeSession = await timeEntriesService.getActiveSession(userId, companyId)
    if (!activeSession) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active session',
          message: 'You do not have an active clock session to end.',
        },
        { status: 404 }
      )
    }

    // Prepare clock out data
    const clockOutData = {
      timeEntryId: activeSession.id,
      userId,
      description: validation.data.description,
      workCompleted: validation.data.workCompleted,
      issuesEncountered: validation.data.issuesEncountered,
      clockOutLocation: validation.data.location,
    }

    // Clock out user
    const timeEntry = await timeEntriesService.clockOut(clockOutData)

    // Calculate hours breakdown
    const totalHours = parseFloat(timeEntry.total_hours || '0')
    const regularHours = parseFloat(timeEntry.regular_hours || '0')
    const overtimeHours = parseFloat(timeEntry.overtime_hours || '0')

    // Get project name for response
    const project = activeSession.project || { name: 'Unknown Project' }

    // Transform response
    const response = {
      timeEntry: {
        id: timeEntry.id,
        startTime: timeEntry.start_time,
        endTime: timeEntry.end_time,
        totalHours,
        status: timeEntry.status,
        date: timeEntry.date,
      },
      summary: {
        totalHours,
        regularHours,
        overtimeHours,
        projectName: project.name,
        workPeriod: `${timeEntry.start_time} - ${timeEntry.end_time}`,
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully clocked out. Total hours: ${totalHours.toFixed(2)}`,
        data: response,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Clock out error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('No active clock session')) {
        return NextResponse.json(
          {
            success: false,
            error: 'No active session',
            message: error.message,
          },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while clocking out.',
      },
      { status: 500 }
    )
  }
}