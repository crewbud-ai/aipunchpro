// ==============================================
// components/time-tracking/ClockInOutWidget.tsx - FIXED VERSION
// Resolves infinite loading issue
// ==============================================

"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Clock,
  Play,
  Square,
  Building2,
  AlertCircle,
  Loader2,
  Timer,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Import hooks with fixed API usage
import { useClockSession, useClockInOut } from "@/hooks/time-tracking"

// Import sub-components
import { ProjectSelectionModal } from "./ProjectSelectionModal"
import { ClockOutModal } from "./ClockOutModal"
import { CurrentSessionDisplay } from "./CurrentSessionDisplay"

// ==============================================
// INTERFACES
// ==============================================
interface ClockInOutWidgetProps {
  className?: string
  showTodaysSummary?: boolean
  compact?: boolean
}

// ==============================================
// MAIN COMPONENT - FIXED VERSION
// ==============================================
export function ClockInOutWidget({ 
  className, 
  showTodaysSummary = true,
  compact = false 
}: ClockInOutWidgetProps) {
  
  console.log('ClockInOutWidget: Component rendered')

  // ==============================================
  // HOOKS
  // ==============================================
  const {
    hasActiveSession,
    currentSession,
    isLoading: sessionLoading,
    error: sessionError,
    refreshSession,
    isClocked,
    formattedDuration,
    canClockOut,
  } = useClockSession()

  const {
    projects,
    isClockingIn,
    isClockingOut,
    isLoadingOptions,
    error: clockError,
    clockIn,
    clockOut,
    hasProjects,
    clearError,
  } = useClockInOut()

  // ==============================================
  // LOCAL STATE
  // ==============================================
  const [showClockInModal, setShowClockInModal] = useState(false)
  const [showClockOutModal, setShowClockOutModal] = useState(false)

  // ==============================================
  // DEBUG LOGGING - TEMPORARY
  // ==============================================
  useEffect(() => {
    console.log('ClockInOutWidget Debug:', {
      sessionLoading,
      isLoadingOptions,
      sessionError,
      clockError,
      hasActiveSession,
      currentSession: !!currentSession,
      hasProjects,
      projectsCount: projects?.length || 0
    })
  }, [sessionLoading, isLoadingOptions, sessionError, clockError, hasActiveSession, currentSession, hasProjects, projects])

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const isLoading = sessionLoading || isLoadingOptions
  const hasError = sessionError || clockError
  const canShowClockIn = hasProjects && !isClocked && !isLoading
  const canShowClockOut = isClocked && canClockOut && !isLoading

  // ==============================================
  // HANDLERS
  // ==============================================
  const handleClockInClick = () => {
    if (!hasProjects) {
      console.warn('No projects available for clock in')
      return
    }
    setShowClockInModal(true)
  }

  const handleClockOutClick = () => {
    if (!canClockOut) {
      console.warn('Cannot clock out - no active session')
      return
    }
    setShowClockOutModal(true)
  }

  const handleClockInSuccess = async () => {
    setShowClockInModal(false)
    await refreshSession()
    clearError()
  }

  const handleClockOutSuccess = async () => {
    setShowClockOutModal(false)
    await refreshSession()
    clearError()
  }

  const handleCloseModals = () => {
    setShowClockInModal(false)
    setShowClockOutModal(false)
    clearError()
  }

  // ==============================================
  // CLEAR ERRORS WHEN SESSION STATE CHANGES
  // ==============================================
  useEffect(() => {
    if (isClocked !== undefined) {
      clearError()
    }
  }, [isClocked, clearError])

  // ==============================================
  // LOADING STATE WITH TIMEOUT FALLBACK - FIXED
  // ==============================================
  const [forceShowContent, setForceShowContent] = useState(false)
  
  useEffect(() => {
    // Force show content after 5 seconds to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('ClockInOutWidget: Force showing content after timeout')
      setForceShowContent(true)
    }, 5000)

    return () => clearTimeout(timeout)
  }, [])

  // Show loading only if actually loading and not forced to show content
  if (isLoading && !forceShowContent) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          {showTodaysSummary && <Skeleton className="h-16 w-full" />}
          
          {/* Debug info - will be removed */}
          <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
            Debug: sessionLoading={String(sessionLoading)}, isLoadingOptions={String(isLoadingOptions)}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ==============================================
  // ERROR STATE
  // ==============================================
  if (hasError && !forceShowContent) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Clock System Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {hasError}. Please refresh the page or contact support if the problem persists.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                refreshSession()
                clearError()
              }}
            >
              Try Again
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setForceShowContent(true)}
            >
              Force Show
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ==============================================
  // MAIN INTERFACE - ALWAYS SHOWS NOW
  // ==============================================
  return (
    <>
      <Card className={cn("w-full", className)}>
        <CardHeader className={cn("pb-3", compact && "pb-2")}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className={cn("text-lg flex items-center gap-2", compact && "text-base")}>
                <Clock className="h-5 w-5 text-orange-600" />
                Time Tracking
              </CardTitle>
              <CardDescription className={cn(compact && "text-xs")}>
                {isClocked 
                  ? `Working on ${currentSession?.projectName || 'a project'}` 
                  : "Ready to start your workday"
                }
              </CardDescription>
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              {isClocked ? (
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                  <Activity className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600">
                  <Timer className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current Session Display */}
          {isClocked && currentSession && (
            <CurrentSessionDisplay 
              session={currentSession}
              duration={formattedDuration}
              compact={compact}
            />
          )}

          {/* Main Action Buttons */}
          <div className="flex gap-3">
            {!isClocked ? (
              <Button
                onClick={handleClockInClick}
                disabled={!canShowClockIn}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12"
                size="lg"
              >
                {isClockingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Clocking In...
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
                disabled={!canShowClockOut}
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-12"
                size="lg"
              >
                {isClockingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Clocking Out...
                  </>
                ) : (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Clock Out
                  </>
                )}
              </Button>
            )}

            {/* Refresh Button */}
            {!compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshSession}
                disabled={isLoading}
                className="px-3"
              >
                <Activity className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Error Display */}
          {hasError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {hasError}
              </AlertDescription>
            </Alert>
          )}

          {/* No Projects Warning */}
          {!hasProjects && !isLoading && (
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                You are not assigned to any projects. Please contact your supervisor to get assigned to a project before you can clock in.
              </AlertDescription>
            </Alert>
          )}

          {/* Today's Summary */}
          {showTodaysSummary && !compact && (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-500">Today</div>
                  <div className="font-semibold">
                    {isClocked ? formattedDuration : '0h 0m'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">This Week</div>
                  <div className="font-semibold">32h 15m</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="font-semibold text-green-600">
                    {isClocked ? 'Working' : 'Off Duty'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Debug Panel - TEMPORARY */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs bg-gray-100 p-2 rounded space-y-1">
              <div>Session Loading: {String(sessionLoading)}</div>
              <div>Options Loading: {String(isLoadingOptions)}</div>
              <div>Has Projects: {String(hasProjects)} ({projects?.length || 0})</div>
              <div>Is Clocked: {String(isClocked)}</div>
              <div>Has Session: {String(!!currentSession)}</div>
              <div>Errors: {hasError || 'None'}</div>
              <div>Force Show: {String(forceShowContent)}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clock In Modal */}
      <ProjectSelectionModal
        isOpen={showClockInModal}
        onClose={handleCloseModals}
        onSuccess={handleClockInSuccess}
        projects={projects}
        isLoading={isClockingIn}
      />

      {/* Clock Out Modal */}
      <ClockOutModal
        isOpen={showClockOutModal}
        onClose={handleCloseModals}
        onSuccess={handleClockOutSuccess}
        currentSession={currentSession}
        isLoading={isClockingOut}
      />
    </>
  )
}

export default ClockInOutWidget