import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, DollarSign, Play, Square, Timer, TrendingUp } from 'lucide-react'
import { useClockInOut, useClockSession } from '@/hooks/time-tracking'
import { ProjectSelectionModal } from './ProjectSelectionModal'
import { ClockOutModal } from './ClockOutModal'

// ==============================================
// UNIFIED CLOCK & EARNINGS WIDGET
// Combines clock in/out functionality with live earnings display
// Uses existing ProjectSelectionModal and ClockOutModal
// ==============================================

export function UnifiedClockEarningsWidget() {
  const {
    hasActiveSession,
    currentSession,
    isLoading,
    sessionDuration,
  } = useClockSession()

  const { projects, isClockingIn } = useClockInOut()

  const [showClockIn, setShowClockIn] = useState(false)
  const [showClockOut, setShowClockOut] = useState(false)
  const [currentEarnings, setCurrentEarnings] = useState(0)
  const [regularHours, setRegularHours] = useState(0)
  const [overtimeHours, setOvertimeHours] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate earnings in real-time
  useEffect(() => {
    if (!hasActiveSession || !currentSession) {
      setCurrentEarnings(0)
      setRegularHours(0)
      setOvertimeHours(0)
      return
    }

    // Calculate total hours worked
    const totalHours = sessionDuration / 60 // Convert minutes to hours
    
    // Get rates (with fallback to 0)
    const regularRate = (currentSession as any).regularRate || 0
    const overtimeRate = (currentSession as any).overtimeRate || regularRate * 1.5

    // Calculate regular and overtime hours
    const regHours = Math.min(totalHours, 8)
    const otHours = Math.max(0, totalHours - 8)

    // Calculate earnings
    const regularPay = regHours * regularRate
    const overtimePay = otHours * overtimeRate
    const total = regularPay + overtimePay

    setRegularHours(regHours)
    setOvertimeHours(otHours)
    setCurrentEarnings(total)
  }, [hasActiveSession, currentSession, sessionDuration, currentTime])

  // Format time duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const secs = Math.floor((Date.now() % 60000) / 1000)
    
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`
    } else if (mins > 0) {
      return `${mins}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const handleClockInSuccess = () => {
    setShowClockIn(false)
    // Refresh page to update widget
    window.location.reload()
  }

  const handleClockOutSuccess = () => {
    setShowClockOut(false)
    // Refresh page to update widget
    window.location.reload()
  }

  const hasOvertime = overtimeHours > 0
  const statusColor = hasOvertime ? 'yellow' : 'green'
  const statusBg = hasOvertime ? 'bg-yellow-50' : 'bg-green-50'
  const statusBorder = hasOvertime ? 'border-yellow-200' : 'border-green-200'
  const statusText = hasOvertime ? 'text-yellow-800' : 'text-green-800'

  return (
    <>
      <Card className={`${hasActiveSession ? statusBg : ''} ${hasActiveSession ? statusBorder : 'border-gray-200'} transition-colors`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Clock
            </CardTitle>
            {hasActiveSession && (
              <Badge 
                variant="outline" 
                className={`${statusText} ${statusBg} ${statusBorder}`}
              >
                {hasOvertime ? '⚡ OVERTIME' : '● WORKING'}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* CLOCKED OUT STATE */}
          {!hasActiveSession && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Timer className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Ready to start working?
              </p>
              <Button 
                onClick={() => setShowClockIn(true)}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                <Play className="mr-2 h-4 w-4" />
                Clock In
              </Button>
            </div>
          )}

          {/* CLOCKED IN STATE */}
          {hasActiveSession && currentSession && (
            <div className="space-y-4">
              {/* Project Info */}
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Working on</p>
                <p className="font-semibold text-gray-900">
                  {(currentSession as any).projectName || 'Unknown Project'}
                </p>
                {(currentSession as any).scheduleProjectTitle && (
                  <p className="text-xs text-gray-600 mt-1">
                    → {(currentSession as any).scheduleProjectTitle}
                  </p>
                )}
              </div>

              {/* Time Worked */}
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Time Worked</span>
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 font-mono">
                  {formatDuration(sessionDuration)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(sessionDuration / 60).toFixed(2)} hours
                </p>
              </div>

              {/* Earnings */}
              <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-700">Earned So Far</span>
                  <DollarSign className="h-4 w-4 text-green-700" />
                </div>
                <p className="text-3xl font-bold text-green-700">
                  ${currentEarnings.toFixed(2)}
                </p>
                
                {/* Breakdown */}
                <div className="mt-3 pt-3 border-t border-green-300 space-y-1">
                  <div className="flex justify-between text-xs text-gray-700">
                    <span>Regular: {regularHours.toFixed(2)}h</span>
                    <span className="font-semibold">
                      ${(regularHours * ((currentSession as any).regularRate || 0)).toFixed(2)}
                    </span>
                  </div>
                  {hasOvertime && (
                    <div className="flex justify-between text-xs text-yellow-700">
                      <span>Overtime: {overtimeHours.toFixed(2)}h</span>
                      <span className="font-semibold">
                        ${(overtimeHours * ((currentSession as any).overtimeRate || 0)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-600 mt-2 text-center">
                  💡 Pending approval
                </p>
              </div>

              {/* Clock Out Button */}
              <Button 
                onClick={() => setShowClockOut(true)}
                variant="destructive"
                className="w-full"
                disabled={isLoading}
              >
                <Square className="mr-2 h-4 w-4" />
                Clock Out
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Use Existing Dialogs */}
      <ProjectSelectionModal 
        isOpen={showClockIn}
        onClose={() => setShowClockIn(false)}
        onSuccess={handleClockInSuccess}
        projects={projects} // Will be loaded by the modal itself via useClockInOut hook
        isLoading={isClockingIn}
      />
      
      <ClockOutModal 
        isOpen={showClockOut}
        onClose={() => setShowClockOut(false)}
        onSuccess={handleClockOutSuccess}
        currentSession={currentSession}
      />
    </>
  )
}