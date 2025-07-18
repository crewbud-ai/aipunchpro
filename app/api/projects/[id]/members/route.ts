// ==============================================
// src/app/api/projects/[id]/members/route.ts - Project Member Assignment API Routes (Corrected)
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { 
  validateProjectAssignment,
  formatTeamMemberErrors,
} from '@/lib/validations/team/team-member'
import { TeamMemberDatabaseService } from '@/lib/database/services/team-members'
import { ProjectDatabaseService } from '@/lib/database/services/projects'
import { AuthDatabaseService } from '@/lib/database/services/auth'
import { teamMemberEmailService } from '@/lib/email/services/team-members'
import { generateDashboardUrl } from '@/lib/email/utils/tokens'

// ==============================================
// GET /api/projects/[id]/members - Get Project Team Members
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
          message: 'You must be logged in to view project team members.',
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
    const teamService = new TeamMemberDatabaseService(true, false)

    // Check if project exists and belongs to company
    const projectExists = await projectService.checkProjectExists(projectId, companyId)
    if (!projectExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
          message: 'The requested project does not exist or you do not have access to view it.',
        },
        { status: 404 }
      )
    }

    // Get project team members
    const projectTeamMembers = await teamService.getProjectTeamMembers(projectId, companyId)

    // Transform team members to clean structure
    const transformedTeamMembers = projectTeamMembers.map((assignment: any) => ({
      // Assignment details
      assignmentId: assignment.id,
      status: assignment.status,
      hourlyRate: assignment.hourly_rate,
      overtimeRate: assignment.overtime_rate,
      notes: assignment.notes,
      joinedAt: assignment.joined_at,
      leftAt: assignment.left_at,
      
      // User details
      user: {
        id: assignment.user.id,
        firstName: assignment.user.first_name,
        lastName: assignment.user.last_name,
        email: assignment.user.email,
        role: assignment.user.role,
        jobTitle: assignment.user.job_title,
        tradeSpecialty: assignment.user.trade_specialty,
        defaultHourlyRate: assignment.user.hourly_rate,
        defaultOvertimeRate: assignment.user.overtime_rate,
        isActive: assignment.user.is_active,
      },
      
      // Effective rates (project override OR user default)
      effectiveHourlyRate: assignment.hourly_rate || assignment.user.hourly_rate,
      effectiveOvertimeRate: assignment.overtime_rate || assignment.user.overtime_rate,
    }))

    return NextResponse.json(
      {
        success: true,
        message: 'Project team members retrieved successfully',
        data: {
          projectTeamMembers: transformedTeamMembers,
          totalAssigned: transformedTeamMembers.length,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get project team members error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving project team members.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// POST /api/projects/[id]/members - Assign Team Member to Project (Updated with Email)
// ==============================================
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
          message: 'You must be logged in to assign team members to projects.',
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
    const body = await request.json()
    const teamMemberId = body.userId

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

    // Add projectId to validation data
    const validationData = { ...body, projectId, userId: teamMemberId }

    // Validate input data
    const validation = validateProjectAssignment(validationData)
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

    const assignmentData = validation.data

    // Create service instances
    const projectService = new ProjectDatabaseService(true, false)
    const teamService = new TeamMemberDatabaseService(true, false)
    const authService = new AuthDatabaseService(true, false)

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

    // Check if team member exists and belongs to company
    const teamMemberExists = await teamService.checkTeamMemberExists(teamMemberId, companyId)
    if (!teamMemberExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team member not found',
          message: 'The requested team member does not exist or you do not have access to assign them.',
        },
        { status: 404 }
      )
    }

    // Assign team member to project
    const projectAssignment = await teamService.assignToProject(
      teamMemberId,
      projectId,
      companyId,
      {
        hourlyRate: assignmentData.hourlyRate,
        overtimeRate: assignmentData.overtimeRate,
        notes: assignmentData.notes,
        status: assignmentData.status || 'active',
        assignedBy: userId,
      }
    )

    // Get user details for response
    const teamMember = await teamService.getTeamMemberById(teamMemberId, companyId)

    // ==============================================
    // SEND PROJECT ASSIGNMENT EMAIL
    // ==============================================
    try {
      // Get detailed information for email
      const project = await projectService.getProjectByIdEnhanced(projectId, companyId)
      const company = await authService.getCompanyById(companyId)
      const assigningUser = await authService.getUserById(userId)

      if (project && company && teamMember) {
        await teamMemberEmailService.sendProjectAssignmentEmail({
          email: teamMember.email,
          firstName: teamMember.first_name,
          lastName: teamMember.last_name,
          companyName: company.name,
          projectName: project.name,
          projectDescription: project.description,
          assignedBy: `${assigningUser?.first_name} ${assigningUser?.last_name}` || 'System Administrator',
          notes: assignmentData.notes,
          hourlyRate: assignmentData.hourlyRate || teamMember.hourly_rate,
          startDate: assignmentData.startDate || project.start_date,
          dashboardUrl: generateDashboardUrl(),
        })
      }
    } catch (emailError) {
      console.error('Failed to send project assignment email:', emailError)
      // Don't fail the entire request if email fails
    }

    // Transform response
    const transformedAssignment = {
      assignmentId: projectAssignment.id,
      projectId: projectAssignment.project_id,
      status: projectAssignment.status,
      hourlyRate: projectAssignment.hourly_rate,
      overtimeRate: projectAssignment.overtime_rate,
      notes: projectAssignment.notes,
      joinedAt: projectAssignment.joined_at,
      assignedBy: projectAssignment.assigned_by,
      createdAt: projectAssignment.created_at,
      
      user: {
        id: teamMember?.id,
        firstName: teamMember?.first_name,
        lastName: teamMember?.last_name,
        email: teamMember?.email,
        role: teamMember?.role,
        jobTitle: teamMember?.job_title,
        tradeSpecialty: teamMember?.trade_specialty,
        defaultHourlyRate: teamMember?.hourly_rate,
        defaultOvertimeRate: teamMember?.overtime_rate,
      },
      
      // Effective rates (project override OR user default)
      effectiveHourlyRate: projectAssignment.hourly_rate || teamMember?.hourly_rate,
      effectiveOvertimeRate: projectAssignment.overtime_rate || teamMember?.overtime_rate,
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Team member assigned to project successfully',
        data: {
          assignment: transformedAssignment,
        },
        notifications: {
          message: `${teamMember?.first_name} ${teamMember?.last_name} has been assigned to the project and can now access project tasks and resources. They have been notified via email.`,
        },
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Assign team member to project error:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('User is already assigned')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Assignment conflict',
            message: 'This team member is already assigned to the project.',
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while assigning the team member to the project.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// DELETE /api/projects/[id]/members - Remove Team Member from Project (Updated with Email)
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
          message: 'You must be logged in to remove team members from projects.',
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

    // Parse userId and reason from query params (since DELETE requests typically don't have body)
    const url = new URL(request.url)
    const teamMemberId = url.searchParams.get('userId')
    const reason = url.searchParams.get('reason')
    const lastWorkingDay = url.searchParams.get('lastWorkingDay')

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

    // Create service instances
    const projectService = new ProjectDatabaseService(true, false)
    const teamService = new TeamMemberDatabaseService(true, false)
    const authService = new AuthDatabaseService(true, false)

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

    // Check if team member exists and belongs to company
    const teamMemberExists = await teamService.checkTeamMemberExists(teamMemberId, companyId)
    if (!teamMemberExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team member not found',
          message: 'The requested team member does not exist or you do not have access to manage them.',
        },
        { status: 404 }
      )
    }

    // Get team member details for response message
    const teamMember = await teamService.getTeamMemberById(teamMemberId, companyId)

    // Remove team member from project
    await teamService.removeFromProject(teamMemberId, projectId, companyId)

    // ==============================================
    // SEND PROJECT REMOVAL EMAIL
    // ==============================================
    try {
      // Get detailed information for email
      const project = await projectService.getProjectByIdEnhanced(projectId, companyId)
      const company = await authService.getCompanyById(companyId)
      const removingUser = await authService.getUserById(userId)

      if (project && company && teamMember) {
        await teamMemberEmailService.sendProjectRemovalEmail({
          email: teamMember.email,
          firstName: teamMember.first_name,
          lastName: teamMember.last_name,
          companyName: company.name,
          projectName: project.name,
          removedBy: `${removingUser?.first_name} ${removingUser?.last_name}` || 'System Administrator',
          reason: reason || 'Project assignment ended',
          lastWorkingDay: lastWorkingDay || new Date().toISOString(),
          dashboardUrl: generateDashboardUrl(),
        })
      }
    } catch (emailError) {
      console.error('Failed to send project removal email:', emailError)
      // Don't fail the entire request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Team member removed from project successfully',
        notifications: {
          message: `${teamMember?.first_name} ${teamMember?.last_name} has been removed from the project and will no longer have access to project resources. They have been notified via email.`,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Remove team member from project error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while removing the team member from the project.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// PUT /api/projects/[id]/members - Update Project Assignment
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
          message: 'You must be logged in to update project assignments.',
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
    const body = await request.json()
    const { userId: teamMemberId, ...updateData } = body

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

    // Create service instances
    const projectService = new ProjectDatabaseService(true, false)
    const teamService = new TeamMemberDatabaseService(true, false)

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

    // Check if team member exists and belongs to company
    const teamMemberExists = await teamService.checkTeamMemberExists(teamMemberId, companyId)
    if (!teamMemberExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team member not found',
          message: 'The requested team member does not exist or you do not have access to manage them.',
        },
        { status: 404 }
      )
    }

    // Update project assignment
    const updatedAssignment = await teamService.updateProjectAssignment(
      teamMemberId,
      projectId,
      companyId,
      {
        hourlyRate: updateData.hourlyRate,
        overtimeRate: updateData.overtimeRate,
        notes: updateData.notes,
        status: updateData.status,
      }
    )

    // Get team member details for response
    const teamMember = await teamService.getTeamMemberById(teamMemberId, companyId)

    // Transform response
    const transformedAssignment = {
      assignmentId: updatedAssignment.id,
      projectId: updatedAssignment.project_id,
      status: updatedAssignment.status,
      hourlyRate: updatedAssignment.hourly_rate,
      overtimeRate: updatedAssignment.overtime_rate,
      notes: updatedAssignment.notes,
      joinedAt: updatedAssignment.joined_at,
      updatedAt: updatedAssignment.updated_at,
      
      user: {
        id: teamMember?.id,
        firstName: teamMember?.first_name,
        lastName: teamMember?.last_name,
        email: teamMember?.email,
        role: teamMember?.role,
        jobTitle: teamMember?.job_title,
        tradeSpecialty: teamMember?.trade_specialty,
        defaultHourlyRate: teamMember?.hourly_rate,
        defaultOvertimeRate: teamMember?.overtime_rate,
      },
      
      // Effective rates (project override OR user default)
      effectiveHourlyRate: updatedAssignment.hourly_rate || teamMember?.hourly_rate,
      effectiveOvertimeRate: updatedAssignment.overtime_rate || teamMember?.overtime_rate,
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Project assignment updated successfully',
        data: {
          assignment: transformedAssignment,
        },
        notifications: {
          message: `Project assignment for ${teamMember?.first_name} ${teamMember?.last_name} has been updated successfully.`,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Update project assignment error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while updating the project assignment.',
      },
      { status: 500 }
    )
  }
}