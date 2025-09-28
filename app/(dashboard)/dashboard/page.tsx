// ==============================================
// app/(dashboard)/dashboard/page.tsx - STEP 8: Dashboard with ClockInOut Focus
// Simple Dashboard with Time Tracking Integration
// ==============================================

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Clock,
  Activity,
  Timer,
  Briefcase,
  Plus,
  Building2,
  ClipboardList,
  Users,
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

// Import permission utilities
import { hasPermission, isAdmin, getCurrentRole } from "@/lib/permissions"
import { withPermission } from "@/lib/permissions"

// Import dashboard hook
import { useDashboard } from "@/hooks/dashboard/use-dashboard"

// Import the ClockInOutWidget
import React from "react"

// Import the ClockInOutWidget
import { ClockInOutWidget } from "@/components/time-tracking"

// Import time tracking hooks
import { useClockSession, useTimeEntries } from "@/hooks/time-tracking"

// ==============================================
// DASHBOARD COMPONENT
// ==============================================

export default function DashboardPage() {
  
  // ==============================================
  // PERMISSION CHECKS
  // ==============================================
  const canCreateProjects = hasPermission('projects', 'create')
  const canManageTeam = hasPermission('team', 'add')
  const canViewProjects = hasPermission('projects', 'view')
  const canViewPunchlist = hasPermission('punchlist', 'view')
  const userRole = getCurrentRole()
  const isAdminUser = isAdmin()

  // ==============================================
  // DATA HOOKS
  // ==============================================
  
  // Dashboard user info
  const { user, userFullName, isLoading: isDashboardLoading } = useDashboard()

  // Time tracking data for member users
  const { 
    isClocked, 
    currentSession, 
    formattedDuration,
    isLoading: isLoadingSession,
    error: sessionError
  } = useClockSession()

  // Add debug logging for session
  React.useEffect(() => {
    console.log('Session debug:', {
      isLoadingSession,
      sessionError,
      isClocked,
      currentSession
    })
  }, [isLoadingSession, sessionError, isClocked, currentSession])

  // Today's time entries for members - using the main hook with today's filters
  const today = new Date().toISOString().split('T')[0]
  const {
    timeEntries: todaysEntries,
    isLoading: isLoadingTimeEntries,
    state: timeEntriesState
  } = useTimeEntries()

  // Load today's entries on mount
  React.useEffect(() => {
    console.log('Dashboard - Time entries state:', timeEntriesState)
    console.log('Dashboard - Today entries count:', todaysEntries?.length || 0)
    console.log('Dashboard - Loading states:', { 
      isDashboardLoading, 
      isLoadingSession, 
      isLoadingTimeEntries 
    })
  }, [timeEntriesState, todaysEntries, isDashboardLoading, isLoadingSession, isLoadingTimeEntries])

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  
  // Today's work stats for members
  const todaysTotalHours = todaysEntries?.filter(entry => entry.date === today)
    .reduce((acc, entry) => acc + (entry.totalHours || 0), 0) || 0
  const todaysProjects = new Set(
    todaysEntries?.filter(entry => entry.date === today)
      .map(entry => entry.projectId || 'unknown') || []
  ).size

  // ==============================================
  // RENDER LOADING STATE - EXCLUDE SESSION LOADING FOR DEBUGGING
  // ==============================================
  if (isDashboardLoading || (isLoadingTimeEntries && timeEntriesState === 'loading')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full mb-4" />
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ==============================================
  // RENDER MAIN DASHBOARD
  // ==============================================
  return (
    <div className="space-y-6">
      
      {/* ==============================================
           DASHBOARD HEADER
           ============================================== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {userFullName?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdminUser 
              ? "Manage your construction operations from here."
              : isClocked 
                ? `You're currently working on ${currentSession?.projectName || 'a project'}`
                : "Ready to start your workday?"
            }
          </p>
        </div>

        {/* Quick Actions for Admin Users */}
        {isAdminUser && (
          <div className="flex items-center gap-3">
            {withPermission('projects', 'create',
              <Link href="/dashboard/projects/new">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
            )}
            {withPermission('team', 'add',
              <Link href="/dashboard/team/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Team Member
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ==============================================
           MEMBER TIME TRACKING SECTION (PRIMARY FOCUS)
           ============================================== */}
      {!isAdminUser && (
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Clock In/Out Widget - Primary Position */}
          <div className="md:col-span-2">
            {/* TEMPORARY: Always show the widget to test */}
            <ClockInOutWidget 
              showTodaysSummary={true}
              compact={false}
            />
            
            {/* Debug info */}
            {isLoadingSession && (
              <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
                Session still loading... (This should not persist)
              </div>
            )}
          </div>

          {/* Today's Work Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-orange-600" />
                Today's Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Hours Worked */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Hours Worked</span>
                </div>
                <span className="font-semibold">
                  {isClocked ? formattedDuration : `${todaysTotalHours.toFixed(1)}h`}
                </span>
              </div>

              {/* Projects Worked */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Projects</span>
                </div>
                <span className="font-semibold">{todaysProjects}</span>
              </div>

              {/* Current Status */}
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isClocked ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium">
                    {isClocked ? 'Currently Working' : 'Off Duty'}
                  </span>
                </div>
                {isClocked && currentSession && (
                  <p className="text-xs text-gray-500 mt-1">
                    On {currentSession.projectName}
                  </p>
                )}
              </div>

              {/* Quick Links */}
              <div className="pt-2 border-t space-y-2">
                {withPermission('projects', 'view',
                  <Link href="/dashboard/projects" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Building2 className="mr-2 h-3 w-3" />
                      View My Projects
                    </Button>
                  </Link>
                )}
                {withPermission('punchlist', 'view',
                  <Link href="/dashboard/punchlist" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <ClipboardList className="mr-2 h-3 w-3" />
                      My Tasks
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==============================================
           ADMIN OVERVIEW SECTION (SIMPLE)
           ============================================== */}
      {isAdminUser && (
        <div className="grid gap-6 lg:grid-cols-4">
          
          {/* Simple Stats Cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <Building2 className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-gray-600">5 active projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-gray-600">18 assigned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
              <ClipboardList className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">43</div>
              <p className="text-xs text-gray-600">3 critical issues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">642h</div>
              <p className="text-xs text-gray-600">Team hours logged</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==============================================
           QUICK ACCESS NAVIGATION
           ============================================== */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Projects */}
        {withPermission('projects', 'view',
          <Link href="/dashboard/projects">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Projects</CardTitle>
                    <CardDescription className="text-sm">Manage construction projects</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        )}

        {/* Team */}
        {withPermission('team', 'view',
          <Link href="/dashboard/team">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Team</CardTitle>
                    <CardDescription className="text-sm">Manage team members</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        )}

        {/* Punchlist */}
        {withPermission('punchlist', 'view',
          <Link href="/dashboard/punchlist">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Punchlist</CardTitle>
                    <CardDescription className="text-sm">Track tasks and issues</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        )}

        {/* Time Tracking (Admin View) */}
        {isAdminUser && (
          <Link href="/dashboard/time-tracking">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Time Tracking</CardTitle>
                    <CardDescription className="text-sm">Monitor team hours</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        )}
      </div>

      {/* ==============================================
           WELCOME MESSAGE FOR NEW USERS
           ============================================== */}
      {isAdminUser && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-600 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">Welcome to CrewBudAI</h3>
                <p className="text-orange-800 text-sm mb-4">
                  Get started by creating your first project and adding team members. Our platform helps you manage 
                  construction projects, track time, and coordinate your crew efficiently.
                </p>
                <div className="flex gap-3">
                  {withPermission('projects', 'create',
                    <Link href="/dashboard/projects/new">
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                        Create First Project
                      </Button>
                    </Link>
                  )}
                  {withPermission('team', 'add',
                    <Link href="/dashboard/team/new">
                      <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                        Add Team Members
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}