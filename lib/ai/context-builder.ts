// ==============================================
// lib/ai/context-builder.ts - Build Context from Database
// ==============================================

import { createClient } from '@supabase/supabase-js'
import type { UserContext, DatabaseContext } from '@/types/ai'
import { getAIContextPermissions } from './permissions'

// ==============================================
// PAYROLL SUMMARY TYPE
// ==============================================
interface PayrollSummary {
  weeklyHours: number
  weeklyPay: number
  pendingApprovals: number
}

// ==============================================
// CONTEXT BUILDER SERVICE
// ==============================================
export class AIContextBuilder {
  private supabaseClient: ReturnType<typeof createClient>
  private enableLogging: boolean

  constructor(enableLogging = false) {
    this.enableLogging = enableLogging

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    this.supabaseClient = createClient(supabaseUrl, supabaseKey)
  }

  private log(message: string, data?: any) {
    if (this.enableLogging) {
      console.log(`[AIContextBuilder] ${message}`, data || '')
    }
  }

  // ==============================================
  // BUILD DATABASE CONTEXT
  // ==============================================
  async buildDatabaseContext(
    userContext: UserContext
  ): Promise<DatabaseContext> {
    this.log('Building database context', { userId: userContext.userId, role: userContext.role })

    const permissions = getAIContextPermissions(userContext.role)
    const context: DatabaseContext = {}

    try {
      // Always fetch user's own data
      context.myProjects = await this.getUserProjects(userContext.userId, userContext.companyId)
      context.myTimeEntries = await this.getUserTimeEntries(userContext.userId, userContext.companyId)
      context.myPunchlistItems = await this.getUserPunchlistItems(userContext.userId, userContext.companyId)

      // Fetch admin data if user has permissions
      if (permissions.canAccessAllProjects) {
        context.companyProjects = await this.getCompanyProjects(userContext.companyId)
      }

      if (permissions.canAccessTeamData) {
        context.teamMembers = await this.getTeamMembers(userContext.companyId)
      }

      if (permissions.canAccessPayroll) {
        const payrollData = await this.getPayrollSummary(userContext.companyId)
        // Store as any[] to match DatabaseContext type, but we'll use it correctly
        context.payrollData = payrollData ? [payrollData] : []
      }

      this.log('Context built successfully')
      return context
    } catch (error) {
      this.log('Error building context', error)
      return context // Return partial context on error
    }
  }

  // ==============================================
  // GET USER'S PROJECTS
  // ==============================================
  private async getUserProjects(userId: string, companyId: string) {
    const { data, error } = await this.supabaseClient
      .from('project_members')
      .select(`
        project:projects (
          id,
          name,
          status,
          start_date,
          end_date,
          budget
        )
      `)
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .limit(10)

    if (error) {
      this.log('Error fetching user projects', error)
      return []
    }

    return data?.map(pm => pm.project).filter(Boolean) || []
  }

  // ==============================================
  // GET USER'S TIME ENTRIES (Recent)
  // ==============================================
  private async getUserTimeEntries(userId: string, companyId: string) {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { data, error } = await this.supabaseClient
      .from('time_entries')
      .select('id, date, total_hours, status, project:projects(name)')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .gte('date', oneWeekAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(20)

    if (error) {
      this.log('Error fetching time entries', error)
      return []
    }

    return data || []
  }

  // ==============================================
  // GET USER'S PUNCHLIST ITEMS
  // ==============================================
  private async getUserPunchlistItems(userId: string, companyId: string) {
    const { data, error } = await this.supabaseClient
      .from('punchlist_item_assignments')
      .select(`
        punchlist_item:punchlist_items (
          id,
          title,
          status,
          priority,
          due_date,
          project:projects(name)
        )
      `)
      .eq('company_id', companyId)
      .limit(20)

    if (error) {
      this.log('Error fetching punchlist items', error)
      return []
    }

    return data?.map(pa => pa.punchlist_item).filter(Boolean) || []
  }

  // ==============================================
  // GET COMPANY PROJECTS (Admin only)
  // ==============================================
  private async getCompanyProjects(companyId: string) {
    const { data, error } = await this.supabaseClient
      .from('projects')
      .select('id, name, status, budget, start_date, end_date')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      this.log('Error fetching company projects', error)
      return []
    }

    return data || []
  }

