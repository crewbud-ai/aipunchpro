// ==============================================
// src/app/api/punchlist-items/route.ts - Punchlist Items API Routes
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateCreatePunchlistItem,
  validateGetPunchlistItems,
  formatPunchlistItemErrors,
  transformCreatePunchlistItemData,
} from '@/lib/validations/punchlist/punchlist-items'
import { PunchlistItemDatabaseService } from '@/lib/database/services/punchlist-items'
import { ProjectDatabaseService } from '@/lib/database/services/projects'
import { ScheduleProjectDatabaseService } from '@/lib/database/services/schedule-projects'

// ==============================================
// GET /api/punchlist-items - Get All Punchlist Items for Company
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
          message: 'You must be logged in to view punchlist items.',
        },
        { status: 401 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = {
      projectId: url.searchParams.get('projectId'),
      relatedScheduleProjectId: url.searchParams.get('relatedScheduleProjectId'),
      status: url.searchParams.get('status'),
      priority: url.searchParams.get('priority'),
      issueType: url.searchParams.get('issueType'),
      tradeCategory: url.searchParams.get('tradeCategory'),
      assignedToUserId: url.searchParams.get('assignedToUserId'),
      reportedBy: url.searchParams.get('reportedBy'),
      dueDateFrom: url.searchParams.get('dueDateFrom'),
      dueDateTo: url.searchParams.get('dueDateTo'),
      requiresInspection: url.searchParams.get('requiresInspection') ? url.searchParams.get('requiresInspection') === 'true' : undefined,
      isOverdue: url.searchParams.get('isOverdue') ? url.searchParams.get('isOverdue') === 'true' : undefined,
      search: url.searchParams.get('search'),
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
      offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined,
      sortBy: url.searchParams.get('sortBy'),
      sortOrder: url.searchParams.get('sortOrder'),
    }

    // Validate query parameters
    const validation = validateGetPunchlistItems(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: formatPunchlistItemErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // Create service instance
    const punchlistService = new PunchlistItemDatabaseService(true, false)

    // Get punchlist items with filters
    const result = await punchlistService.getPunchlistItems(companyId, validation.data)

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
        message: 'Punchlist items retrieved successfully.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/punchlist-items:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching punchlist items.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// POST /api/punchlist-items - Create New Punchlist Item
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
          message: 'You must be logged in to create punchlist items.',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate input data
    const validation = validateCreatePunchlistItem(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formatPunchlistItemErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // Create service instances
    const punchlistService = new PunchlistItemDatabaseService(true, false)
    const projectService = new ProjectDatabaseService(true, false)
    const scheduleService = new ScheduleProjectDatabaseService(true, false)

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

    // Verify related schedule project if provided
    if (validation.data.relatedScheduleProjectId) {
      const scheduleProjectExists = await scheduleService.checkScheduleProjectExists(validation.data.relatedScheduleProjectId, companyId)
      if (!scheduleProjectExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'Schedule project not found',
            message: 'The specified schedule project does not exist or you do not have access to it.',
          },
          { status: 404 }
        )
      }
    }

    // Verify assigned project member if provided
    if (validation.data.assignedProjectMemberId) {
      const projectMembers = await punchlistService.getProjectMembersForProject(validation.data.projectId, companyId)
      const assignedMemberExists = projectMembers.some(pm => pm.id === validation.data.assignedProjectMemberId)
      
      if (!assignedMemberExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid assignment',
            message: 'The specified team member is not assigned to this project.',
          },
          { status: 400 }
        )
      }
    }

    // Transform form data for database
    const punchlistData = {
      ...validation.data,
      companyId,
      reportedBy: userId,
    }

    // Create punchlist item
    const punchlistItem = await punchlistService.createPunchlistItem(punchlistData)

    // Get the created punchlist item with full details
    const punchlistItemWithDetails = await punchlistService.getPunchlistItemById(punchlistItem.id, companyId)

    return NextResponse.json(
      {
        success: true,
        data: punchlistItemWithDetails,
        message: 'Punchlist item created successfully.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/punchlist-items:', error)
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('foreign key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid reference',
            message: 'One or more referenced items (project, schedule item, or team member) are invalid.',
          },
          { status: 400 }
        )
      }
      
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate entry',
            message: 'A punchlist item with similar details already exists.',
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while creating the punchlist item.',
      },
      { status: 500 }
    )
  }
}