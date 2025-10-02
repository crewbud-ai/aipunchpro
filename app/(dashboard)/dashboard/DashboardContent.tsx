// // ==============================================
// // app/(dashboard)/dashboard/DashboardContent.tsx - CLIENT COMPONENT
// // ==============================================

// "use client"

// import React from 'react'
// import Link from 'next/link'
// import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
// import { Building2, Users, Calendar, ClipboardList, Clock } from 'lucide-react'
// import { hasPermission } from '@/lib/permissions'

// // Import time tracking components
// import { ClockInOutWidget, LiveEarningsDisplay } from '@/components/time-tracking'

// // Import dashboard components - adjust path if needed
// import { TodaysSummaryCard } from '@/components/dashboard/TodaysSummaryCard'
// import { RecentEntriesCard } from '@/components/dashboard/RecentEntriesCard'


// import { useLiveEarnings } from '@/hooks/time-tracking/use-live-earnings'

// interface DashboardContentProps {
//     user: {
//         id: string
//         email: string
//         firstName: string
//         lastName: string
//         role: string
//     }
// }

// export function DashboardContent({ user }: DashboardContentProps) {
//     // ==============================================
//     // PERMISSION CHECKS - Using hasPermission from lib/permissions
//     // ==============================================
//     const isMember = user.role === 'member'
//     const canViewProjects = hasPermission('projects', 'view') || hasPermission('projects', 'viewAll')
//     const canViewTeam = hasPermission('team', 'view')
//     const canViewSchedule = hasPermission('schedule', 'view')
//     const canViewPunchlist = hasPermission('punchlist', 'view')

//     const { activeSession, isLoading: isLoadingSession } = useLiveEarnings()

//     // ==============================================
//     // RENDER
//     // ==============================================
//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div>
//                 <h1 className="text-3xl font-bold text-gray-900">
//                     Welcome back, {user.firstName}!
//                 </h1>
//                 <p className="text-gray-500 mt-1">
//                     Here's what's happening with your projects today.
//                 </p>
//             </div>

//             {activeSession && !isLoadingSession && (
//                 <div className="animate-in fade-in slide-in-from-top-4 duration-500">
//                     <LiveEarningsDisplay
//                         activeSession={activeSession}
//                         updateInterval={60000} // Update every 1 minute
//                     />
//                 </div>
//             )}

//             {/* MEMBER LAYOUT - Time Tracking Focus */}
//             {isMember ? (
//                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//                     {/* Clock In/Out Widget - Takes priority */}
//                     <div className="lg:col-span-1">
//                         <ClockInOutWidget showTodaysSummary={false} />
//                     </div>

//                     {/* Today's Summary */}
//                     <div className="lg:col-span-1">
//                         <TodaysSummaryCard />
//                     </div>

//                     {/* Quick Access - Schedule */}
//                     {canViewSchedule && (
//                         <Link href="/dashboard/schedule">
//                             <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
//                                 <CardHeader className="pb-3">
//                                     <div className="flex items-center gap-3">
//                                         <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
//                                             <Calendar className="h-5 w-5 text-orange-600" />
//                                         </div>
//                                         <div>
//                                             <CardTitle className="text-base">Schedule</CardTitle>
//                                             <CardDescription className="text-sm">View your assignments</CardDescription>
//                                         </div>
//                                     </div>
//                                 </CardHeader>
//                             </Card>
//                         </Link>
//                     )}

//                     {/* Recent Entries - Full Width */}
//                     <div className="lg:col-span-3">
//                         <RecentEntriesCard />
//                     </div>

//                     {/* Quick Access - Tasks */}
//                     {canViewPunchlist && (
//                         <Link href="/dashboard/punchlist">
//                             <Card className="hover:shadow-md transition-shadow cursor-pointer">
//                                 <CardHeader className="pb-3">
//                                     <div className="flex items-center gap-3">
//                                         <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
//                                             <ClipboardList className="h-5 w-5 text-green-600" />
//                                         </div>
//                                         <div>
//                                             <CardTitle className="text-base">Tasks</CardTitle>
//                                             <CardDescription className="text-sm">Your punchlist items</CardDescription>
//                                         </div>
//                                     </div>
//                                 </CardHeader>
//                             </Card>
//                         </Link>
//                     )}

