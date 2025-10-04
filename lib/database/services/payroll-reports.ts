// ==============================================
// lib/database/services/reports/payroll-reports.ts - Payroll Reports Database Service
// ==============================================

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'
import type {
  PayrollReportFilters,
  PayrollReport,
  PayrollReportByPerson,
  PayrollReportByProject,
  PayrollReportByCostCode,
  OvertimeSummary,
  DetailedPayrollEntry,
  TotalHoursSummary,
} from '@/types/reports'

export class PayrollReportsDatabaseService {
  private supabaseClient: ReturnType<typeof createServerClient>
  private enableLogging: boolean

  constructor(isServer = false, isAdmin = false, enableLogging = false) {
    if (isServer && isAdmin) {
      this.supabaseClient = createAdminClient()
    } else if (isServer) {
      this.supabaseClient = createServerClient()
    } else {
      this.supabaseClient = createBrowserClient()
    }
    this.enableLogging = enableLogging
  }

  private log(message: string, data?: any) {
    if (this.enableLogging) {
      console.log(`[PayrollReportsService] ${message}`, data || '')
    }
  }

  // ==============================================
  // 1. TIME BY PERSON (Employee Breakdown)
  // ==============================================
  async getTimeByPerson(
    companyId: string,
    filters: PayrollReportFilters
  ): Promise<PayrollReportByPerson[]> {
    this.log('Fetching time by person', { companyId, filters })

    let query = this.supabaseClient
      .from('time_entries')
      .select(`
        user_id,
        regular_hours,
        overtime_hours,
        double_time_hours,
        total_hours,
        regular_rate,
        overtime_rate,
        double_time_rate,
        total_pay,
        project_id,
        worker:users!time_entries_user_id_fkey (
          id,
          first_name,
          last_name,
          email,
          trade_specialty
        ),
        project:projects!time_entries_project_id_fkey (
          id,
          name
        )
      `)
      .eq('company_id', companyId)
      .gte('date', filters.startDate)
      .lte('date', filters.endDate)
      .eq('is_system_user', true)

    // Apply optional filters
    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'pending') {
        query = query.in('status', ['pending', 'clocked_out'])
      } else {
        query = query.eq('status', filters.status)
      }
    }

    const { data: entries, error } = await query

    if (error) {
      this.log('Error fetching time by person', error)
      throw new Error(`Failed to fetch time by person: ${error.message}`)
    }

    if (!entries || entries.length === 0) {
      return []
    }

    // Group by user and calculate totals
    const userMap = new Map<string, {
      userId: string
      userName: string
      userEmail: string
      tradeSpecialty?: string
      regularHours: number
      overtimeHours: number
      doubleTimeHours: number
      totalHours: number
      regularPay: number
      overtimePay: number
      doubleTimePay: number
      totalPay: number
      entries: number
      projects: Set<string>
      projectNames: Set<string>
      rates: { regular: number[]; overtime: number[]; doubleTime: number[] }
    }>()

    for (const entry of entries) {
      const userId = entry.user_id
      if (!userId) continue

      const worker = entry.worker as any
      const project = entry.project as any

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          userName: worker ? `${worker.first_name} ${worker.last_name}` : 'Unknown',
          userEmail: worker?.email || '',
          tradeSpecialty: worker?.trade_specialty,
          regularHours: 0,
          overtimeHours: 0,
          doubleTimeHours: 0,
          totalHours: 0,
          regularPay: 0,
          overtimePay: 0,
          doubleTimePay: 0,
          totalPay: 0,
          entries: 0,
          projects: new Set(),
          projectNames: new Set(),
          rates: { regular: [], overtime: [], doubleTime: [] }
        })
      }

      const userData = userMap.get(userId)!

      // Accumulate hours
      userData.regularHours += parseFloat(entry.regular_hours || '0')
      userData.overtimeHours += parseFloat(entry.overtime_hours || '0')
      userData.doubleTimeHours += parseFloat(entry.double_time_hours || '0')
      userData.totalHours += parseFloat(entry.total_hours || '0')

      // Calculate pay breakdown
      const regularHrs = parseFloat(entry.regular_hours || '0')
      const overtimeHrs = parseFloat(entry.overtime_hours || '0')
      const doubleTimeHrs = parseFloat(entry.double_time_hours || '0')
      const regularRate = parseFloat(entry.regular_rate || '0')
      const overtimeRate = parseFloat(entry.overtime_rate || '0')
      const doubleTimeRate = parseFloat(entry.double_time_rate || '0')

      userData.regularPay += regularHrs * regularRate
      userData.overtimePay += overtimeHrs * overtimeRate
      userData.doubleTimePay += doubleTimeHrs * doubleTimeRate
      userData.totalPay += parseFloat(entry.total_pay || '0')

      // Track rates for averaging
      if (regularRate > 0) userData.rates.regular.push(regularRate)
      if (overtimeRate > 0) userData.rates.overtime.push(overtimeRate)
      if (doubleTimeRate > 0) userData.rates.doubleTime.push(doubleTimeRate)

      // Track projects
      userData.entries++
      if (entry.project_id) {
        userData.projects.add(entry.project_id)
        if (project?.name) {
          userData.projectNames.add(project.name)
        }
      }
    }

    // Convert to array and calculate averages
    return Array.from(userMap.values()).map(user => ({
      userId: user.userId,
      userName: user.userName,
      userEmail: user.userEmail,
      tradeSpecialty: user.tradeSpecialty,
      regularHours: Math.round(user.regularHours * 100) / 100,
      overtimeHours: Math.round(user.overtimeHours * 100) / 100,
      doubleTimeHours: Math.round(user.doubleTimeHours * 100) / 100,
      totalHours: Math.round(user.totalHours * 100) / 100,
      regularPay: Math.round(user.regularPay * 100) / 100,
      overtimePay: Math.round(user.overtimePay * 100) / 100,
      doubleTimePay: Math.round(user.doubleTimePay * 100) / 100,
      totalPay: Math.round(user.totalPay * 100) / 100,
      totalEntries: user.entries,
      projectsWorked: user.projects.size,
      projectNames: Array.from(user.projectNames),
      avgRegularRate: user.rates.regular.length > 0
        ? Math.round((user.rates.regular.reduce((a, b) => a + b, 0) / user.rates.regular.length) * 100) / 100
        : 0,
      avgOvertimeRate: user.rates.overtime.length > 0
        ? Math.round((user.rates.overtime.reduce((a, b) => a + b, 0) / user.rates.overtime.length) * 100) / 100
        : 0,
      avgDoubleTimeRate: user.rates.doubleTime.length > 0
        ? Math.round((user.rates.doubleTime.reduce((a, b) => a + b, 0) / user.rates.doubleTime.length) * 100) / 100
        : 0,
    }))
  }

  // ==============================================
  // 2. TIME BY PROJECT (Project Breakdown)
  // ==============================================
  async getTimeByProject(
    companyId: string,
    filters: PayrollReportFilters
  ): Promise<PayrollReportByProject[]> {
    this.log('Fetching time by project', { companyId, filters })

    let query = this.supabaseClient
      .from('time_entries')
      .select(`
        project_id,
        user_id,
        regular_hours,
        overtime_hours,
        double_time_hours,
        total_hours,
        total_pay,
        project:projects!time_entries_project_id_fkey (
          id,
          name,
          project_number,
          status
        ),
        worker:users!time_entries_user_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq('company_id', companyId)
      .gte('date', filters.startDate)
      .lte('date', filters.endDate)

    // Apply filters
    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'pending') {
        query = query.in('status', ['pending', 'clocked_out'])
      } else {
        query = query.eq('status', filters.status)
      }
    }

    const { data: entries, error } = await query

    if (error) {
      this.log('Error fetching time by project', error)
      throw new Error(`Failed to fetch time by project: ${error.message}`)
    }

    if (!entries || entries.length === 0) {
      return []
    }

    // Group by project
    const projectMap = new Map<string, {
      projectId: string
      projectName: string
      projectNumber?: string
      projectStatus: string
      regularHours: number
      overtimeHours: number
      doubleTimeHours: number
      totalHours: number
      regularCost: number
      overtimeCost: number
      doubleTimeCost: number
      totalCost: number
      workers: Set<string>
      workerNames: Set<string>
      entries: number
    }>()

    for (const entry of entries) {
      const projectId = entry.project_id
      if (!projectId) continue

      const project = entry.project as any
      const worker = entry.worker as any

      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          projectId,
          projectName: project?.name || 'Unknown Project',
          projectNumber: project?.project_number,
          projectStatus: project?.status || 'unknown',
          regularHours: 0,
          overtimeHours: 0,
          doubleTimeHours: 0,
          totalHours: 0,
          regularCost: 0,
          overtimeCost: 0,
          doubleTimeCost: 0,
          totalCost: 0,
          workers: new Set(),
          workerNames: new Set(),
          entries: 0
        })
      }

      const projectData = projectMap.get(projectId)!

      // Accumulate hours
      const regularHrs = parseFloat(entry.regular_hours || '0')
      const overtimeHrs = parseFloat(entry.overtime_hours || '0')
      const doubleTimeHrs = parseFloat(entry.double_time_hours || '0')

      projectData.regularHours += regularHrs
      projectData.overtimeHours += overtimeHrs
      projectData.doubleTimeHours += doubleTimeHrs
      projectData.totalHours += parseFloat(entry.total_hours || '0')
      projectData.totalCost += parseFloat(entry.total_pay || '0')

      // We don't have individual cost breakdown in entry, use total_pay
      // For better breakdown, we'd need to recalculate or store separately
      projectData.regularCost += parseFloat(entry.total_pay || '0')

      // Track workers
      projectData.entries++
      if (entry.user_id) {
        projectData.workers.add(entry.user_id)
        if (worker) {
          projectData.workerNames.add(`${worker.first_name} ${worker.last_name}`)
        }
      }
    }

    // Convert to array and calculate averages
    return Array.from(projectMap.values()).map(proj => ({
      projectId: proj.projectId,
      projectName: proj.projectName,
      projectNumber: proj.projectNumber,
      projectStatus: proj.projectStatus,
      totalHours: Math.round(proj.totalHours * 100) / 100,
      regularHours: Math.round(proj.regularHours * 100) / 100,
      overtimeHours: Math.round(proj.overtimeHours * 100) / 100,
      doubleTimeHours: Math.round(proj.doubleTimeHours * 100) / 100,
      totalCost: Math.round(proj.totalCost * 100) / 100,
      regularCost: Math.round(proj.regularCost * 100) / 100,
      overtimeCost: Math.round(proj.overtimeCost * 100) / 100,
      doubleTimeCost: Math.round(proj.doubleTimeCost * 100) / 100,
      workersCount: proj.workers.size,
      workerNames: Array.from(proj.workerNames),
      avgHoursPerWorker: proj.workers.size > 0
        ? Math.round((proj.totalHours / proj.workers.size) * 100) / 100
        : 0,
      avgCostPerHour: proj.totalHours > 0
        ? Math.round((proj.totalCost / proj.totalHours) * 100) / 100
        : 0,
      totalEntries: proj.entries
    }))
  }

  // ==============================================
  // 3. TIME BY COST CODE (Trade/Work Type)
  // ==============================================
  async getTimeByCostCode(
    companyId: string,
    filters: PayrollReportFilters
  ): Promise<PayrollReportByCostCode[]> {
    this.log('Fetching time by cost code', { companyId, filters })

    let query = this.supabaseClient
      .from('time_entries')
      .select(`
        trade,
        work_type,
        user_id,
        project_id,
        regular_hours,
        overtime_hours,
        double_time_hours,
        total_hours,
        total_pay
      `)
      .eq('company_id', companyId)
      .gte('date', filters.startDate)
      .lte('date', filters.endDate)

    // Apply filters
    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'pending') {
        query = query.in('status', ['pending', 'clocked_out'])
      } else {
        query = query.eq('status', filters.status)
      }
    }

    const { data: entries, error } = await query

    if (error) {
      this.log('Error fetching time by cost code', error)
      throw new Error(`Failed to fetch time by cost code: ${error.message}`)
    }

    if (!entries || entries.length === 0) {
      return []
    }

    // Calculate total hours for percentage
    const totalHoursSum = entries.reduce((sum, entry) => 
      sum + parseFloat(entry.total_hours || '0'), 0
    )

    // Group by trade and work_type
    const costCodeMap = new Map<string, {
      costCode: string
      costCodeType: 'trade' | 'work_type'
      costCodeLabel: string
      regularHours: number
      overtimeHours: number
      doubleTimeHours: number
      totalHours: number
      totalCost: number
      workers: Set<string>
      projects: Set<string>
      entries: number
    }>()

    for (const entry of entries) {
      // Process trade
      if (entry.trade) {
        const key = `trade_${entry.trade}`
        if (!costCodeMap.has(key)) {
          costCodeMap.set(key, {
            costCode: entry.trade,
            costCodeType: 'trade',
            costCodeLabel: entry.trade.charAt(0).toUpperCase() + entry.trade.slice(1),
            regularHours: 0,
            overtimeHours: 0,
            doubleTimeHours: 0,
            totalHours: 0,
            totalCost: 0,
            workers: new Set(),
            projects: new Set(),
            entries: 0
          })
        }

        const tradeData = costCodeMap.get(key)!
        tradeData.regularHours += parseFloat(entry.regular_hours || '0')
        tradeData.overtimeHours += parseFloat(entry.overtime_hours || '0')
        tradeData.doubleTimeHours += parseFloat(entry.double_time_hours || '0')
        tradeData.totalHours += parseFloat(entry.total_hours || '0')
        tradeData.totalCost += parseFloat(entry.total_pay || '0')
        tradeData.entries++
        if (entry.user_id) tradeData.workers.add(entry.user_id)
        if (entry.project_id) tradeData.projects.add(entry.project_id)
      }

      // Process work_type
      if (entry.work_type) {
        const key = `work_type_${entry.work_type}`
        if (!costCodeMap.has(key)) {
          costCodeMap.set(key, {
            costCode: entry.work_type,
            costCodeType: 'work_type',
            costCodeLabel: entry.work_type.charAt(0).toUpperCase() + entry.work_type.slice(1).replace('_', ' '),
            regularHours: 0,
            overtimeHours: 0,
            doubleTimeHours: 0,
            totalHours: 0,
            totalCost: 0,
            workers: new Set(),
            projects: new Set(),
            entries: 0
          })
        }

        const workTypeData = costCodeMap.get(key)!
        workTypeData.regularHours += parseFloat(entry.regular_hours || '0')
        workTypeData.overtimeHours += parseFloat(entry.overtime_hours || '0')
        workTypeData.doubleTimeHours += parseFloat(entry.double_time_hours || '0')
        workTypeData.totalHours += parseFloat(entry.total_hours || '0')
        workTypeData.totalCost += parseFloat(entry.total_pay || '0')
        workTypeData.entries++
        if (entry.user_id) workTypeData.workers.add(entry.user_id)
        if (entry.project_id) workTypeData.projects.add(entry.project_id)
      }
    }

    // Convert to array and calculate percentages
    return Array.from(costCodeMap.values()).map(code => ({
      costCode: code.costCode,
      costCodeType: code.costCodeType,
      costCodeLabel: code.costCodeLabel,
      totalHours: Math.round(code.totalHours * 100) / 100,
      regularHours: Math.round(code.regularHours * 100) / 100,
      overtimeHours: Math.round(code.overtimeHours * 100) / 100,
      doubleTimeHours: Math.round(code.doubleTimeHours * 100) / 100,
      totalCost: Math.round(code.totalCost * 100) / 100,
      percentOfTotal: totalHoursSum > 0
        ? Math.round((code.totalHours / totalHoursSum) * 10000) / 100
        : 0,
      workersCount: code.workers.size,
      projectsCount: code.projects.size,
      entriesCount: code.entries,
      avgCostPerHour: code.totalHours > 0
        ? Math.round((code.totalCost / code.totalHours) * 100) / 100
        : 0
    }))
  }

  // ==============================================
  // 4. OVERTIME SUMMARY
  // ==============================================
  async getOvertimeSummary(
    companyId: string,
    filters: PayrollReportFilters
  ): Promise<OvertimeSummary[]> {
    this.log('Fetching overtime summary', { companyId, filters })

    let query = this.supabaseClient
      .from('time_entries')
      .select(`
        user_id,
        overtime_hours,
        double_time_hours,
        total_hours,
        overtime_rate,
        double_time_rate,
        date,
        project_id,
        worker:users!time_entries_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        project:projects!time_entries_project_id_fkey (
          name
        )
      `)
      .eq('company_id', companyId)
      .gte('date', filters.startDate)
      .lte('date', filters.endDate)
      .or('overtime_hours.gt.0,double_time_hours.gt.0') // Only entries with OT

    // Apply filters
    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'pending') {
        query = query.in('status', ['pending', 'clocked_out'])
      } else {
        query = query.eq('status', filters.status)
      }
    }

    const { data: entries, error } = await query

    if (error) {
      this.log('Error fetching overtime summary', error)
      throw new Error(`Failed to fetch overtime summary: ${error.message}`)
    }

    if (!entries || entries.length === 0) {
      return []
    }

    // Group by user
    const userOTMap = new Map<string, {
      userId: string
      userName: string
      userEmail: string
      overtimeHours: number
      doubleTimeHours: number
      overtimePay: number
      doubleTimePay: number
      totalHours: number
      daysWithOT: Set<string>
      projects: Set<string>
    }>()

    for (const entry of entries) {
      const userId = entry.user_id
      if (!userId) continue

      const worker = entry.worker as any
      const project = entry.project as any

      if (!userOTMap.has(userId)) {
        userOTMap.set(userId, {
          userId,
          userName: worker ? `${worker.first_name} ${worker.last_name}` : 'Unknown',
          userEmail: worker?.email || '',
          overtimeHours: 0,
          doubleTimeHours: 0,
          overtimePay: 0,
          doubleTimePay: 0,
          totalHours: 0,
          daysWithOT: new Set(),
          projects: new Set()
        })
      }

      const userData = userOTMap.get(userId)!

      const overtimeHrs = parseFloat(entry.overtime_hours || '0')
      const doubleTimeHrs = parseFloat(entry.double_time_hours || '0')
      const overtimeRate = parseFloat(entry.overtime_rate || '0')
      const doubleTimeRate = parseFloat(entry.double_time_rate || '0')

      userData.overtimeHours += overtimeHrs
      userData.doubleTimeHours += doubleTimeHrs
      userData.overtimePay += overtimeHrs * overtimeRate
      userData.doubleTimePay += doubleTimeHrs * doubleTimeRate
      userData.totalHours += parseFloat(entry.total_hours || '0')

      if (entry.date) {
        userData.daysWithOT.add(entry.date)
      }

      if (project?.name) {
        userData.projects.add(project.name)
      }
    }

    // Convert to array and calculate percentages
    return Array.from(userOTMap.values()).map(user => {
      const totalOTHours = user.overtimeHours + user.doubleTimeHours
      const totalOTPay = user.overtimePay + user.doubleTimePay

      return {
        userId: user.userId,
        userName: user.userName,
        userEmail: user.userEmail,
        overtimeHours: Math.round(user.overtimeHours * 100) / 100,
        doubleTimeHours: Math.round(user.doubleTimeHours * 100) / 100,
        totalOTHours: Math.round(totalOTHours * 100) / 100,
        overtimePay: Math.round(user.overtimePay * 100) / 100,
        doubleTimePay: Math.round(user.doubleTimePay * 100) / 100,
        totalOTPay: Math.round(totalOTPay * 100) / 100,
        percentOT: user.totalHours > 0
          ? Math.round((totalOTHours / user.totalHours) * 10000) / 100
          : 0,
        daysWithOT: user.daysWithOT.size,
        projectsWithOT: Array.from(user.projects)
      }
    }).sort((a, b) => b.totalOTHours - a.totalOTHours) // Sort by most OT
  }

  // ==============================================
  // 5. DETAILED ENTRIES (With Notes)
  // ==============================================
  async getDetailedEntries(
    companyId: string,
    filters: PayrollReportFilters
  ): Promise<DetailedPayrollEntry[]> {
    this.log('Fetching detailed entries', { companyId, filters })

    let query = this.supabaseClient
      .from('time_entries')
      .select(`
        id,
        date,
        start_time,
        end_time,
        break_minutes,
        regular_hours,
        overtime_hours,
        double_time_hours,
        total_hours,
        regular_rate,
        overtime_rate,
        double_time_rate,
        total_pay,
        work_type,
        trade,
        description,
        work_completed,
        issues_encountered,
        status,
        approved_by,
        approved_at,
        worker:users!time_entries_user_id_fkey (
          first_name,
          last_name,
          email
        ),
        project:projects!time_entries_project_id_fkey (
          name,
          project_number
        ),
        schedule_project:schedule_projects!time_entries_schedule_project_id_fkey (
          title
        )
      `)
      .eq('company_id', companyId)
      .gte('date', filters.startDate)
      .lte('date', filters.endDate)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })

    // Apply filters
    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'pending') {
        query = query.in('status', ['pending', 'clocked_out'])
      } else {
        query = query.eq('status', filters.status)
      }
    }

    const { data: entries, error } = await query

    if (error) {
      this.log('Error fetching detailed entries', error)
      throw new Error(`Failed to fetch detailed entries: ${error.message}`)
    }

    if (!entries || entries.length === 0) {
      return []
    }

    return entries.map(entry => {
      const worker = entry.worker as any
      const project = entry.project as any
      const scheduleProject = entry.schedule_project as any

      const regularHrs = parseFloat(entry.regular_hours || '0')
      const overtimeHrs = parseFloat(entry.overtime_hours || '0')
      const doubleTimeHrs = parseFloat(entry.double_time_hours || '0')
      const regularRate = parseFloat(entry.regular_rate || '0')
      const overtimeRate = parseFloat(entry.overtime_rate || '0')
      const doubleTimeRate = parseFloat(entry.double_time_rate || '0')

      return {
        id: entry.id,
        date: entry.date,
        userName: worker ? `${worker.first_name} ${worker.last_name}` : 'Unknown',
        userEmail: worker?.email || '',
        projectName: project?.name || 'Unknown Project',
        projectNumber: project?.project_number,
        scheduleProjectTitle: scheduleProject?.title,
        startTime: entry.start_time || '',
        endTime: entry.end_time,
        breakMinutes: entry.break_minutes || 0,
        regularHours: Math.round(regularHrs * 100) / 100,
        overtimeHours: Math.round(overtimeHrs * 100) / 100,
        doubleTimeHours: Math.round(doubleTimeHrs * 100) / 100,
        totalHours: Math.round(parseFloat(entry.total_hours || '0') * 100) / 100,
        regularRate: Math.round(regularRate * 100) / 100,
        overtimeRate: Math.round(overtimeRate * 100) / 100,
        doubleTimeRate: Math.round(doubleTimeRate * 100) / 100,
        regularPay: Math.round(regularHrs * regularRate * 100) / 100,
        overtimePay: Math.round(overtimeHrs * overtimeRate * 100) / 100,
        doubleTimePay: Math.round(doubleTimeHrs * doubleTimeRate * 100) / 100,
        totalPay: Math.round(parseFloat(entry.total_pay || '0') * 100) / 100,
        workType: entry.work_type,
        trade: entry.trade,
        description: entry.description,
        workCompleted: entry.work_completed,
        issuesEncountered: entry.issues_encountered,
        status: entry.status || 'unknown',
        approvedBy: entry.approved_by,
        approvedAt: entry.approved_at
      }
    })
  }

  // ==============================================
  // 6. TOTAL HOURS SUMMARY (Overall Statistics)
  // ==============================================
  async getTotalHoursSummary(
    companyId: string,
    filters: PayrollReportFilters
  ): Promise<TotalHoursSummary> {
    this.log('Fetching total hours summary', { companyId, filters })

    // Get all entries
    let query = this.supabaseClient
      .from('time_entries')
      .select(`
        id,
        user_id,
        project_id,
        regular_hours,
        overtime_hours,
        double_time_hours,
        total_hours,
        total_pay,
        status
      `)
      .eq('company_id', companyId)
      .gte('date', filters.startDate)
      .lte('date', filters.endDate)

    // Apply filters
    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'pending') {
        query = query.in('status', ['pending', 'clocked_out'])
      } else {
        query = query.eq('status', filters.status)
      }
    }

    const { data: entries, error } = await query

    if (error) {
      this.log('Error fetching total summary', error)
      throw new Error(`Failed to fetch total summary: ${error.message}`)
    }

    if (!entries || entries.length === 0) {
      return this.getEmptySummary(filters)
    }

    // Calculate totals
    const uniqueWorkers = new Set<string>()
    const uniqueProjects = new Set<string>()
    let totalRegularHours = 0
    let totalOvertimeHours = 0
    let totalDoubleTimeHours = 0
    let grandTotalHours = 0
    let totalRegularCost = 0
    let totalOvertimeCost = 0
    let totalDoubleTimeCost = 0
    let grandTotalCost = 0
    let pendingEntries = 0
    let approvedEntries = 0
    let pendingCost = 0
    let approvedCost = 0

    for (const entry of entries) {
      const regularHrs = parseFloat(entry.regular_hours || '0')
      const overtimeHrs = parseFloat(entry.overtime_hours || '0')
      const doubleTimeHrs = parseFloat(entry.double_time_hours || '0')
      const totalPay = parseFloat(entry.total_pay || '0')

      totalRegularHours += regularHrs
      totalOvertimeHours += overtimeHrs
      totalDoubleTimeHours += doubleTimeHrs
      grandTotalHours += parseFloat(entry.total_hours || '0')
      grandTotalCost += totalPay

      // For cost breakdown, we use total_pay
      // In a more detailed system, you'd calculate each type separately
      totalRegularCost += totalPay

      // Track unique workers and projects
      if (entry.user_id) uniqueWorkers.add(entry.user_id)
      if (entry.project_id) uniqueProjects.add(entry.project_id)

      // Status breakdown
      if (entry.status === 'pending' || entry.status === 'clocked_out') {
        pendingEntries++
        pendingCost += totalPay
      } else if (entry.status === 'approved') {
        approvedEntries++
        approvedCost += totalPay
      }
    }

    // Calculate date range
    const start = new Date(filters.startDate)
    const end = new Date(filters.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    // Calculate percentages
    const percentRegular = grandTotalHours > 0 
      ? (totalRegularHours / grandTotalHours) * 100 
      : 0
    const percentOvertime = grandTotalHours > 0 
      ? (totalOvertimeHours / grandTotalHours) * 100 
      : 0
    const percentDoubleTime = grandTotalHours > 0 
      ? (totalDoubleTimeHours / grandTotalHours) * 100 
      : 0

    return {
      startDate: filters.startDate,
      endDate: filters.endDate,
      totalDays,
      totalEntries: entries.length,
      totalWorkers: uniqueWorkers.size,
      totalProjects: uniqueProjects.size,
      totalRegularHours: Math.round(totalRegularHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      totalDoubleTimeHours: Math.round(totalDoubleTimeHours * 100) / 100,
      grandTotalHours: Math.round(grandTotalHours * 100) / 100,
      totalRegularCost: Math.round(totalRegularCost * 100) / 100,
      totalOvertimeCost: Math.round(totalOvertimeCost * 100) / 100,
      totalDoubleTimeCost: Math.round(totalDoubleTimeCost * 100) / 100,
      grandTotalCost: Math.round(grandTotalCost * 100) / 100,
      avgHoursPerWorker: uniqueWorkers.size > 0 
        ? Math.round((grandTotalHours / uniqueWorkers.size) * 100) / 100 
        : 0,
      avgHoursPerEntry: entries.length > 0 
        ? Math.round((grandTotalHours / entries.length) * 100) / 100 
        : 0,
      avgCostPerHour: grandTotalHours > 0 
        ? Math.round((grandTotalCost / grandTotalHours) * 100) / 100 
        : 0,
      avgCostPerWorker: uniqueWorkers.size > 0 
        ? Math.round((grandTotalCost / uniqueWorkers.size) * 100) / 100 
        : 0,
      percentRegularHours: Math.round(percentRegular * 100) / 100,
      percentOvertimeHours: Math.round(percentOvertime * 100) / 100,
      percentDoubleTimeHours: Math.round(percentDoubleTime * 100) / 100,
      pendingEntries,
      approvedEntries,
      pendingCost: Math.round(pendingCost * 100) / 100,
      approvedCost: Math.round(approvedCost * 100) / 100
    }
  }

  // ==============================================
  // 7. MAIN METHOD - GET COMPLETE PAYROLL REPORT
  // ==============================================
  async getPayrollReport(
    companyId: string,
    userId: string,
    filters: PayrollReportFilters
  ): Promise<PayrollReport> {
    this.log('Generating complete payroll report', { companyId, userId, filters })

    try {
      // Fetch all sections in parallel for better performance
      const [
        summary,
        byPerson,
        byProject,
        byCostCode,
        overtimeSummary,
        detailedEntries
      ] = await Promise.all([
        this.getTotalHoursSummary(companyId, filters),
        this.getTimeByPerson(companyId, filters),
        this.getTimeByProject(companyId, filters),
        this.getTimeByCostCode(companyId, filters),
        this.getOvertimeSummary(companyId, filters),
        filters.includeDetailedEntries 
          ? this.getDetailedEntries(companyId, filters)
          : Promise.resolve([])
      ])

      return {
        summary,
        byPerson,
        byProject,
        byCostCode,
        overtimeSummary,
        detailedEntries: filters.includeDetailedEntries ? detailedEntries : undefined,
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        filters
      }
    } catch (error) {
      this.log('Error generating payroll report', error)
      throw error
    }
  }

  // ==============================================
  // 8. QUICK STATS (For Dashboard)
  // ==============================================
  async getPayrollStats(
    companyId: string,
    filters?: { projectId?: string; userId?: string }
  ): Promise<{
    thisWeekHours: number
    thisWeekCost: number
    pendingApprovalsCost: number
    topWorkers: Array<{
      userId: string
      userName: string
      totalHours: number
      totalPay: number
    }>
    topProjects: Array<{
      projectId: string
      projectName: string
      totalHours: number
      totalCost: number
    }>
  }> {
    this.log('Fetching payroll stats', { companyId, filters })

    // Get this week's date range
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    const startDate = startOfWeek.toISOString().split('T')[0]
    const endDate = now.toISOString().split('T')[0]

    // This week query
    let weekQuery = this.supabaseClient
      .from('time_entries')
      .select('total_hours, total_pay')
      .eq('company_id', companyId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (filters?.projectId) {
      weekQuery = weekQuery.eq('project_id', filters.projectId)
    }

    if (filters?.userId) {
      weekQuery = weekQuery.eq('user_id', filters.userId)
    }

    const { data: weekEntries, error: weekError } = await weekQuery

    if (weekError) {
      this.log('Error fetching week stats', weekError)
      throw new Error(`Failed to fetch week stats: ${weekError.message}`)
    }

    const thisWeekHours = weekEntries?.reduce((sum, e) => 
      sum + parseFloat(e.total_hours || '0'), 0
    ) || 0

    const thisWeekCost = weekEntries?.reduce((sum, e) => 
      sum + parseFloat(e.total_pay || '0'), 0
    ) || 0

    // Pending approvals
    let pendingQuery = this.supabaseClient
      .from('time_entries')
      .select('total_pay')
      .eq('company_id', companyId)
      .in('status', ['pending', 'clocked_out'])

    if (filters?.projectId) {
      pendingQuery = pendingQuery.eq('project_id', filters.projectId)
    }

    if (filters?.userId) {
      pendingQuery = pendingQuery.eq('user_id', filters.userId)
    }

    const { data: pendingEntries, error: pendingError } = await pendingQuery

    if (pendingError) {
      this.log('Error fetching pending stats', pendingError)
    }

    const pendingApprovalsCost = pendingEntries?.reduce((sum, e) => 
      sum + parseFloat(e.total_pay || '0'), 0
    ) || 0

    // Top workers (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    const { data: workerStats } = await this.supabaseClient
      .from('time_entries')
      .select(`
        user_id,
        total_hours,
        total_pay,
        worker:users!time_entries_user_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('company_id', companyId)
      .gte('date', thirtyDaysAgoStr)
      .limit(1000)

    const workerMap = new Map<string, { 
      userId: string
      userName: string
      totalHours: number
      totalPay: number 
    }>()

    workerStats?.forEach(entry => {
      const worker = entry.worker as any
      if (!entry.user_id || !worker) return

      if (!workerMap.has(entry.user_id)) {
        workerMap.set(entry.user_id, {
          userId: entry.user_id,
          userName: `${worker.first_name} ${worker.last_name}`,
          totalHours: 0,
          totalPay: 0
        })
      }

      const data = workerMap.get(entry.user_id)!
      data.totalHours += parseFloat(entry.total_hours || '0')
      data.totalPay += parseFloat(entry.total_pay || '0')
    })

    const topWorkers = Array.from(workerMap.values())
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5)

    // Top projects (last 30 days)
    const { data: projectStats } = await this.supabaseClient
      .from('time_entries')
      .select(`
        project_id,
        total_hours,
        total_pay,
        project:projects!time_entries_project_id_fkey (
          name
        )
      `)
      .eq('company_id', companyId)
      .gte('date', thirtyDaysAgoStr)
      .limit(1000)

    const projectMap = new Map<string, {
      projectId: string
      projectName: string
      totalHours: number
      totalCost: number
    }>()

    projectStats?.forEach(entry => {
      const project = entry.project as any
      if (!entry.project_id || !project) return

      if (!projectMap.has(entry.project_id)) {
        projectMap.set(entry.project_id, {
          projectId: entry.project_id,
          projectName: project.name,
          totalHours: 0,
          totalCost: 0
        })
      }

      const data = projectMap.get(entry.project_id)!
      data.totalHours += parseFloat(entry.total_hours || '0')
      data.totalCost += parseFloat(entry.total_pay || '0')
    })

    const topProjects = Array.from(projectMap.values())
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 3)

    return {
      thisWeekHours: Math.round(thisWeekHours * 100) / 100,
      thisWeekCost: Math.round(thisWeekCost * 100) / 100,
      pendingApprovalsCost: Math.round(pendingApprovalsCost * 100) / 100,
      topWorkers,
      topProjects
    }
  }

  // ==============================================
  // HELPER: Empty Summary
  // ==============================================
  private getEmptySummary(filters: PayrollReportFilters): TotalHoursSummary {
    const start = new Date(filters.startDate)
    const end = new Date(filters.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    return {
      startDate: filters.startDate,
      endDate: filters.endDate,
      totalDays,
      totalEntries: 0,
      totalWorkers: 0,
      totalProjects: 0,
      totalRegularHours: 0,
      totalOvertimeHours: 0,
      totalDoubleTimeHours: 0,
      grandTotalHours: 0,
      totalRegularCost: 0,
      totalOvertimeCost: 0,
      totalDoubleTimeCost: 0,
      grandTotalCost: 0,
      avgHoursPerWorker: 0,
      avgHoursPerEntry: 0,
      avgCostPerHour: 0,
      avgCostPerWorker: 0,
      percentRegularHours: 0,
      percentOvertimeHours: 0,
      percentDoubleTimeHours: 0,
      pendingEntries: 0,
      approvedEntries: 0,
      pendingCost: 0,
      approvedCost: 0
    }
  }
}