// ==============================================
// app/(dashboard)/dashboard/member/page.tsx
// Member Dashboard - For Regular Team Members
// ==============================================

"use client"

import React from 'react'
import { redirect } from 'next/navigation'
import { TimeTrackingProvider } from '@/contexts/time-tracking/TimeTrackingContext'
import { DashboardContent } from '../DashboardContent'
import { useDashboard } from '@/hooks/dashboard/use-dashboard'
import { Loader2 } from 'lucide-react'

export default function MemberDashboardPage() {
  // ==============================================
  // GET USER FROM HOOK
  // ==============================================
  const { isAuthenticated, user, isLoading } = useDashboard()

  // ==============================================
  // LOADING STATE
  // ==============================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ==============================================
  // AUTH CHECK
  // ==============================================
  if (!isAuthenticated || !user) {
    redirect('/auth/login')
    return null
  }

  // ==============================================
  // ROLE CHECK - Redirect admins to their dashboard
  // ==============================================
  if (user.role === 'super_admin' || user.role === 'admin') {
    redirect('/dashboard/admin')
    return null
  }

  // ==============================================
  // RENDER WITH CONTEXT PROVIDER
  // ==============================================
  return (
    <TimeTrackingProvider>
      <DashboardContent user={user} />
    </TimeTrackingProvider>
  )
}