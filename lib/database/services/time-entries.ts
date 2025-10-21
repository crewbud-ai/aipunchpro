// ==============================================
// lib/database/services/time-entries.ts - Time Entries Database Service
// ==============================================

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'
import type {
  ClockInInput,
  ClockOutInput,
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
  GetTimeEntriesInput
} from '@/lib/validations/time-tracking/time-entries'
import PaymentCalculationService from './payment-calculation'

// ==============================================
// INTERFACES & TYPES
// ==============================================
interface TimeEntryRow {
  id: string
  company_id: string
  project_id: string
  schedule_project_id?: string
  user_id: string
  worker_name?: string
  is_system_user: boolean
  date: string
  start_time?: string
  end_time?: string
  break_minutes: number
  regular_hours: string
  overtime_hours: string
  double_time_hours: string
  total_hours: string
  regular_rate?: string
  overtime_rate?: string
  double_time_rate?: string
  total_pay?: string
  description?: string
  work_type?: string
  trade?: string
  clock_in_location?: any
  clock_out_location?: any
  work_location?: string
  status: string
  submitted_at?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  equipment_used?: string[]
  materials_used?: string[]
  weather_conditions?: string
  temperature_f?: number
  work_conditions?: string
  safety_incidents?: string
  ppe?: string[]
  work_completed?: string
  issues_encountered?: string
  next_steps?: string
  quality_rating?: number
  created_by?: string
  last_modified_by?: string
  created_at: string
  updated_at: string
}

interface ClockInData {
  companyId: string
  userId: string
  projectId: string
  scheduleProjectId?: string
  workType?: string
  trade?: string
  description?: string
  clockInLocation?: { lat: number; lng: number }
  regularRate?: number
  overtimeRate?: number
  doubleTimeRate?: number
}

interface ClockOutData {
  timeEntryId: string
  userId: string
  description?: string
  workCompleted?: string
  issuesEncountered?: string
  clockOutLocation?: { lat: number; lng: number }
}

// ==============================================
// TIME ENTRIES DATABASE SERVICE
// ==============================================
export class TimeEntriesDatabaseService {
  private supabaseClient: ReturnType<typeof createServerClient>
  private enableLogging: boolean
  private enableCache: boolean

  constructor(enableLogging = false, enableCache = false) {
    this.enableLogging = enableLogging
    this.enableCache = enableCache

    // Initialize Supabase client (following your exact pattern)
    this.supabaseClient = createServerClient()
  }

  // ==============================================
  // LOGGING HELPER
  // ==============================================
  private log(message: string, data?: any) {
    if (this.enableLogging) {
      console.log(`[TimeEntriesService] ${message}`, data || '')
    }
  }

  // ==============================================
  // CLOCK IN OPERATION
  // ==============================================
  async clockIn(data: ClockInData): Promise<TimeEntryRow> {
    this.log('Clock in operation', { userId: data.userId, projectId: data.projectId })

    // First check if user already has an active session
    const activeSession = await this.getActiveSession(data.userId, data.companyId)
    if (activeSession) {
      throw new Error('User already has an active clock session. Please clock out first.')
    }

    // Get current time
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD format

    // Prepare location data
    const clockInLocation = data.clockInLocation
      ? `(${data.clockInLocation.lat},${data.clockInLocation.lng})`
      : null

    const { data: timeEntry, error } = await this.supabaseClient
      .from('time_entries')
      .insert([{
        company_id: data.companyId,
        user_id: data.userId,
        project_id: data.projectId,
        schedule_project_id: data.scheduleProjectId || null,
        date: currentDate,
        start_time: currentTime,
        end_time: null,
        break_minutes: 0,
        regular_hours: '0',
        overtime_hours: '0',
        double_time_hours: '0',
        total_hours: '0',

        regular_rate: data.regularRate ? data.regularRate.toString() : null,
        overtime_rate: data.overtimeRate ? data.overtimeRate.toString() : null,
        double_time_rate: data.doubleTimeRate ? data.doubleTimeRate.toString() : null,
        total_pay: null,
        status: 'clocked_in',
        work_type: data.workType || null,
        trade: data.trade || null,
        description: data.description || null,
        clock_in_location: clockInLocation,
        worker_name: null,
        is_system_user: true,
        created_by: data.userId,
        last_modified_by: data.userId,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }])
      .select()
      .single()

    if (error) {
      this.log('Clock in error', error)
      throw new Error(`Failed to clock in: ${error.message}`)
    }

    this.log('Clock in successful with rates stored', {
      timeEntryId: timeEntry.id,
      regularRate: data.regularRate,
      overtimeRate: data.overtimeRate
    })
    return timeEntry
  }

