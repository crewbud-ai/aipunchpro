// ==============================================
// app/api/time-entries/route.ts - Time Entries API Routes (FIXED)
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateCreateTimeEntry,
  validateGetTimeEntries,
  formatTimeEntryErrors,
} from '@/lib/validations/time-tracking/time-entries'
import { TimeEntriesDatabaseService } from '@/lib/database/services/time-entries'

// ==============================================
// GET /api/time-entries - Get Time Entries for Company
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

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = {
      userId: url.searchParams.get('userId'),
      projectId: url.searchParams.get('projectId'),
      scheduleProjectId: url.searchParams.get('scheduleProjectId'),
      status: url.searchParams.get('status'),
      workType: url.searchParams.get('workType'),
      trade: url.searchParams.get('trade'),
      dateFrom: url.searchParams.get('dateFrom'),
      dateTo: url.searchParams.get('dateTo'),
      search: url.searchParams.get('search'),
      needsApproval: url.searchParams.get('needsApproval'),
      isActive: url.searchParams.get('isActive'),
      sortBy: url.searchParams.get('sortBy'),
      sortOrder: url.searchParams.get('sortOrder'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
    }

    // FIXED: Convert null values to undefined and process types correctly
    const processedParams = {
      userId: queryParams.userId || undefined,
      projectId: queryParams.projectId || undefined,
      scheduleProjectId: queryParams.scheduleProjectId || undefined,
      status: queryParams.status || undefined,
      workType: queryParams.workType || undefined,
      trade: queryParams.trade || undefined,
      dateFrom: queryParams.dateFrom || undefined,
      dateTo: queryParams.dateTo || undefined,
      search: queryParams.search || undefined,
      needsApproval: queryParams.needsApproval === 'true' ? true : 
                     queryParams.needsApproval === 'false' ? false : undefined,
      isActive: queryParams.isActive === 'true' ? true : 
                queryParams.isActive === 'false' ? false : undefined,
      sortBy: queryParams.sortBy || undefined,
      sortOrder: queryParams.sortOrder || undefined,
      limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
      offset: queryParams.offset ? parseInt(queryParams.offset) : undefined,
    }

    // Validate query parameters
    const validation = validateGetTimeEntries(processedParams)
    if (!validation.success) {
      console.error('Validation error:', validation.error)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: formatTimeEntryErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // Create service instance
    const timeEntriesService = new TimeEntriesDatabaseService(true, false)

    // Get time entries with filters
    const result = await timeEntriesService.getTimeEntries(companyId, validation.data)

    // Transform time entries to clean structure
    const transformedTimeEntries = result.timeEntries.map((entry: any) => ({
      id: entry.id,
      companyId: entry.company_id,
      projectId: entry.project_id,
      scheduleProjectId: entry.schedule_project_id,
      userId: entry.user_id,
      workerName: entry.worker_name,
      isSystemUser: entry.is_system_user,
      date: entry.date,
      startTime: entry.start_time,
      endTime: entry.end_time,
      breakMinutes: entry.break_minutes,
      regularHours: parseFloat(entry.regular_hours || '0'),
      overtimeHours: parseFloat(entry.overtime_hours || '0'),
      doubleTimeHours: parseFloat(entry.double_time_hours || '0'),
      totalHours: parseFloat(entry.total_hours || '0'),
      regularRate: entry.regular_rate ? parseFloat(entry.regular_rate) : undefined,
      overtimeRate: entry.overtime_rate ? parseFloat(entry.overtime_rate) : undefined,
      doubleTimeRate: entry.double_time_rate ? parseFloat(entry.double_time_rate) : undefined,
      totalPay: entry.total_pay ? parseFloat(entry.total_pay) : undefined,
      description: entry.description,
      workType: entry.work_type,
      trade: entry.trade,
      clockInLocation: entry.clock_in_location ? {
        lat: parseFloat(entry.clock_in_location.split(',')[0].replace('(', '')),
        lng: parseFloat(entry.clock_in_location.split(',')[1].replace(')', ''))
      } : undefined,
      clockOutLocation: entry.clock_out_location ? {
        lat: parseFloat(entry.clock_out_location.split(',')[0].replace('(', '')),
        lng: parseFloat(entry.clock_out_location.split(',')[1].replace(')', ''))
      } : undefined,
      workLocation: entry.work_location,
      status: entry.status,
      submittedAt: entry.submitted_at,
      approvedBy: entry.approved_by,
      approvedAt: entry.approved_at,
      rejectionReason: entry.rejection_reason,
      equipmentUsed: entry.equipment_used || [],
      materialsUsed: entry.materials_used || [],
      weatherConditions: entry.weather_conditions,
      temperatureF: entry.temperature_f,
      workConditions: entry.work_conditions,
      safetyIncidents: entry.safety_incidents,
      ppe: entry.ppe || [],
      workCompleted: entry.work_completed,
      issuesEncountered: entry.issues_encountered,
      nextSteps: entry.next_steps,
      qualityRating: entry.quality_rating,
      createdBy: entry.created_by,
      lastModifiedBy: entry.last_modified_by,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,

      // Related data
      project: entry.project ? {
        id: entry.project.id,
        name: entry.project.name,
        status: entry.project.status,
        projectNumber: entry.project.project_number,
      } : null,

      scheduleProject: entry.schedule_project ? {
        id: entry.schedule_project.id,
        title: entry.schedule_project.title,
        status: entry.schedule_project.status,
      } : null,

      worker: entry.worker ? {
        id: entry.worker.id,
        firstName: entry.worker.first_name,
        lastName: entry.worker.last_name,
        email: entry.worker.email,
      } : null,

      approver: entry.approver ? {
        id: entry.approver.id,
        firstName: entry.approver.first_name,
        lastName: entry.approver.last_name,
        email: entry.approver.email,
      } : null,
    }))

    
    return NextResponse.json(
      {
        success: true,
        message: 'Time entries retrieved successfully',
        data: {
          timeEntries: transformedTimeEntries,
          totalCount: result.totalCount,
          pagination: {
            limit: validation.data.limit || 50,
            offset: validation.data.offset || 0,
            hasMore: result.totalCount > (validation.data.offset || 0) + transformedTimeEntries.length,
          },
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get time entries error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving time entries.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// POST /api/time-entries - Create Time Entry (Manual)
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
          message: 'You must be logged in to create time entries.',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate input data
    const validation = validateCreateTimeEntry(body)
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
          message: 'You do not have access to create time entries for this project.',
        },
        { status: 403 }
      )
    }

    // Create time entry
    const timeEntry = await timeEntriesService.createTimeEntry(
      validation.data,
      companyId,
      userId
    )

    // Transform response
    const transformedTimeEntry = {
      id: timeEntry.id,
      projectId: timeEntry.project_id,
      scheduleProjectId: timeEntry.schedule_project_id,
      date: timeEntry.date,
      startTime: timeEntry.start_time,
      endTime: timeEntry.end_time,
      totalHours: parseFloat(timeEntry.total_hours || '0'),
      status: timeEntry.status,
      workType: timeEntry.work_type,
      trade: timeEntry.trade,
      description: timeEntry.description,
      createdAt: timeEntry.created_at,
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Time entry created successfully',
        data: {
          timeEntry: transformedTimeEntry,
        },
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Create time entry error:', error)

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
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while creating the time entry.',
      },
      { status: 500 }
    )
  }
}