//                     {/* Quick Access - Time History */}
//                     <Link href="/dashboard/time-tracking">
//                         <Card className="hover:shadow-md transition-shadow cursor-pointer">
//                             <CardHeader className="pb-3">
//                                 <div className="flex items-center gap-3">
//                                     <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
//                                         <Clock className="h-5 w-5 text-purple-600" />
//                                     </div>
//                                     <div>
//                                         <CardTitle className="text-base">Time History</CardTitle>
//                                         <CardDescription className="text-sm">View all entries</CardDescription>
//                                     </div>
//                                 </div>
//                             </CardHeader>
//                         </Card>
//                     </Link>
//                 </div>
//             ) : (
//                 /* ADMIN/SUPERVISOR LAYOUT - Management Focus */
//                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
//                     {/* Projects Card */}
//                     {canViewProjects && (
//                         <Link href="/dashboard/projects">
//                             <Card className="hover:shadow-md transition-shadow cursor-pointer">
//                                 <CardHeader className="pb-3">
//                                     <div className="flex items-center gap-3">
//                                         <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
//                                             <Building2 className="h-5 w-5 text-blue-600" />
//                                         </div>
//                                         <div>
//                                             <CardTitle className="text-base">Projects</CardTitle>
//                                             <CardDescription className="text-sm">Manage projects</CardDescription>
//                                         </div>
//                                     </div>
//                                 </CardHeader>
//                             </Card>
//                         </Link>
//                     )}

//                     {/* Team Card */}
//                     {canViewTeam && (
//                         <Link href="/dashboard/team">
//                             <Card className="hover:shadow-md transition-shadow cursor-pointer">
//                                 <CardHeader className="pb-3">
//                                     <div className="flex items-center gap-3">
//                                         <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
//                                             <Users className="h-5 w-5 text-green-600" />
//                                         </div>
//                                         <div>
//                                             <CardTitle className="text-base">Team</CardTitle>
//                                             <CardDescription className="text-sm">Manage team members</CardDescription>
//                                         </div>
//                                     </div>
//                                 </CardHeader>
//                             </Card>
//                         </Link>
//                     )}

//                     {/* Schedule Card */}
//                     {canViewSchedule && (
//                         <Link href="/dashboard/schedule">
//                             <Card className="hover:shadow-md transition-shadow cursor-pointer">
//                                 <CardHeader className="pb-3">
//                                     <div className="flex items-center gap-3">
//                                         <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
//                                             <Calendar className="h-5 w-5 text-orange-600" />
//                                         </div>
//                                         <div>
//                                             <CardTitle className="text-base">Schedule</CardTitle>
//                                             <CardDescription className="text-sm">View schedule</CardDescription>
//                                         </div>
//                                     </div>
//                                 </CardHeader>
//                             </Card>
//                         </Link>
//                     )}

//                     {/* Punchlist Card */}
//                     {canViewPunchlist && (
//                         <Link href="/dashboard/punchlist">
//                             <Card className="hover:shadow-md transition-shadow cursor-pointer">
//                                 <CardHeader className="pb-3">
//                                     <div className="flex items-center gap-3">
//                                         <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
//                                             <ClipboardList className="h-5 w-5 text-purple-600" />
//                                         </div>
//                                         <div>
//                                             <CardTitle className="text-base">Punchlist</CardTitle>
//                                             <CardDescription className="text-sm">Track tasks</CardDescription>
//                                         </div>
//                                     </div>
//                                 </CardHeader>
//                             </Card>
//                         </Link>
//                     )}

//                     {/* Time Tracking Card */}
//                     <Link href="/dashboard/time-tracking">
//                         <Card className="hover:shadow-md transition-shadow cursor-pointer">
//                             <CardHeader className="pb-3">
//                                 <div className="flex items-center gap-3">
//                                     <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
//                                         <Clock className="h-5 w-5 text-indigo-600" />
//                                     </div>
//                                     <div>
//                                         <CardTitle className="text-base">Time Tracking</CardTitle>
//                                         <CardDescription className="text-sm">View time entries</CardDescription>
//                                     </div>
//                                 </div>
//                             </CardHeader>
//                         </Card>
//                     </Link>
//                 </div>
//             )}

