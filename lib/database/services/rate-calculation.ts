// ==============================================
// lib/services/rate-calculation.ts - Rate Calculation Service
// Fetches hourly rates with correct priority: project_members → users
// ==============================================

import { createServerClient } from '@/lib/supabase/server'

// ==============================================
// INTERFACES
// ==============================================
interface RateResult {
  regularRate: number
  overtimeRate: number
  doubleTimeRate?: number
  source: 'project_override' | 'user_default'
}

interface RateError {
  error: string
  details?: string
}

// ==============================================
// RATE CALCULATION SERVICE CLASS
// ==============================================
export class RateCalculationService {
  private supabaseClient: ReturnType<typeof createServerClient>
  private enableLogging: boolean

  constructor(enableLogging = false) {
    this.enableLogging = enableLogging
    this.supabaseClient = createServerClient()
  }

  // ==============================================
  // LOGGING HELPER
  // ==============================================
  private log(message: string, data?: any) {
    if (this.enableLogging) {
      console.log(`[RateCalculationService] ${message}`, data || '')
    }
  }

  // ==============================================
  // GET HOURLY RATE (Main Method)
  // Priority: project_members.hourly_rate → users.hourly_rate
  // ==============================================
  async getHourlyRate(
    userId: string,
    projectId: string,
    companyId: string
  ): Promise<number> {
    this.log('Getting hourly rate', { userId, projectId })

    try {
      // Step 1: Check project_members table for project-specific override
      const { data: projectMember, error: pmError } = await this.supabaseClient
        .from('project_members')
        .select('hourly_rate')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .single()

      if (pmError && pmError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is ok
        this.log('Error fetching project member rate', pmError)
      }

      // If project-specific rate exists and is not null, use it
      if (projectMember && projectMember.hourly_rate !== null) {
        const rate = parseFloat(projectMember.hourly_rate as any)
        this.log('Using project-specific rate', { rate, source: 'project_override' })
        return rate
      }

      // Step 2: Fall back to user's default rate
      const { data: user, error: userError } = await this.supabaseClient
        .from('users')
        .select('hourly_rate')
        .eq('id', userId)
        .single()

      if (userError) {
        this.log('Error fetching user rate', userError)
        throw new Error(`Failed to fetch user rate: ${userError.message}`)
      }

      if (!user || user.hourly_rate === null) {
        throw new Error('No hourly rate found for user. Please set a default rate.')
      }

      const rate = parseFloat(user.hourly_rate as any)
      this.log('Using user default rate', { rate, source: 'user_default' })
      return rate

    } catch (error) {
      this.log('Get hourly rate error', error)
      throw error
    }
  }

  // ==============================================
  // GET OVERTIME RATE (Main Method)
  // Priority: project_members.overtime_rate → users.overtime_rate → hourly_rate × 1.5
  // ==============================================
  async getOvertimeRate(
    userId: string,
    projectId: string,
    companyId: string
  ): Promise<number> {
    this.log('Getting overtime rate', { userId, projectId })

    try {
      // Step 1: Check project_members table for project-specific override
      const { data: projectMember, error: pmError } = await this.supabaseClient
        .from('project_members')
        .select('overtime_rate, hourly_rate')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .single()

      if (pmError && pmError.code !== 'PGRST116') {
        this.log('Error fetching project member OT rate', pmError)
      }

      // If project-specific OT rate exists and is not null, use it
      if (projectMember && projectMember.overtime_rate !== null) {
        const rate = parseFloat(projectMember.overtime_rate as any)
        this.log('Using project-specific OT rate', { rate, source: 'project_override' })
        return rate
      }

      // Step 2: Fall back to user's default OT rate
      const { data: user, error: userError } = await this.supabaseClient
        .from('users')
        .select('overtime_rate, hourly_rate')
        .eq('id', userId)
        .single()

      if (userError) {
        this.log('Error fetching user OT rate', userError)
        throw new Error(`Failed to fetch user OT rate: ${userError.message}`)
      }

      // If user has explicit OT rate, use it
      if (user && user.overtime_rate !== null) {
        const rate = parseFloat(user.overtime_rate as any)
        this.log('Using user default OT rate', { rate, source: 'user_default' })
        return rate
      }

      // Step 3: Calculate OT rate as 1.5x regular rate
      if (user && user.hourly_rate !== null) {
        const regularRate = parseFloat(user.hourly_rate as any)
        const calculatedOTRate = regularRate * 1.5
        this.log('Calculated OT rate as 1.5x regular', { 
          regularRate, 
          calculatedOTRate, 
          source: 'calculated' 
        })
        return calculatedOTRate
      }

      // If we got here, we have a problem
      // Let's try to get the regular rate and calculate
      const regularRate = await this.getHourlyRate(userId, projectId, companyId)
      const calculatedOTRate = regularRate * 1.5
      this.log('Calculated OT rate from regular rate', { regularRate, calculatedOTRate })
      return calculatedOTRate

    } catch (error) {
      this.log('Get overtime rate error', error)
      throw error
    }
  }

