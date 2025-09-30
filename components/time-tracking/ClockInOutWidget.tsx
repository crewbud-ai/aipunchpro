// ==============================================
// components/time-tracking/ClockInOutWidget.tsx - ENHANCED WITH CONTEXT
// ==============================================

"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Play, Square, Loader2 } from "lucide-react"
import { useClockInOut } from "@/hooks/time-tracking"
import { useTimeTracking } from "@/contexts/time-tracking/TimeTrackingContext"
import { ProjectSelectionModal } from "./ProjectSelectionModal"
import { ClockOutModal } from "./ClockOutModal"
import { CurrentSessionDisplay } from "./CurrentSessionDisplay"
import { ClockInOutWidgetSkeleton } from "./skeletons/TimeTrackingSkeletons"

interface ClockInOutWidgetProps {
  className?: string
  showTodaysSummary?: boolean
  compact?: boolean
}

export function ClockInOutWidget({ 
  className, 
  showTodaysSummary = true,
  compact = false 
}: ClockInOutWidgetProps) {
  // ==============================================
  // CONTEXT - Get shared time tracking state
  // ==============================================
  const { 
    isClocked, 
    currentSession, 
    sessionLoading,
    refreshSession,
    refreshDashboard 
  } = useTimeTracking()

  // ==============================================
  // HOOKS
  // ==============================================
  const {
    projects,
    scheduleProjects,
    isLoadingOptions,
    clockIn,
    clockOut,
    isClockingIn,
    isClockingOut,
    error: clockError,
  } = useClockInOut()

  // ==============================================
  // LOCAL STATE
  // ==============================================
  const [showClockInModal, setShowClockInModal] = useState(false)
  const [showClockOutModal, setShowClockOutModal] = useState(false)
  const [todaysTotal, setTodaysTotal] = useState(0)

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const hasProjects = projects.length > 0
  const isLoading = sessionLoading || isLoadingOptions
  const isProcessing = isClockingIn || isClockingOut

  // ==============================================
  // CALCULATE TODAY'S TOTAL & DURATION STRING
  // ==============================================
  const [durationString, setDurationString] = React.useState('0h 0m')
  
  useEffect(() => {
    if (currentSession && isClocked) {
      const minutes = currentSession.duration || 0
      setTodaysTotal(minutes)
      
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      setDurationString(`${hours}h ${mins}m`)
    } else {
      setTodaysTotal(0)
      setDurationString('0h 0m')
    }
  }, [currentSession, isClocked])

  // ==============================================
  // HANDLE CLOCK IN SUCCESS
  // ==============================================
  const handleClockInSuccess = async () => {
    setShowClockInModal(false)
    
    // Refresh session first (updates context)
    await refreshSession()
    
    // Then trigger dashboard-wide refresh
    refreshDashboard()
  }

  // ==============================================
  // HANDLE CLOCK OUT SUCCESS
  // ==============================================
  const handleClockOutSuccess = async () => {
    setShowClockOutModal(false)
    
    // Refresh session first (updates context)
    await refreshSession()
    
    // Then trigger dashboard-wide refresh
    refreshDashboard()
  }

  // ==============================================
  // HANDLE CLOCK IN BUTTON
  // ==============================================
  const handleClockInClick = () => {
    if (!hasProjects) {
      return
    }
    setShowClockInModal(true)
  }

  // ==============================================
  // HANDLE CLOCK OUT BUTTON
  // ==============================================
  const handleClockOutClick = () => {
    setShowClockOutModal(true)
  }

  // ==============================================
  // LOADING STATE
  // ==============================================
  if (isLoading) {
    return <ClockInOutWidgetSkeleton />
  }

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Time Tracking
          </CardTitle>
          {!compact && (
            <CardDescription>
              {isClocked ? 'Currently clocked in' : 'Start tracking your time'}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Current Session Display */}
            {isClocked && currentSession && (
              <CurrentSessionDisplay 
                session={currentSession} 
                duration={durationString}
                compact={compact} 
              />
            )}

            {/* Clock In/Out Button */}
            {!isClocked ? (
              <Button
                onClick={handleClockInClick}
                disabled={!hasProjects || isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size={compact ? "sm" : "default"}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Clock In
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleClockOutClick}
                disabled={isProcessing}
                variant="destructive"
                className="w-full"
                size={compact ? "sm" : "default"}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Clock Out
                  </>
                )}
              </Button>
            )}

            {/* No Projects Warning */}
            {!hasProjects && !isLoading && (
              <p className="text-sm text-muted-foreground text-center">
                No projects assigned. Contact your supervisor.
              </p>
            )}

            {/* Today's Summary */}
            {showTodaysSummary && (
              <div className="pt-4 border-t text-center">
                <div className="text-sm text-gray-500">Today's Total</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {Math.floor(todaysTotal / 60)}h {todaysTotal % 60}m
                </div>
              </div>
            )}

            {/* Error Display */}
            {clockError && (
              <p className="text-sm text-red-500 text-center">{clockError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ProjectSelectionModal
        isOpen={showClockInModal}
        onClose={() => setShowClockInModal(false)}
        onSuccess={handleClockInSuccess}
        projects={projects}
        isLoading={isClockingIn}
      />

      <ClockOutModal
        isOpen={showClockOutModal}
        onClose={() => setShowClockOutModal(false)}
        onSuccess={handleClockOutSuccess}
        currentSession={currentSession}
        isLoading={isClockingOut}
      />
    </>
  )
}

export default ClockInOutWidget