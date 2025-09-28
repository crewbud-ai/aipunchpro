// ==============================================
// app/api/time-entries/clock-in-options/route.ts - Clock In Options API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { TimeEntriesDatabaseService } from '@/lib/database/services/time-entries'

// ==============================================
// GET /api/time-entries/clock-in-options - Get Available Projects for Clock In
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
          message: 'You must be logged in to view clock-in options.',
        },
        { status: 401 }
      )
    }

    // Create service instance
    const timeEntriesService = new TimeEntriesDatabaseService(true, false)

    // Get user's available projects and schedule projects for clocking in
    const clockInOptions = await timeEntriesService.getClockInOptions(userId, companyId)

    // Transform response to match expected structure
    const response = {
      projects: clockInOptions.projects || [],
      scheduleProjects: clockInOptions.scheduleProjects || [],
      userInfo: {
        id: userId,
        // Add any additional user info if needed
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Clock-in options retrieved successfully',
        data: response,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get clock-in options error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving clock-in options.',
      },
      { status: 500 }
    )
  }
}