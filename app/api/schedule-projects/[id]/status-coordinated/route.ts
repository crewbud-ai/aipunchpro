// ==============================================
// app/api/schedule-projects/[id]/status-coordinated/route.ts - Coordinated Schedule Project Status Update API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { StatusCoordinatorService } from '@/lib/database/services/status-coordinator'

// ==============================================
// VALIDATION SCHEMA
// ==============================================
const updateScheduleStatusCoordinatedSchema = z.object({
  status: z.enum([
    'planned',
    'in_progress', 
    'completed',
    'delayed',
    'cancelled'
  ], {
    errorMap: () => ({ message: 'Please select a valid status' })
  }),
  
  progressPercentage: z
    .number()
    .min(0, 'Progress cannot be negative')
    .max(100, 'Progress cannot exceed 100%')
    .optional(),

  actualHours: z
    .number()
    .min(0, 'Actual hours cannot be negative')
    .max(999.99, 'Actual hours cannot exceed 999.99')
    .optional(),

  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),

  skipDependencyValidation: z
    .boolean()
    .default(false)
    .optional(),

  skipProjectSync: z
    .boolean()
    .default(false)
    .optional(),
})

function formatValidationErrors(error: z.ZodError) {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }))
}

// ==============================================
// PATCH /api/schedule-projects/[id]/status-coordinated - Update Schedule Project Status with Sync
// ==============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user info from middleware
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')
    
    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to update schedule project status.',
        },
        { status: 401 }
      )
    }

    const scheduleProjectId = params.id

    if (!scheduleProjectId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Schedule project ID is required.',
        },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Validate input data
    const validation = updateScheduleStatusCoordinatedSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formatValidationErrors(validation.error),
        },
        { status: 400 }
      )
    }

    const { 
      status, 
      progressPercentage, 
      actualHours, 
      notes, 
      skipDependencyValidation,
      skipProjectSync 
    } = validation.data

    // Create status coordinator service
    const statusCoordinator = new StatusCoordinatorService(true, false)

    // Check if punchlist items are blocking completion (if status is 'completed')
    if (status === 'completed' && !skipDependencyValidation) {
      const blockingCheck = await statusCoordinator.canCompleteScheduleProject(
        scheduleProjectId, 
        companyId
      )
      
      if (!blockingCheck.canComplete) {
        return NextResponse.json(
          {
            success: false,
            error: 'Schedule project completion blocked',
            message: `Cannot complete schedule project due to blocking issues.`,
            data: {
              blockingCount: blockingCheck.blockingCount,
              blockingItems: blockingCheck.blockingItems
            }
          },
          { status: 400 }
        )
      }
    }

    // Update schedule project status with coordination
    const result = await statusCoordinator.updateScheduleProjectStatusWithSync(
      scheduleProjectId,
      companyId,
      status,
      progressPercentage,
      actualHours,
      notes,
      userId
    )

    // Prepare response message
    let responseMessage = `Schedule project status updated to "${status}".`
    
    if (!skipProjectSync && result.data.projectSync.updated) {
      responseMessage += ` Parent project status was automatically updated to "${result.data.projectSync.newStatus}".`
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          scheduleProject: result.data.scheduleProject,
          projectSync: result.data.projectSync,
          syncPerformed: !skipProjectSync
        },
        message: responseMessage,
        notifications: {
          type: 'success',
          title: 'Schedule Status Updated',
          message: responseMessage
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in PATCH /api/schedule-projects/[id]/status-coordinated:', error)

    // Handle specific coordination errors
    if (error instanceof Error) {
      if (error.message.includes('blocking')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Status change blocked',
            message: error.message,
          },
          { status: 400 }
        )
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Schedule project not found',
            message: 'The requested schedule project does not exist or you do not have access to update it.',
          },
          { status: 404 }
        )
      }

      if (error.message.includes('dependency')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Dependency validation failed',
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
        message: 'An unexpected error occurred while updating the schedule project status.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// GET /api/schedule-projects/[id]/status-coordinated - Get Schedule Project Blocking Status
// ==============================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user info from middleware
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')
    
    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to view schedule project status.',
        },
        { status: 401 }
      )
    }

    const scheduleProjectId = params.id

    if (!scheduleProjectId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Schedule project ID is required.',
        },
        { status: 400 }
      )
    }

    // Create status coordinator service  
    const statusCoordinator = new StatusCoordinatorService(true, false)

    // Check completion eligibility
    const completionCheck = await statusCoordinator.canCompleteScheduleProject(
      scheduleProjectId, 
      companyId
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          canComplete: completionCheck.canComplete,
          blockingCount: completionCheck.blockingCount,
          blockingItems: completionCheck.blockingItems,
          timestamp: new Date().toISOString()
        },
        message: completionCheck.canComplete 
          ? 'Schedule project is ready for completion.'
          : `Schedule project completion is blocked by ${completionCheck.blockingCount} item(s).`
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in GET /api/schedule-projects/[id]/status-coordinated:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while checking schedule project status.',
      },
      { status: 500 }
    )
  }
}