  // ==============================================
  // CLOCK OUT OPERATION
  // ==============================================
  async clockOut(data: ClockOutData): Promise<TimeEntryRow> {
    this.log('Clock out operation', { timeEntryId: data.timeEntryId, userId: data.userId })

    // Get the active time entry
    const { data: timeEntry, error: fetchError } = await this.supabaseClient
      .from('time_entries')
      .select('*')
      .eq('id', data.timeEntryId)
      .eq('user_id', data.userId)
      .eq('status', 'clocked_in')
      .single()

    if (fetchError || !timeEntry) {
      throw new Error('No active clock session found')
    }

    // Calculate total hours
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    const totalHours = this.calculateHours(timeEntry.start_time, currentTime, timeEntry.break_minutes)

    // Get rates from the time entry (they were saved during clock in)
    const regularRate = parseFloat(timeEntry.regular_rate || '0')
    const overtimeRate = parseFloat(timeEntry.overtime_rate || '0')
    const doubleTimeRate = parseFloat(timeEntry.double_time_rate || '0')

    this.log('Rates retrieved from time entry', {
      regularRate,
      overtimeRate,
      doubleTimeRate
    })

    // Calculate payment using PaymentCalculationService
    const paymentService = new PaymentCalculationService(this.enableLogging)
    const paymentBreakdown = paymentService.calculatePayment({
      totalHours,
      regularRate,
      overtimeRate,
      doubleTimeRate,
    })

    this.log('Payment breakdown calculated', paymentBreakdown)

    // Prepare location data
    const clockOutLocation = data.clockOutLocation
      ? `(${data.clockOutLocation.lat},${data.clockOutLocation.lng})`
      : null

    // Update time entry
    const { data: updatedEntry, error: updateError } = await this.supabaseClient
      .from('time_entries')
      .update({
        end_time: currentTime,
        total_hours: paymentBreakdown.totalHours.toString(),
        regular_hours: paymentBreakdown.regularHours.toString(),
        overtime_hours: paymentBreakdown.overtimeHours.toString(),
        double_time_hours: paymentBreakdown.doubleTimeHours.toString(),
        total_pay: paymentBreakdown.totalPay.toString(),
        status: 'clocked_out',
        clock_out_location: clockOutLocation,
        description: data.description || timeEntry.description,
        work_completed: data.workCompleted || null,
        issues_encountered: data.issuesEncountered || null,
        last_modified_by: data.userId,
        updated_at: now.toISOString()
      })
      .eq('id', data.timeEntryId)
      .select()
      .single()

    if (updateError) {
      this.log('Clock out error', updateError)
      throw new Error(`Failed to clock out: ${updateError.message}`)
    }

    this.log('Clock out successful', {
      timeEntryId: updatedEntry.id,
      totalHours: paymentBreakdown.totalHours,
      totalPay: paymentBreakdown.totalPay
    })
    return updatedEntry
  }

  // ==============================================
  // APPROVE TIME ENTRY
  // ==============================================
  async approveTimeEntry(
    timeEntryId: string,
    approvedBy: string,
    companyId: string
  ): Promise<TimeEntryRow> {
    this.log('Approving time entry', { timeEntryId, approvedBy, companyId })

    // First, verify the time entry exists and belongs to the company
    const { data: existingEntry, error: fetchError } = await this.supabaseClient
      .from('time_entries')
      .select('*')
      .eq('id', timeEntryId)
      .eq('company_id', companyId)
      .single()

    if (fetchError || !existingEntry) {
      this.log('Time entry not found', fetchError)
      throw new Error('Time entry not found')
    }

    // Check if already approved
    if (existingEntry.status === 'approved') {
      this.log('Time entry already approved')
      return existingEntry
    }

    // Check if entry has an end time (not currently clocked in)
    if (!existingEntry.end_time) {
      this.log('Cannot approve entry without end time')
      throw new Error('Cannot approve an active time entry. Please clock out first.')
    }

    const now = new Date()

    // Update the time entry
    const { data: updatedEntry, error: updateError } = await this.supabaseClient
      .from('time_entries')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', timeEntryId)
      .select()
      .single()

    if (updateError) {
      this.log('Approve time entry error', updateError)
      throw new Error(`Failed to approve time entry: ${updateError.message}`)
    }

    this.log('Time entry approved successfully', {
      timeEntryId: updatedEntry.id,
      approvedBy,
    })

    return updatedEntry
  }

