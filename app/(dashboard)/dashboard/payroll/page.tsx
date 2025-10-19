// ==============================================
// app/(dashboard)/dashboard/payroll/page.tsx
// Admin Payroll - Review & Approve Team Member Work
// ==============================================

"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  Download,
  Play,
  Check,
  X,
  Eye,
  Filter,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useTimeEntries } from '@/hooks/time-tracking'
import { TimeEntryDetailsDialog } from '@/components/time-tracking/TimeEntryDetailsDialog'
import { TimeEntriesApi } from '@/lib/api/time-entries'
import type { TimeEntrySummary } from '@/types/time-tracking'
import { Alert, AlertDescription } from "@/components/ui/alert"

import { payrollReportsApi } from '@/lib/api/payroll'
import { FileSpreadsheet } from "lucide-react"
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/format-functions'

export default function PayrollPage() {
  // ==============================================
  // STATE & HOOKS
  // ==============================================
  const { timeEntries, isLoading, refreshTimeEntries } = useTimeEntries()

  const [selectedEntry, setSelectedEntry] = useState<TimeEntrySummary | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all')
  const [isApproving, setIsApproving] = useState<string | null>(null)
  const [isRejecting, setIsRejecting] = useState<string | null>(null)
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)

  // ==============================================
  // FILTER & GROUP TIME ENTRIES BY EMPLOYEE
  // ==============================================
  const filteredEntries = useMemo(() => {
    if (filterStatus === 'all') return timeEntries
    if (filterStatus === 'pending') {
      return timeEntries.filter(e => e.status === 'pending' || e.status === 'clocked_out')
    }
    return timeEntries.filter(e => e.status === 'approved')
  }, [timeEntries, filterStatus])

  // Group entries by user and calculate totals
  const employeePayrollData = useMemo(() => {
    const grouped = new Map<string, {
      userId: string
      workerName: string
      workerEmail: string
      entries: TimeEntrySummary[]
      totalHours: number
      regularHours: number
      overtimeHours: number
      doubleTimeHours: number
      totalPay: number
      pendingCount: number
      approvedCount: number
      avgRate: number
    }>()

    filteredEntries.forEach(entry => {
      const key = entry.userId
      if (!grouped.has(key)) {
        // Extract worker name from nested worker object
        const worker = (entry as any).worker
        const firstName = worker?.firstName || ''
        const lastName = worker?.lastName || ''
        const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Worker'
        const email = worker?.email || ''

        grouped.set(key, {
          userId: entry.userId,
          workerName: fullName,
          workerEmail: email,
          entries: [],
          totalHours: 0,
          regularHours: 0,
          overtimeHours: 0,
          doubleTimeHours: 0,
          totalPay: 0,
          pendingCount: 0,
          approvedCount: 0,
          avgRate: 0
        })
      }

      const employee = grouped.get(key)!
      employee.entries.push(entry)
      employee.totalHours += entry.totalHours ?? 0
      employee.regularHours += entry.regularHours ?? 0
      employee.overtimeHours += entry.overtimeHours ?? 0
      employee.doubleTimeHours += entry.doubleTimeHours ?? 0
      employee.totalPay += entry.totalPay ?? 0

      if (entry.status === 'pending' || entry.status === 'clocked_out') {
        employee.pendingCount++
      } else if (entry.status === 'approved') {
        employee.approvedCount++
      }
    })

    // Calculate average rate for each employee
    grouped.forEach(employee => {
      const rateSum = employee.entries.reduce((sum, e) => sum + (e.regularRate ?? 0), 0)
      employee.avgRate = employee.entries.length > 0 ? rateSum / employee.entries.length : 0
    })

    return Array.from(grouped.values()).sort((a, b) => b.totalPay - a.totalPay)
  }, [filteredEntries])


  // ==============================================
  // QUICK EXPORT HANDLER
  // ==============================================
  const handleQuickExport = async () => {
    setIsExporting(true)

    try {
      // Calculate date range for current period (this month)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const filters = {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
        status: filterStatus === 'all' ? undefined : filterStatus,
        includeNotes: true,
        includeDetailedEntries: true
      }

      await payrollReportsApi.exportPayrollCSV(filters, 'payroll-export-current-period')

      toast({
        title: "Export Successful",
        description: "Payroll data has been exported to CSV.",
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export payroll data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // ==============================================
  // CALCULATE SUMMARY STATS
  // ==============================================
  const stats = useMemo(() => {
    const totalGrossPay = employeePayrollData.reduce((sum, emp) => sum + emp.totalPay, 0)
    const totalHours = employeePayrollData.reduce((sum, emp) => sum + emp.totalHours, 0)
    const totalPending = timeEntries.filter(e => e.status === 'pending' || e.status === 'clocked_out').length
    const totalEmployees = employeePayrollData.length

    return {
      totalGrossPay: totalGrossPay.toFixed(2),
      totalHours: totalHours.toFixed(1),
      pendingApprovals: totalPending,
      totalEmployees
    }
  }, [employeePayrollData, timeEntries])

  // ==============================================
  // HANDLERS
  // ==============================================
  const handleApproveEntry = async (entryId: string) => {
    setIsApproving(entryId)
    try {
      await TimeEntriesApi.approveTimeEntry(entryId)
      await refreshTimeEntries()
    } catch (error) {
      console.error('Failed to approve entry:', error)
    } finally {
      setIsApproving(null)
    }
  }

  const handleRejectEntry = async (entryId: string) => {
    // TODO: Add a proper rejection dialog modal
    const reason = prompt('Enter reason for rejection:')
    if (!reason || reason.trim().length === 0) {
      return
    }

    setIsRejecting(entryId)
    try {
      await TimeEntriesApi.rejectTimeEntry(entryId, reason)
      await refreshTimeEntries()
    } catch (error) {
      console.error('Failed to reject entry:', error)
    } finally {
      setIsRejecting(null)
    }
  }

  const handleViewDetails = (entry: TimeEntrySummary) => {
    setSelectedEntry(entry)
    setIsDetailOpen(true)
  }

  const toggleEmployeeExpanded = (userId: string) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const expandAll = () => {
    const allIds = employeePayrollData.map(emp => emp.userId)
    setExpandedEmployees(new Set(allIds))
  }

  const collapseAll = () => {
    setExpandedEmployees(new Set())
  }

  // ==============================================
  // LOADING STATE
  // ==============================================
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl">
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-3 xs:gap-4 px-2 xs:px-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl xs:text-3xl font-bold text-gray-900 truncate">Payroll Management</h1>
              <p className="text-xs xs:text-sm sm:text-base text-gray-600 mt-0.5 xs:mt-1 leading-snug">Review and approve employee timesheets</p>
            </div>
            <div className="flex gap-1.5 xs:gap-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={handleQuickExport}
                disabled={isExporting || timeEntries.length === 0}
                className="h-9 xs:h-10 text-sm xs:text-base flex-1 xs:flex-none"
              >
                {isExporting ? (
                  <>
                    <Loader className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Exporting...</span>
                    <span className="xs:hidden">Export...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Export CSV</span>
                    <span className="xs:hidden">Export</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-3 xs:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6">
                <CardTitle className="text-xs xs:text-sm font-medium truncate">Total Gross Pay</CardTitle>
                <DollarSign className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-green-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 xs:px-4 sm:px-6">
                <div className="text-lg xs:text-xl sm:text-2xl font-bold truncate">${stats.totalGrossPay}</div>
                <p className="text-xs text-gray-600 truncate">Current period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6">
                <CardTitle className="text-xs xs:text-sm font-medium truncate">Total Hours</CardTitle>
                <Clock className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-blue-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 xs:px-4 sm:px-6">
                <div className="text-lg xs:text-xl sm:text-2xl font-bold truncate">{stats.totalHours}h</div>
                <p className="text-xs text-gray-600 truncate">Hours worked</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6">
                <CardTitle className="text-xs xs:text-sm font-medium truncate">Pending Approvals</CardTitle>
                <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-yellow-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 xs:px-4 sm:px-6">
                <div className="text-lg xs:text-xl sm:text-2xl font-bold truncate">{stats.pendingApprovals}</div>
                <p className="text-xs text-gray-600 truncate">Require review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6">
                <CardTitle className="text-xs xs:text-sm font-medium truncate">Active Employees</CardTitle>
                <Users className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-purple-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 xs:px-4 sm:px-6">
                <div className="text-lg xs:text-xl sm:text-2xl font-bold truncate">{stats.totalEmployees}</div>
                <p className="text-xs text-gray-600 truncate">Team members</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-4 xs:pt-5 sm:pt-6 px-4 xs:px-5 sm:px-6">
              <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3">
                <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
                  <Filter className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-xs xs:text-sm font-medium text-gray-700">Filter:</span>
                </div>
                <div className="flex gap-1.5 xs:gap-2 flex-wrap">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                    className="h-8 xs:h-9 text-xs xs:text-sm"
                  >
                    All Entries
                  </Button>
                  <Button
                    variant={filterStatus === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('pending')}
                    className="h-8 xs:h-9 text-xs xs:text-sm"
                  >
                    Pending ({timeEntries.filter(e => e.status === 'pending' || e.status === 'clocked_out').length})
                  </Button>
                  <Button
                    variant={filterStatus === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('approved')}
                    className="h-8 xs:h-9 text-xs xs:text-sm"
                  >
                    Approved ({timeEntries.filter(e => e.status === 'approved').length})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alert for Pending Items */}
          {stats.pendingApprovals > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              <AlertDescription className="text-yellow-800 text-xs xs:text-sm leading-snug">
                You have <strong>{stats.pendingApprovals} time entries</strong> waiting for approval. Review and approve them to process payroll.
              </AlertDescription>
            </Alert>
          )}

          {/* Employee Payroll Table */}
          <Card>
            <CardHeader className="px-4 xs:px-5 sm:px-6">
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base xs:text-lg truncate">Employee Payroll Summary</CardTitle>
                  <CardDescription className="text-xs xs:text-sm leading-snug xs:leading-normal">
                    Click on employee cards to expand and view individual entries
                  </CardDescription>
                </div>
                <div className="flex gap-1.5 xs:gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={expandAll}
                    className="h-8 xs:h-9 text-xs xs:text-sm flex-1 xs:flex-none"
                  >
                    <span className="hidden xs:inline">Expand All</span>
                    <span className="xs:hidden">Expand</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={collapseAll}
                    className="h-8 xs:h-9 text-xs xs:text-sm flex-1 xs:flex-none"
                  >
                    <span className="hidden xs:inline">Collapse All</span>
                    <span className="xs:hidden">Collapse</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 xs:px-5 sm:px-6">
              {employeePayrollData.length === 0 ? (
                <div className="text-center py-8 xs:py-10 sm:py-12 text-gray-500">
                  <Users className="h-10 w-10 xs:h-12 xs:w-12 mx-auto mb-2 xs:mb-3 opacity-50 flex-shrink-0" />
                  <p className="font-medium text-sm xs:text-base">No time entries found</p>
                  <p className="text-xs xs:text-sm mt-0.5 xs:mt-1">No data matches your current filter</p>
                </div>
              ) : (
                <div className="space-y-3 xs:space-y-4">
                  {employeePayrollData.map((employee) => {
                    const isExpanded = expandedEmployees.has(employee.userId)

                    return (
                      <Card key={employee.userId} className="border-2">
                        <CardHeader
                          className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6"
                          onClick={() => toggleEmployeeExpanded(employee.userId)}
                        >
                          <div className="flex flex-col xs:flex-row xs:items-center gap-3 xs:gap-0 xs:justify-between">
                            <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 xs:w-10 xs:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm xs:text-base flex-shrink-0">
                                {employee.workerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 xs:gap-2">
                                  <CardTitle className="text-sm xs:text-base truncate">{employee.workerName}</CardTitle>
                                  {isExpanded ? (
                                    <ChevronUp className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-500 flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-500 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs xs:text-sm text-gray-600 truncate">
                                  {employee.entries.length} {employee.entries.length === 1 ? 'entry' : 'entries'}
                                </p>
                                {employee.workerEmail && (
                                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                                    {employee.workerEmail}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 xs:gap-4 flex-shrink-0">
                              <div className="text-right">
                                <p className="text-xl xs:text-2xl font-bold text-green-700">
                                  ${employee.totalPay.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {employee.totalHours.toFixed(1)}h total
                                </p>
                              </div>
                              {employee.pendingCount > 0 && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300 text-xs whitespace-nowrap">
                                  {employee.pendingCount} Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        {isExpanded && (
                          <div className="animate-in slide-in-from-top-2 duration-300">
                            <CardContent className="px-3 xs:px-4 sm:px-6">
                              {/* Hours Breakdown */}
                              <div className="grid grid-cols-3 gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4 p-2.5 xs:p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="text-xs text-gray-600">Regular</p>
                                  <p className="text-xs xs:text-sm font-semibold">
                                    {employee.regularHours.toFixed(1)}h
                                  </p>
                                </div>
                                {employee.overtimeHours > 0 && (
                                  <div>
                                    <p className="text-xs text-yellow-700">Overtime</p>
                                    <p className="text-xs xs:text-sm font-semibold text-yellow-800">
                                      {employee.overtimeHours.toFixed(1)}h
                                    </p>
                                  </div>
                                )}
                                {employee.doubleTimeHours > 0 && (
                                  <div>
                                    <p className="text-xs text-red-700">Double Time</p>
                                    <p className="text-xs xs:text-sm font-semibold text-red-800">
                                      {employee.doubleTimeHours.toFixed(1)}h
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Individual Entries Table */}
                              <div className="overflow-x-auto -mx-3 xs:-mx-4 sm:-mx-6 px-3 xs:px-4 sm:px-6">
                                <table className="w-full text-xs xs:text-sm">
                                  <thead className="border-b bg-gray-50">
                                    <tr>
                                      <th className="text-left p-1.5 xs:p-2 font-medium whitespace-nowrap">Date</th>
                                      <th className="text-left p-1.5 xs:p-2 font-medium whitespace-nowrap">Project</th>
                                      <th className="text-left p-1.5 xs:p-2 font-medium whitespace-nowrap">Hours</th>
                                      <th className="text-left p-1.5 xs:p-2 font-medium whitespace-nowrap">Amount</th>
                                      <th className="text-left p-1.5 xs:p-2 font-medium whitespace-nowrap">Status</th>
                                      <th className="text-center p-1.5 xs:p-2 font-medium whitespace-nowrap">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {employee.entries.map((entry) => (
                                      <tr key={entry.id} className="border-b hover:bg-gray-50">
                                        <td className="p-1.5 xs:p-2 whitespace-nowrap">{formatDate(entry.date)}</td>
                                        <td className="p-1.5 xs:p-2 min-w-[100px] xs:min-w-[120px]">
                                          <div className="text-xs xs:text-sm truncate max-w-[90px] xs:max-w-[110px]">
                                            {(entry as any).project?.name || 'Unknown'}
                                          </div>
                                        </td>
                                        <td className="p-1.5 xs:p-2 whitespace-nowrap">
                                          <div>
                                            <p className="font-medium">{(entry.totalHours ?? 0).toFixed(1)}h</p>
                                            {(entry.overtimeHours ?? 0) > 0 && (
                                              <p className="text-xs text-yellow-600">
                                                +{entry.overtimeHours!.toFixed(1)}h OT
                                              </p>
                                            )}
                                          </div>
                                        </td>
                                        <td className="p-1.5 xs:p-2 whitespace-nowrap">
                                          <p className="font-semibold text-green-700">
                                            ${(entry.totalPay ?? 0).toFixed(2)}
                                          </p>
                                        </td>
                                        <td className="p-1.5 xs:p-2 whitespace-nowrap">
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              "text-xs",
                                              entry.status === 'approved'
                                                ? 'bg-green-100 text-green-800 border-green-300'
                                                : entry.status === 'rejected'
                                                  ? 'bg-red-100 text-red-800 border-red-300'
                                                  : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                            )}
                                          >
                                            {entry.status === 'clocked_out' ? 'Pending' : entry.status}
                                          </Badge>
                                        </td>
                                        <td className="p-1.5 xs:p-2">
                                          <div className="flex items-center justify-center gap-0.5 xs:gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleViewDetails(entry)
                                              }}
                                              className="h-7 xs:h-8 w-7 xs:w-8 p-0"
                                            >
                                              <Eye className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                                            </Button>
                                            {(entry.status === 'pending' || entry.status === 'clocked_out') && (
                                              <>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 h-7 xs:h-8 w-7 xs:w-8 p-0"
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleApproveEntry(entry.id)
                                                  }}
                                                  disabled={isApproving === entry.id}
                                                >
                                                  {isApproving === entry.id ? (
                                                    <div className="h-3.5 w-3.5 xs:h-4 xs:w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                                  ) : (
                                                    <Check className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                                                  )}
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 xs:h-8 w-7 xs:w-8 p-0"
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleRejectEntry(entry.id)
                                                  }}
                                                  disabled={isRejecting === entry.id}
                                                >
                                                  {isRejecting === entry.id ? (
                                                    <div className="h-3.5 w-3.5 xs:h-4 xs:w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                  ) : (
                                                    <X className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                                                  )}
                                                </Button>
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </CardContent>
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details Dialog */}
          <TimeEntryDetailsDialog
            isOpen={isDetailOpen}
            onClose={() => {
              setIsDetailOpen(false)
              setSelectedEntry(null)
            }}
            entry={selectedEntry}
          />
        </div>
      </div>
    </div>
  )
}