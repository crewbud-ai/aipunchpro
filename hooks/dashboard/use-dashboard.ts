// ==============================================
// src/hooks/dashboard/use-dashboard.ts - Dashboard Hook
// ==============================================

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'

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

  // Load user data from localStorage or API
  const loadUserData = useCallback(() => {
    try {
      const userData = localStorage.getItem('user')
      const companyData = localStorage.getItem('company')

      if (userData && companyData) {
        setState(prev => ({
          ...prev,
          user: JSON.parse(userData),
          company: JSON.parse(companyData),
          isLoading: false,
        }))
      } else {
        // If no data in localStorage, user might need to re-login
        setState(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  // Sign out function
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, isSigningOut: true }))

    try {
      // Call logout API to invalidate session and clear cookies
      await authApi.logout()
      
      // Only clear localStorage after successful API call
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
      // This ensures user is logged out from the frontend
      localStorage.removeItem('user')
      localStorage.removeItem('company')
      
      setState({
        user: null,
        company: null,
        isLoading: false,
        isSigningOut: false,
      })

      // Redirect anyway - the API error toast will be shown by authApi
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