// ==============================================
// src/app/api/team-members/[id]/route.ts - Individual Team Member API Routes (Updated with Email Integration)
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateUpdateTeamMember,
  formatTeamMemberErrors,
} from '@/lib/validations/team/team-member'
import { TeamMemberDatabaseService } from '@/lib/database/services/team-members'
import { AuthDatabaseService } from '@/lib/database/services/auth'
import { calculateTeamMemberStatus } from '@/lib/database/schema/project-members'
import { teamMemberEmailService } from '@/lib/email/services/team-members'
import { generateSecurePassword, generateLoginUrl, generateDashboardUrl } from '@/lib/email/utils/tokens'

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

    // Transform for frontend
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

      // Project assignments
      currentProjects: teamMember.project_memberships?.filter((pm: any) => pm.status === 'active').map((pm: any) => ({
        id: pm.project?.id,
        name: pm.project?.name,
        status: pm.project?.status,
        priority: pm.project?.priority,
        role: pm.role,
        hourlyRate: pm.hourly_rate,
        overtimeRate: pm.overtime_rate,
        notes: pm.notes,
        joinedAt: pm.joined_at,
        leftAt: pm.left_at,
      })) || [],

      // Calculate assignment status
      assignmentStatus: calculateTeamMemberStatus(teamMember.is_active, teamMember.project_memberships?.filter((pm: any) => pm.status === 'active').length || 0),
      activeProjectCount: teamMember.project_memberships?.filter((pm: any) => pm.status === 'active').length || 0,
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
    console.error('Get team member error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving the team member.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// PUT /api/team-members/[id] - Update Team Member Details
// ==============================================
// ==============================================
// PUT /api/team-members/[id] - Update Team Member Details (With Project Assignment)
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

    // Create service instances
    const teamService = new TeamMemberDatabaseService(true, false)
    const authService = new AuthDatabaseService(true, false)

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

    // Get original team member data before update
    const originalTeamMember = await teamService.getTeamMemberById(teamMemberId, companyId)

    // Update team member basic information
    const updatedTeamMember = await teamService.updateTeamMember(teamMemberId, companyId, {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      email: updateData.email,
      phone: updateData.phone,
      role: updateData.role,
      jobTitle: updateData.jobTitle,
      tradeSpecialty: updateData.tradeSpecialty,
      hourlyRate: updateData.hourlyRate,
      overtimeRate: updateData.overtimeRate,
      startDate: updateData.startDate,
      certifications: updateData.certifications,
      emergencyContactName: updateData.emergencyContactName,
      emergencyContactPhone: updateData.emergencyContactPhone,
      isActive: updateData.isActive,
    })

    // ==============================================
    // HANDLE PROJECT ASSIGNMENT (NEW LOGIC)
    // ==============================================
    let projectAssignment: any = null
    let projectDetails: any = null

    // Check if project assignment is included in the update
    if (body.assignToProject && body.projectId) {

      try {
        // Get project details
        projectDetails = await teamService.getBasicProjectInfo(body.projectId, companyId)

        if (!projectDetails) {
          return NextResponse.json({
            success: false,
            error: 'Project not found',
            message: 'The specified project could not be found.',
          }, { status: 404 })
        }

        // Check if user is already assigned to this project
        const existingAssignment = await teamService.checkProjectAssignment(teamMemberId, body.projectId, companyId)

        if (existingAssignment) {
          // Update existing assignment
          projectAssignment = await teamService.updateProjectAssignment(teamMemberId, body.projectId, companyId, {
            hourlyRate: body.projectHourlyRate,
            overtimeRate: body.projectOvertimeRate,
            notes: body.projectNotes,
            status: 'active',
          })
        } else {
          // Create new project assignment
          projectAssignment = await teamService.assignToProject(teamMemberId, body.projectId, companyId, {
            hourlyRate: body.projectHourlyRate,
            overtimeRate: body.projectOvertimeRate,
            notes: body.projectNotes,
            status: 'active',
            assignedBy: userId,
          })
        }

        // ==============================================
        // SEND PROJECT ASSIGNMENT EMAIL
        // ==============================================
        try {
          const company = await authService.getCompanyById(companyId)
          const assigningUser = await authService.getUserById(userId)

          if (company && projectDetails) {
            await teamMemberEmailService.sendProjectAssignmentEmail({
              email: updatedTeamMember.email,
              firstName: updatedTeamMember.first_name,
              lastName: updatedTeamMember.last_name,
              companyName: company.name,
              projectName: projectDetails.name,
              assignedBy: `${assigningUser?.first_name} ${assigningUser?.last_name}` || 'System Administrator',
              hourlyRate: body.projectHourlyRate,
              notes: body.projectNotes,
              dashboardUrl: generateDashboardUrl(),
            })
          }
        } catch (emailError) {
          console.error('Failed to send project assignment email:', emailError)
          // Don't fail the entire request if email fails
        }

      } catch (error) {
        console.error('Error handling project assignment:', error)
        // Don't fail the entire update if project assignment fails
      }
    }

    // Transform for frontend response
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
    }

    // Build response data
    const responseData: any = {
      teamMember: transformedTeamMember,
    }

    // Add project assignment details if created/updated
    if (projectAssignment) {
      responseData.projectAssignment = {
        id: projectAssignment.id,
        projectId: projectAssignment.project_id,
        status: projectAssignment.status,
        hourlyRate: projectAssignment.hourly_rate,
        overtimeRate: projectAssignment.overtime_rate,
        notes: projectAssignment.notes,
        joinedAt: projectAssignment.joined_at,
      }
    }

    // Build success message
    const message = projectAssignment
      ? 'Team member updated successfully and assigned to project'
      : 'Team member updated successfully'

    const notifications = projectAssignment
      ? {
        message: `Team member details have been updated and they have been assigned to the project. They will be notified via email.`
      }
      : {
        message: `Team member details have been updated successfully.`
      }

    return NextResponse.json(
      {
        success: true,
        message,
        data: responseData,
        notifications,
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

      if (error.message.includes('User is already assigned')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Assignment conflict',
            message: 'User is already assigned to this project.',
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
// DELETE /api/team-members/[id]
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
          message: 'You must be logged in to delete team members.',
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

    // Create service instances
    const teamService = new TeamMemberDatabaseService(true, false)
    const authService = new AuthDatabaseService(true, false)

    // Check if team member exists and belongs to company
    const teamMemberExists = await teamService.checkTeamMemberExists(teamMemberId, companyId)
    if (!teamMemberExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team member not found',
          message: 'The requested team member does not exist or you do not have access to delete it.',
        },
        { status: 404 }
      )
    }

    // Prevent self-deletion
    if (teamMemberId === userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete self',
          message: 'You cannot delete your own account.',
        },
        { status: 400 }
      )
    }

    // Get team member details before deletion for email notification
    const teamMember = await teamService.getTeamMemberById(teamMemberId, companyId)
    const company = await authService.getCompanyById(companyId)
    const deletingUser = await authService.getUserById(userId)

    if (!teamMember || !company) {
      return NextResponse.json(
        {
          success: false,
          error: 'Required data not found',
          message: 'Unable to retrieve team member or company information.',
        },
        { status: 404 }
      )
    }

    // ==============================================
    // SEND DELETION NOTIFICATION EMAIL FIRST
    // ==============================================
    try {
      await teamMemberEmailService.sendAccountDeactivationEmail({
        email: teamMember.email,
        firstName: teamMember.first_name,
        lastName: teamMember.last_name,
        companyName: company.name,
        deactivatedBy: `${deletingUser?.first_name} ${deletingUser?.last_name}` || 'System Administrator',
        reason: 'Account has been permanently deleted by administrator',
        lastWorkingDay: new Date().toISOString(),
        contactEmail: company.contact_email || undefined,
      })
    } catch (emailError) {
      console.error('Failed to send deletion email:', emailError)
      // Don't fail the entire request if email fails
    }

    // ==============================================
    // PERMANENTLY DELETE TEAM MEMBER
    // ==============================================

    // First, remove from all active projects
    await teamService.removeFromAllProjects(teamMemberId, companyId)

    // Then, permanently delete the team member from the database
    await teamService.permanentlyDeleteTeamMember(teamMemberId, companyId)

    return NextResponse.json(
      {
        success: true,
        message: 'Team member deleted permanently',
        notifications: {
          message: 'Team member has been permanently deleted from the system. All associated data has been removed.',
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete team member error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while deleting the team member.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// POST /api/team-members/[id]/reactivate - Reactivate Team Member (New Endpoint with Email)
// ==============================================
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if this is a reactivation request
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action !== 'reactivate') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      )
    }

    // Get user info from middleware
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')

    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to reactivate team members.',
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

    // Parse request body for any notes
    const body = await request.json()
    const { notes } = body

    // Create service instances
    const teamService = new TeamMemberDatabaseService(true, false)
    const authService = new AuthDatabaseService(true, false)

    // Check if team member exists
    const teamMember = await teamService.getTeamMemberById(teamMemberId, companyId)
    if (!teamMember) {
      return NextResponse.json(
        {
          success: false,
          error: 'Team member not found',
          message: 'The requested team member does not exist.',
        },
        { status: 404 }
      )
    }

    // Check if already active
    if (teamMember.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: 'Already active',
          message: 'This team member is already active.',
        },
        { status: 400 }
      )
    }

    // Get company and reactivating user details
    const company = await authService.getCompanyById(companyId)
    const reactivatingUser = await authService.getUserById(userId)

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: 'Company not found',
          message: 'Company information could not be retrieved.',
        },
        { status: 404 }
      )
    }

    // Generate new temporary password
    const temporaryPassword = generateSecurePassword()

    // Reactivate team member
    await teamService.reactivateTeamMember(teamMemberId, companyId, {
      reactivatedBy: userId,
      temporaryPassword,
    })


    // ==========================================
    // SET PASSWORD CHANGE REQUIREMENT FLAG
    // ==========================================
    try {
      await authService.setRequiresPasswordChange(teamMemberId, true)
    } catch (flagError) {
      // Log error but don't fail the entire request
      console.error('Failed to set password change requirement on reactivation:', flagError)
    }

    // ==============================================
    // SEND REACTIVATION EMAIL
    // ==============================================
    try {
      await teamMemberEmailService.sendAccountReactivationEmail({
        email: teamMember.email,
        firstName: teamMember.first_name,
        lastName: teamMember.last_name,
        companyName: company.name,
        reactivatedBy: `${reactivatingUser?.first_name} ${reactivatingUser?.last_name}` || 'System Administrator',
        temporaryPassword,
        notes,
        loginUrl: generateLoginUrl(),
      })
    } catch (emailError) {
      console.error('Failed to send reactivation email:', emailError)
      // Don't fail the entire request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Team member reactivated successfully',
        notifications: {
          message: 'Team member has been reactivated and can now access their account. They have been sent login instructions via email.',
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Reactivate team member error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while reactivating the team member.',
      },
      { status: 500 }
    )
  }
}