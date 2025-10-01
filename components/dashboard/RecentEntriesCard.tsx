// ==============================================
// components/dashboard/RecentEntriesCard.tsx - CORRECT DATA MAPPING
// ==============================================

"use client"

import React, { useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { History, ArrowRight, Clock, Calendar, Briefcase, Eye } from 'lucide-react'
import { useTimeTracking } from '@/contexts/time-tracking/TimeTrackingContext'
import { RecentEntriesSkeleton } from '@/components/time-tracking/skeletons/TimeTrackingSkeletons'
import { useTimeEntries } from '@/hooks/time-tracking'
import { TimeEntryDetailsDialog } from '@/components/time-tracking/TimeEntryDetailsDialog'

export function RecentEntriesCard() {
  const { dashboardRefreshKey } = useTimeTracking()
  const {
    timeEntries,
    isLoading,
    refreshTimeEntries
  } = useTimeEntries()

  // Local state for dialog
  const [selectedEntry, setSelectedEntry] = React.useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)

  // Take first 5 entries - already sorted correctly by the hook
  const recentEntries = React.useMemo(() => {
    return timeEntries.slice(0, 5)
  }, [timeEntries])

  // ==============================================
  // REFRESH WHEN DASHBOARD UPDATES
  // ==============================================
  useEffect(() => {
    refreshTimeEntries()
  }, [dashboardRefreshKey, refreshTimeEntries])

  // ==============================================
  // FORMAT FUNCTIONS
  // ==============================================
  const formatTime = (time?: string) => {
    if (!time) return '-'
    // Handle HH:MM:SS format - split and take first two parts
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

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
      day: 'numeric'
    })
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
  // LOADING STATE
  // ==============================================
  if (isLoading) {
    return <RecentEntriesSkeleton count={5} />
  }

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <History className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">Recent Entries</CardTitle>
              <CardDescription className="text-sm">Your latest time entries</CardDescription>
            </div>
          </div>

          {/* VIEW ALL BUTTON */}
          <Link href="/dashboard/time-tracking">
            <Button variant="ghost" size="sm" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        {recentEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No time entries yet</p>
            <p className="text-sm mt-1">Clock in to start tracking!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* LEFT SIDE - Entry Details */}
                <div className="flex-1 space-y-1">
                  {/* Project Name - Access nested object */}
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <p className="font-medium text-sm">
                      {(entry as any).project?.name || 'Unknown Project'}
                    </p>
                  </div>

                  {/* Schedule Project Title - Access nested object */}
                  {(entry as any).scheduleProject?.title && (
                    <p className="text-xs text-gray-500 ml-6">
                      {(entry as any).scheduleProject.title}
                    </p>
                  )}

                  {/* Date and Time */}
                  <div className="flex items-center gap-3 ml-6 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(entry.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(entry.startTime)} - {entry.endTime ? formatTime(entry.endTime) : 'In Progress'}
                    </span>
                  </div>

                  {/* Work Type and Trade */}
                  {(entry.workType || entry.trade) && (
                    <div className="flex items-center gap-2 ml-6 text-xs">
                      {entry.workType && (
                        <span className="text-gray-600 capitalize">{entry.workType}</span>
                      )}
                      {entry.workType && entry.trade && (
                        <span className="text-gray-400">•</span>
                      )}
                      {entry.trade && (
                        <span className="text-gray-600 capitalize">{entry.trade}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT SIDE - Hours and Status */}
                <div className="flex flex-col items-end gap-2 ml-4">
                  {/* Hours - Direct access from root level */}
                  <div className="font-semibold text-sm text-gray-900">
                    {entry.totalHours ? `${entry.totalHours.toFixed(1)}h` : '-'}
                  </div>

                  {/* Status Badge - Direct access from root level */}
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(entry.status)}`}
                  >
                    {getStatusLabel(entry.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}