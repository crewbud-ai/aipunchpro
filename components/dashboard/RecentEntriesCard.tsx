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
import { formatDateSmart, formatTime12Hour, getTimeEntryStatusColor } from '@/utils/format-functions'

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
        <CardHeader className="p-4 xs:p-5 sm:p-6">
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4">
            <div className="flex items-center gap-2.5 xs:gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 xs:w-10 xs:h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <History className="h-4 w-4 xs:h-5 xs:w-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm xs:text-base truncate">Recent Entries</CardTitle>
                <CardDescription className="text-xs xs:text-sm leading-snug truncate">Your latest time entries</CardDescription>
              </div>
            </div>

            {/* VIEW ALL BUTTON - Mobile Responsive */}
            <Link href="/dashboard/time-tracking" className="w-full xs:w-auto">
              <Button variant="ghost" size="sm" className="gap-1.5 xs:gap-2 w-full xs:w-auto h-9 xs:h-10 text-sm xs:text-base">
                View All
                <ArrowRight className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
          {recentEntries.length === 0 ? (
            <div className="text-center py-8 xs:py-10 sm:py-12 text-gray-500 px-4">
              <Clock className="h-10 w-10 xs:h-12 xs:w-12 mx-auto mb-2.5 xs:mb-3 opacity-50" />
              <p className="font-medium text-sm xs:text-base">No time entries yet</p>
              <p className="text-xs xs:text-sm mt-1 leading-snug">Clock in from the dashboard to start tracking</p>
            </div>
          ) : (
            <>
              {/* Desktop Table - Hidden on mobile */}
              <div className="hidden md:block overflow-x-auto">
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
                            <span className="font-medium">{formatDateSmart(entry.date)}</span>
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
                              {entry.startTime && formatTime12Hour(entry.startTime)} - {entry.endTime ? formatTime12Hour(entry.endTime) : 'In Progress'}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-gray-900">
                            {entry.totalHours ? `${entry.totalHours.toFixed(1)}h` : '-'}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={getTimeEntryStatusColor(entry.status)}>
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

              {/* Mobile Cards - Visible only on mobile/tablet */}
              <div className="md:hidden space-y-2.5 xs:space-y-3">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-3 xs:p-4 space-y-2.5 xs:space-y-3 hover:bg-gray-50 transition-colors">
                    {/* Header: Date and Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 xs:gap-2 min-w-0 flex-1">
                        <Calendar className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-sm xs:text-base text-gray-900 leading-snug">{formatDateSmart(entry.date)}</span>
                      </div>
                      <Badge variant="outline" className={`${getTimeEntryStatusColor(entry.status)} text-xs shrink-0`}>
                        {getStatusLabel(entry.status)}
                      </Badge>
                    </div>

                    {/* Project Info */}
                    <div className="min-w-0">
                      <p className="font-medium text-sm xs:text-base text-gray-900 truncate leading-snug">
                        {(entry as any).project?.name || 'Unknown Project'}
                      </p>
                      {(entry as any).scheduleProject?.title && (
                        <p className="text-xs text-gray-500 truncate leading-snug mt-0.5">{(entry as any).scheduleProject.title}</p>
                      )}
                    </div>

                    {/* Time and Hours Grid */}
                    <div className="grid grid-cols-2 gap-2.5 xs:gap-3 text-xs xs:text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Time</p>
                        <p className="text-gray-900 font-medium leading-snug">
                          {entry.startTime && formatTime12Hour(entry.startTime)} - {entry.endTime ? formatTime12Hour(entry.endTime) : 'In Progress'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Hours</p>
                        <p className="font-semibold text-gray-900 leading-snug">
                          {entry.totalHours ? `${entry.totalHours.toFixed(1)}h` : '-'}
                        </p>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-9 xs:h-10 text-xs xs:text-sm"
                      onClick={() => handleViewDetails(entry)}
                    >
                      <Eye className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </>
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