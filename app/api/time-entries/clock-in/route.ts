// ==============================================
// app/api/time-entries/clock-in/route.ts - UPDATED WITH RATE FETCHING
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateClockIn,
  formatTimeEntryErrors,
} from '@/lib/validations/time-tracking/time-entries'
import { TimeEntriesDatabaseService } from '@/lib/database/services/time-entries'
import { RateCalculationService } from '@/lib/database/services/rate-calculation'

// ==============================================
// POST /api/time-entries/clock-in - Clock In User
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
          message: 'You must be logged in to clock in.',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate input data
    const validation = validateClockIn(body)
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

    // Create service instances
    const timeEntriesService = new TimeEntriesDatabaseService(true, false)
    const rateService = new RateCalculationService(true) // ⭐ NEW SERVICE

    // Check if user has access to the project
    const hasProjectAccess = await timeEntriesService.checkProjectAccess(
      validation.data.projectId, 
      userId, 
      companyId
    )

    if (!hasProjectAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
          message: 'You do not have access to clock into this project.',
        },
        { status: 403 }
      )
    }

    // Check if user already has an active session
    const activeSession = await timeEntriesService.getActiveSession(userId, companyId)
    if (activeSession) {
      return NextResponse.json(
        {
          success: false,
          error: 'Active session exists',
          message: 'You already have an active clock session. Please clock out first.',
        },
        { status: 409 }
      )
    }

    // Fetch hourly rates before clocking in
    let rates
    try {
      rates = await rateService.getAllRates(userId, validation.data.projectId, companyId)
      
      console.log('✅ Rates fetched successfully:', {
        regularRate: rates.regularRate,
        overtimeRate: rates.overtimeRate,
        source: rates.source
      })
    } catch (rateError) {
      console.error('❌ Rate fetching error:', rateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Rate not configured',
          message: rateError instanceof Error 
            ? rateError.message 
            : 'No hourly rate found. Please contact your administrator to set up your rates.',
        },
        { status: 400 }
      )
    }

    // Prepare clock in data with rates
    const clockInData = {
      companyId,
      userId,
      projectId: validation.data.projectId,
      scheduleProjectId: validation.data.scheduleProjectId,
      description: validation.data.description,
      regularRate: rates.regularRate,
      overtimeRate: rates.overtimeRate,
      doubleTimeRate: rates.doubleTimeRate,
    }

    // Clock in user (this will store the rates)
    const timeEntry = await timeEntriesService.clockIn(clockInData)

    // Get project and schedule project names for response
    const clockInOptions = await timeEntriesService.getClockInOptions(userId, companyId)
    const project = clockInOptions.projects.find((p: any) => p.id === validation.data.projectId)
    const scheduleProject = validation.data.scheduleProjectId 
      ? clockInOptions.scheduleProjects.find((sp: any) => sp.id === validation.data.scheduleProjectId)
      : null

    // Transform response with rates
    const response = {
      timeEntry: {
        id: timeEntry.id,
        projectId: timeEntry.project_id,
        scheduleProjectId: timeEntry.schedule_project_id,
        startTime: timeEntry.start_time,
        status: timeEntry.status,
        date: timeEntry.date,
        regularRate: rates.regularRate,
        overtimeRate: rates.overtimeRate,
      },
      session: {
        id: timeEntry.id,
        projectName: project?.name || 'Unknown Project',
        scheduleProjectTitle: scheduleProject?.title,
        startTime: timeEntry.start_time,
        duration: 0,
        regularRate: rates.regularRate,
        overtimeRate: rates.overtimeRate,
        rateSource: rates.source, // 'project_override' or 'user_default'
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully clocked into ${project?.name || 'project'} at $${rates.regularRate}/hr`,
        data: response,
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Clock in error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('already has an active')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Active session exists',
            message: error.message,
          },
          { status: 409 }
        )
      }

      if (error.message.includes('access')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Access denied',
            message: error.message,
          },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while clocking in.',
      },
      { status: 500 }
    )
  }
}