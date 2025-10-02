import React, { useState, useEffect } from 'react'
import { Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ==============================================
// TYPES & INTERFACES
// ==============================================

interface ActiveSession {
  id: string
  projectId: string
  projectName: string
  scheduleProjectId?: string
  scheduleProjectTitle?: string
  startTime: string // HH:MM format
  date: string
  regularRate: number
  overtimeRate: number
  doubleTimeRate?: number
  breakMinutes?: number
}

interface EarningsBreakdown {
  elapsedSeconds: number
  totalHours: number
  regularHours: number
  overtimeHours: number
  doubleTimeHours: number
  regularPay: number
  overtimePay: number
  doubleTimePay: number
  totalEarnings: number
  hasOvertime: boolean
  hasDoubleTime: boolean
}

// ==============================================
// LIVE EARNINGS DISPLAY COMPONENT
// ==============================================

interface LiveEarningsDisplayProps {
  activeSession: ActiveSession | null
  updateInterval?: number // milliseconds, default 60000 (1 minute)
}

export function LiveEarningsDisplay({ 
  activeSession, 
  updateInterval = 60000 
}: LiveEarningsDisplayProps) {
  const [earnings, setEarnings] = useState<EarningsBreakdown | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // ==============================================
  // CALCULATE EARNINGS
  // ==============================================
  const calculateEarnings = (session: ActiveSession): EarningsBreakdown => {
    // Parse start time
    const [startHours, startMinutes] = session.startTime?.split(':')?.map(Number)
    const startDate = new Date(session.date)
    startDate.setHours(startHours, startMinutes, 0, 0)

    // Calculate elapsed time
    const now = new Date()
    const elapsedMs = now.getTime() - startDate.getTime()
    const elapsedSeconds = Math.floor(elapsedMs / 1000)
    const elapsedMinutes = Math.floor(elapsedSeconds / 60)
    
    // Subtract break minutes
    const breakMinutes = session.breakMinutes || 0
    const workingMinutes = Math.max(0, elapsedMinutes - breakMinutes)
    const totalHours = workingMinutes / 60

    // Calculate hours breakdown
    let regularHours = 0
    let overtimeHours = 0
    let doubleTimeHours = 0

    if (totalHours <= 8) {
      regularHours = totalHours
    } else if (totalHours <= 12) {
      regularHours = 8
      overtimeHours = totalHours - 8
    } else {
      regularHours = 8
      overtimeHours = 4
      doubleTimeHours = totalHours - 12
    }

    // Calculate payments
    const regularPay = regularHours * session.regularRate
    const overtimePay = overtimeHours * session.overtimeRate
    const doubleTimePay = doubleTimeHours * (session.doubleTimeRate || session.regularRate * 2)
    const totalEarnings = regularPay + overtimePay + doubleTimePay

    return {
      elapsedSeconds,
      totalHours: Math.round(totalHours * 100) / 100,
      regularHours: Math.round(regularHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      doubleTimeHours: Math.round(doubleTimeHours * 100) / 100,
      regularPay: Math.round(regularPay * 100) / 100,
      overtimePay: Math.round(overtimePay * 100) / 100,
      doubleTimePay: Math.round(doubleTimePay * 100) / 100,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      hasOvertime: overtimeHours > 0 || doubleTimeHours > 0,
      hasDoubleTime: doubleTimeHours > 0,
    }
  }

  // ==============================================
  // FORMAT ELAPSED TIME
  // ==============================================
  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // ==============================================
  // EFFECTS
  // ==============================================

  // Update current time every second for live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Recalculate earnings based on update interval
  useEffect(() => {
    if (!activeSession) {
      setEarnings(null)
      return
    }

    // Calculate immediately
    setEarnings(calculateEarnings(activeSession))

    // Set up interval to recalculate
    const interval = setInterval(() => {
      setEarnings(calculateEarnings(activeSession))
    }, updateInterval)

    return () => clearInterval(interval)
  }, [activeSession, updateInterval, currentTime])

  // ==============================================
  // RENDER
  // ==============================================

  if (!activeSession || !earnings) {
    return null
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {earnings.hasDoubleTime ? (
              <>
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <Badge variant="destructive">DOUBLE TIME</Badge>
              </>
            ) : earnings.hasOvertime ? (
              <>
                <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  OVERTIME
                </Badge>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  WORKING
                </Badge>
              </>
            )}
          </div>
          
          <Badge variant="secondary" className="text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending Approval
          </Badge>
        </div>

        {/* Project Info */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Currently working on</p>
          <p className="font-semibold text-gray-900">{activeSession.projectName}</p>
          {activeSession.scheduleProjectTitle && (
            <p className="text-sm text-gray-600">→ {activeSession.scheduleProjectTitle}</p>
          )}
        </div>

        {/* Elapsed Time */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-lg">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs text-gray-600">Time Worked</p>
            <p className="text-2xl font-bold text-gray-900 font-mono">
              {formatElapsedTime(earnings.elapsedSeconds)}
            </p>
            <p className="text-xs text-gray-500">
              {earnings.totalHours.toFixed(2)} hours total
            </p>
          </div>
        </div>

        {/* Earnings */}
        <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-300">
          <DollarSign className="w-6 h-6 text-green-700" />
          <div className="flex-1">
            <p className="text-xs text-gray-700 mb-1">Earned So Far</p>
            <p className="text-3xl font-bold text-green-700">
              ${earnings.totalEarnings.toFixed(2)}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-600 opacity-50" />
        </div>

        {/* Earnings Breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700 mb-2">Breakdown:</p>
          
          {/* Regular Pay */}
          <div className="flex items-center justify-between text-sm p-2 bg-white rounded">
            <span className="text-gray-600">
              Regular: {earnings.regularHours.toFixed(2)}h × ${activeSession.regularRate.toFixed(2)}
            </span>
            <span className="font-semibold text-gray-900">
              ${earnings.regularPay.toFixed(2)}
            </span>
          </div>

          {/* Overtime Pay */}
          {earnings.hasOvertime && (
            <div className="flex items-center justify-between text-sm p-2 bg-yellow-50 rounded border border-yellow-200">
              <span className="text-gray-700">
                Overtime: {earnings.overtimeHours.toFixed(2)}h × ${activeSession.overtimeRate.toFixed(2)}
              </span>
              <span className="font-semibold text-yellow-800">
                ${earnings.overtimePay.toFixed(2)}
              </span>
            </div>
          )}

          {/* Double Time Pay */}
          {earnings.hasDoubleTime && (
            <div className="flex items-center justify-between text-sm p-2 bg-red-50 rounded border border-red-200">
              <span className="text-gray-700">
                Double Time: {earnings.doubleTimeHours.toFixed(2)}h × ${(activeSession.doubleTimeRate || activeSession.regularRate * 2).toFixed(2)}
              </span>
              <span className="font-semibold text-red-800">
                ${earnings.doubleTimePay.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Overtime Warning */}
        {earnings.hasOvertime && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              {earnings.hasDoubleTime ? (
                <>⚠️ You've exceeded 12 hours. Double time rate is now active.</>
              ) : (
                <>⚠️ You've exceeded 8 hours. Overtime rate is now active.</>
              )}
            </p>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 Earnings will be finalized when you clock out and approved by admin
          </p>
        </div>
      </CardContent>
    </Card>
  )
}