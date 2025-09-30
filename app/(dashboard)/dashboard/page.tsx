// ==============================================
// app/(dashboard)/dashboard/page.tsx - PROFESSIONAL MEMBER DASHBOARD
// Real-time insights and data for team members with auto-refresh
// ==============================================

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  Activity,
  Timer,
  Briefcase,
  Plus,
  Building2,
  ClipboardList,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import React from "react"

// Import permission utilities
import { hasPermission, isAdmin, getCurrentRole } from "@/lib/permissions"
import { withPermission } from "@/lib/permissions"

// Import hooks
import { useDashboard } from "@/hooks/dashboard/use-dashboard"
import { ClockInOutWidget } from "@/components/time-tracking"
import { useClockSession, useTimeEntries } from "@/hooks/time-tracking"

// Import utility functions
import { formatTime12Hour, getStatusBadgeVariant, getStatusColorClass } from "@/utils/format-functions"

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
  const { user, userFullName, isLoading: isDashboardLoading } = useDashboard()

  // Current session data
  const {
    isClocked,
    currentSession,
    formattedDuration,
    isLoading: isLoadingSession,
    refreshSession,
  } = useClockSession()

  // All time entries for calculations
  const {
    timeEntries,
    isLoading: isLoadingTimeEntries,
    state: timeEntriesState,
    refreshTimeEntries
  } = useTimeEntries()

  // ==============================================
  // AUTO-REFRESH LOGIC
  // ==============================================
  
  // Track previous clock state to detect changes
  const previousIsClockedRef = React.useRef(isClocked)
  
  React.useEffect(() => {
    // Detect clock state change
    if (previousIsClockedRef.current !== isClocked && !isLoadingSession) {
      console.log('Clock state changed, refreshing data...')
      
      // Wait for DB to sync, then refresh
      const timer = setTimeout(() => {
        Promise.all([
          refreshTimeEntries(),
          refreshSession()
        ]).then(() => {
          console.log('Data refreshed successfully')
        })
      }, 1000) // 1 second delay for DB sync
      
      return () => clearTimeout(timer)
    }
    
    // Update ref for next comparison
    previousIsClockedRef.current = isClocked
  }, [isClocked, isLoadingSession, refreshTimeEntries, refreshSession])

  // Periodic refresh every 30 seconds while clocked in
  React.useEffect(() => {
    if (isClocked && !isAdminUser) {
      const interval = setInterval(() => {
        console.log('Periodic refresh for active session')
        refreshSession()
        refreshTimeEntries()
      }, 30000) // 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [isClocked, isAdminUser, refreshSession, refreshTimeEntries])

  // ==============================================
  // COMPUTED STATISTICS - REAL DATA
  // ==============================================
  const today = new Date().toISOString().split('T')[0]
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekStartStr = weekStart.toISOString().split('T')[0]

  // Today's stats
  const todaysEntries = React.useMemo(() =>
    timeEntries?.filter(entry => entry.date === today) || [],
    [timeEntries, today]
  )

  const todaysTotalHours = React.useMemo(() =>
    todaysEntries.reduce((acc, entry) => acc + (entry.totalHours || 0), 0),
    [todaysEntries]
  )

  const todaysProjects = React.useMemo(() =>
    new Set(todaysEntries.map(entry => entry.projectId)).size,
    [todaysEntries]
  )

  // This week's stats
  const weekEntries = React.useMemo(() =>
    timeEntries?.filter(entry => entry.date >= weekStartStr) || [],
    [timeEntries, weekStartStr]
  )

  const weekTotalHours = React.useMemo(() =>
    weekEntries.reduce((acc, entry) => acc + (entry.totalHours || 0), 0),
    [weekEntries]
  )

  const weekDaysWorked = React.useMemo(() =>
    new Set(weekEntries.map(entry => entry.date)).size,
    [weekEntries]
  )

  // Total hours (all time)
  const totalHours = React.useMemo(() =>
    timeEntries?.reduce((acc, entry) => acc + (entry.totalHours || 0), 0) || 0,
    [timeEntries]
  )

  // Pending approvals
  const pendingEntries = React.useMemo(() =>
    timeEntries?.filter(entry => entry.status === 'pending') || [],
    [timeEntries]
  )

  // Recent entries (last 5, sorted by date DESC, then time DESC)
  const recentEntries = React.useMemo(() => {
    if (!timeEntries) return []
    
    return [...timeEntries]
      .sort((a, b) => {
        // First sort by date (newest first)
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date)
        }
        // Then by start time (newest first)
        if (a.startTime && b.startTime) {
          return b.startTime.localeCompare(a.startTime)
        }
        return 0
      })
      .slice(0, 5)
  }, [timeEntries])

  // ==============================================
  // RENDER LOADING STATE
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
      
      {/* DASHBOARD HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {userFullName?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdminUser 
              ? "Manage your construction operations from here."
              : isClocked 
                ? `Currently working on ${currentSession?.projectName || 'a project'}`
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

      {/* MEMBER PROFESSIONAL DASHBOARD */}
      {!isAdminUser && (
        <>
          {/* Top Row - Clock Widget + Quick Stats */}
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Clock In/Out Widget */}
            <div className="lg:col-span-2">
              <ClockInOutWidget 
                showTodaysSummary={false}
                compact={false}
              />
            </div>

            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-orange-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Today's Progress</span>
                    <span className="font-semibold">{todaysTotalHours.toFixed(1)}h</span>
                  </div>
                  <Progress value={(todaysTotalHours / 8) * 100} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {todaysTotalHours >= 8 ? 'Full day completed' : `${(8 - todaysTotalHours).toFixed(1)}h remaining`}
                  </p>
                </div>
                
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Week</span>
                    <span className="font-semibold">{weekTotalHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Days Worked</span>
                    <span className="font-semibold">{weekDaysWorked} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Hours</span>
                    <span className="font-semibold">{totalHours.toFixed(1)}h</span>
                  </div>
                </div>

                {pendingEntries.length > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{pendingEntries.length} entries pending approval</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Second Row - Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
                <Timer className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todaysTotalHours.toFixed(1)}h</div>
                <p className="text-xs text-gray-600">
                  {isClocked ? 'Currently working' : `${todaysEntries.length} entries`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weekTotalHours.toFixed(1)}h</div>
                <p className="text-xs text-gray-600">{weekDaysWorked} days worked</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projects</CardTitle>
                <Building2 className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todaysProjects}</div>
                <p className="text-xs text-gray-600">Active today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isClocked ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                  ) : (
                    <Badge variant="outline">Off Duty</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {isClocked ? formattedDuration : 'Ready to work'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Third Row - Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Time Entries</span>
                <Link href="/dashboard/time-tracking">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardTitle>
              <CardDescription>Your latest clock in/out sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentEntries.length > 0 ? (
                <div className="space-y-3">
                  {recentEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColorClass(entry.status)}`}>
                          {entry.status === 'approved' ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : entry.status === 'clocked_in' ? (
                            <Clock className="h-5 w-5" />
                          ) : (
                            <Timer className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{entry.projectName}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(entry.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                            {entry.startTime && ` • ${formatTime12Hour(entry.startTime)}`}
                            {entry.endTime && ` - ${formatTime12Hour(entry.endTime)}`}
                            {!entry.endTime && entry.status === 'clocked_in' && ' • In Progress'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{entry.totalHours.toFixed(2)}h</div>
                        <Badge variant={getStatusBadgeVariant(entry.status)} className="text-xs capitalize">
                          {entry.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Timer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No time entries yet</p>
                  <p className="text-sm">Clock in to start tracking your time</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ADMIN OVERVIEW SECTION */}
      {isAdminUser && (
        <div className="grid gap-6 lg:grid-cols-4">
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

      {/* QUICK ACCESS NAVIGATION */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    <CardDescription className="text-sm">View your projects</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        )}

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
                    <CardDescription className="text-sm">View team members</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        )}

        {withPermission('punchlist', 'view',
          <Link href="/dashboard/punchlist">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Tasks</CardTitle>
                    <CardDescription className="text-sm">Your punchlist items</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        )}

        <Link href="/dashboard/time-tracking">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Time History</CardTitle>
                  <CardDescription className="text-sm">View all entries</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}