  // ==============================================
  // REJECT TIME ENTRY
  // ==============================================
  async rejectTimeEntry(
    timeEntryId: string,
    rejectedBy: string,
    companyId: string,
    reason: string
  ): Promise<TimeEntryRow> {
    this.log('Rejecting time entry', { timeEntryId, rejectedBy, companyId, reason })

    // First, verify the time entry exists and belongs to the company
    const { data: existingEntry, error: fetchError } = await this.supabaseClient
      .from('time_entries')
      .select('*')
      .eq('id', timeEntryId)
      .eq('company_id', companyId)
      .single()

    if (fetchError || !existingEntry) {
      this.log('Time entry not found', fetchError)
      throw new Error('Time entry not found')
    }

    // Check if already rejected
    if (existingEntry.status === 'rejected') {
      this.log('Time entry already rejected')
      return existingEntry
    }

    const now = new Date()

    // Update the time entry
    const { data: updatedEntry, error: updateError } = await this.supabaseClient
      .from('time_entries')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        approved_by: rejectedBy, // Track who rejected it
        approved_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', timeEntryId)
      .select()
      .single()

    if (updateError) {
      this.log('Reject time entry error', updateError)
      throw new Error(`Failed to reject time entry: ${updateError.message}`)
    }

    this.log('Time entry rejected successfully', {
      timeEntryId: updatedEntry.id,
      rejectedBy,
      reason,
    })

    return updatedEntry
  }

  // ==============================================
  // BULK APPROVE TIME ENTRIES
  // ==============================================
  async bulkApproveTimeEntries(
    timeEntryIds: string[],
    approvedBy: string,
    companyId: string
  ): Promise<{ approved: number; failed: number }> {
    this.log('Bulk approving time entries', { count: timeEntryIds.length, approvedBy })

    let approved = 0
    let failed = 0

    for (const entryId of timeEntryIds) {
      try {
        await this.approveTimeEntry(entryId, approvedBy, companyId)
        approved++
      } catch (error) {
        this.log(`Failed to approve entry ${entryId}`, error)
        failed++
      }
    }

    this.log('Bulk approve completed', { approved, failed })

    return { approved, failed }
  }

  // ==============================================
  // GET ACTIVE SESSION
  // ==============================================
  async getActiveSession(userId: string, companyId: string): Promise<any> {
    this.log('Getting active session', { userId })

    const { data: activeSession, error } = await this.supabaseClient
      .from('time_entries')
      .select(`
        *,
        project:projects!inner(id, name, status, project_number),
        schedule_project:schedule_projects(id, title, status)
      `)
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('status', 'clocked_in')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      this.log('Get active session error', error)
      throw new Error(`Failed to get active session: ${error.message}`)
    }

