// ==============================================
// hooks/dashboard/use-dashboard.ts - Updated to fetch from API
// ==============================================

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { initializePermissions, clearPermissions } from '@/lib/permissions'

// ==============================================
// INTERFACES
// ==============================================
interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  phone?: string
  emailVerified: boolean
  lastLoginAt?: string
  permissions?: any
}

interface Company {
  id: string
  name: string
  slug: string
  industry?: string
  size?: string
}

interface DashboardState {
  user: User | null
  company: Company | null
  isLoading: boolean
  isSigningOut: boolean
}

export const useDashboard = () => {
  const router = useRouter()
  const [state, setState] = useState<DashboardState>({
    user: null,
    company: null,
    isLoading: true,
    isSigningOut: false,
  })

  // Load user data from API (using session cookie)
  const loadUserData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      // Fetch user profile from API
      // The API reads from session (via middleware headers)
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        credentials: 'include', // Important: send cookies
      })

      if (!response.ok) {
        // If 401, user not authenticated
        if (response.status === 401) {
          setState(prev => ({ ...prev, user: null, company: null, isLoading: false }))
          return
        }
        throw new Error('Failed to fetch user profile')
      }

      const data = await response.json()

      if (data.success && data.data) {
        const userData = data.data.user
        const companyData = data.data.company

        // Transform to match interface
        const user: User = {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name || userData.firstName,
          lastName: userData.last_name || userData.lastName,
          role: userData.role,
          phone: userData.phone,
          emailVerified: userData.email_verified || userData.emailVerified,
          lastLoginAt: userData.last_login_at || userData.lastLoginAt,
          permissions: userData.permissions,
        }

        const company: Company = {
          id: companyData.id,
          name: companyData.name,
          slug: companyData.slug,
          industry: companyData.industry,
          size: companyData.size,
        }

        setState({
          user,
          company,
          isLoading: false,
          isSigningOut: false,
        })

        // Initialize permissions
        initializePermissions({ user, company })

        // Optional: Also save to localStorage for offline access
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('company', JSON.stringify(company))
      } else {
        setState(prev => ({ ...prev, user: null, company: null, isLoading: false }))
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      setState(prev => ({ ...prev, user: null, company: null, isLoading: false }))
    }
  }, [])

  // Sign out function
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, isSigningOut: true }))

    try {
      // Call logout API to invalidate session and clear cookies
      await authApi.logout()

      clearPermissions()

      // Clear localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('company')

      // Clear state
      setState({
        user: null,
        company: null,
        isLoading: false,
        isSigningOut: false,
      })

      // Redirect to login
      router.push('/auth/login')
      router.refresh() // Force refresh to trigger middleware

    } catch (error) {
      console.error('Logout error:', error)

      // Even if API fails, still clear localStorage and redirect
      localStorage.removeItem('user')
      localStorage.removeItem('company')

      setState({
        user: null,
        company: null,
        isLoading: false,
        isSigningOut: false,
      })

      router.push('/auth/login')
      router.refresh()
    }
  }, [router])

  // Get user initials for avatar
  const getUserInitials = useCallback(() => {
    if (!state.user) return 'U'

    const firstInitial = state.user.firstName?.[0]?.toUpperCase() || ''
    const lastInitial = state.user.lastName?.[0]?.toUpperCase() || ''

    return firstInitial + lastInitial || state.user.email?.[0]?.toUpperCase() || 'U'
  }, [state.user])

  // Get user full name
  const getUserFullName = useCallback(() => {
    if (!state.user) return 'User'

    const firstName = state.user.firstName || ''
    const lastName = state.user.lastName || ''

    return `${firstName} ${lastName}`.trim() || state.user.email || 'User'
  }, [state.user])

  // Get user role display
  const getUserRoleDisplay = useCallback(() => {
    if (!state.user?.role) return 'User'

    // Convert role to display format
    return state.user.role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }, [state.user])

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!state.user && !!state.company
  }, [state.user, state.company])

  // Navigate to settings
  const goToSettings = useCallback(() => {
    router.push('/dashboard/settings')
  }, [router])

  // Navigate to profile
  const goToProfile = useCallback(() => {
    router.push('/dashboard/profile')
  }, [router])

  // Load data on mount
  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  return {
    // State
    user: state.user,
    company: state.company,
    isLoading: state.isLoading,
    isSigningOut: state.isSigningOut,

    // Computed values
    isAuthenticated: isAuthenticated(),
    userInitials: getUserInitials(),
    userFullName: getUserFullName(),
    userRoleDisplay: getUserRoleDisplay(),

    // Actions
    signOut,
    loadUserData,
    goToSettings,
    goToProfile,
  }
}