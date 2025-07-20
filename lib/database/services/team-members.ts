// ==============================================
// src/lib/database/services/team-members.ts - Team Member Database Service
// ==============================================

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'
import type {
    User,
    NewUser,
    ProjectMember,
    NewProjectMember,
    TeamMemberWithProjects,
    ProjectMemberWithUser
} from '@/lib/database/schema'
import { calculateTeamMemberStatus } from '@/lib/database/schema/project-members'
import { DEFAULT_PERMISSIONS } from '@/lib/database/schema/users'
import bcrypt from 'bcryptjs'

export class TeamMemberDatabaseService {
    private supabaseClient: ReturnType<typeof createServerClient>

    constructor(isServer = false, isAdmin = false) {
        if (isServer && isAdmin) {
            this.supabaseClient = createAdminClient()
        } else if (isServer) {
            this.supabaseClient = createServerClient()
        } else {
            this.supabaseClient = createBrowserClient()
        }
    }

    // Add this private method to hash passwords
    private async hashPassword(password: string): Promise<string> {
        const saltRounds = 12
        return await bcrypt.hash(password, saltRounds)
    }

    // ==============================================
    // TEAM MEMBER CRUD OPERATIONS
    // ==============================================

    async createTeamMember(data: {
        companyId: string
        firstName: string
        lastName: string
        email: string
        phone?: string
        role?: 'super_admin' | 'admin' | 'supervisor' | 'member'
        jobTitle?: string
        tradeSpecialty?: string
        hourlyRate?: number
        overtimeRate?: number
        startDate?: string
        certifications?: string
        emergencyContactName?: string
        emergencyContactPhone?: string
        isActive?: boolean
        temporaryPassword?: string
    }) {
        // Get default permissions for role
        const permissions = DEFAULT_PERMISSIONS[data.role || 'member'] || DEFAULT_PERMISSIONS.member

        // Hash the temporary password if provided
        let passwordHash: string | null = null
        if (data.temporaryPassword) {
            passwordHash = await this.hashPassword(data.temporaryPassword)
        }

        const { data: user, error } = await this.supabaseClient
            .from('users')
            .insert([{
                company_id: data.companyId,
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email,
                phone: data.phone,
                role: data.role || 'member',
                permissions: permissions,
                password_hash: passwordHash,
                email_verified: true,
                job_title: data.jobTitle,
                trade_specialty: data.tradeSpecialty,
                hourly_rate: data.hourlyRate,
                overtime_rate: data.overtimeRate,
                start_date: data.startDate,
                certifications: data.certifications,
                emergency_contact_name: data.emergencyContactName,
                emergency_contact_phone: data.emergencyContactPhone,
                is_active: data.isActive !== undefined ? data.isActive : true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }])
            .select()
            .single()

        if (error) throw error
        return user
    }

    async createTeamMemberWithProjectAssignment(data: {
        // User data
        companyId: string
        firstName: string
        lastName: string
        email: string
        phone?: string
        role?: 'super_admin' | 'admin' | 'supervisor' | 'member'
        jobTitle?: string
        tradeSpecialty?: string
        hourlyRate?: number
        overtimeRate?: number
        startDate?: string
        certifications?: string
        emergencyContactName?: string
        emergencyContactPhone?: string
        isActive?: boolean
        temporaryPassword?: string

        // Project assignment data
        projectId: string
        projectHourlyRate?: number
        projectOvertimeRate?: number
        assignmentNotes?: string
        assignmentStatus?: 'active' | 'inactive'
        assignedBy: string
    }) {

        // Hash the temporary password if provided
        let passwordHash: string | null = null
        if (data.temporaryPassword) {
            passwordHash = await this.hashPassword(data.temporaryPassword)
        }

        // First create the user
        const newUser = await this.createTeamMember({
            companyId: data.companyId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            role: data.role,
            jobTitle: data.jobTitle,
            tradeSpecialty: data.tradeSpecialty,
            hourlyRate: data.hourlyRate,
            overtimeRate: data.overtimeRate,
            startDate: data.startDate,
            certifications: data.certifications,
            emergencyContactName: data.emergencyContactName,
            emergencyContactPhone: data.emergencyContactPhone,
            isActive: data.isActive,
            temporaryPassword: data.temporaryPassword,
        })

        // Then assign to project
        const projectAssignment = await this.assignToProject(
            newUser.id,
            data.projectId,
            data.companyId,
            {
                hourlyRate: data.projectHourlyRate,
                overtimeRate: data.projectOvertimeRate,
                notes: data.assignmentNotes,
                status: data.assignmentStatus || 'active',
                assignedBy: data.assignedBy,
            }
        )

        return {
            user: newUser,
            projectAssignment
        }
    }