    return activeSession || null
  }

  // ==============================================
  // GET TIME ENTRIES
  // ==============================================
  async getTimeEntries(companyId: string, options: Partial<GetTimeEntriesInput> = {}) {
    this.log('Getting time entries', { companyId, options })

    let query = this.supabaseClient
      .from('time_entries')
      .select(`
      *,
      project:projects(id, name, status, project_number),
      schedule_project:schedule_projects(id, title, status),
      worker:users!time_entries_user_id_users_id_fk(id, first_name, last_name, email),
      approver:users!time_entries_approved_by_users_id_fk(id, first_name, last_name, email)
    `)
      .eq('company_id', companyId)

    // ✅ Build a separate count query with the same filters
    let countQuery = this.supabaseClient
      .from('time_entries')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)

    // Apply filters to BOTH queries
    if (options.userId) {
      query = query.eq('user_id', options.userId)
      countQuery = countQuery.eq('user_id', options.userId)
    }

    if (options.projectId) {
      query = query.eq('project_id', options.projectId)
      countQuery = countQuery.eq('project_id', options.projectId)
    }

    if (options.scheduleProjectId) {
      query = query.eq('schedule_project_id', options.scheduleProjectId)
      countQuery = countQuery.eq('schedule_project_id', options.scheduleProjectId)
    }

    if (options.status) {
      query = query.eq('status', options.status)
      countQuery = countQuery.eq('status', options.status)
    }

    if (options.workType) {
      query = query.eq('work_type', options.workType)
      countQuery = countQuery.eq('work_type', options.workType)
    }

    if (options.trade) {
      query = query.eq('trade', options.trade)
      countQuery = countQuery.eq('trade', options.trade)
    }

    if (options.dateFrom) {
      query = query.gte('date', options.dateFrom)
      countQuery = countQuery.gte('date', options.dateFrom)
    }

    if (options.dateTo) {
      query = query.lte('date', options.dateTo)
      countQuery = countQuery.lte('date', options.dateTo)
    }

    if (options.needsApproval) {
      query = query.eq('status', 'pending')
      countQuery = countQuery.eq('status', 'pending')
    }

    if (options.isActive) {
      query = query.eq('status', 'clocked_in')
      countQuery = countQuery.eq('status', 'clocked_in')
    }

    if (options.search) {
      const searchFilter = `description.ilike.%${options.search}%,work_completed.ilike.%${options.search}%`
      query = query.or(searchFilter)
      countQuery = countQuery.or(searchFilter)
    }

    // Apply sorting (only to main query)
    const sortBy = options.sortBy || 'date'
    const sortOrder = options.sortOrder || 'desc'

    // Map sortBy to actual database column names
    const sortByColumn = (() => {
      switch (sortBy) {
        case 'startTime':
          return 'start_time'
        case 'totalHours':
          return 'total_hours'
        case 'createdAt':
          return 'created_at'
        default:
          return sortBy
      }
    })()

    query = query.order(sortByColumn, { ascending: sortOrder === 'asc' })

    // Apply pagination (only to main query)
    const limit = options.limit || 50
    const offset = options.offset || 0
    query = query.range(offset, offset + limit - 1)

    // Execute both queries
    const { data: timeEntries, error } = await query
    const { count, error: countError } = await countQuery

    if (error) {
      this.log('Get time entries error', error)
      throw new Error(`Failed to get time entries: ${error.message}`)
    }

    if (countError) {
      this.log('Get time entries count error', countError)
      console.error('Count query failed:', countError)
    }

    this.log('Query results', {
      entriesFound: timeEntries?.length || 0,
      totalCount: count || 0
    })

    return {
      timeEntries: timeEntries || [],
      totalCount: count || 0
    }
  }

  // ==============================================
  // GET SINGLE TIME ENTRY (CORRECTED)
  // ==============================================
  async getTimeEntry(timeEntryId: string, companyId: string): Promise<any | null> {
    this.log('Getting time entry', { timeEntryId, companyId })

    const { data: timeEntry, error } = await this.supabaseClient
      .from('time_entries')
      .select(`
      *,
      project:projects(id, name, status, project_number),
      schedule_project:schedule_projects(id, title, status),
      worker:users!time_entries_user_id_users_id_fk(id, first_name, last_name, email, trade_specialty),
      approver:users!time_entries_approved_by_users_id_fk(id, first_name, last_name, email)
    `)
      .eq('id', timeEntryId)
      .eq('company_id', companyId)
      .single()

    if (error && error.code !== 'PGRST116') {
      this.log('Get time entry error', error)
      throw new Error(`Failed to get time entry: ${error.message}`)
    }

    this.log('Time entry retrieved', { found: !!timeEntry })

    return timeEntry || null
  }

  // ==============================================
  // GET CLOCK IN OPTIONS (projects for selection)
  // ==============================================
  async getClockInOptions(userId: string, companyId: string) {
    this.log('Getting clock in options', { userId })

    // First get user's project_member records (we need the IDs)
    const { data: projectMembers, error: memberError } = await this.supabaseClient
      .from('project_members')
      .select('project_id, id')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('status', 'active')

    if (memberError) {
      this.log('Get project members error', memberError)
      throw new Error(`Failed to get project assignments: ${memberError.message}`)
    }

    const projectIds = projectMembers?.map(pm => pm.project_id).filter(Boolean) || []
    const projectMemberIds = projectMembers?.map(pm => pm.id).filter(Boolean) || []

    this.log('User project assignments', { projectIds, projectMemberIds })
    console.log('🔍 DEBUG - Project Member IDs:', projectMemberIds)

    // Get user's assigned projects
    let projects: any[] = []
    if (projectIds.length > 0) {
      const { data: projectsData, error: projectError } = await this.supabaseClient
        .from('projects')
        .select('id, name, status, project_number')
        .in('id', projectIds)
        .eq('status', 'in_progress')

      if (projectError) {
        this.log('Get projects error', projectError)
        throw new Error(`Failed to get assigned projects: ${projectError.message}`)
      }

      projects = projectsData || []
      this.log('Found projects', { count: projects.length })
    }

    // Get schedule projects where user is assigned via project_member_id
    // Get schedule projects where user is assigned by USER_ID (not project_member_id)
    let scheduleProjects: any[] = []
    if (projectIds.length > 0) {
      const { data: scheduleData, error: scheduleError } = await this.supabaseClient
        .from('schedule_projects')
        .select('id, project_id, title, status, start_date, end_date, trade_required, priority, assigned_project_member_ids')
        .in('project_id', projectIds)
        .in('status', ['planned', 'in_progress'])

      if (scheduleError) {
        this.log('Get schedule projects error', scheduleError)
        console.warn('Failed to get schedule projects:', scheduleError.message)
      } else {
        this.log('Raw schedule projects', { count: scheduleData?.length || 0 })

        // FIXED: Filter by userId instead of project_member_id
        // The assigned_project_member_ids field actually contains user_ids
        scheduleProjects = (scheduleData || [])
          .filter(sp => {
            const assignedIds = sp.assigned_project_member_ids || []

            // Check if user's ID is in the assigned list
            const isAssigned = assignedIds.includes(userId)

            if (isAssigned) {
              this.log('User is assigned to schedule project', {
                scheduleProjectId: sp.id,
                title: sp.title
              })
            }

            return isAssigned
          })
          .map(sp => ({
            id: sp.id,
            projectId: sp.project_id,
            title: sp.title,
            status: sp.status,
            startDate: sp.start_date,
            endDate: sp.end_date,
            trade: sp.trade_required,
            priority: sp.priority,
            isActive: sp.status === 'in_progress',
          }))

        this.log('Filtered schedule projects', { count: scheduleProjects.length })
      }
    }

    // Get user info
    const { data: userData, error: userError } = await this.supabaseClient
      .from('users')
      .select('id, first_name, last_name, trade_specialty')
      .eq('id', userId)
      .single()

    if (userError) {
      this.log('Get user info error', userError)
    }

    const transformedProjects = projects.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      projectNumber: p.project_number,
      isActive: p.status === 'in_progress',
    }))

    return {
      projects: transformedProjects,
      scheduleProjects: scheduleProjects,
      userInfo: userData ? {
        id: userData.id,
        name: `${userData.first_name} ${userData.last_name}`,
        tradeSpecialty: userData.trade_specialty,
      } : null,
    }
  }

  // ==============================================
  // CREATE TIME ENTRY (MANUAL)
  // ==============================================
  async createTimeEntry(data: CreateTimeEntryInput, companyId: string, userId: string): Promise<TimeEntryRow> {
    this.log('Creating time entry', { projectId: data.projectId, date: data.date })

    // Calculate total hours if both start and end time provided
    let totalHours = 0
    if (data.startTime && data.endTime) {
      totalHours = this.calculateHours(data.startTime, data.endTime, data.breakMinutes || 0)
    }

    // Prepare location data
    const clockInLocation = data.clockInLocation
      ? `(${data.clockInLocation.lat},${data.clockInLocation.lng})`
      : null
    const clockOutLocation = data.clockOutLocation
      ? `(${data.clockOutLocation.lat},${data.clockOutLocation.lng})`
      : null

    const now = new Date()

    const { data: timeEntry, error } = await this.supabaseClient
      .from('time_entries')
      .insert([{
        company_id: companyId,
        user_id: userId,
        project_id: data.projectId,
        schedule_project_id: data.scheduleProjectId || null,
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime || null,
        break_minutes: data.breakMinutes || 0,
        regular_hours: Math.min(totalHours, 8).toString(),
        overtime_hours: Math.max(0, totalHours - 8).toString(),
        double_time_hours: '0',
        total_hours: totalHours.toString(),
        status: data.endTime ? 'clocked_out' : 'clocked_in',
        work_type: data.workType || null,
        trade: data.trade || null,
        description: data.description || null,
        clock_in_location: clockInLocation,
        clock_out_location: clockOutLocation,
        work_location: data.workLocation || null,
        equipment_used: data.equipmentUsed || null,
        materials_used: data.materialsUsed || null,
        weather_conditions: data.weatherConditions || null,
        temperature_f: data.temperatureF || null,
        work_conditions: data.workConditions || null,
        safety_incidents: data.safetyIncidents || null,
        ppe: data.ppe || null,
        work_completed: data.workCompleted || null,
        issues_encountered: data.issuesEncountered || null,
        next_steps: data.nextSteps || null,
        quality_rating: data.qualityRating || null,
        worker_name: null,
        is_system_user: true,
        created_by: userId,
        last_modified_by: userId,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }])
      .select()
      .single()

    if (error) {
      this.log('Create time entry error', error)
      throw new Error(`Failed to create time entry: ${error.message}`)
    }

    this.log('Time entry created', { timeEntryId: timeEntry.id })
    return timeEntry
  }

  // ==============================================
  // UPDATE TIME ENTRY
  // ==============================================
  async updateTimeEntry(timeEntryId: string, data: UpdateTimeEntryInput, companyId: string, userId: string): Promise<TimeEntryRow> {
    this.log('Updating time entry', { timeEntryId })

    // Calculate total hours if both times are being updated
    let updateData: any = {
      last_modified_by: userId,
      updated_at: new Date().toISOString()
    }

    // Add provided fields to update
    if (data.date) updateData.date = data.date
    if (data.startTime) updateData.start_time = data.startTime
    if (data.endTime) updateData.end_time = data.endTime
    if (data.breakMinutes !== undefined) updateData.break_minutes = data.breakMinutes
    if (data.workType) updateData.work_type = data.workType
    if (data.trade) updateData.trade = data.trade
    if (data.description !== undefined) updateData.description = data.description
    if (data.workLocation !== undefined) updateData.work_location = data.workLocation
    if (data.status) updateData.status = data.status
    if (data.rejectionReason !== undefined) updateData.rejection_reason = data.rejectionReason

    // Handle arrays
    if (data.equipmentUsed !== undefined) updateData.equipment_used = data.equipmentUsed
    if (data.materialsUsed !== undefined) updateData.materials_used = data.materialsUsed
    if (data.ppe !== undefined) updateData.ppe = data.ppe

    // Handle optional fields
    if (data.weatherConditions !== undefined) updateData.weather_conditions = data.weatherConditions
    if (data.temperatureF !== undefined) updateData.temperature_f = data.temperatureF
    if (data.workConditions !== undefined) updateData.work_conditions = data.workConditions
    if (data.safetyIncidents !== undefined) updateData.safety_incidents = data.safetyIncidents
    if (data.workCompleted !== undefined) updateData.work_completed = data.workCompleted
    if (data.issuesEncountered !== undefined) updateData.issues_encountered = data.issuesEncountered
    if (data.nextSteps !== undefined) updateData.next_steps = data.nextSteps
    if (data.qualityRating !== undefined) updateData.quality_rating = data.qualityRating

    // Handle location updates
    if (data.clockInLocation) {
      updateData.clock_in_location = `(${data.clockInLocation.lat},${data.clockInLocation.lng})`
    }
    if (data.clockOutLocation) {
      updateData.clock_out_location = `(${data.clockOutLocation.lat},${data.clockOutLocation.lng})`
    }

    // Recalculate hours if time fields are updated
    if (data.startTime || data.endTime || data.breakMinutes !== undefined) {
      // Get current entry to get missing time values
      const { data: currentEntry } = await this.supabaseClient
        .from('time_entries')
        .select('start_time, end_time, break_minutes')
        .eq('id', timeEntryId)
        .single()

      if (currentEntry) {
        const startTime = data.startTime || currentEntry.start_time
        const endTime = data.endTime || currentEntry.end_time
        const breakMinutes = data.breakMinutes !== undefined ? data.breakMinutes : currentEntry.break_minutes

        if (startTime && endTime) {
          const totalHours = this.calculateHours(startTime, endTime, breakMinutes)
          updateData.total_hours = totalHours.toString()
          updateData.regular_hours = Math.min(totalHours, 8).toString()
          updateData.overtime_hours = Math.max(0, totalHours - 8).toString()
        }
      }
    }

    const { data: updatedEntry, error } = await this.supabaseClient
      .from('time_entries')
      .update(updateData)
      .eq('id', timeEntryId)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) {
      this.log('Update time entry error', error)
      throw new Error(`Failed to update time entry: ${error.message}`)
    }

    this.log('Time entry updated', { timeEntryId: updatedEntry.id })
    return updatedEntry
  }

  // ==============================================
  // DELETE TIME ENTRY
  // ==============================================
  async deleteTimeEntry(timeEntryId: string, companyId: string): Promise<boolean> {
    this.log('Deleting time entry', { timeEntryId })

    const { error } = await this.supabaseClient
      .from('time_entries')
      .delete()
      .eq('id', timeEntryId)
      .eq('company_id', companyId)

    if (error) {
      this.log('Delete time entry error', error)
      throw new Error(`Failed to delete time entry: ${error.message}`)
    }

    this.log('Time entry deleted', { timeEntryId })
    return true
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================
  private calculateHours(startTime: string, endTime: string, breakMinutes: number = 0): number {
    const start = new Date(`1970-01-01T${startTime}`)
    const end = new Date(`1970-01-01T${endTime}`)

    const diffMs = end.getTime() - start.getTime()
    const totalMinutes = Math.floor(diffMs / (1000 * 60)) - breakMinutes

    return Math.max(0, totalMinutes / 60) // Convert to hours, ensure non-negative
  }

  // Check if project exists and user has access
  async checkProjectAccess(projectId: string, userId: string, companyId: string): Promise<boolean> {
    const { data, error } = await this.supabaseClient
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('status', 'active')
      .single()

    return !error && !!data
  }

  // Get today's time entries for user
  async getTodaysTimeEntries(userId: string, companyId: string) {
    const today = new Date().toISOString().split('T')[0]

    return this.getTimeEntries(companyId, {
      userId,
      dateFrom: today,
      dateTo: today,
      sortBy: 'startTime',
      sortOrder: 'asc'
    })
  }

  // Get user's time entry statistics
  async getTimeEntryStats(userId: string, companyId: string) {
    const { data: stats, error } = await this.supabaseClient
      .rpc('get_time_entry_stats', {
        p_user_id: userId,
        p_company_id: companyId
      })

    if (error) {
      this.log('Get time entry stats error', error)
      // Return default stats if RPC fails
      return {
        totalEntries: 0,
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        todayHours: 0,
        weekHours: 0,
        pendingEntries: 0
      }
    }

    return stats
  }

  // Get recent time entries for a user
  async getRecentEntries(
    userId: string,
    companyId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<any[]> {
    this.log('Getting recent entries', { userId, limit, offset })

    const { data: entries, error } = await this.supabaseClient
      .from('time_entries')
      .select(`
      *,
      project:projects!inner(id, name, status, project_number),
      schedule_project:schedule_projects(id, title, status)
    `)
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .order('date', { ascending: false })        // Latest date first
      .order('start_time', { ascending: false })  // Latest time first (within same date)
      .order('created_at', { ascending: false })  // Fallback: latest created first
      .range(offset, offset + limit - 1)

    if (error) {
      this.log('Get recent entries error', error)
      throw new Error(`Failed to get recent entries: ${error.message}`)
    }

    this.log('Recent entries retrieved', {
      count: entries?.length || 0,
      firstEntry: entries?.[0] ? {
        date: entries[0].date,
        startTime: entries[0].start_time,
        createdAt: entries[0].created_at
      } : null
    })

    return entries || []
  }
}