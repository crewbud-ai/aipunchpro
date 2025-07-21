import { NextRequest, NextResponse } from 'next/server'
import { ProjectDatabaseService } from '@/lib/database/services/projects'
import { ScheduleProjectDatabaseService } from '@/lib/database/services/schedule-projects'
import { PunchlistItemDatabaseService } from '@/lib/database/services/punchlist-items'

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
          message: 'You must be logged in to view project status summary.',
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

    // Create service instances
    const projectService = new ProjectDatabaseService(true, false)
    const scheduleService = new ScheduleProjectDatabaseService(true, false)
    const punchlistService = new PunchlistItemDatabaseService(true, false)

    // Check if project exists
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

    // Get project details
    const project = await projectService.getProjectByIdEnhanced(projectId, companyId)
    
    // Get schedule projects summary
    const scheduleProjects = await scheduleService.getScheduleProjectsByProject(
      projectId,
      companyId
    )

    // Get punchlist summary
    const { data: punchlistItems } = await punchlistService.getPunchlistItemsByProject(
      projectId,
      companyId,
      { limit: 1000, offset: 0 } // Get all for summary
    )

    // Calculate summaries
    const scheduleSummary = scheduleProjects.reduce((acc, sp) => {
      acc[sp.status] = (acc[sp.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const punchlistSummary = punchlistItems.reduce((acc, pi) => {
      acc[pi.status] = (acc[pi.status] || 0) + 1
      acc[`priority_${pi.priority}`] = (acc[`priority_${pi.priority}`] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate project health metrics
    const totalSchedules = scheduleProjects.length
    const completedSchedules = scheduleSummary.completed || 0
    const scheduleCompletionRate = totalSchedules > 0 ? (completedSchedules / totalSchedules) * 100 : 0

    const totalPunchlist = punchlistItems.length
    const openPunchlist = (punchlistSummary.open || 0) + (punchlistSummary.assigned || 0) + (punchlistSummary.in_progress || 0)
    const criticalPunchlist = punchlistSummary.priority_critical || 0

    const summary = {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        progress: project.progress || 0
      },
      scheduleProjects: {
        total: totalSchedules,
        summary: scheduleSummary,
        completionRate: Math.round(scheduleCompletionRate)
      },
      punchlistItems: {
        total: totalPunchlist,
        open: openPunchlist,
        critical: criticalPunchlist,
        summary: punchlistSummary
      },
      healthIndicators: {
        scheduleOnTrack: scheduleCompletionRate >= 75,
        punchlistManageable: criticalPunchlist === 0 && openPunchlist <= 5,
        overallHealth: scheduleCompletionRate >= 75 && criticalPunchlist === 0 ? 'good' : 
                      scheduleCompletionRate >= 50 && criticalPunchlist <= 2 ? 'fair' : 'needs_attention'
      }
    }

    return NextResponse.json({
      success: true,
      data: summary,
      message: 'Project status summary retrieved successfully'
    })

  } catch (error) {
    console.error('Error in GET /api/projects/[id]/status-summary:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching project status summary.',
      },
      { status: 500 }
    )
  }
}