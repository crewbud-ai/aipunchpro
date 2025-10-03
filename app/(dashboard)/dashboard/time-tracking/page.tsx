// // ==============================================
// // app/(dashboard)/dashboard/time-tracking/page.tsx - FIXED VERSION
// // Using shared TimeEntryDetailsDialog component
// // ==============================================

// "use client"

// import React, { useState, useMemo } from 'react'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { 
//   Clock, 
//   Calendar,
//   Eye,
//   Download,
//   TrendingUp,
//   DollarSign,
//   Timer,
// } from "lucide-react"
// import { Skeleton } from "@/components/ui/skeleton"
// import { isAdmin } from '@/lib/permissions'
// import Link from 'next/link'
// import { useTimeEntries } from '@/hooks/time-tracking'
// import { TimeEntryDetailsDialog } from '@/components/time-tracking/TimeEntryDetailsDialog'
// import type { TimeEntrySummary } from '@/types/time-tracking'

// export default function TimeTrackingPage() {
//   // ==============================================
//   // HOOKS - Use the existing time entries hook
//   // ==============================================
//   const { 
//     timeEntries, 
//     isLoading, 
//     timeEntryStats
//   } = useTimeEntries()
  
//   // ==============================================
//   // LOCAL STATE
//   // ==============================================
//   const [selectedEntry, setSelectedEntry] = useState<TimeEntrySummary | null>(null)
//   const [isDetailOpen, setIsDetailOpen] = useState(false)
//   const userIsAdmin = isAdmin()

//   // ==============================================
//   // CALCULATE STATS - Using hook's timeEntryStats
//   // ==============================================
//   const stats = useMemo(() => ({
//     totalHours: timeEntryStats.totalHours.toFixed(1),
//     weekHours: timeEntryStats.weekHours.toFixed(1),
//     pendingCount: timeEntryStats.byStatus.pending,
//     approvedCount: timeEntryStats.byStatus.approved,
//     totalEntries: timeEntryStats.totalEntries
//   }), [timeEntryStats])

//   // ==============================================
//   // FORMAT FUNCTIONS
//   // ==============================================
//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString)
//     const today = new Date()
//     const yesterday = new Date(today)
//     yesterday.setDate(yesterday.getDate() - 1)

//     if (date.toDateString() === today.toDateString()) {
//       return 'Today'
//     } else if (date.toDateString() === yesterday.toDateString()) {
//       return 'Yesterday'
//     }
//     return date.toLocaleDateString('en-US', { 
//       weekday: 'short',
//       month: 'short', 
//       day: 'numeric',
//       year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
//     })
//   }

//   const formatTime = (time?: string) => {
//     if (!time) return '-'
//     const [hours, minutes] = time.split(':')
//     const hour = parseInt(hours)
//     const ampm = hour >= 12 ? 'PM' : 'AM'
//     const displayHour = hour % 12 || 12
//     return `${displayHour}:${minutes} ${ampm}`
//   }

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'clocked_in':
//         return 'bg-green-100 text-green-800 border-green-200'
//       case 'clocked_out':
//         return 'bg-blue-100 text-blue-800 border-blue-200'
//       case 'approved':
//         return 'bg-purple-100 text-purple-800 border-purple-200'
//       case 'pending':
//         return 'bg-yellow-100 text-yellow-800 border-yellow-200'
//       case 'rejected':
//         return 'bg-red-100 text-red-800 border-red-200'
//       default:
//         return 'bg-gray-100 text-gray-800 border-gray-200'
//     }
//   }

//   const getStatusLabel = (status: string) => {
//     return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
//   }

//   // ==============================================
//   // HANDLE VIEW DETAILS
//   // ==============================================
//   const handleViewDetails = (entry: TimeEntrySummary) => {
//     setSelectedEntry(entry)
//     setIsDetailOpen(true)
//   }

//   const handleCloseDetails = () => {
//     setIsDetailOpen(false)
//     setSelectedEntry(null)
//   }

