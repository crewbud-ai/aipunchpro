// ==============================================
// components/reports/payroll/PayrollReportDisplay.tsx
// Payroll Report Display Component with Tabs
// ==============================================

"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DollarSign,
  Clock,
  Users,
  Briefcase,
  TrendingUp,
  Calendar,
  ArrowUpDown,
  FileText,
  Building2,
  Code,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import type { PayrollReport } from '@/types/reports'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate, formatHours, formatPercent } from '@/utils/format-functions'

// ==============================================
// INTERFACES
// ==============================================
interface PayrollReportDisplayProps {
  report: PayrollReport
}

type SortDirection = 'asc' | 'desc'


const reportTabs = [
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'by-person', label: 'By Person', icon: Users },
  { id: 'by-project', label: 'By Project', icon: Building2 },
  { id: 'by-cost-code', label: 'By Cost Code', icon: Code },
  { id: 'overtime', label: 'Overtime', icon: TrendingUp },
]

// ==============================================
// COMPONENT
// ==============================================
export function PayrollReportDisplay({ report }: PayrollReportDisplayProps) {
  const [activeTab, setActiveTab] = useState('summary')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -150, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 150, behavior: 'smooth' })
    }
  }

  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const hasOverflow = container.scrollWidth > container.clientWidth
    setShowLeftArrow(hasOverflow && container.scrollLeft > 10)
    setShowRightArrow(
      hasOverflow && container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }

  // Setup scroll listeners
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Initial check
    setTimeout(checkScroll, 100)

    // Add listeners
    window.addEventListener('resize', checkScroll)

    return () => {
      window.removeEventListener('resize', checkScroll)
    }
  }, [])


  // ==============================================
  // SUMMARY TAB
  // ==============================================
  const renderSummaryTab = () => (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-3 xs:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6">
            <CardTitle className="text-xs xs:text-sm font-medium truncate">Total Hours</CardTitle>
            <Clock className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-blue-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 xs:px-4 sm:px-6">
            <div className="text-lg xs:text-xl sm:text-2xl font-bold truncate">{formatHours(report.summary.grandTotalHours)}</div>
            <p className="text-xs text-gray-600 mt-0.5 xs:mt-1 truncate">
              {report.summary.totalEntries} entries
            </p>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6">
            <CardTitle className="text-xs xs:text-sm font-medium truncate">Total Cost</CardTitle>
            <DollarSign className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 xs:px-4 sm:px-6">
            <div className="text-lg xs:text-xl sm:text-2xl font-bold truncate">{formatCurrency(report.summary.grandTotalCost)}</div>
            <p className="text-xs text-gray-600 mt-0.5 xs:mt-1 truncate">
              {formatCurrency(report.summary.avgCostPerHour)}/hour avg
            </p>
          </CardContent>
        </Card>

        {/* Workers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6">
            <CardTitle className="text-xs xs:text-sm font-medium truncate">Workers</CardTitle>
            <Users className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-purple-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 xs:px-4 sm:px-6">
            <div className="text-lg xs:text-xl sm:text-2xl font-bold truncate">{report.summary.totalWorkers}</div>
            <p className="text-xs text-gray-600 mt-0.5 xs:mt-1 truncate">
              {formatHours(report.summary.avgHoursPerWorker)} avg/worker
            </p>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6">
            <CardTitle className="text-xs xs:text-sm font-medium truncate">Projects</CardTitle>
            <Briefcase className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-orange-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 xs:px-4 sm:px-6">
            <div className="text-lg xs:text-xl sm:text-2xl font-bold truncate">{report.summary.totalProjects}</div>
            <p className="text-xs text-gray-600 mt-0.5 xs:mt-1 truncate">
              {report.summary.totalDays} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hours Breakdown */}
      <Card>
        <CardHeader className="px-4 xs:px-5 sm:px-6">
          <CardTitle className="text-base xs:text-lg">Hours Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="px-4 xs:px-5 sm:px-6">
          <div className="space-y-2.5 xs:space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs xs:text-sm font-medium truncate">Regular Hours</span>
              <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
                <Badge variant="outline" className="text-xs whitespace-nowrap">{formatPercent(report.summary.percentRegularHours)}</Badge>
                <span className="font-semibold text-sm xs:text-base whitespace-nowrap">{formatHours(report.summary.totalRegularHours)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs xs:text-sm font-medium truncate">Overtime Hours</span>
              <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
                <Badge variant="outline" className="text-xs whitespace-nowrap">{formatPercent(report.summary.percentOvertimeHours)}</Badge>
                <span className="font-semibold text-sm xs:text-base whitespace-nowrap">{formatHours(report.summary.totalOvertimeHours)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs xs:text-sm font-medium truncate">Double Time Hours</span>
              <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
                <Badge variant="outline" className="text-xs whitespace-nowrap">{formatPercent(report.summary.percentDoubleTimeHours)}</Badge>
                <span className="font-semibold text-sm xs:text-base whitespace-nowrap">{formatHours(report.summary.totalDoubleTimeHours)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost & Status Breakdown */}
      <div className="grid gap-3 xs:gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="px-4 xs:px-5 sm:px-6">
            <CardTitle className="text-base xs:text-lg">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="px-4 xs:px-5 sm:px-6">
            <div className="space-y-1.5 xs:space-y-2">
              <div className="flex justify-between text-xs xs:text-sm gap-2">
                <span className="truncate">Regular:</span>
                <span className="font-semibold whitespace-nowrap">{formatCurrency(report.summary.totalRegularCost)}</span>
              </div>
              <div className="flex justify-between text-xs xs:text-sm gap-2">
                <span className="truncate">Overtime:</span>
                <span className="font-semibold whitespace-nowrap">{formatCurrency(report.summary.totalOvertimeCost)}</span>
              </div>
              <div className="flex justify-between text-xs xs:text-sm gap-2">
                <span className="truncate">Double Time:</span>
                <span className="font-semibold whitespace-nowrap">{formatCurrency(report.summary.totalDoubleTimeCost)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 xs:px-5 sm:px-6">
            <CardTitle className="text-base xs:text-lg">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="px-4 xs:px-5 sm:px-6">
            <div className="space-y-1.5 xs:space-y-2">
              <div className="flex justify-between text-xs xs:text-sm gap-2">
                <span className="truncate">Pending Entries:</span>
                <span className="font-semibold whitespace-nowrap">{report.summary.pendingEntries}</span>
              </div>
              <div className="flex justify-between text-xs xs:text-sm gap-2">
                <span className="truncate">Approved Entries:</span>
                <span className="font-semibold whitespace-nowrap">{report.summary.approvedEntries}</span>
              </div>
              <div className="flex justify-between text-xs xs:text-sm gap-2">
                <span className="truncate">Pending Cost:</span>
                <span className="font-semibold text-yellow-600 whitespace-nowrap">{formatCurrency(report.summary.pendingCost)}</span>
              </div>
              <div className="flex justify-between text-xs xs:text-sm gap-2">
                <span className="truncate">Approved Cost:</span>
                <span className="font-semibold text-green-600 whitespace-nowrap">{formatCurrency(report.summary.approvedCost)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // ==============================================
  // BY PERSON TAB
  // ==============================================
  const renderByPersonTab = () => (
    <Card>
      <CardHeader className="px-4 xs:px-5 sm:px-6">
        <CardTitle className="text-base xs:text-lg">Time by Person</CardTitle>
        <CardDescription className="text-xs xs:text-sm leading-snug xs:leading-normal">
          Employee breakdown with hours and payment details
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 xs:px-5 sm:px-6">
        <div className="overflow-x-auto -mx-4 xs:-mx-5 sm:-mx-6 px-4 xs:px-5 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs xs:text-sm whitespace-nowrap">Employee</TableHead>
                <TableHead className="text-xs xs:text-sm whitespace-nowrap">Trade</TableHead>
                <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">Regular Hrs</TableHead>
                <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">OT Hrs</TableHead>
                <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">Total Hrs</TableHead>
                <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">Total Pay</TableHead>
                <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">Projects</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.byPerson.map((person) => (
                <TableRow key={person.userId}>
                  <TableCell className="min-w-[140px] xs:min-w-[160px]">
                    <div>
                      <div className="font-medium text-xs xs:text-sm truncate max-w-[120px] xs:max-w-[140px]">{person.userName}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[120px] xs:max-w-[140px]">{person.userEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[80px] xs:min-w-[100px]">
                    <Badge variant="outline" className="text-xs whitespace-nowrap">{person.tradeSpecialty || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs xs:text-sm whitespace-nowrap">{formatHours(person.regularHours)}</TableCell>
                  <TableCell className="text-right text-xs xs:text-sm whitespace-nowrap">{formatHours(person.overtimeHours)}</TableCell>
                  <TableCell className="text-right font-semibold text-xs xs:text-sm whitespace-nowrap">{formatHours(person.totalHours)}</TableCell>
                  <TableCell className="text-right font-semibold text-xs xs:text-sm whitespace-nowrap">{formatCurrency(person.totalPay)}</TableCell>
                  <TableCell className="text-right text-xs xs:text-sm whitespace-nowrap">{person.projectsWorked}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )

  // ==============================================
  // BY PROJECT TAB
  // ==============================================
  const renderByProjectTab = () => (
    <Card>
      <CardHeader className="px-4 xs:px-5 sm:px-6">
        <CardTitle className="text-base xs:text-lg">Time by Project</CardTitle>
        <CardDescription className="text-xs xs:text-sm leading-snug xs:leading-normal">
          Project breakdown with hours and cost details
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 xs:px-5 sm:px-6">
        <div className="overflow-x-auto -mx-4 xs:-mx-5 sm:-mx-6 px-4 xs:px-5 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs xs:text-sm whitespace-nowrap">Project</TableHead>
                <TableHead className="text-xs xs:text-sm whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">Total Hrs</TableHead>
                <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">Total Cost</TableHead>
                <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">Workers</TableHead>
                <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">Avg $/Hr</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.byProject.map((project) => (
                <TableRow key={project.projectId}>
                  <TableCell className="min-w-[140px] xs:min-w-[180px]">
                    <div>
                      <div className="font-medium text-xs xs:text-sm truncate max-w-[120px] xs:max-w-[160px]">{project.projectName}</div>
                      {project.projectNumber && (
                        <div className="text-xs text-gray-500 truncate max-w-[120px] xs:max-w-[160px]">{project.projectNumber}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[80px] xs:min-w-[100px]">
                    <Badge variant="outline" className="text-xs whitespace-nowrap">{project.projectStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-xs xs:text-sm whitespace-nowrap">{formatHours(project.totalHours)}</TableCell>
                  <TableCell className="text-right font-semibold text-xs xs:text-sm whitespace-nowrap">{formatCurrency(project.totalCost)}</TableCell>
                  <TableCell className="text-right text-xs xs:text-sm whitespace-nowrap">{project.workersCount}</TableCell>
                  <TableCell className="text-right text-xs xs:text-sm whitespace-nowrap">{formatCurrency(project.avgCostPerHour)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )

  // ==============================================
  // BY COST CODE TAB
  // ==============================================
  const renderByCostCodeTab = () => (
    <Card>
      <CardHeader className="px-4 xs:px-5 sm:px-6">
        <CardTitle className="text-base xs:text-lg">Time by Cost Code</CardTitle>
        <CardDescription className="text-xs xs:text-sm leading-snug xs:leading-normal">
          Breakdown by trade and work type
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 xs:px-5 sm:px-6">
        <div className="overflow-x-auto -mx-4 xs:-mx-5 sm:-mx-6 px-4 xs:px-5 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs xs:text-sm whitespace-nowrap">Cost Code</TableHead>
                <TableHead className="text-xs xs:text-sm whitespace-nowrap">Type</TableHead>
                <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">Total Hrs</TableHead>
                <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">Total Cost</TableHead>
                <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">% of Total</TableHead>
                <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">Workers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.byCostCode.map((code, index) => (
                <TableRow key={`${code.costCode}-${index}`}>
                  <TableCell className="font-medium text-xs xs:text-sm min-w-[100px] xs:min-w-[120px]">
                    <div className="truncate max-w-[90px] xs:max-w-[110px]">{code.costCodeLabel}</div>
                  </TableCell>
                  <TableCell className="min-w-[90px] xs:min-w-[110px]">
                    <Badge
                      variant={code.costCodeType === 'trade' ? 'default' : 'secondary'}
                      className="text-xs whitespace-nowrap"
                    >
                      {code.costCodeType === 'trade' ? 'Trade' : 'Work Type'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-xs xs:text-sm whitespace-nowrap">{formatHours(code.totalHours)}</TableCell>
                  <TableCell className="text-right font-semibold text-xs xs:text-sm whitespace-nowrap">{formatCurrency(code.totalCost)}</TableCell>
                  <TableCell className="text-right text-xs xs:text-sm whitespace-nowrap">{formatPercent(code.percentOfTotal)}</TableCell>
                  <TableCell className="text-right text-xs xs:text-sm whitespace-nowrap">{code.workersCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )

  // ==============================================
  // OVERTIME TAB
  // ==============================================
  const renderOvertimeTab = () => (
    <Card>
      <CardHeader className="px-4 xs:px-5 sm:px-6">
        <CardTitle className="text-base xs:text-lg">Overtime Summary</CardTitle>
        <CardDescription className="text-xs xs:text-sm leading-snug xs:leading-normal">
          Employees with overtime and double time hours
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 xs:px-5 sm:px-6">
        {report.overtimeSummary.length === 0 ? (
          <div className="text-center py-6 xs:py-8 text-gray-500">
            <TrendingUp className="h-10 w-10 xs:h-12 xs:w-12 mx-auto mb-2 text-gray-400 flex-shrink-0" />
            <p className="text-xs xs:text-sm sm:text-base">No overtime recorded for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 xs:-mx-5 sm:-mx-6 px-4 xs:px-5 sm:px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs xs:text-sm whitespace-nowrap">Employee</TableHead>
                  <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">OT Hours</TableHead>
                  <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">DT Hours</TableHead>
                  <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">Total OT</TableHead>
                  <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">OT Pay</TableHead>
                  <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">% OT</TableHead>
                  <TableHead className="text-right text-xs xs:text-sm whitespace-nowrap">Days with OT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.overtimeSummary.map((ot) => (
                  <TableRow key={ot.userId}>
                    <TableCell className="min-w-[140px] xs:min-w-[160px]">
                      <div>
                        <div className="font-medium text-xs xs:text-sm truncate max-w-[120px] xs:max-w-[140px]">{ot.userName}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[120px] xs:max-w-[140px]">{ot.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs xs:text-sm whitespace-nowrap">{formatHours(ot.overtimeHours)}</TableCell>
                    <TableCell className="text-right text-xs xs:text-sm whitespace-nowrap">{formatHours(ot.doubleTimeHours)}</TableCell>
                    <TableCell className="text-right font-semibold text-xs xs:text-sm whitespace-nowrap">{formatHours(ot.totalOTHours)}</TableCell>
                    <TableCell className="text-right font-semibold text-xs xs:text-sm whitespace-nowrap">{formatCurrency(ot.totalOTPay)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="text-xs whitespace-nowrap">{formatPercent(ot.percentOT)}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs xs:text-sm whitespace-nowrap">{ot.daysWithOT}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // ==============================================
  // MAIN RENDER
  // ==============================================
  return (
    <div className="space-y-3 xs:space-y-4 sm:space-y-4">
      {/* Report Info */}
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0 text-xs xs:text-sm text-gray-600 px-2 xs:px-0">
        <div className="flex items-center gap-1.5 xs:gap-2">
          <Calendar className="h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
          <span className="truncate">
            {formatDate(report.summary.startDate)} - {formatDate(report.summary.endDate)}
          </span>
        </div>
        <span className="text-xs truncate">Generated: {new Date(report.generatedAt).toLocaleString()}</span>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 xs:space-y-4">
        {/* Mobile: Scrollable tabs with arrows */}
        <div className="lg:hidden relative px-10">
          <TabsList
            ref={scrollContainerRef}
            className={cn(
              "flex w-full justify-start h-auto bg-transparent border-0 p-0",
              "overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2 gap-2"
            )}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            onScroll={checkScroll}
          >
            {reportTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "flex items-center justify-center gap-1.5 min-w-[110px] xs:min-w-[120px] snap-start",
                  "text-xs font-medium py-2 px-2.5 xs:px-3 rounded-lg transition-all duration-200 shrink-0",
                  // Default state
                  "bg-white border border-gray-200",
                  "text-gray-600 shadow-sm",
                  "hover:border-gray-300",
                  // Active state - Subtle orange
                  "data-[state=active]:bg-orange-50 data-[state=active]:border-orange-500",
                  "data-[state=active]:text-orange-700",
                  "data-[state=active]:shadow-md"
                )}
              >
                <tab.icon className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Left Arrow - Only show if can scroll left */}
          {showLeftArrow && (
            <button
              type="button"
              onClick={scrollLeft}
              className={cn(
                "absolute left-0 top-0 z-20",
                "bg-white border border-gray-300 rounded-full shadow-lg",
                "w-8 h-8 flex items-center justify-center",
                "hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all"
              )}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4 text-gray-700" />
            </button>
          )}

          {/* Right Arrow - Only show if can scroll right */}
          {showRightArrow && (
            <button
              type="button"
              onClick={scrollRight}
              className={cn(
                "absolute right-0 top-0 z-20",
                "bg-white border border-gray-300 rounded-full shadow-lg",
                "w-8 h-8 flex items-center justify-center",
                "hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all"
              )}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4 text-gray-700" />
            </button>
          )}

          {/* Fade indicators on edges */}
          <div className="absolute top-0 left-8 bottom-2 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-8 bottom-2 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
        </div>

        {/* Desktop: Grid layout */}
        <TabsList
          className={cn(
            "hidden lg:grid w-full h-auto bg-gray-50 border border-gray-200 shadow-sm",
            "lg:grid-cols-5",
            "gap-1.5 p-2 rounded-lg"
          )}
        >
          {reportTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex items-center justify-center gap-2",
                "text-sm font-medium py-2.5 px-3 rounded-md transition-all duration-200",
                // Default state
                "bg-white text-gray-600 border border-transparent",
                "hover:text-gray-900 hover:shadow-sm",
                // Active state - Subtle orange
                "data-[state=active]:bg-orange-50",
                "data-[state=active]:text-orange-700",
                "data-[state=active]:border-orange-500",
                "data-[state=active]:shadow-sm"
              )}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="summary" className="space-y-4 xs:space-y-5 sm:space-y-6">
          {renderSummaryTab()}
        </TabsContent>

        <TabsContent value="by-person" className="space-y-4 xs:space-y-5 sm:space-y-6">
          {renderByPersonTab()}
        </TabsContent>

        <TabsContent value="by-project" className="space-y-4 xs:space-y-5 sm:space-y-6">
          {renderByProjectTab()}
        </TabsContent>

        <TabsContent value="by-cost-code" className="space-y-4 xs:space-y-5 sm:space-y-6">
          {renderByCostCodeTab()}
        </TabsContent>

        <TabsContent value="overtime" className="space-y-4 xs:space-y-5 sm:space-y-6">
          {renderOvertimeTab()}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PayrollReportDisplay