  // ==============================================
  // GET DOUBLE TIME RATE (Optional)
  // Priority: project_members → users → overtime_rate × 1.5 → hourly_rate × 2
  // ==============================================
  async getDoubleTimeRate(
    userId: string,
    projectId: string,
    companyId: string
  ): Promise<number> {
    this.log('Getting double time rate', { userId, projectId })

    try {
      // For now, calculate as 2x regular rate
      const regularRate = await this.getHourlyRate(userId, projectId, companyId)
      const doubleTimeRate = regularRate * 2
      
      this.log('Calculated double time rate', { regularRate, doubleTimeRate })
      return doubleTimeRate

    } catch (error) {
      this.log('Get double time rate error', error)
      throw error
    }
  }

  // ==============================================
  // GET ALL RATES AT ONCE (Optimized)
  // Returns all rates in one call with single query optimization
  // ==============================================
  async getAllRates(
    userId: string,
    projectId: string,
    companyId: string
  ): Promise<RateResult> {
    this.log('Getting all rates at once', { userId, projectId })

    try {
      // Fetch both project_member and user data in parallel
      const [projectMemberResult, userResult] = await Promise.all([
        this.supabaseClient
          .from('project_members')
          .select('hourly_rate, overtime_rate')
          .eq('user_id', userId)
          .eq('project_id', projectId)
          .eq('company_id', companyId)
          .eq('status', 'active')
          .single(),
        
        this.supabaseClient
          .from('users')
          .select('hourly_rate, overtime_rate')
          .eq('id', userId)
          .single()
      ])

      const projectMember = projectMemberResult.data
      const user = userResult.data

      // Determine source
      const hasProjectOverride = projectMember && projectMember.hourly_rate !== null
      const source = hasProjectOverride ? 'project_override' : 'user_default'

      // Get regular rate
      let regularRate: number
      if (hasProjectOverride) {
        regularRate = parseFloat(projectMember.hourly_rate as any)
      } else if (user && user.hourly_rate !== null) {
        regularRate = parseFloat(user.hourly_rate as any)
      } else {
        throw new Error('No hourly rate found for user')
      }

      // Get overtime rate
      let overtimeRate: number
      if (projectMember && projectMember.overtime_rate !== null) {
        overtimeRate = parseFloat(projectMember.overtime_rate as any)
      } else if (user && user.overtime_rate !== null) {
        overtimeRate = parseFloat(user.overtime_rate as any)
      } else {
        // Calculate as 1.5x regular
        overtimeRate = regularRate * 1.5
      }

      // Get double time rate (always calculated as 2x regular)
      const doubleTimeRate = regularRate * 2

      this.log('All rates fetched successfully', {
        regularRate,
        overtimeRate,
        doubleTimeRate,
        source
      })

      return {
        regularRate,
        overtimeRate,
        doubleTimeRate,
        source
      }

    } catch (error) {
      this.log('Get all rates error', error)
      throw error
    }
  }

  // ==============================================
  // VALIDATE RATES
  // Checks if user has valid rates set up
  // ==============================================
  async validateUserRates(
    userId: string,
    projectId?: string,
    companyId?: string
  ): Promise<{ isValid: boolean; message?: string }> {
    try {
      // Check if user has a default rate
      const { data: user } = await this.supabaseClient
        .from('users')
        .select('hourly_rate')
        .eq('id', userId)
        .single()

      if (!user || user.hourly_rate === null) {
        return {
          isValid: false,
          message: 'No default hourly rate set. Please contact your administrator.'
        }
      }

      // If project specified, check if override exists
      if (projectId && companyId) {
        const { data: projectMember } = await this.supabaseClient
          .from('project_members')
          .select('hourly_rate')
          .eq('user_id', userId)
          .eq('project_id', projectId)
          .eq('company_id', companyId)
          .eq('status', 'active')
          .single()

        // Project member exists but no rate - use user default (still valid)
        if (projectMember && projectMember.hourly_rate === null) {
          return {
            isValid: true,
            message: 'Using default user rate for this project'
          }
        }

        // Project member exists with override
        if (projectMember && projectMember.hourly_rate !== null) {
          return {
            isValid: true,
            message: 'Using project-specific rate override'
          }
        }
      }

      return {
        isValid: true,
        message: 'Using default user rate'
      }

    } catch (error) {
      return {
        isValid: false,
        message: 'Error validating rates'
      }
    }
  }
}

// ==============================================
// CONVENIENCE EXPORT
// ==============================================
export default RateCalculationService