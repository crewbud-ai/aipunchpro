// ==============================================
// app/(dashboard)/dashboard/admin/page.tsx
// Complete Admin Dashboard - With Custom Hook (FIXED)
// ==============================================

"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from 'next/link'
import {
  Building2,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  ClipboardList,
  Activity,
  BarChart3,
  UserCheck,
  Timer,
  Wallet,
  ArrowRight,
  Eye,
  AlertTriangle,
  RefreshCw
} from "lucide-react"

// Import custom dashboard hook
import { useAdminDashboard } from '@/hooks/dashboard'
import { isAdmin } from '@/lib/permissions'

export default function AdminDashboardPage() {

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // ==============================================
  // USE CUSTOM DASHBOARD HOOK
  // ==============================================
  const {
    stats,
    isLoading,
    hasError,
    error,
    refreshDashboard
  } = useAdminDashboard()

  // ==============================================
  // ERROR STATE
  // ==============================================
  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Failed to load dashboard data. Please try again.'}
          </AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboard}
            className="mt-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </Alert>
      </div>
    )
  }

  // ==============================================
  // LOADING STATE
  // ==============================================
  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl">
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title Section - Mobile Optimized */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">
                Admin Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Complete overview of your construction operations
              </p>
            </div>

            {/* Action Section - Mobile Optimized */}
            <div className="flex items-center gap-2 sm:flex-shrink-0">
              {/* Live Updates Badge - Responsive */}
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-300 text-xs sm:text-sm whitespace-nowrap"
              >
                <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                <span className="hidden xs:inline">Live Updates</span>
                <span className="xs:hidden">Live</span>
              </Badge>

              {/* Refresh Button - Responsive */}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshDashboard}
                className="h-9 sm:h-10"
              >
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Critical Alerts */}
          {(stats.time.pendingApprovals > 0 || stats.projects.delayed > 0) && (
            <div className={`grid gap-4 ${stats.time.pendingApprovals > 0 && stats.projects.delayed > 0
              ? 'md:grid-cols-2'
              : 'md:grid-cols-1'
              }`}>
              {stats.time.pendingApprovals > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>{stats.time.pendingApprovals} time entries</strong> waiting for approval.
                    <Link href="/dashboard/payroll">
                      <Button variant="link" size="sm" className="ml-2 h-auto p-0 text-yellow-700">
                        Review Now <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </AlertDescription>
                </Alert>
              )}
              {stats.projects.delayed > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>{stats.projects.delayed} projects</strong> are behind schedule.
                    <Link href="/dashboard/projects">
                      <Button variant="link" size="sm" className="ml-2 h-auto p-0 text-red-700">
                        View Projects <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Primary Stats - Projects & Team */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Projects */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.projects.total}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-600">
                    {stats.projects.active} active
                  </p>
                  <Link href="/dashboard/projects">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Completion Rate</span>
                    <span className="font-semibold">{stats.projects.completionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.projects.completionRate} className="h-1" />
                </div>
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.projects.active}</div>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {stats.projects.completed} Completed
                  </Badge>
                </div>
                {stats.projects.delayed > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    {stats.projects.delayed} Behind Schedule
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total Team Members */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.team.total}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-600">
                    {stats.team.active} active
                  </p>
                  <Link href="/dashboard/team">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Manage <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Utilization Rate</span>
                    <span className="font-semibold">{stats.team.utilizationRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.team.utilizationRate} className="h-1" />
                </div>
              </CardContent>
            </Card>

            {/* Team Assignment Status */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Status</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.team.assigned}</div>
                <p className="text-xs text-gray-600 mt-1">Currently assigned</p>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <Badge variant="outline" className="bg-gray-50">
                    {stats.team.available} Available
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Tracking & Payroll Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Today's Hours */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Hours</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.time.todayHours.toFixed(1)}h</div>
                <div className="flex items-center gap-2 mt-2">
                  {stats.time.activeSessions > 0 ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      <Activity className="h-3 w-3 mr-1" />
                      {stats.time.activeSessions} Active Now
                    </Badge>
                  ) : (
                    <p className="text-xs text-gray-600">No active sessions</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* This Week's Hours */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.time.weekHours.toFixed(1)}h</div>
                <p className="text-xs text-gray-600 mt-1">Total team hours</p>
                <Link href="/dashboard/time-tracking">
                  <Button variant="ghost" size="sm" className="h-7 text-xs mt-2 px-0">
                    View Details <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card className={`hover:shadow-md transition-shadow ${stats.time.pendingApprovals > 0 ? 'border-yellow-300' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Timer className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.time.pendingApprovals}</div>
                <p className="text-xs text-gray-600 mt-1">
                  ${stats.payroll.pending.toFixed(2)} pending
                </p>
                {stats.time.pendingApprovals > 0 && (
                  <Link href="/dashboard/payroll">
                    <Button variant="default" size="sm" className="h-7 text-xs mt-2 bg-yellow-600 hover:bg-yellow-700">
                      Review Now <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Total Payroll This Week */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Week Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${stats.payroll.weekTotal.toFixed(2)}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    ${stats.payroll.approved.toFixed(2)} Approved
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget & Financial Overview */}
          {stats.budget.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-600" />
                  Budget Overview
                </CardTitle>
                <CardDescription>
                  Company-wide budget utilization across all projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Budget</p>
                    <p className="text-2xl font-bold">
                      ${stats.budget.total.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ${(stats.budget.spent + stats.payroll.approved).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>Materials: ${stats.budget.spent.toLocaleString()}</span>
                      <span>•</span>
                      <span>Labor: ${stats.payroll.approved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Remaining</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${stats.budget.remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {stats.payroll.pending > 0 && (
                      <p className="text-xs text-yellow-600 mt-1">
                        +${stats.payroll.pending.toFixed(2)} pending approval
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Budget Utilization (including labor)</span>
                    <span className="font-semibold">
                      {stats.budget.utilizationPercent.toFixed(2)}%
                    </span>
                  </div>
                  <Progress
                    value={stats.budget.utilizationPercent}
                    className="h-3"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.budget.utilizationPercent > 80
                      ? '⚠️ High budget utilization - Monitor spending closely'
                      : stats.budget.utilizationPercent > 60
                        ? '✓ Budget on track'
                        : '✓ Budget healthy'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions & Navigation */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Projects Quick View */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Projects Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <Badge>{stats.projects.active}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Completed</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {stats.projects.completed}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">On Hold</span>
                  <Badge variant="outline">{stats.projects.onHold}</Badge>
                </div>
                {stats.projects.delayed > 0 && (
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm text-red-600 font-medium">Behind Schedule</span>
                    <Badge variant="outline" className="bg-red-100 text-red-700">
                      {stats.projects.delayed}
                    </Badge>
                  </div>
                )}
                <Link href="/dashboard/projects">
                  <Button variant="outline" className="w-full mt-2">
                    <Eye className="h-4 w-4 mr-2" />
                    View All Projects
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Team Quick View */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                  Team Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Total Members</span>
                  <Badge>{stats.team.total}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Active</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {stats.team.active}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Assigned</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {stats.team.assigned}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Available</span>
                  <Badge variant="outline">{stats.team.available}</Badge>
                </div>
                <Link href="/dashboard/team">
                  <Button variant="outline" className="w-full mt-2">
                    <Eye className="h-4 w-4 mr-2" />
                    Manage Team
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Payroll Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Payroll & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                  <span className="text-sm text-yellow-700 font-medium">Pending Approval</span>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                    {stats.time.pendingApprovals}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">This Week Hours</span>
                  <Badge>{stats.time.weekHours.toFixed(1)}h</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Week Payroll</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    ${stats.payroll.weekTotal.toFixed(2)}
                  </Badge>
                </div>
                {stats.time.activeSessions > 0 && (
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-sm text-green-700 font-medium">Active Sessions</span>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      {stats.time.activeSessions}
                    </Badge>
                  </div>
                )}
                <Link href="/dashboard/payroll">
                  <Button
                    variant={stats.time.pendingApprovals > 0 ? "default" : "outline"}
                    className={`w-full mt-2 ${stats.time.pendingApprovals > 0 ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {stats.time.pendingApprovals > 0 ? 'Review Payroll' : 'View Payroll'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Additional Quick Links */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/schedule">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Schedule</p>
                      <p className="text-xs text-gray-600">View timeline</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/punchlist">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <ClipboardList className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Punchlist</p>
                      <p className="text-xs text-gray-600">View tasks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/payroll">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Payroll</p>
                      <p className="text-xs text-gray-600">Manage payments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/reports">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Reports</p>
                      <p className="text-xs text-gray-600">Analytics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}