    async getTeamMemberById(userId: string, companyId: string) {
        const { data: user, error } = await this.supabaseClient
            .from('users')
            .select(`
                *,
                project_memberships:project_members!project_members_user_id_users_id_fk(
                    id,
                    project_id,
                    status,
                    hourly_rate,
                    overtime_rate,
                    notes,
                    joined_at,
                    left_at,
                    project:projects(
                    id,
                    name,
                    status,
                    priority
                    )
                )
            `)
            .eq('id', userId)
            .eq('company_id', companyId)
            .single()

        if (error && error.code !== 'PGRST116') {
            throw error
        }

        return user
    }

    async getTeamMembersByCompany(
        companyId: string,
        options: {
            role?: 'super_admin' | 'admin' | 'supervisor' | 'member'
            status?: 'active' | 'inactive' | 'all'
            assignmentStatus?: 'not_assigned' | 'assigned' | 'inactive'
            tradeSpecialty?: string
            projectId?: string
            limit?: number
            offset?: number
            search?: string
            sortBy?: 'first_name' | 'last_name' | 'email' | 'role' | 'trade_specialty' | 'hourly_rate' | 'start_date' | 'created_at'
            sortOrder?: 'asc' | 'desc'
        } = {}
    ) {
        // FIXED: Specify the exact foreign key relationship to avoid ambiguity
        let query = this.supabaseClient
            .from('users')
            .select(`
                *,
                project_memberships:project_members!project_members_user_id_users_id_fk(
                    id,
                    project_id,
                    status,
                    hourly_rate,
                    overtime_rate,
                    notes,
                    joined_at,
                    project:projects(
                    id,
                    name,
                    status,
                    priority
                )
            )
        `, { count: 'exact' })
            .eq('company_id', companyId)
            .neq('role', 'super_admin')

        // Apply filters
        if (options.role) {
            query = query.eq('role', options.role)
        }

        if (options.status && options.status !== 'all') {
            query = query.eq('is_active', options.status === 'active')
        }

        if (options.tradeSpecialty) {
            query = query.eq('trade_specialty', options.tradeSpecialty)
        }

        if (options.search) {
            query = query.or(`
      first_name.ilike.%${options.search}%,
      last_name.ilike.%${options.search}%,
      email.ilike.%${options.search}%,
      job_title.ilike.%${options.search}%,
      trade_specialty.ilike.%${options.search}%
    `.replace(/\s+/g, ''))
        }

        // Apply sorting
        const sortBy = options.sortBy || 'created_at'
        const sortOrder = options.sortOrder || 'desc'
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })

        // Apply pagination
        if (options.limit) {
            query = query.limit(options.limit)
        }

        if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
        }

        const { data: users, error, count } = await query

        if (error) throw error

        return {
            teamMembers: users || [],
            total: count || 0
        }
    }

    async permanentlyDeleteTeamMember(userId: string, companyId: string) {
        // First, delete all project memberships (both active and inactive)
        const { error: projectMembersError } = await this.supabaseClient
            .from('project_members')
            .delete()
            .eq('user_id', userId)
            .eq('company_id', companyId)

        if (projectMembersError) throw projectMembersError

        // Then, delete the user record permanently
        const { error: userError } = await this.supabaseClient
            .from('users')
            .delete()
            .eq('id', userId)
            .eq('company_id', companyId)

        if (userError) throw userError
        return true
    }

    async updateTeamMember(
        userId: string,
        companyId: string,
        data: {
            firstName?: string
            lastName?: string
            email?: string
            phone?: string
            role?: 'super_admin' | 'admin' | 'supervisor' | 'member'
            jobTitle?: string
            tradeSpecialty?: string
            hourlyRate?: number
            overtimeRate?: number
            startDate?: string
            certifications?: string
            emergencyContactName?: string
            emergencyContactPhone?: string
            isActive?: boolean
            notes?: string
        }
    ) {
        const updateData: any = {
            updated_at: new Date().toISOString(),
        }

        // Only include fields that are provided
        if (data.firstName !== undefined) updateData.first_name = data.firstName
        if (data.lastName !== undefined) updateData.last_name = data.lastName
        if (data.email !== undefined) updateData.email = data.email
        if (data.phone !== undefined) updateData.phone = data.phone
        if (data.role !== undefined) {
            updateData.role = data.role
            // Update permissions when role changes
            updateData.permissions = DEFAULT_PERMISSIONS[data.role] || DEFAULT_PERMISSIONS.member
        }
        if (data.jobTitle !== undefined) updateData.job_title = data.jobTitle
        if (data.tradeSpecialty !== undefined) updateData.trade_specialty = data.tradeSpecialty
        if (data.hourlyRate !== undefined) updateData.hourly_rate = data.hourlyRate
        if (data.overtimeRate !== undefined) updateData.overtime_rate = data.overtimeRate
        if (data.startDate !== undefined) updateData.start_date = data.startDate
        if (data.certifications !== undefined) updateData.certifications = data.certifications
        if (data.emergencyContactName !== undefined) updateData.emergency_contact_name = data.emergencyContactName
        if (data.emergencyContactPhone !== undefined) updateData.emergency_contact_phone = data.emergencyContactPhone
        if (data.isActive !== undefined) updateData.is_active = data.isActive
        if (data.notes !== undefined) updateData.notes = data.notes

        const { data: user, error } = await this.supabaseClient
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .eq('company_id', companyId)
            .select()
            .single()

        if (error) throw error
        return user
    }

    async deactivateTeamMember(userId: string, companyId: string) {
        // Set user as inactive and set left_at for all active project assignments
        const now = new Date().toISOString()

        // Update user status
        const { error: userError } = await this.supabaseClient
            .from('users')
            .update({
                is_active: false,
                updated_at: now,
            })
            .eq('id', userId)
            .eq('company_id', companyId)

        if (userError) throw userError

        // Update all active project assignments
        const { error: projectError } = await this.supabaseClient
            .from('project_members')
            .update({
                status: 'inactive',
                left_at: now.split('T')[0], // Date only
                updated_at: now,
            })
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .eq('status', 'active')

        if (projectError) throw projectError

        return true
    }

    async reactivateTeamMember(
        userId: string,
        companyId: string,
        data: {
            reactivatedBy: string
            temporaryPassword: string
        }
    ) {

        // Hash the new temporary password
        const passwordHash = await this.hashPassword(data.temporaryPassword)

        // Update user status
        const { data: user, error } = await this.supabaseClient
            .from('users')
            .update({
                is_active: true,
                password_hash: passwordHash,
                email_verified: true,
                updated_at: new Date().toISOString(),
                // Note: You might want to add a password hash field here
                // password_hash: await bcrypt.hash(data.temporaryPassword, 12),
            })
            .eq('id', userId)
            .eq('company_id', companyId)
            .select()
            .single()

        if (error) throw error
        return user
    }

    async updateProjectAssignment(
        userId: string,
        projectId: string,
        companyId: string,
        data: {
            hourlyRate?: number
            overtimeRate?: number
            notes?: string
            status?: 'active' | 'inactive'
        }
    ) {
        const { data: updated, error } = await this.supabaseClient
            .from('project_members')
            .update({
                hourly_rate: data.hourlyRate,
                overtime_rate: data.overtimeRate,
                notes: data.notes,
                status: data.status || 'active',
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .eq('company_id', companyId)
            .select()
            .single()

        if (error) throw error
        return updated
    }

    async getBasicProjectInfo(projectId: string, companyId: string) {
        const { data, error } = await this.supabaseClient
            .from('projects')
            .select('id, name, description')
            .eq('id', projectId)
            .eq('company_id', companyId)
            .single()

        if (error && error.code !== 'PGRST116') {
            throw error
        }

        return data
    }


    // ==============================================
    // PROJECT ASSIGNMENT OPERATIONS
    // ==============================================

    async assignToProject(
        userId: string,
        projectId: string,
        companyId: string,
        data: {
            hourlyRate?: number
            overtimeRate?: number
            notes?: string
            status?: 'active' | 'inactive'
            assignedBy: string
        }
    ) {
        // Check if user is already assigned to this project
        const { data: existing } = await this.supabaseClient
            .from('project_members')
            .select('id, status')
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .eq('company_id', companyId)
            .single()

        if (existing) {
            if (existing.status === 'active') {
                throw new Error('User is already assigned to this project')
            } else {
                // Reactivate existing assignment
                const { data: reactivated, error } = await this.supabaseClient
                    .from('project_members')
                    .update({
                        status: data.status || 'active',
                        hourly_rate: data.hourlyRate,
                        overtime_rate: data.overtimeRate,
                        notes: data.notes,
                        left_at: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id)
                    .select()
                    .single()

                if (error) throw error
                return reactivated
            }
        }

        // Create new assignment
        const { data: assignment, error } = await this.supabaseClient
            .from('project_members')
            .insert([{
                company_id: companyId,
                project_id: projectId,
                user_id: userId,
                hourly_rate: data.hourlyRate,
                overtime_rate: data.overtimeRate,
                notes: data.notes,
                status: data.status || 'active',
                assigned_by: data.assignedBy,
                joined_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }])
            .select()
            .single()

        if (error) throw error
        return assignment
    }

    async removeFromProject(userId: string, projectId: string, companyId: string) {
        const { error } = await this.supabaseClient
            .from('project_members')
            .update({
                status: 'inactive',
                left_at: new Date().toISOString().split('T')[0],
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .eq('company_id', companyId)
            .eq('status', 'active')

        if (error) throw error
        return true
    }

    async removeFromAllProjects(userId: string, companyId: string) {
        const { error } = await this.supabaseClient
            .from('project_members')
            .update({
                status: 'inactive',
                left_at: new Date().toISOString().split('T')[0],
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .eq('status', 'active')

        if (error) throw error
        return true
    }

    async getProjectAssignments(userId: string, companyId: string) {
        const { data: assignments, error } = await this.supabaseClient
            .from('project_members')
            .select(`
      *,
      project:projects(
        id,
        name,
        status,
        priority,
        start_date,
        end_date
      ),
      user:users!project_members_user_id_users_id_fk(
        id,
        first_name,
        last_name,
        email,
        hourly_rate,
        overtime_rate
      )
    `)
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .order('joined_at', { ascending: false })

        if (error) throw error
        return assignments || []
    }

    async getProjectTeamMembers(projectId: string, companyId: string) {
        // FIXED: Specify the exact foreign key relationship to avoid ambiguity
        const { data: assignments, error } = await this.supabaseClient
            .from('project_members')
            .select(`
                *,
                user:users!project_members_user_id_users_id_fk(
                    id,
                    first_name,
                    last_name,
                    email,
                    role,
                    job_title,
                    trade_specialty,
                    hourly_rate,
                    overtime_rate,
                    is_active
                ),
                project:projects(
                    id,
                    name,
                    status
                )
            `)
            .eq('project_id', projectId)
            .eq('company_id', companyId)
            .eq('status', 'active')
            .order('joined_at', { ascending: false })

        if (error) throw error
        return assignments || []
    }

    async checkProjectAssignment(userId: string, projectId: string, companyId: string) {
        const { data, error } = await this.supabaseClient
            .from('project_members')
            .select('id, status, hourly_rate, overtime_rate, notes')
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .eq('company_id', companyId)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error
        }

        return data
    }

    // ==============================================
    // UTILITY METHODS
    // ==============================================

    async isEmailTaken(email: string, companyId: string, excludeUserId?: string): Promise<boolean> {
        try {
            let query = this.supabaseClient
                .from('users')
                .select('id')
                .eq('company_id', companyId)
                .eq('email', email)

            if (excludeUserId) {
                query = query.neq('id', excludeUserId)
            }

            const { data, error } = await query.single()
            return !error && !!data
        } catch (error) {
            return false
        }
    }

    async getAvailableTeamMembers(companyId: string, projectId?: string): Promise<User[]> {
        let query = this.supabaseClient
            .from('users')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_active', true)

        if (projectId) {
            // Exclude users already assigned to this project
            const { data: assignedUsers } = await this.supabaseClient
                .from('project_members')
                .select('user_id')
                .eq('project_id', projectId)
                .eq('company_id', companyId)
                .eq('status', 'active')

            if (assignedUsers && assignedUsers.length > 0) {
                const assignedUserIds = assignedUsers.map(pm => pm.user_id)
                query = query.not('id', 'in', `(${assignedUserIds.join(',')})`)
            }
        }

        const { data: users, error } = await query.order('first_name', { ascending: true })

        if (error) throw error
        return users || []
    }

    // ==============================================
    // STATISTICS & ANALYTICS
    // ==============================================

    async getTeamMemberStats(companyId: string) {
        const { data: users, error } = await this.supabaseClient
            .from('users')
            .select(`
        *,
        project_memberships:project_members(
          id,
          status
        )
      `)
            .eq('company_id', companyId)

        if (error) throw error

        const roleCounts = {
            super_admin: 0,
            admin: 0,
            supervisor: 0,
            member: 0,
        }

        const statusCounts = {
            active: 0,
            inactive: 0,
        }

        const assignmentCounts = {
            not_assigned: 0,
            assigned: 0,
            inactive: 0,
        }

        const tradeSpecialties: Record<string, number> = {}

        users.forEach(user => {
            // Role counts
            roleCounts[user.role as keyof typeof roleCounts]++

            // Status counts
            statusCounts[user.is_active ? 'active' : 'inactive']++

            // Assignment status counts
            const activeAssignments = user.project_memberships?.filter((pm: any) => pm.status === 'active') || []
            const assignmentStatus = calculateTeamMemberStatus(user.is_active, activeAssignments.length)
            assignmentCounts[assignmentStatus]++

            // Trade specialty counts
            if (user.trade_specialty) {
                tradeSpecialties[user.trade_specialty] = (tradeSpecialties[user.trade_specialty] || 0) + 1
            }
        })

        const topTradeSpecialties = Object.entries(tradeSpecialties)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }))

        return {
            totalTeamMembers: users.length,
            byRole: roleCounts,
            byStatus: statusCounts,
            byAssignmentStatus: assignmentCounts,
            topTradeSpecialties,
            averageHourlyRate: users.length > 0
                ? Math.round((users.reduce((sum, u) => sum + (u.hourly_rate || 0), 0) / users.length) * 100) / 100
                : 0,
        }
    }

    async checkTeamMemberExists(userId: string, companyId: string): Promise<boolean> {
        try {
            const { data, error } = await this.supabaseClient
                .from('users')
                .select('id')
                .eq('id', userId)
                .eq('company_id', companyId)
                .single()

            return !error && !!data
        } catch (error) {
            return false
        }
    }

    async getEffectiveRates(userId: string, projectId?: string): Promise<{ hourlyRate: number, overtimeRate: number }> {
        // Get user's default rates
        const { data: user } = await this.supabaseClient
            .from('users')
            .select('hourly_rate, overtime_rate')
            .eq('id', userId)
            .single()

        if (!user) {
            return { hourlyRate: 0, overtimeRate: 0 }
        }

        // If no specific project, return user defaults
        if (!projectId) {
            return {
                hourlyRate: user.hourly_rate || 0,
                overtimeRate: user.overtime_rate || 0
            }
        }

        // Check for project-specific rate overrides
        const { data: projectMember } = await this.supabaseClient
            .from('project_members')
            .select('hourly_rate, overtime_rate')
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .eq('status', 'active')
            .single()

        return {
            hourlyRate: projectMember?.hourly_rate || user.hourly_rate || 0,
            overtimeRate: projectMember?.overtime_rate || user.overtime_rate || 0
        }
    }
}