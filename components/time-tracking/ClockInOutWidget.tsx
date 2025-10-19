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
        <CardHeader className="p-4 xs:p-5 sm:p-6">
          <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
            <Clock className="h-4 w-4 xs:h-5 xs:w-5 text-orange-600 shrink-0" />
            Time Tracking
          </CardTitle>
          {!compact && (
            <CardDescription className="text-xs xs:text-sm leading-snug xs:leading-normal mt-1 xs:mt-1.5">
              {isClocked ? 'Currently clocked in' : 'Start tracking your time'}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
          <div className="space-y-3 xs:space-y-4">
            {/* Current Session Display */}
            {isClocked && currentSession && (
              <CurrentSessionDisplay
                session={currentSession}
                duration={durationString}
                compact={compact}
              />
            )}

            {/* Clock In/Out Button - Mobile Responsive */}
            {!isClocked ? (
              <Button
                onClick={handleClockInClick}
                disabled={!hasProjects || isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-9 xs:h-10 sm:h-11 text-sm xs:text-base"
                size={compact ? "sm" : "default"}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
                    <span>Clock In</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleClockOutClick}
                disabled={isProcessing}
                variant="destructive"
                className="w-full h-9 xs:h-10 sm:h-11 text-sm xs:text-base"
                size={compact ? "sm" : "default"}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Square className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
                    <span>Clock Out</span>
                  </>
                )}
              </Button>
            )}

            {/* No Projects Warning - Mobile Responsive */}
            {!hasProjects && !isLoading && (
              <p className="text-xs xs:text-sm text-muted-foreground text-center leading-snug">
                No projects assigned. Contact your supervisor.
              </p>
            )}

            {/* Today's Summary - Mobile Responsive */}
            {showTodaysSummary && (
              <div className="pt-3 xs:pt-4 border-t text-center">
                <div className="text-xs xs:text-sm text-gray-500 mb-1 xs:mb-1.5">Today's Total</div>
                <div className="text-xl xs:text-2xl font-semibold text-gray-900">
                  {Math.floor(todaysTotal / 60)}h {todaysTotal % 60}m
                </div>
              </div>
            )}

            {/* Error Display - Mobile Responsive */}
            {clockError && (
              <p className="text-xs xs:text-sm text-red-500 text-center leading-snug">{clockError}</p>
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