//             {/* Additional Stats or Info Section */}
//             <div className="mt-8">
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Quick Tips</CardTitle>
//                     </CardHeader>
//                     <CardDescription className="px-6 pb-4">
//                         {isMember ? (
//                             <ul className="space-y-2 text-sm">
//                                 <li>• Always clock in when starting work on a project</li>
//                                 <li>• Remember to clock out when taking breaks or ending your shift</li>
//                                 <li>• Check your schedule regularly for upcoming assignments</li>
//                                 <li>• Report any issues through the punchlist</li>
//                             </ul>
//                         ) : (
//                             <ul className="space-y-2 text-sm">
//                                 <li>• Review team time entries regularly</li>
//                                 <li>• Keep project schedules updated</li>
//                                 <li>• Monitor punchlist items for quality control</li>
//                                 <li>• Communicate with team members about assignments</li>
//                             </ul>
//                         )}
//                     </CardDescription>
//                 </Card>
//             </div>
//         </div>
//     )
// }


// ==============================================
// app/(dashboard)/dashboard/DashboardContent.tsx - FINAL VERSION
// ==============================================

"use client"

import React from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Building2, Users, Calendar, ClipboardList } from 'lucide-react'
import { hasPermission } from '@/lib/permissions'

// ⭐ NEW: Import unified widget and new components
import { UnifiedClockEarningsWidget } from '@/components/time-tracking/UnifiedClockEarningsWidget'
import { EarningsSummaryCards } from '@/components/dashboard'
import { TimeEntriesTable } from '@/components/time-tracking/TimeEntriesTable'

// Import hooks
import { useTimeEntries } from '@/hooks/time-tracking'

interface DashboardContentProps {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
  }
}

export function DashboardContent({ user }: DashboardContentProps) {
  // ==============================================
  // PERMISSION CHECKS
  // ==============================================
  const isMember = user.role === 'member'
  const canViewProjects = hasPermission('projects', 'view') || hasPermission('projects', 'viewAll')
  const canViewTeam = hasPermission('team', 'view')
  const canViewSchedule = hasPermission('schedule', 'view')
  const canViewPunchlist = hasPermission('punchlist', 'view')

  // ⭐ NEW: Get time entries for the table
  const { timeEntries, isLoading } = useTimeEntries()

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* MEMBER LAYOUT - Time Tracking Focus */}
      {isMember ? (
        <div className="space-y-6">
          {/* Row 1: Unified Clock/Earnings Widget */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* ⭐ NEW: Unified widget replacing both old components */}
            <div className="md:col-span-1">
              <UnifiedClockEarningsWidget />
            </div>

            {/* Quick Access Cards */}
            <div className="md:col-span-2 grid gap-6 grid-cols-1 sm:grid-cols-2">
              {/* Schedule Card */}
              {canViewSchedule && (
                <Link href="/dashboard/schedule">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">Schedule</CardTitle>
                          <CardDescription className="text-sm">View assignments</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              )}

              {/* Punchlist Card */}
              {canViewPunchlist && (
                <Link href="/dashboard/punchlist">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <ClipboardList className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">Punchlist</CardTitle>
                          <CardDescription className="text-sm">View tasks</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              )}
            </div>
          </div>

          {/* ⭐ NEW: Row 2: Earnings Summary Cards */}
          <EarningsSummaryCards />

          {/* ⭐ NEW: Row 3: Time Entries Table */}
          <TimeEntriesTable 
            timeEntries={timeEntries}
            isLoading={isLoading}
            title="Recent Time Entries"
            showAll={false}
            limit={5}
          />
        </div>
      ) : (
        // ADMIN LAYOUT - Original cards for admins
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Projects Card */}
          {canViewProjects && (
            <Link href="/dashboard/projects">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Projects</CardTitle>
                      <CardDescription className="text-sm">Manage projects</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )}

          {/* Team Card */}
          {canViewTeam && (
            <Link href="/dashboard/team">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
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

          {/* Schedule Card */}
          {canViewSchedule && (
            <Link href="/dashboard/schedule">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Schedule</CardTitle>
                      <CardDescription className="text-sm">View schedule</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )}

          {/* Punchlist Card */}
          {canViewPunchlist && (
            <Link href="/dashboard/punchlist">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <ClipboardList className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Punchlist</CardTitle>
                      <CardDescription className="text-sm">Manage tasks</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}