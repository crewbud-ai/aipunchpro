// ==============================================
// src/app/api/schedule-projects/route.ts - Schedule Projects API Routes
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateCreateScheduleProject,
  validateGetScheduleProjects,
  formatScheduleProjectErrors,
  transformCreateScheduleProjectData,
} from '@/lib/validations/schedule/schedule-projects'
import { ScheduleProjectDatabaseService } from '@/lib/database/services/schedule-projects'
import { ProjectDatabaseService } from '@/lib/database/services/projects'

// ==============================================
// GET /api/schedule-projects - Get All Schedule Projects for Company
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
          message: 'You must be logged in to view schedule projects.',
        },
        { status: 401 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = {
      projectId: url.searchParams.get('projectId'),
      status: url.searchParams.get('status'),
      priority: url.searchParams.get('priority'),
      tradeRequired: url.searchParams.get('tradeRequired'),
      assignedToUserId: url.searchParams.get('assignedToUserId'),
      startDateFrom: url.searchParams.get('startDateFrom'),
      startDateTo: url.searchParams.get('startDateTo'),
      search: url.searchParams.get('search'),
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
      offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined,
      sortBy: url.searchParams.get('sortBy'),
      sortOrder: url.searchParams.get('sortOrder'),
    }

    // Validate query parameters
    const validation = validateGetScheduleProjects(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: formatScheduleProjectErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // Create service instance
    const scheduleService = new ScheduleProjectDatabaseService(true, false)

    // Get schedule projects with filters
    const result = await scheduleService.getScheduleProjects(companyId, validation.data)

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        pagination: {
          total: result.totalCount,
          limit: validation.data.limit,
          offset: validation.data.offset,
          hasMore: result.totalCount > (validation.data.offset + validation.data.limit),
        },
        message: 'Schedule projects retrieved successfully.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/schedule-projects:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching schedule projects.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// POST /api/schedule-projects - Create New Schedule Project
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
          message: 'You must be logged in to create schedule projects.',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate input data
    const validation = validateCreateScheduleProject(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formatScheduleProjectErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // Create service instances
    const scheduleService = new ScheduleProjectDatabaseService(true, false)
    const projectService = new ProjectDatabaseService(true, false)

    // Verify project exists and belongs to company
    const projectExists = await projectService.checkProjectExists(validation.data.projectId, companyId)
    if (!projectExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
          message: 'The specified project does not exist or you do not have access to it.',
        },
        { status: 404 }
      )
    }

    // Validate dependencies if provided
    if (validation.data.dependsOn && validation.data.dependsOn.length > 0) {
      const validDependencies = await scheduleService.validateDependencies('', validation.data.dependsOn, companyId)
      if (!validDependencies) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid dependencies',
            message: 'One or more dependency schedule projects are invalid or would create a circular dependency.',
          },
          { status: 400 }
        )
      }
    }

    // Transform form data for database
    const scheduleData = {
      ...validation.data,
      companyId,
      createdBy: userId,
    }

    // Create schedule project
    const scheduleProject = await scheduleService.createScheduleProject(scheduleData)

    // Get the created schedule project with full details
    const scheduleProjectWithDetails = await scheduleService.getScheduleProjectById(scheduleProject.id, companyId)

    return NextResponse.json(
      {
        success: true,
        data: scheduleProjectWithDetails,
        message: 'Schedule project created successfully.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/schedule-projects:', error)
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('foreign key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid reference',
            message: 'One or more assigned team members are invalid.',
          },
          { status: 400 }
        )
      }
      
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate entry',
            message: 'A schedule project with similar details already exists.',
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while creating the schedule project.',
      },
      { status: 500 }
    )
  }
}