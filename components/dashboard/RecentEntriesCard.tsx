"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History } from 'lucide-react'
import { useTimeTracking } from '@/contexts/time-tracking/TimeTrackingContext'
import { RecentEntriesSkeleton } from '@/components/time-tracking/skeletons/TimeTrackingSkeletons'
import { format } from 'date-fns'

interface TimeEntry {
  id: string
  projectName: string
  date: string
  startTime: string
  endTime: string | null
  totalHours: string
  status: string
}

export function RecentEntriesCard() {
  const { dashboardRefreshKey } = useTimeTracking()
  const [isLoading, setIsLoading] = useState(false)
  const [entries, setEntries] = useState<TimeEntry[]>([])

  // ==============================================
  // FETCH RECENT ENTRIES
  // ==============================================
  useEffect(() => {
    const fetchRecentEntries = async () => {
      setIsLoading(true)
      try {
        // Replace with actual API call
        const response = await fetch('/api/time-entries/recent?limit=5')
        const data = await response.json()
        
        if (data.success) {
          setEntries(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch recent entries:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentEntries()
  }, [dashboardRefreshKey]) // Refetch when dashboard updates

  // ==============================================
  // FORMAT TIME
  // ==============================================
  const formatTime = (time: string) => {
    if (!time) return '-'
    return format(new Date(`2000-01-01T${time}`), 'h:mm a')
  }

  // ==============================================
  // GET STATUS COLOR
  // ==============================================
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clocked_in':
        return 'bg-green-100 text-green-800'
      case 'clocked_out':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No time entries yet. Clock in to start tracking!
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{entry.projectName}</p>
                  <p className="text-xs text-gray-500">
                    {formatTime(entry.startTime)} - {entry.endTime ? formatTime(entry.endTime) : 'In Progress'}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant="secondary" className={getStatusColor(entry.status)}>
                    {entry.status.replace('_', ' ')}
                  </Badge>
                  {entry.totalHours && (
                    <p className="text-xs text-gray-600">
                      {parseFloat(entry.totalHours).toFixed(1)}h
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}