// ==============================================
// src/app/api/projects/stats/route.ts - Enhanced Project Statistics API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { ProjectDatabaseService } from '@/lib/database/services/projects'

// ==============================================
// GET /api/projects/stats - Get Enhanced Project Statistics
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

    // Get projects with location data for geographic insights
    const projectsWithLocations = await projectService.getProjectsWithCoordinates(companyId)

    // Calculate location-based statistics
    const locationStats = {
      totalProjectsWithLocation: projectsWithLocations.length,
      stateDistribution: {} as Record<string, number>,
      cityDistribution: {} as Record<string, number>,
    }

    projectsWithLocations.forEach(project => {
      if (project.location?.state) {
        locationStats.stateDistribution[project.location.state] = 
          (locationStats.stateDistribution[project.location.state] || 0) + 1
      }
      if (project.location?.city) {
        locationStats.cityDistribution[project.location.city] = 
          (locationStats.cityDistribution[project.location.city] || 0) + 1
      }
    })

    // Get client-based statistics
    const clientStats = await projectService.getClientStats(companyId)

    // Calculate budget utilization by status
    const budgetByStatus = await projectService.getBudgetStatsByStatus(companyId)

    // Return enhanced statistics using only available data
    return NextResponse.json(
      {
        success: true,
        message: 'Project statistics retrieved successfully',
        data: {
          overview: {
            totalProjects: stats.totalProjects,
            activeProjects: stats.byStatus.in_progress || 0,
            completedProjects: stats.byStatus.completed || 0,
            onHoldProjects: stats.byStatus.on_hold || 0,
            notStartedProjects: stats.byStatus.not_started || 0,
            cancelledProjects: stats.byStatus.cancelled || 0,
          },
          
          statusBreakdown: {
            not_started: stats.byStatus.not_started || 0,
            in_progress: stats.byStatus.in_progress || 0,
            on_track: stats.byStatus.on_track || 0,
            ahead_of_schedule: stats.byStatus.ahead_of_schedule || 0,
            behind_schedule: stats.byStatus.behind_schedule || 0,
            on_hold: stats.byStatus.on_hold || 0,
            completed: stats.byStatus.completed || 0,
            cancelled: stats.byStatus.cancelled || 0,
          },
          
          priorityBreakdown: {
            low: stats.byPriority.low || 0,
            medium: stats.byPriority.medium || 0,
            high: stats.byPriority.high || 0,
            urgent: stats.byPriority.urgent || 0,
          },

          budget: {
            totalBudget: stats.totalBudget || 0,
            totalSpent: stats.totalSpent || 0,
            remainingBudget: (stats.totalBudget || 0) - (stats.totalSpent || 0),
            budgetUtilization: stats.totalBudget ? 
              Math.round(((stats.totalSpent || 0) / stats.totalBudget) * 100) : 0,
            averageProjectBudget: stats.totalProjects > 0 ? 
              Math.round((stats.totalBudget || 0) / stats.totalProjects) : 0,
            budgetByStatus: budgetByStatus,
          },

          progress: {
            averageProgress: stats.averageProgress || 0,
            // Calculate additional progress metrics from available data
            totalEstimatedHours: stats.totalEstimatedHours || 0,
            totalActualHours: stats.totalActualHours || 0,
            hoursEfficiency: stats.totalEstimatedHours > 0 ? 
              Math.round(((stats.totalActualHours || 0) / stats.totalEstimatedHours) * 100) : 0,
          },

          geography: {
            totalProjectsWithLocation: locationStats.totalProjectsWithLocation,
            stateDistribution: locationStats.stateDistribution,
            cityDistribution: locationStats.cityDistribution,
            topStates: Object.entries(locationStats.stateDistribution)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([state, count]) => ({ state, count })),
            topCities: Object.entries(locationStats.cityDistribution)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([city, count]) => ({ city, count })),
          },

          clients: {
            totalUniqueClients: clientStats.totalUniqueClients || 0,
            clientsWithMultipleProjects: clientStats.clientsWithMultipleProjects || 0,
            topClients: clientStats.topClients || [],
            projectsWithoutClient: clientStats.projectsWithoutClient || 0,
          },

          // Simplified metrics using available data
          summary: {
            averageProjectBudget: stats.totalProjects > 0 ? 
              Math.round((stats.totalBudget || 0) / stats.totalProjects) : 0,
            budgetEfficiency: stats.totalBudget > 0 ? 
              Math.round(((stats.totalSpent || 0) / stats.totalBudget) * 100) : 0,
            completionRate: stats.totalProjects > 0 ? 
              Math.round((stats.byStatus.completed || 0) / stats.totalProjects * 100) : 0,
            activeProjectsRate: stats.totalProjects > 0 ? 
              Math.round(((stats.byStatus.in_progress || 0) + (stats.byStatus.on_track || 0)) / stats.totalProjects * 100) : 0,
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