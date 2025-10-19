// ==============================================
// components/dashboard/TodaysSummaryCard.tsx - Smart Component
// ==============================================

"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { useTimeTracking } from '@/contexts/time-tracking/TimeTrackingContext'
import { TodaysSummarySkeleton } from '@/components/time-tracking/skeletons/TimeTrackingSkeletons'

export function TodaysSummaryCard() {
  const { dashboardRefreshKey, currentSession, isClocked } = useTimeTracking()
  const [isLoading, setIsLoading] = useState(false)
  const [todaysData, setTodaysData] = useState({
    totalHours: 0,
    totalMinutes: 0,
    entries: 0
  })

  // ==============================================
  // FETCH TODAY'S DATA
  // ==============================================
  useEffect(() => {
    const fetchTodaysData = async () => {
      setIsLoading(true)
      try {
        // Simulate API call - Replace with actual API
        await new Promise(resolve => setTimeout(resolve, 500))

        // Calculate from current session if clocked in
        if (isClocked && currentSession) {
          const totalMinutes = currentSession.duration || 0
          setTodaysData({
            totalHours: Math.floor(totalMinutes / 60),
            totalMinutes: totalMinutes % 60,
            entries: 1 // Or fetch actual count
          })
        } else {
          // Fetch completed entries for today
          setTodaysData({
            totalHours: 0,
            totalMinutes: 0,
            entries: 0
          })
        }
      } catch (error) {
        console.error('Failed to fetch today\'s summary:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTodaysData()
  }, [dashboardRefreshKey, isClocked, currentSession])

  // ==============================================
  // LOADING STATE
  // ==============================================
  if (isLoading) {
    return <TodaysSummarySkeleton />
  }

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <Card>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm sm:text-base truncate">Today's Time</CardTitle>
            <CardDescription className="text-xs sm:text-sm truncate">Your time tracked today</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600 truncate">Total Hours</span>
            <span className="text-base sm:text-lg font-semibold whitespace-nowrap">
              {todaysData.totalHours}h {todaysData.totalMinutes}m
            </span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600 truncate">Entries</span>
            <span className="text-base sm:text-lg font-semibold">{todaysData.entries}</span>
          </div>
          {isClocked && (
            <div className="pt-2 border-t">
              <span className="text-xs sm:text-xs text-green-600 font-medium">● Currently clocked in</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}