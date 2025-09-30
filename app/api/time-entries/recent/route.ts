// ==============================================
// app/api/time-entries/recent/route.ts - Get Recent Time Entries
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { TimeEntriesDatabaseService } from '@/lib/database/services/time-entries'

// ==============================================
// GET /api/time-entries/recent - Get User's Recent Time Entries
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
          message: 'You must be logged in to view time entries.',
        },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Validate limit
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid limit',
          message: 'Limit must be between 1 and 50.',
        },
        { status: 400 }
      )
    }

    // Create service instance
    const timeEntriesService = new TimeEntriesDatabaseService(true, false)

    // Get recent time entries
    const entries = await timeEntriesService.getRecentEntries(
      userId,
      companyId,
      limit,
      offset
    )

    // Transform the response
    const transformedEntries = entries.map((entry: any) => ({
      id: entry.id,
      projectId: entry.project_id,
      projectName: entry.project?.name || 'Unknown Project',
      scheduleProjectId: entry.schedule_project_id,
      scheduleProjectTitle: entry.schedule_project?.title,
      date: entry.date,
      startTime: entry.start_time,
      endTime: entry.end_time,
      totalHours: entry.total_hours,
      status: entry.status,
      workType: entry.work_type,
      trade: entry.trade,
      description: entry.description,
    }))

    return NextResponse.json(
      {
        success: true,
        message: 'Recent entries retrieved successfully',
        data: transformedEntries,
        pagination: {
          limit,
          offset,
          count: transformedEntries.length,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get recent entries error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving recent entries.',
      },
      { status: 500 }
    )
  }
}