//   // ==============================================
//   // LOADING STATE
//   // ==============================================
//   if (isLoading) {
//     return (
//       <div className="space-y-6">
//         <Skeleton className="h-20 w-full" />
//         <div className="grid gap-4 md:grid-cols-4">
//           {[1, 2, 3, 4].map(i => (
//             <Skeleton key={i} className="h-32 w-full" />
//           ))}
//         </div>
//         <Skeleton className="h-96 w-full" />
//       </div>
//     )
//   }

//   // ==============================================
//   // RENDER
//   // ==============================================
//   return (
//     <div className="space-y-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold">Time Tracking</h1>
//           <p className="text-gray-600 mt-1">View and manage your time entries</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <Button variant="outline" size="sm">
//             <Download className="h-4 w-4 mr-2" />
//             Export
//           </Button>
//           {userIsAdmin && (
//             <Link href="/dashboard/time-tracking/admin">
//               <Button size="sm">
//                 Admin View
//               </Button>
//             </Link>
//           )}
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid gap-4 md:grid-cols-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
//             <Clock className="h-4 w-4 text-blue-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.totalHours}h</div>
//             <p className="text-xs text-gray-600">All time entries</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">This Week</CardTitle>
//             <TrendingUp className="h-4 w-4 text-green-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.weekHours}h</div>
//             <p className="text-xs text-gray-600">Current week</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Pending</CardTitle>
//             <Timer className="h-4 w-4 text-yellow-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.pendingCount}</div>
//             <p className="text-xs text-gray-600">Awaiting approval</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Approved</CardTitle>
//             <DollarSign className="h-4 w-4 text-purple-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.approvedCount}</div>
//             <p className="text-xs text-gray-600">Ready for payroll</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Time Entries Table */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Time Entries</CardTitle>
//           <CardDescription>
//             {stats.totalEntries} {stats.totalEntries === 1 ? 'entry' : 'entries'}
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           {timeEntries.length === 0 ? (
//             <div className="text-center py-12 text-gray-500">
//               <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
//               <p className="font-medium">No time entries yet</p>
//               <p className="text-sm mt-1">Clock in from the dashboard to start tracking</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b bg-gray-50">
//                     <th className="text-left p-3 font-medium text-sm">Date</th>
//                     <th className="text-left p-3 font-medium text-sm">Project</th>
//                     <th className="text-left p-3 font-medium text-sm">Time</th>
//                     <th className="text-left p-3 font-medium text-sm">Hours</th>
//                     <th className="text-left p-3 font-medium text-sm">Status</th>
//                     <th className="text-center p-3 font-medium text-sm">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {timeEntries.map((entry) => (
//                     <tr key={entry.id} className="border-b hover:bg-gray-50 transition-colors">
//                       <td className="p-3">
//                         <div className="flex items-center gap-2">
//                           <Calendar className="h-4 w-4 text-gray-400" />
//                           <span className="font-medium">{formatDate(entry.date)}</span>
//                         </div>
//                       </td>
//                       <td className="p-3">
//                         <div>
//                           <p className="font-medium text-gray-900">
//                             {(entry as any).project?.name || 'Unknown Project'}
//                           </p>
//                           {(entry as any).scheduleProject?.title && (
//                             <p className="text-xs text-gray-500">{(entry as any).scheduleProject.title}</p>
//                           )}
//                         </div>
//                       </td>
//                       <td className="p-3">
//                         <div className="text-sm">
//                           <p className="text-gray-900">
//                             {formatTime(entry.startTime)} - {entry.endTime ? formatTime(entry.endTime) : 'In Progress'}
//                           </p>
//                         </div>
//                       </td>
//                       <td className="p-3">
//                         <div className="font-semibold text-gray-900">
//                           {entry.totalHours ? `${entry.totalHours.toFixed(1)}h` : '-'}
//                         </div>
//                       </td>
//                       <td className="p-3">
//                         <Badge variant="outline" className={getStatusColor(entry.status)}>
//                           {getStatusLabel(entry.status)}
//                         </Badge>
//                       </td>
//                       <td className="p-3 text-center">
//                         <Button 
//                           variant="ghost" 
//                           size="sm"
//                           onClick={() => handleViewDetails(entry)}
//                         >
//                           <Eye className="h-4 w-4" />
//                         </Button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* FIXED: Use shared TimeEntryDetailsDialog component */}
//       <TimeEntryDetailsDialog
//         isOpen={isDetailOpen}
//         onClose={handleCloseDetails}
//         entry={selectedEntry}
//       />
//     </div>
//   )
// }


// ==============================================
// app/(dashboard)/dashboard/time-tracking/page.tsx
// Updated to use TimeEntriesTable component with amounts
// ==============================================

"use client"

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  Download,
  TrendingUp,
  DollarSign,
  Timer,
  CheckCircle,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { isAdmin } from '@/lib/permissions'
import Link from 'next/link'
import { useTimeEntries } from '@/hooks/time-tracking'
import { TimeEntriesTable } from '@/components/time-tracking'

export default function TimeTrackingPage() {
  // ==============================================
  // HOOKS
  // ==============================================
  const { 
    timeEntries, 
    isLoading, 
    timeEntryStats
  } = useTimeEntries()
  
  const userIsAdmin = isAdmin()

  // ==============================================
  // CALCULATE STATS WITH EARNINGS
  // ==============================================
  const stats = useMemo(() => {
    // Calculate earnings from time entries
    const totalEarnings = timeEntries.reduce((sum, entry) => {
      return sum + (entry.totalPay || 0)
    }, 0)

    const approvedEarnings = timeEntries
      .filter(e => e.status === 'approved')
      .reduce((sum, entry) => sum + (entry.totalPay || 0), 0)

    const pendingEarnings = timeEntries
      .filter(e => e.status === 'pending' || e.status === 'clocked_out')
      .reduce((sum, entry) => sum + (entry.totalPay || 0), 0)

    return {
      totalHours: timeEntryStats.totalHours.toFixed(1),
      weekHours: timeEntryStats.weekHours.toFixed(1),
      pendingCount: timeEntryStats.byStatus.pending + timeEntryStats.byStatus.clocked_out,
      approvedCount: timeEntryStats.byStatus.approved,
      totalEntries: timeEntryStats.totalEntries,
      totalEarnings: totalEarnings.toFixed(2),
      approvedEarnings: approvedEarnings.toFixed(2),
      pendingEarnings: pendingEarnings.toFixed(2)
    }
  }, [timeEntries, timeEntryStats])

  // ==============================================
  // LOADING STATE
  // ==============================================
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Tracking</h1>
          <p className="text-gray-600 mt-1">View and manage your time entries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {userIsAdmin && (
            <Link href="/dashboard/time-tracking/admin">
              <Button size="sm">
                Admin View
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards - Now with Earnings */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}h</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalEntries} {stats.totalEntries === 1 ? 'entry' : 'entries'}
            </p>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekHours}h</div>
            <p className="text-xs text-gray-600 mt-1">Current week</p>
          </CardContent>
        </Card>

        {/* Pending - With Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Timer className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-gray-600 mt-1">
              ${stats.pendingEarnings} awaiting approval
            </p>
          </CardContent>
        </Card>

        {/* Approved - With Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedCount}</div>
            <p className="text-xs text-gray-600 mt-1">
              ${stats.approvedEarnings} ready for payroll
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Summary Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <DollarSign className="h-5 w-5" />
            Total Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-3">
            <div className="text-4xl font-bold text-green-700">
              ${stats.totalEarnings}
            </div>
            <div className="text-sm text-green-600">
              from {stats.totalHours} hours worked
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-green-200">
            <div>
              <p className="text-xs text-green-700 mb-1">Approved</p>
              <p className="text-xl font-semibold text-green-800">
                ${stats.approvedEarnings}
              </p>
            </div>
            <div>
              <p className="text-xs text-yellow-700 mb-1">Pending</p>
              <p className="text-xl font-semibold text-yellow-800">
                ${stats.pendingEarnings}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries Table - Using Reusable Component */}
      <TimeEntriesTable
        timeEntries={timeEntries}
        isLoading={isLoading}
        title="All Time Entries"
        showAll={true}
      />
    </div>
  )
}