// ==============================================
// hooks/dashboard/use-admin-dashboard.ts
// FIX: All TypeScript Type Issues Resolved
// ==============================================

import { useState, useCallback, useEffect, useMemo } from 'react'
import type { DashboardStats, DashboardState } from '@/types/dashboard'

// Import existing hooks following project patterns
import { useProjects, useProjectStats } from '@/hooks/projects'
import { useTeamMembers, useTeamMemberStats } from '@/hooks/team-members'
import { useTimeEntries } from '@/hooks/time-tracking'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseAdminDashboardReturn {
  // Stats
  stats: DashboardStats | null
  
  // State
  state: DashboardState
  isLoading: boolean
  hasError: boolean
  error: string | null
  
  // Actions
  refreshDashboard: () => Promise<void>
  clearError: () => void
}

// ==============================================
// MAIN HOOK
// ==============================================
export function useAdminDashboard(): UseAdminDashboardReturn {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<DashboardState>('loading')
  const [error, setError] = useState<string | null>(null)

  // ==============================================
  // USE EXISTING HOOKS (following project patterns)
  // ==============================================
  const { 
    projects, 
    isLoading: projectsLoading,
    refreshProjects 
  } = useProjects()
  
  const { 
    stats: projectStats, 
    isLoading: projectStatsLoading,
    refreshStats: refreshProjectStats 
  } = useProjectStats()
  
  const { 
    teamMembers, 
    isLoading: teamLoading,
    refreshTeamMembers 
  } = useTeamMembers()
  
  const { 
    stats: teamStats, 
    isLoading: teamStatsLoading 
  } = useTeamMemberStats()
  
  const { 
    timeEntries, 
    isLoading: timeEntriesLoading,
    timeEntryStats,
    refreshTimeEntries 
  } = useTimeEntries()

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const isLoading = useMemo(() => {
    return projectsLoading || projectStatsLoading || teamLoading || teamStatsLoading || timeEntriesLoading
  }, [projectsLoading, projectStatsLoading, teamLoading, teamStatsLoading, timeEntriesLoading])

  const hasError = state === 'error'

  // ==============================================
  // CALCULATE COMPREHENSIVE DASHBOARD STATS
  // ==============================================
  const stats = useMemo<DashboardStats | null>(() => {
    if (isLoading) return null

    try {
      // Projects stats
      const totalProjects = projects.length
      const activeProjects = projects.filter(p => 
        p.status === 'in_progress' || p.status === 'on_track'
      ).length
      const completedProjects = projects.filter(p => p.status === 'completed').length
      
      // FIXED: Use 'behind_schedule' which exists in the type
      const delayedProjects = projects.filter(p => 
        p.status === 'behind_schedule'
      ).length
      
      const onHoldProjects = projects.filter(p => p.status === 'on_hold').length

      // Team stats
      const totalMembers = teamMembers.length
      
      // FIXED: Use 'isActive' property which exists in TeamMemberSummary
      const activeMembers = teamMembers.filter(m => m.isActive === true).length
      
      const assignedMembers = teamMembers.filter(m => m.assignmentStatus === 'assigned').length
      
      // FIXED: Use 'not_assigned' which exists in assignmentStatus type
      const availableMembers = teamMembers.filter(m => m.assignmentStatus === 'not_assigned').length

      // Time & Payroll stats
      const pendingApprovals = timeEntries.filter(e => 
        e.status === 'pending' || e.status === 'clocked_out'
      ).length
      
      const totalHoursThisWeek = timeEntryStats.weekHours || 0
      const totalHoursToday = timeEntryStats.todayHours || 0
      
      // Calculate payroll amounts
      const totalPayrollPending = timeEntries
        .filter(e => e.status === 'pending' || e.status === 'clocked_out')
        .reduce((sum, entry) => sum + (entry.totalPay ?? 0), 0)
      
      const totalPayrollApproved = timeEntries
        .filter(e => e.status === 'approved')
        .reduce((sum, entry) => sum + (entry.totalPay ?? 0), 0)
      
      const totalPayrollThisWeek = timeEntries
        .filter(e => {
          const entryDate = new Date(e.date)
          const weekStart = new Date()
          weekStart.setDate(weekStart.getDate() - weekStart.getDay())
          return entryDate >= weekStart
        })
        .reduce((sum, entry) => sum + (entry.totalPay ?? 0), 0)

      // FIXED: Budget calculations - Use correct property names from projectStats
      const totalBudget = projectStats?.totalBudget ?? 0
      const totalSpent = projectStats?.totalSpent ?? 0
      
      // FIXED: Calculate budget utilization INCLUDING approved payroll (labor costs)
      const totalSpentWithLabor = totalSpent + totalPayrollApproved
      const budgetUtilization = totalBudget > 0 ? ((totalSpentWithLabor / totalBudget) * 100) : 0

      // Active sessions
      const activeSessions = timeEntries.filter(e => e.status === 'clocked_in').length

      return {
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          delayed: delayedProjects,
          onHold: onHoldProjects,
          completionRate: totalProjects > 0 ? ((completedProjects / totalProjects) * 100) : 0
        },
        team: {
          total: totalMembers,
          active: activeMembers,
          assigned: assignedMembers,
          available: availableMembers,
          utilizationRate: totalMembers > 0 ? ((assignedMembers / totalMembers) * 100) : 0
        },
        time: {
          todayHours: totalHoursToday,
          weekHours: totalHoursThisWeek,
          activeSessions: activeSessions,
          pendingApprovals: pendingApprovals
        },
        payroll: {
          pending: totalPayrollPending,
          approved: totalPayrollApproved,
          weekTotal: totalPayrollThisWeek,
          totalPaid: totalPayrollApproved + totalPayrollPending
        },
        budget: {
          total: totalBudget,
          spent: totalSpent,
          remaining: totalBudget - totalSpentWithLabor, // FIXED: Include labor in remaining
          utilizationPercent: budgetUtilization // FIXED: Now includes labor costs
        }
      }
    } catch (err) {
      console.error('Error calculating dashboard stats:', err)
      setError('Failed to calculate dashboard statistics')
      setState('error')
      return null
    }
  }, [projects, teamMembers, timeEntries, projectStats, timeEntryStats, isLoading])

  // ==============================================
  // ACTIONS
  // ==============================================
  const refreshDashboard = useCallback(async () => {
    try {
      setState('loading')
      setError(null)

      // Refresh all data sources
      await Promise.all([
        refreshProjects(),
        refreshProjectStats(),
        refreshTeamMembers(),
        refreshTimeEntries()
      ])

      setState('loaded')
    } catch (err) {
      console.error('Error refreshing dashboard:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh dashboard')
      setState('error')
    }
  }, [refreshProjects, refreshProjectStats, refreshTeamMembers, refreshTimeEntries])

  const clearError = useCallback(() => {
    setError(null)
    if (state === 'error') {
      setState('loaded')
    }
  }, [state])

  // ==============================================
  // EFFECTS
  // ==============================================
  useEffect(() => {
    if (!isLoading && stats !== null) {
      setState('loaded')
    }
  }, [isLoading, stats])

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    stats,
    state,
    isLoading,
    hasError,
    error,
    refreshDashboard,
    clearError
  }
}

// ==============================================
// EXPORT DEFAULT
// ==============================================
export default useAdminDashboard