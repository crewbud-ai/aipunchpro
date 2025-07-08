// ==============================================
// src/app/api/team-members/[id]/route.ts - Individual Team Member API Routes
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { 
  validateUpdateTeamMember,
  formatTeamMemberErrors,
} from '@/lib/validations/team/team-member'
import { TeamMemberDatabaseService } from '@/lib/database/services/team-members'
import { calculateTeamMemberStatus } from '@/lib/database/schema/project-members'

// ==============================================
// GET /api/team-members/[id] - Get Specific Team Member Details
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
          message: 'You must be logged in to view team member details.',
        },
        { status: 401 }
      )
    }

    const teamMemberId = params.id

    if (!teamMemberId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Team member ID is required.',
        },
        { status: 400 }
      )
    }

    // Create service instance
    const teamService = new TeamMemberDatabaseService(true, false)

    // Check if team member exists and belongs to company
    const teamMemberExists = await teamService.checkTeamMemberExists(teamMemberId, companyId)
    if (!teamMemberExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team member not found',
          message: 'The requested team member does not exist or you do not have access to view it.',
        },
        { status: 404 }
      )
    }

    // Get team member details with project assignments
    const teamMember = await teamService.getTeamMemberById(teamMemberId, companyId)

    if (!teamMember) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team member not found',
          message: 'The requested team member could not be found.',
        },
        { status: 404 }
      )
    }

    // Get project assignments history
    const projectAssignments = await teamService.getProjectAssignments(teamMemberId, companyId)

    // Calculate assignment status and project info
    const activeProjects = teamMember.project_memberships?.filter((pm: any) => pm.status === 'active') || []
    const assignmentStatus = calculateTeamMemberStatus(teamMember.is_active, activeProjects.length)

    const currentProjects = activeProjects.map((pm: any) => ({
      id: pm.project.id,
      name: pm.project.name,
      status: pm.status,
      priority: pm.project.priority,
      joinedAt: pm.joined_at,
      hourlyRate: pm.hourly_rate,
      overtimeRate: pm.overtime_rate,
      notes: pm.notes,
    }))

    // Transform project assignments history
    const assignmentHistory = projectAssignments.map((assignment: any) => ({
      id: assignment.id,
      projectId: assignment.project_id,
      projectName: assignment.project?.name,
      projectStatus: assignment.project?.status,
      projectPriority: assignment.project?.priority,
      status: assignment.status,
      hourlyRate: assignment.hourly_rate,
      overtimeRate: assignment.overtime_rate,
      notes: assignment.notes,
      joinedAt: assignment.joined_at,
      leftAt: assignment.left_at,
      createdAt: assignment.created_at,
    }))

    // Transform team member to clean structure
    const transformedTeamMember = {
      id: teamMember.id,
      firstName: teamMember.first_name,
      lastName: teamMember.last_name,
      email: teamMember.email,
      phone: teamMember.phone,
      role: teamMember.role,
      jobTitle: teamMember.job_title,
      tradeSpecialty: teamMember.trade_specialty,
      hourlyRate: teamMember.hourly_rate,
      overtimeRate: teamMember.overtime_rate,
      startDate: teamMember.start_date,
      certifications: teamMember.certifications,
      emergencyContactName: teamMember.emergency_contact_name,
      emergencyContactPhone: teamMember.emergency_contact_phone,
      isActive: teamMember.is_active,
      createdAt: teamMember.created_at,
      updatedAt: teamMember.updated_at,
      
      // Calculated fields
      assignmentStatus,
      activeProjectCount: activeProjects.length,
      currentProjects,
      assignmentHistory,
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Team member details retrieved successfully',
        data: {
          teamMember: transformedTeamMember,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get team member details error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving team member details.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// PUT /api/team-members/[id] - Update Team Member Details
// ==============================================
export async function PUT(
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
          message: 'You must be logged in to update team members.',
        },
        { status: 401 }
      )
    }

    const teamMemberId = params.id

    if (!teamMemberId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Team member ID is required.',
        },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Add ID to validation data
    const validationData = { ...body, id: teamMemberId }

    // Validate input data
    const validation = validateUpdateTeamMember(validationData)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formatTeamMemberErrors(validation.error),
        },
        { status: 400 }
      )
    }

    const updateData = validation.data

    // Create service instance
    const teamService = new TeamMemberDatabaseService(true, false)

    // Check if team member exists and belongs to company
    const teamMemberExists = await teamService.checkTeamMemberExists(teamMemberId, companyId)
    if (!teamMemberExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team member not found',
          message: 'The requested team member does not exist or you do not have access to update it.',
        },
        { status: 404 }
      )
    }

    // Check if email is taken by another user (if email is being updated)
    if (updateData.email) {
      const emailTaken = await teamService.isEmailTaken(updateData.email, companyId, teamMemberId)
      if (emailTaken) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already exists',
            details: [{ field: 'email', message: 'This email is already used by another team member' }],
          },
          { status: 409 }
        )
      }
    }

    // Remove ID from update data (not needed for update operation)
    const { id, ...updateFields } = updateData

    // Update team member
    const updatedTeamMember = await teamService.updateTeamMember(
      teamMemberId,
      companyId,
      updateFields
    )

    // Get updated team member with project assignments for response
    const teamMemberWithProjects = await teamService.getTeamMemberById(teamMemberId, companyId)
    
    // Calculate assignment status
    const activeProjects = teamMemberWithProjects?.project_memberships?.filter((pm: any) => pm.status === 'active') || []
    const assignmentStatus = calculateTeamMemberStatus(updatedTeamMember.is_active, activeProjects.length)

    // Transform response
    const transformedTeamMember = {
      id: updatedTeamMember.id,
      firstName: updatedTeamMember.first_name,
      lastName: updatedTeamMember.last_name,
      email: updatedTeamMember.email,
      phone: updatedTeamMember.phone,
      role: updatedTeamMember.role,
      jobTitle: updatedTeamMember.job_title,
      tradeSpecialty: updatedTeamMember.trade_specialty,
      hourlyRate: updatedTeamMember.hourly_rate,
      overtimeRate: updatedTeamMember.overtime_rate,
      startDate: updatedTeamMember.start_date,
      certifications: updatedTeamMember.certifications,
      emergencyContactName: updatedTeamMember.emergency_contact_name,
      emergencyContactPhone: updatedTeamMember.emergency_contact_phone,
      isActive: updatedTeamMember.is_active,
      createdAt: updatedTeamMember.created_at,
      updatedAt: updatedTeamMember.updated_at,
      
      // Calculated fields
      assignmentStatus,
      activeProjectCount: activeProjects.length,
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Team member updated successfully',
        data: {
          teamMember: transformedTeamMember,
        },
        notifications: {
          message: 'Team member information has been updated successfully.',
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Update team member error:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate entry',
            message: 'Email address already exists.',
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while updating the team member.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// DELETE /api/team-members/[id] - Deactivate Team Member
// ==============================================
export async function DELETE(
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
          message: 'You must be logged in to deactivate team members.',
        },
        { status: 401 }
      )
    }

    const teamMemberId = params.id

    if (!teamMemberId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Team member ID is required.',
        },
        { status: 400 }
      )
    }

    // Create service instance
    const teamService = new TeamMemberDatabaseService(true, false)

    // Check if team member exists and belongs to company
    const teamMemberExists = await teamService.checkTeamMemberExists(teamMemberId, companyId)
    if (!teamMemberExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team member not found',
          message: 'The requested team member does not exist or you do not have access to deactivate it.',
        },
        { status: 404 }
      )
    }

    // Prevent self-deactivation
    if (teamMemberId === userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot deactivate self',
          message: 'You cannot deactivate your own account.',
        },
        { status: 400 }
      )
    }

    // Deactivate team member (soft delete)
    await teamService.deactivateTeamMember(teamMemberId, companyId)

    return NextResponse.json(
      {
        success: true,
        message: 'Team member deactivated successfully',
        notifications: {
          message: 'Team member has been deactivated and removed from all active projects.',
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Deactivate team member error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while deactivating the team member.',
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