  // ==============================================
  // GET TEAM MEMBERS (Admin/Supervisor only)
  // ==============================================
  private async getTeamMembers(companyId: string) {
    const { data, error } = await this.supabaseClient
      .from('users')
      .select('id, first_name, last_name, role, trade_specialty')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('first_name', { ascending: true })
      .limit(50)

    if (error) {
      this.log('Error fetching team members', error)
      return []
    }

    return data || []
  }

  // ==============================================
  // GET PAYROLL SUMMARY (Admin only)
  // ==============================================
  private async getPayrollSummary(companyId: string): Promise<PayrollSummary | null> {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { data, error } = await this.supabaseClient
      .from('time_entries')
      .select('total_hours, total_pay, status')
      .eq('company_id', companyId)
      .gte('date', oneWeekAgo.toISOString().split('T')[0])

    if (error) {
      this.log('Error fetching payroll summary', error)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    // Calculate summary with proper type assertions
    const totalHours = data.reduce((sum, entry) => {
      const hours = String(entry.total_hours || '0')
      return sum + parseFloat(hours)
    }, 0)

    const totalPay = data.reduce((sum, entry) => {
      const pay = String(entry.total_pay || '0')
      return sum + parseFloat(pay)
    }, 0)

    const pendingEntries = data.filter(entry => 
      entry.status === 'pending' || entry.status === 'clocked_out'
    ).length

    return {
      weeklyHours: Math.round(totalHours * 100) / 100,
      weeklyPay: Math.round(totalPay * 100) / 100,
      pendingApprovals: pendingEntries,
    }
  }

  // ==============================================
  // FORMAT CONTEXT AS STRING
  // ==============================================
  formatContextAsString(context: DatabaseContext, userContext: UserContext): string {
    const lines: string[] = []

    lines.push(`User: ${userContext.firstName} ${userContext.lastName} (${userContext.role})`)
    lines.push('')

    // My Projects
    if (context.myProjects && context.myProjects.length > 0) {
      lines.push('**Your Assigned Projects:**')
      context.myProjects.forEach((project: any) => {
        lines.push(`- ${project.name} (${project.status})`)
      })
      lines.push('')
    }

    // My Recent Time
    if (context.myTimeEntries && context.myTimeEntries.length > 0) {
      const totalHours = context.myTimeEntries.reduce((sum: number, entry: any) => 
        sum + parseFloat(entry.total_hours || '0'), 0
      )
      lines.push(`**Your Recent Time (Last 7 Days):** ${totalHours.toFixed(1)} hours`)
      lines.push('')
    }

    // My Punchlist Items
    if (context.myPunchlistItems && context.myPunchlistItems.length > 0) {
      const openItems = context.myPunchlistItems.filter((item: any) => 
        item.status !== 'completed'
      ).length
      lines.push(`**Your Open Punchlist Items:** ${openItems}`)
      lines.push('')
    }

    // Company Data (Admin only)
    if (context.companyProjects && context.companyProjects.length > 0) {
      lines.push(`**Company Projects:** ${context.companyProjects.length} active projects`)
      lines.push('')
    }

    // Payroll data (stored as array with one element)
    if (context.payrollData && context.payrollData.length > 0) {
      const payrollData = context.payrollData[0] as PayrollSummary
      lines.push('**Company Payroll Summary (This Week):**')
      lines.push(`- Total Hours: ${payrollData.weeklyHours} hours`)
      lines.push(`- Total Pay: $${payrollData.weeklyPay.toLocaleString()}`)
      lines.push(`- Pending Approvals: ${payrollData.pendingApprovals}`)
      lines.push('')
    }

    return lines.join('\n')
  }
}