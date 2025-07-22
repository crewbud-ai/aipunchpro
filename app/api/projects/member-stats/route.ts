import { NextRequest, NextResponse } from 'next/server'
import { ProjectDatabaseService } from '@/lib/database/services/projects'

export async function GET(request: NextRequest) {
  try {
    // Get user info from middleware (following your existing pattern)
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')
    
    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to view project statistics.',
        },
        { status: 401 }
      )
    }

    // Create service instance (following your existing pattern)
    const projectService = new ProjectDatabaseService(true, false)

    // Get member project statistics
    const stats = await projectService.getMemberProjectStats(companyId, userId)

    return NextResponse.json(
      {
        success: true,
        message: 'Member project statistics retrieved successfully',
        data: stats,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get member project stats error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving project statistics.',
      },
      { status: 500 }
    )
  }
}