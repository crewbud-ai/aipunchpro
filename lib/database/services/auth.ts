// ==============================================
// src/lib/database/services/auth.ts - Complete Authentication Database Service
// ==============================================

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'
import bcrypt from 'bcryptjs'
import { DEFAULT_PERMISSIONS } from '../schema'

export class AuthDatabaseService {
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

  // ==============================================
  // COMPANY OPERATIONS
  // ==============================================
  async createCompany(data: {
    name: string
    slug: string
    industry?: string
    size?: string
  }) {
    const { data: company, error } = await this.supabaseClient
      .from('companies')
      .insert([{
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw error
    return company
  }

  async getCompanyBySlug(slug: string) {
    const { data, error } = await this.supabaseClient
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }
    return data
  }


  async getFirstCompany() {
    const { data, error } = await this.supabaseClient
      .from('companies')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }
    return data
  }

  // ==============================================
  // USER OPERATIONS
  // ==============================================
  async createUser(data: {
    company_id: string
    email: string
    first_name: string
    last_name: string
    role: string
    phone?: string | null
    password?: string // Add password field for future use
  }) {

    // Get permissions based on role
    const permissions = DEFAULT_PERMISSIONS[data.role] || DEFAULT_PERMISSIONS['member']

    const userData: any = {
      company_id: data.company_id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role,
      permissions: permissions,
      phone: data.phone || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Hash password if provided
    if (data.password) {
      userData.password_hash = await this.hashPassword(data.password)
    }

    const { data: user, error } = await this.supabaseClient
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) throw error
    return user
  }

  async createGoogleUser(data: {
    email: string
    firstName: string
    lastName: string
    googleId: string
    companyId: string
    avatarUrl?: string
  }) {
    // Get default permissions for member role
    const permissions = DEFAULT_PERMISSIONS['member']

    const userData = {
      company_id: data.companyId,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      google_id: data.googleId,
      auth_provider: 'google' as const,
      profile_completed: false, // User needs to complete profile
      role: 'member', // Always member for Google sign-ins
      permissions: permissions,
      avatar_url: data.avatarUrl,
      email_verified: true, // Google emails are pre-verified
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: user, error } = await this.supabaseClient
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) throw error
    return user
  }

  async completeGoogleUserProfile(userId: string, data: {
    phone?: string
    tradeSpecialty?: string
    startDate?: string
    emergencyContactName?: string
    emergencyContactPhone?: string
  }) {
    const updateData: any = {
      phone: data.phone,
      trade_specialty: data.tradeSpecialty,
      start_date: data.startDate,
      emergency_contact_name: data.emergencyContactName,
      emergency_contact_phone: data.emergencyContactPhone,
      profile_completed: true, // Mark profile as complete
      updated_at: new Date().toISOString(),
    }

    const { data: user, error } = await this.supabaseClient
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return user
  }

