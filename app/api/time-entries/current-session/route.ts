// ==============================================
// app/api/time-entries/current-session/route.ts - Current Session API Route
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { TimeEntriesDatabaseService } from '@/lib/database/services/time-entries'

// ==============================================
// GET /api/time-entries/current-session - Get Current Active Session
// ==============================================
export async function GET(request: NextRequest) {
  try {
    // Get user info from middleware
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')

    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to view your current session.',
        },
        { status: 401 }
      )
    }

    // Create service instance
    const timeEntriesService = new TimeEntriesDatabaseService(true, false)

    // Get user's active session
    const activeSession = await timeEntriesService.getActiveSession(userId, companyId)

    if (!activeSession) {
      return NextResponse.json(
        {
          success: true,
          message: 'No active clock session',
          data: {
            hasActiveSession: false,
            session: null,
          },
        },
        { status: 200 }
      )
    }

    // Calculate session duration
    const startTime = activeSession.start_time
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    
    // Calculate duration in minutes
    const start = new Date(`1970-01-01T${startTime}`)
    const current = new Date(`1970-01-01T${currentTime}`)
    const durationMs = current.getTime() - start.getTime()
    const durationMinutes = Math.floor(durationMs / (1000 * 60))

    // Get project and schedule project info
    const project = activeSession.project || { name: 'Unknown Project' }
    const scheduleProject = activeSession.schedule_project

    // Parse rates from active session
    const regularRate = parseFloat(activeSession.regular_rate || '0')
    const overtimeRate = parseFloat(activeSession.overtime_rate || '0')
    const doubleTimeRate = parseFloat(activeSession.double_time_rate || '0')
    const breakMinutes = activeSession.break_minutes || 0

    // Transform response
    const sessionData = {
      id: activeSession.id,
      userId: activeSession.user_id,
      projectId: activeSession.project_id,
      scheduleProjectId: activeSession.schedule_project_id,
      startTime: activeSession.start_time,
      date: activeSession.date,
      duration: Math.max(0, durationMinutes), // Ensure non-negative
      breakMinutes,
      regularRate,
      overtimeRate,
      doubleTimeRate,

      projectName: project.name,
      scheduleProjectTitle: scheduleProject?.title,
      workType: activeSession.work_type,
      trade: activeSession.trade,
      status: activeSession.status,
      description: activeSession.description,

      // For component compatibility
      project: {
        id: activeSession.project_id,
        name: project.name,
      },
      scheduleProject: scheduleProject ? {
        id: activeSession.schedule_project_id,
        title: scheduleProject.title,
      } : undefined,
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Current session retrieved successfully',
        data: {
          hasActiveSession: true,
          session: sessionData,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get current session error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving your current session.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// DELETE /api/time-entries/current-session - Force End Session (Admin)
// ==============================================
export async function DELETE(request: NextRequest) {
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
          message: 'You must be logged in to end sessions.',
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
          message: 'Only administrators can force end sessions.',
        },
        { status: 403 }
      )
    }

    // Parse query parameters to get target user ID
    const url = new URL(request.url)
    const targetUserId = url.searchParams.get('userId') || userId

    // Create service instance
    const timeEntriesService = new TimeEntriesDatabaseService(true, false)

    // Get target user's active session
    const activeSession = await timeEntriesService.getActiveSession(targetUserId, companyId)

    if (!activeSession) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active session',
          message: 'The specified user does not have an active clock session.',
        },
        { status: 404 }
      )
    }

    // Force clock out with admin note
    const clockOutData = {
      timeEntryId: activeSession.id,
      userId: targetUserId,
      description: 'Session ended by administrator',
      workCompleted: 'Session ended by admin - please review',
      issuesEncountered: `Session was force-ended by admin (${userId}) at ${new Date().toISOString()}`,
    }

    const timeEntry = await timeEntriesService.clockOut(clockOutData)

    return NextResponse.json(
      {
        success: true,
        message: 'Session ended successfully by administrator',
        data: {
          timeEntryId: timeEntry.id,
          endedBy: userId,
          endedAt: timeEntry.end_time,
          totalHours: parseFloat(timeEntry.total_hours || '0'),
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Force end session error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while ending the session.',
      },
      { status: 500 }
    )
  }
}