// ==============================================
// src/app/api/projects/stats/route.ts - Project Statistics API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { ProjectDatabaseService } from '@/lib/database/services/projects'

// ==============================================
// GET /api/projects/stats - Get Project Statistics
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
          message: 'You must be logged in to view project statistics.',
        },
        { status: 401 }
      )
    }

    // Create service instance
    const projectService = new ProjectDatabaseService(true, false)

    // Get comprehensive project statistics
    const stats = await projectService.getProjectStats(companyId)

    // Calculate additional metrics
    const currentDate = new Date()
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Return statistics
    return NextResponse.json(
      {
        success: true,
        message: 'Project statistics retrieved successfully',
        data: {
          overview: {
            totalProjects: stats.totalProjects,
            activeProjects: stats.activeProjects,
            completedProjects: stats.completedProjects,
            onHoldProjects: stats.onHoldProjects,
            planningProjects: stats.planningProjects,
          },
          budget: {
            totalBudget: stats.totalBudget,
            totalSpent: stats.totalSpent,
            remainingBudget: stats.remainingBudget,
            budgetUtilization: stats.budgetUtilization,
          },
          progress: {
            averageProgress: stats.averageProgress,
            projectsOnTime: 0, // TODO: Calculate based on deadlines
            projectsDelayed: 0, // TODO: Calculate based on deadlines
            projectsAhead: 0, // TODO: Calculate based on deadlines
          },
          timeline: {
            projectsStartingThisWeek: 0, // TODO: Calculate from start dates
            projectsEndingThisWeek: 0, // TODO: Calculate from end dates
            overdueTasks: 0, // TODO: Calculate from tasks
          },
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get project stats error:', error)

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

// ==============================================
// ALLOWED METHODS
// ==============================================
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}