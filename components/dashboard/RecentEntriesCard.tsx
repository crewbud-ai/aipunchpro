// ==============================================
// components/dashboard/RecentEntriesCard.tsx - COMPLETE WITH DIALOG
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
  // HANDLERS
  // ==============================================
  const handleViewDetails = (entry: any) => {
    setSelectedEntry(entry)
    setIsDetailOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailOpen(false)
    setSelectedEntry(null)
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
    <>
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
                  {recentEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{formatDate(entry.date)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {(entry as any).project?.name || 'Unknown Project'}
                          </p>
                          {(entry as any).scheduleProject?.title && (
                            <p className="text-xs text-gray-500">{(entry as any).scheduleProject.title}</p>
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

      {/* TIME ENTRY DETAILS DIALOG */}
      <TimeEntryDetailsDialog
        isOpen={isDetailOpen}
        onClose={handleCloseDetails}
        entry={selectedEntry}
      />
    </>
  )
}