"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useDashboard } from '@/hooks/dashboard/use-dashboard'

export default function DashboardPage() {
  const router = useRouter()
  
  // ==============================================
  // GET USER FROM HOOK
  // ==============================================
  const { isAuthenticated, user, isLoading } = useDashboard()

  // ==============================================
  // ROLE-BASED REDIRECT LOGIC
  // ==============================================
  useEffect(() => {
    // Wait until loading is complete and user data is available
    if (!isLoading && isAuthenticated && user) {
      const userRole = user.role

      // Redirect based on role
      if (userRole === 'super_admin' || userRole === 'admin') {
        // Admins and Super Admins go to admin dashboard
        router.replace('/dashboard/admin')
      } else {
        // Regular members (supervisor, member) go to member dashboard
        router.replace('/dashboard/member')
      }
    }
  }, [isLoading, isAuthenticated, user, router])

  // ==============================================
  // LOADING STATE (Show while redirecting)
  // ==============================================
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  )
}