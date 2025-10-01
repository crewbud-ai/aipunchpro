// ==============================================
// app/(dashboard)/dashboard/time-tracking/page.tsx - Member View - FIXED
// ==============================================

"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Clock, 
  Calendar,
  Eye,
  Download,
  TrendingUp,
  DollarSign,
  Timer,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { isAdmin } from '@/lib/permissions'
import Link from 'next/link'
import { useTimeEntries } from '@/hooks/time-tracking'
import type { TimeEntrySummary } from '@/types/time-tracking'

export default function TimeTrackingPage() {
  // ==============================================
  // HOOKS - Use the existing time entries hook
  // ==============================================
  const { 
    timeEntries, 
    isLoading, 
    timeEntryStats
  } = useTimeEntries()
  
  // ==============================================
  // LOCAL STATE
  // ==============================================
  const [selectedEntry, setSelectedEntry] = useState<TimeEntrySummary | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const userIsAdmin = isAdmin()

  // ==============================================
  // CALCULATE STATS - Using hook's timeEntryStats
  // ==============================================
  const stats = useMemo(() => ({
    totalHours: timeEntryStats.totalHours.toFixed(1),
    weekHours: timeEntryStats.weekHours.toFixed(1),
    pendingCount: timeEntryStats.byStatus.pending,
    approvedCount: timeEntryStats.byStatus.approved,
    totalEntries: timeEntryStats.totalEntries
  }), [timeEntryStats])

  // ==============================================
  // FORMAT FUNCTIONS
  // ==============================================
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }

  const formatTime = (time?: string) => {
    if (!time) return '-'
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clocked_in':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'clocked_out':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'approved':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // ==============================================
  // HANDLE VIEW DETAILS
  // ==============================================
  const handleViewDetails = (entry: TimeEntrySummary) => {
    setSelectedEntry(entry)
    setIsDetailOpen(true)
  }

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Time Tracking</h1>
          <p className="text-gray-600">View your work hours and time entries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {userIsAdmin && (
            <Link href="/dashboard/time-tracking/admin">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Admin View
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekHours}h</div>
            <p className="text-xs text-muted-foreground">Hours worked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Timer className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}h</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedCount}</div>
            <p className="text-xs text-muted-foreground">Entries approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>
            Your complete work history ({stats.totalEntries} {stats.totalEntries === 1 ? 'entry' : 'entries'})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No time entries yet</p>
              <p className="text-sm mt-1">Clock in from the dashboard to start tracking</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-sm">Date</th>
                    <th className="text-left p-3 font-medium text-sm">Project</th>
                    <th className="text-left p-3 font-medium text-sm">Time</th>
                    <th className="text-left p-3 font-medium text-sm">Hours</th>
                    <th className="text-left p-3 font-medium text-sm">Status</th>
                    <th className="text-center p-3 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{formatDate(entry.date)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-900">{entry.projectName}</p>
                          {entry.scheduleProjectTitle && (
                            <p className="text-xs text-gray-500">{entry.scheduleProjectTitle}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <p className="text-gray-900">
                            {formatTime(entry.startTime)} - {entry.endTime ? formatTime(entry.endTime) : 'In Progress'}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-900">
                          {entry.totalHours ? `${entry.totalHours.toFixed(1)}h` : '-'}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={getStatusColor(entry.status)}>
                          {getStatusLabel(entry.status)}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(entry)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Time Entry Details</DialogTitle>
            <DialogDescription>
              View information for this time entry
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(selectedEntry.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant="outline" className={getStatusColor(selectedEntry.status)}>
                    {getStatusLabel(selectedEntry.status)}
                  </Badge>
                </div>
              </div>

              {/* Project Info */}
              <div>
                <p className="text-sm text-gray-500">Project</p>
                <p className="font-medium">{selectedEntry.projectName}</p>
                {selectedEntry.scheduleProjectTitle && (
                  <p className="text-sm text-gray-600">{selectedEntry.scheduleProjectTitle}</p>
                )}
              </div>

              {/* Time Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Start Time</p>
                  <p className="font-medium">{formatTime(selectedEntry.startTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Time</p>
                  <p className="font-medium">
                    {selectedEntry.endTime ? formatTime(selectedEntry.endTime) : 'In Progress'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Hours</p>
                  <p className="font-medium text-lg">
                    {selectedEntry.totalHours ? `${selectedEntry.totalHours.toFixed(2)}h` : '-'}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              {(selectedEntry.workType || selectedEntry.trade) && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  {selectedEntry.workType && (
                    <div>
                      <p className="text-sm text-gray-500">Work Type</p>
                      <p className="font-medium capitalize">{selectedEntry.workType}</p>
                    </div>
                  )}
                  {selectedEntry.trade && (
                    <div>
                      <p className="text-sm text-gray-500">Trade</p>
                      <p className="font-medium capitalize">{selectedEntry.trade}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Dialog Actions */}
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}