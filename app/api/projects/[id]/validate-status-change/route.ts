import { NextRequest, NextResponse } from 'next/server'
import { StatusCoordinatorService } from '@/lib/database/services/status-coordinator'
import { ProjectDatabaseService } from '@/lib/database/services/projects'

export async function POST(
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
          message: 'You must be logged in to validate status changes.',
        },
        { status: 401 }
      )
    }

    const projectId = params.id
    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Project ID is required.',
        },
        { status: 400 }
      )
    }

    // Parse request body
    const { newStatus } = await request.json()
    if (!newStatus) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'New status is required.',
        },
        { status: 400 }
      )
    }

    // Create service instances
    const projectService = new ProjectDatabaseService(true, false)

    // Check if project exists and belongs to company
    const projectExists = await projectService.checkProjectExists(projectId, companyId)
    if (!projectExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
          message: 'The requested project does not exist or you do not have access to it.',
        },
        { status: 404 }
      )
    }

    // Validate the status change
    const validation = await projectService.validateProjectStatusChange(
      projectId,
      companyId,
      newStatus
    )

    return NextResponse.json({
      success: true,
      data: validation,
      message: 'Status validation completed'
    })

  } catch (error) {
    console.error('Error in POST /api/projects/[id]/validate-status-change:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while validating the status change.',
      },
      { status: 500 }
    )
  }
}