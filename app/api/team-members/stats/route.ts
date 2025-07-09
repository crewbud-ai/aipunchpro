// ==============================================
// src/app/api/team-members/stats/route.ts - Team Member Statistics API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { TeamMemberDatabaseService } from '@/lib/database/services/team-members'

// ==============================================
// GET /api/team-members/stats - Get Team Member Statistics
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
          message: 'You must be logged in to view team member statistics.',
        },
        { status: 401 }
      )
    }

    // Create service instance
    const teamService = new TeamMemberDatabaseService(true, false)

    // Get comprehensive team member statistics
    const stats = await teamService.getTeamMemberStats(companyId)

    return NextResponse.json(
      {
        success: true,
        message: 'Team member statistics retrieved successfully',
        data: stats,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get team member statistics error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving team member statistics.',
      },
      { status: 500 }
    )
  }
}