// ==============================================
// contexts/TimeTrackingContext.tsx - Shared Time Tracking State
// ==============================================

"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useClockSession } from '@/hooks/time-tracking/use-clock-session'

// ==============================================
// TYPES
// ==============================================
interface TimeTrackingContextValue {
  // Session state
  isClocked: boolean
  currentSession: any
  sessionLoading: boolean
  
  // Refresh triggers
  refreshSession: () => Promise<void>
  refreshDashboard: () => void
  
  // Dashboard refresh counter (increments to trigger updates)
  dashboardRefreshKey: number
}

// ==============================================
// CONTEXT
// ==============================================
const TimeTrackingContext = createContext<TimeTrackingContextValue | undefined>(undefined)

// ==============================================
// PROVIDER COMPONENT
// ==============================================
export function TimeTrackingProvider({ children }: { children: React.ReactNode }) {
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0)
  
  // Use the existing clock session hook
  const {
    isClocked,
    currentSession,
    isLoading: sessionLoading,
    refreshSession: originalRefreshSession,
  } = useClockSession()

  // ==============================================
  // REFRESH SESSION - Enhanced to trigger dashboard updates
  // ==============================================
  const refreshSession = useCallback(async () => {
    await originalRefreshSession()
    // After session refreshes, trigger dashboard components to update
    setDashboardRefreshKey(prev => prev + 1)
  }, [originalRefreshSession])

  // ==============================================
  // REFRESH DASHBOARD - Trigger all dashboard components
  // ==============================================
  const refreshDashboard = useCallback(() => {
    setDashboardRefreshKey(prev => prev + 1)
  }, [])

  // ==============================================
  // CONTEXT VALUE
  // ==============================================
  const value: TimeTrackingContextValue = {
    isClocked,
    currentSession,
    sessionLoading,
    refreshSession,
    refreshDashboard,
    dashboardRefreshKey,
  }

  return (
    <TimeTrackingContext.Provider value={value}>
      {children}
    </TimeTrackingContext.Provider>
  )
}

// ==============================================
// HOOK TO USE CONTEXT
// ==============================================
export function useTimeTracking() {
  const context = useContext(TimeTrackingContext)
  
  if (context === undefined) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider')
  }
  
  return context
}

// ==============================================
// DEFAULT EXPORT
// ==============================================
export default TimeTrackingProvider