  async getUserByEmail(email: string) {
    const { data, error } = await this.supabaseClient
      .from('users')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }
    return data
  }

  async getUserForLogin(email: string) {
    const { data, error } = await this.supabaseClient
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        password_hash,
        email_verified,
        role,
        permissions,
        phone,
        last_login_at,
        created_at,
        updated_at,
        company:companies!inner(
          id,
          name,
          slug,
          industry,
          size
        )
      `)
      .eq('email', email)
      .single()

      console.log(error, 'Error')

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  }

  async getCompanyById(companyId: string) {
    const { data, error } = await this.supabaseClient
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }
    return data
  }

  async getUserById(userId: string) {
    const { data, error } = await this.supabaseClient
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        permissions,
        email_verified,
        last_login_at,
        created_at,
        updated_at,
        company:companies(
          id,
          name,
          slug,
          industry,
          size
      )
    `)
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  }

  async getUserByGoogleId(googleId: string) {
    const { data, error } = await this.supabaseClient
      .from('users')
      .select(`
      *,
      company:companies(*)
    `)
      .eq('google_id', googleId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }
    return data
  }

  async updateUserLastLogin(userId: string) {
    const { error } = await this.supabaseClient
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw error
  }

  // ==============================================
  // SESSION OPERATIONS
  // ==============================================
  async createUserSession(data: {
    userId: string
    token: string
    ipAddress: string
    userAgent: string
    expiresAt: Date
  }) {
    const tokenHash = await this.hashToken(data.token)

    const { data: session, error } = await this.supabaseClient
      .from('user_sessions')
      .insert([{
        user_id: data.userId,
        token_hash: tokenHash,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        expires_at: data.expiresAt.toISOString(),
        device_info: {},
        is_active: true,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw error
    return session
  }

  async getUserSession(token: string) {
    const tokenHash = await this.hashToken(token)

    const { data, error } = await this.supabaseClient
      .from('user_sessions')
      .select(`
        *,
        user:users(
          *,
          company:companies(*)
        )
      `)
      .eq('token_hash', tokenHash)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }
    return data
  }

  async invalidateUserSession(token: string) {
    const tokenHash = await this.hashToken(token)

    const { error } = await this.supabaseClient
      .from('user_sessions')
      .update({ is_active: false })
      .eq('token_hash', tokenHash)

    if (error) throw error
  }

  async invalidateAllUserSessions(userId: string) {
    const { error } = await this.supabaseClient
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (error) throw error
  }

  // ==============================================
  // AUTHENTICATION METHODS
  // ==============================================

  async authenticateUser(email: string, password: string) {
    // Get user with password hash
    const user = await this.getUserForLogin(email)

    console.log(user, 'user')

    if (!user) {
      return { success: false, error: 'INVALID_CREDENTIALS', user: null }
    }

    // Check if user has a password set
    if (!user.password_hash) {
      return { success: false, error: 'NO_PASSWORD_SET', user: null }
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return { success: false, error: 'INVALID_CREDENTIALS', user: null }
    }

    // Check if email is verified
    if (!user.email_verified) {
      return { success: false, error: 'EMAIL_NOT_VERIFIED', user }
    }

    return { success: true, error: null, user }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash)
    } catch (error) {
      console.error('Password verification error:', error)
      return false
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  // ==============================================
  // EMAIL VERIFICATION OPERATIONS
  // ==============================================
  async createEmailVerification(data: {
    userId: string
    token: string
    expiresAt: Date
  }) {
    const tokenHash = await this.hashToken(data.token)

    const { data: verification, error } = await this.supabaseClient
      .from('email_verifications')
      .insert([{
        user_id: data.userId,
        token_hash: tokenHash,
        expires_at: data.expiresAt.toISOString(),
        is_used: false,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw error
    return verification
  }

  async findValidVerificationToken(token: string) {
    const tokenHash = await this.hashToken(token)

    const { data, error } = await this.supabaseClient
      .from('email_verifications')
      .select(`
        *,
        user:users!inner(
          id,
          email,
          first_name,
          last_name,
          email_verified,
          company:companies(
            id,
            name,
            slug
          )
        )
      `)
      .eq('token_hash', tokenHash)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }

    return data
  }

  async markTokenAsUsed(token: string) {
    const tokenHash = await this.hashToken(token)

    const { error } = await this.supabaseClient
      .from('email_verifications')
      .update({
        is_used: true,
        // ❌ REMOVED: updated_at doesn't exist in this table
      })
      .eq('token_hash', tokenHash)

    if (error) throw error
  }

  async verifyUserEmail(userId: string, token: string) {
    // Start a transaction-like operation
    try {
      // Mark token as used
      await this.markTokenAsUsed(token)

      // Update user email_verified status
      const { error: userError } = await this.supabaseClient
        .from('users')
        .update({
          email_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (userError) throw userError

      return true
    } catch (error) {
      console.error('Error verifying user email:', error)
      throw error
    }
  }

  async invalidateUserVerificationTokens(userId: string) {
    const { error } = await this.supabaseClient
      .from('email_verifications')
      .update({
        is_used: true,
        // ❌ REMOVED: updated_at doesn't exist in this table
      })
      .eq('user_id', userId)
      .eq('is_used', false)

    if (error) throw error
  }

  async getVerificationStats(userId: string) {
    const { data, error } = await this.supabaseClient
      .from('email_verifications')
      .select('id, created_at, is_used, expires_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const stats = {
      total: data.length,
      used: data.filter(v => v.is_used).length,
      expired: data.filter(v => new Date(v.expires_at) < new Date() && !v.is_used).length,
      pending: data.filter(v => new Date(v.expires_at) >= new Date() && !v.is_used).length,
      lastRequest: data[0]?.created_at || null,
    }

    return stats
  }

  async cleanupExpiredTokens() {
    const { error } = await this.supabaseClient
      .from('email_verifications')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) throw error
  }

  // ==============================================
  // PASSWORD RESET OPERATIONS
  // ==============================================

  async createPasswordReset(data: {
    userId: string
    token: string
    expiresAt: Date
  }) {
    const tokenHash = await this.hashToken(data.token)

    const { data: reset, error } = await this.supabaseClient
      .from('password_resets')
      .insert([{
        user_id: data.userId,
        token_hash: tokenHash,
        expires_at: data.expiresAt.toISOString(),
        is_used: false,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw error
    return reset
  }

  async findValidPasswordResetToken(token: string) {
    const tokenHash = await this.hashToken(token)

    const { data, error } = await this.supabaseClient
      .from('password_resets')
      .select(`
        *,
        user:users!inner(
          id,
          email,
          first_name,
          last_name,
          email_verified,
          company:companies(
            id,
            name,
            slug
          )
        )
      `)
      .eq('token_hash', tokenHash)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }

    return data
  }

  async markPasswordResetTokenAsUsed(token: string) {
    const tokenHash = await this.hashToken(token)

    const { error } = await this.supabaseClient
      .from('password_resets')
      .update({
        is_used: true,
      })
      .eq('token_hash', tokenHash)

    if (error) throw error
  }

  async invalidateUserPasswordResetTokens(userId: string) {
    const { error } = await this.supabaseClient
      .from('password_resets')
      .update({
        is_used: true,
      })
      .eq('user_id', userId)
      .eq('is_used', false)

    if (error) throw error
  }

  async getPasswordResetStats(userId: string) {
    const { data, error } = await this.supabaseClient
      .from('password_resets')
      .select('id, created_at, is_used, expires_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const stats = {
      total: data.length,
      used: data.filter(r => r.is_used).length,
      expired: data.filter(r => new Date(r.expires_at) < new Date() && !r.is_used).length,
      pending: data.filter(r => new Date(r.expires_at) >= new Date() && !r.is_used).length,
      lastRequest: data[0]?.created_at || null,
    }

    return stats
  }

  async cleanupExpiredPasswordResets() {
    const { error } = await this.supabaseClient
      .from('password_resets')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) throw error
  }

  // ==============================================
  // SESSION VALIDATION METHODS
  // ==============================================
  async validateSession(token: string) {
    try {
      const session = await this.getUserSession(token)

      if (!session) {
        return {
          success: false,
          error: 'SESSION_NOT_FOUND',
          data: null
        }
      }

      // Check if session is expired
      if (new Date(session.expires_at) < new Date()) {
        // Mark as inactive
        await this.invalidateUserSession(token)
        return {
          success: false,
          error: 'SESSION_EXPIRED',
          data: null
        }
      }

      // Check if session is active
      if (!session.is_active) {
        return {
          success: false,
          error: 'SESSION_INACTIVE',
          data: null
        }
      }

      return {
        success: true,
        error: null,
        data: {
          sessionId: session.id,
          userId: session.user_id,
          expiresAt: session.expires_at,
          user: session.user
        }
      }
    } catch (error) {
      console.error('Session validation error:', error)
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        data: null
      }
    }
  }

  async invalidateSession(token: string) {
    try {
      await this.invalidateUserSession(token)
      return { success: true }
    } catch (error) {
      console.error('Session invalidation error:', error)
      return { success: false, error: 'INVALIDATION_ERROR' }
    }
  }

  async refreshSession(token: string, rememberMe: boolean = false) {
    try {
      // Get current session
      const sessionData = await this.getUserSession(token)

      if (!sessionData || !sessionData.is_active) {
        return {
          success: false,
          error: 'INVALID_SESSION',
          data: null
        }
      }

      // Invalidate old session
      await this.invalidateUserSession(token)

      // Create new session
      const newToken = this.generateSessionToken()
      const sessionDuration = rememberMe
        ? 30 * 24 * 60 * 60 * 1000  // 30 days
        : 24 * 60 * 60 * 1000       // 24 hours

      const expiresAt = new Date(Date.now() + sessionDuration)

      await this.createUserSession({
        userId: sessionData.user_id,
        token: newToken,
        ipAddress: sessionData.ip_address,
        userAgent: sessionData.user_agent,
        expiresAt,
      })

      return {
        success: true,
        data: {
          token: newToken,
          expiresAt: expiresAt.toISOString()
        }
      }
    } catch (error) {
      console.error('Session refresh error:', error)
      return {
        success: false,
        error: 'REFRESH_ERROR',
        data: null
      }
    }
  }

  async getUserActiveSessions(userId: string) {
    try {
      const { data, error } = await this.supabaseClient
        .from('user_sessions')
        .select(`
          id,
          token_hash,
          ip_address,
          user_agent,
          device_info,
          created_at,
          expires_at,
          is_active
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Get active sessions error:', error)
      return { success: false, error: 'FETCH_ERROR', data: [] }
    }
  }

  async cleanupExpiredSessions() {
    try {
      const { error } = await this.supabaseClient
        .from('user_sessions')
        .update({ is_active: false })
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Cleanup sessions error:', error)
      return { success: false, error: 'CLEANUP_ERROR' }
    }
  }

  // Generate session token (make this method available)
  generateSessionToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // ==============================================
  // PROFILE MANAGEMENT METHODS
  // ==============================================

  async updateUserProfile(userId: string, data: {
    firstName: string
    lastName: string
    phone?: string | null
  }) {
    const { error, data: user } = await this.supabaseClient
      .from('users')
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        permissions,
        email_verified,
        last_login_at,
        created_at,
        updated_at
    `)
      .single()

    if (error) throw error
    return user
  }

  async getUserWithProfile(userId: string) {
    const { data, error } = await this.supabaseClient
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        permissions,
        email_verified,
        last_login_at,
        created_at,
        updated_at,
        company:companies(
          id,
          name,
          slug,
          industry,
          size
        )
      `)
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  }

  async getUserProfileStats(userId: string) {
    try {
      // Get user login history (you might want to create a user_logins table)
      const { data: user, error: userError } = await this.supabaseClient
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          email_verified,
          last_login_at,
          created_at,
          updated_at
        `)
        .eq('id', userId)
        .single()

      if (userError) throw userError

      // Get active sessions count
      const { data: sessions, error: sessionsError } = await this.supabaseClient
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())

      if (sessionsError) throw sessionsError

      return {
        user,
        activeSessionsCount: sessions?.length || 0,
        lastLogin: user?.last_login_at,
        memberSince: user?.created_at,
        isEmailVerified: user?.email_verified || false,
      }
    } catch (error) {
      console.error('Get user profile stats error:', error)
      throw error
    }
  }

  // ==============================================
  // PASSWORD MANAGEMENT METHODS
  // ==============================================

  async getUserForPasswordChange(userId: string) {
    const { data, error } = await this.supabaseClient
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        password_hash,
        email_verified
      `)
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  }

  async updateUserPasswordAndTimestamp(userId: string, passwordHash: string) {
    const { error } = await this.supabaseClient
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw error
  }

  // Enhanced setUserPassword method with better error handling
  // async setUserPassword(userId: string, password: string) {
  //   try {
  //     const passwordHash = await this.hashPassword(password)
  //     await this.updateUserPasswordAndTimestamp(userId, passwordHash)
  //     return true
  //   } catch (error) {
  //     console.error('Set user password error:', error)
  //     throw error
  //   }
  // }

  // ==============================================
  // SESSION MANAGEMENT FOR PASSWORD CHANGE
  // ==============================================

  async invalidateAllUserSessionsExceptCurrent(userId: string, currentToken?: string) {
    try {
      if (!currentToken) {
        // No current token, invalidate all sessions
        return await this.invalidateAllUserSessions(userId)
      }

      // Get current session token hash
      const currentTokenHash = await this.hashToken(currentToken)

      // Invalidate all sessions except current one
      const { error } = await this.supabaseClient
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .neq('token_hash', currentTokenHash)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Invalidate user sessions error:', error)
      throw error
    }
  }

  // ==============================================
  // PASSWORD CHANGE REQUIREMENT METHODS (NEW)
  // ==============================================

  async getUserPasswordChangeStatus(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('requires_password_change')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data?.requires_password_change || false
    } catch (error) {
      console.error('Get password change status error:', error)
      return false
    }
  }


  async setRequiresPasswordChange(userId: string, required: boolean = true) {
    try {
      console.log(userId, 'userIduserIduserId')
      const { error } = await this.supabaseClient
        .from('users')
        .update({
          requires_password_change: required,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Set requires password change error:', error)
      throw error
    }
  }


  async clearRequiresPasswordChange(userId: string) {
    try {
      const { error } = await this.supabaseClient
        .from('users')
        .update({
          requires_password_change: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Clear requires password change error:', error)
      throw error
    }
  }


  async getUserWithPasswordChangeStatus(userId: string) {
    try {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          requires_password_change,
          company_id
        `)
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data
    } catch (error) {
      console.error('Get user with password change status error:', error)
      return null
    }
  }


  async setUserPassword(userId: string, password: string) {
    try {
      const passwordHash = await this.hashPassword(password)

      // Update both password and clear the requirement flag
      const { error } = await this.supabaseClient
        .from('users')
        .update({
          password_hash: passwordHash,
          requires_password_change: false, // ← Clear the flag when password is changed
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Set user password error:', error)
      throw error
    }
  }

  // ==============================================
  // UTILITY METHODS FOR PROFILE
  // ==============================================

  async checkUserExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        return false // User not found
      }

      if (error) throw error
      return !!data
    } catch (error) {
      console.error('Check user exists error:', error)
      return false
    }
  }

  async getUserBasicInfo(userId: string) {
    const { data, error } = await this.supabaseClient
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        permissions,
        email_verified
      `)
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================
  private async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(token)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}