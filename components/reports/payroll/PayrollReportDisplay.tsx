// ==============================================
// components/reports/payroll/PayrollReportDisplay.tsx
// Payroll Report Display Component with Tabs
// ==============================================

"use client"

import React, { useState } from 'react'
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
  ArrowUpDown
} from "lucide-react"
import type { PayrollReport } from '@/types/reports'

// ==============================================
// INTERFACES
// ==============================================
interface PayrollReportDisplayProps {
  report: PayrollReport
}

type SortDirection = 'asc' | 'desc'

// ==============================================
// COMPONENT
// ==============================================
export function PayrollReportDisplay({ report }: PayrollReportDisplayProps) {
  const [activeTab, setActiveTab] = useState('summary')

  // ==============================================
  // FORMAT HELPERS
  // ==============================================
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatHours = (hours: number) => {
    return hours.toFixed(2) + 'h'
  }

  const formatPercent = (percent: number) => {
    return percent.toFixed(2) + '%'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // ==============================================
  // SUMMARY TAB
  // ==============================================
  const renderSummaryTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(report.summary.grandTotalHours)}</div>
            <p className="text-xs text-gray-600 mt-1">
              {report.summary.totalEntries} entries
            </p>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(report.summary.grandTotalCost)}</div>
            <p className="text-xs text-gray-600 mt-1">
              {formatCurrency(report.summary.avgCostPerHour)}/hour avg
            </p>
          </CardContent>
        </Card>

        {/* Workers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workers</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.totalWorkers}</div>
            <p className="text-xs text-gray-600 mt-1">
              {formatHours(report.summary.avgHoursPerWorker)} avg/worker
            </p>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.totalProjects}</div>
            <p className="text-xs text-gray-600 mt-1">
              {report.summary.totalDays} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hours Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Hours Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Regular Hours</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{formatPercent(report.summary.percentRegularHours)}</Badge>
                <span className="font-semibold">{formatHours(report.summary.totalRegularHours)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overtime Hours</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{formatPercent(report.summary.percentOvertimeHours)}</Badge>
                <span className="font-semibold">{formatHours(report.summary.totalOvertimeHours)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Double Time Hours</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{formatPercent(report.summary.percentDoubleTimeHours)}</Badge>
                <span className="font-semibold">{formatHours(report.summary.totalDoubleTimeHours)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost & Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Regular:</span>
                <span className="font-semibold">{formatCurrency(report.summary.totalRegularCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Overtime:</span>
                <span className="font-semibold">{formatCurrency(report.summary.totalOvertimeCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Double Time:</span>
                <span className="font-semibold">{formatCurrency(report.summary.totalDoubleTimeCost)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pending Entries:</span>
                <span className="font-semibold">{report.summary.pendingEntries}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Approved Entries:</span>
                <span className="font-semibold">{report.summary.approvedEntries}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pending Cost:</span>
                <span className="font-semibold text-yellow-600">{formatCurrency(report.summary.pendingCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Approved Cost:</span>
                <span className="font-semibold text-green-600">{formatCurrency(report.summary.approvedCost)}</span>
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
      <CardHeader>
        <CardTitle>Time by Person</CardTitle>
        <CardDescription>
          Employee breakdown with hours and payment details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Trade</TableHead>
                <TableHead className="text-right">Regular Hrs</TableHead>
                <TableHead className="text-right">OT Hrs</TableHead>
                <TableHead className="text-right">Total Hrs</TableHead>
                <TableHead className="text-right">Total Pay</TableHead>
                <TableHead className="text-right">Projects</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.byPerson.map((person) => (
                <TableRow key={person.userId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{person.userName}</div>
                      <div className="text-xs text-gray-500">{person.userEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{person.tradeSpecialty || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatHours(person.regularHours)}</TableCell>
                  <TableCell className="text-right">{formatHours(person.overtimeHours)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatHours(person.totalHours)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(person.totalPay)}</TableCell>
                  <TableCell className="text-right">{person.projectsWorked}</TableCell>
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
      <CardHeader>
        <CardTitle>Time by Project</CardTitle>
        <CardDescription>
          Project breakdown with hours and cost details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Hrs</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Workers</TableHead>
                <TableHead className="text-right">Avg $/Hr</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.byProject.map((project) => (
                <TableRow key={project.projectId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{project.projectName}</div>
                      {project.projectNumber && (
                        <div className="text-xs text-gray-500">{project.projectNumber}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{project.projectStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatHours(project.totalHours)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(project.totalCost)}</TableCell>
                  <TableCell className="text-right">{project.workersCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(project.avgCostPerHour)}</TableCell>
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
      <CardHeader>
        <CardTitle>Time by Cost Code</CardTitle>
        <CardDescription>
          Breakdown by trade and work type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cost Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total Hrs</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
                <TableHead className="text-right">Workers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.byCostCode.map((code, index) => (
                <TableRow key={`${code.costCode}-${index}`}>
                  <TableCell className="font-medium">{code.costCodeLabel}</TableCell>
                  <TableCell>
                    <Badge variant={code.costCodeType === 'trade' ? 'default' : 'secondary'}>
                      {code.costCodeType === 'trade' ? 'Trade' : 'Work Type'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatHours(code.totalHours)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(code.totalCost)}</TableCell>
                  <TableCell className="text-right">{formatPercent(code.percentOfTotal)}</TableCell>
                  <TableCell className="text-right">{code.workersCount}</TableCell>
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
      <CardHeader>
        <CardTitle>Overtime Summary</CardTitle>
        <CardDescription>
          Employees with overtime and double time hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        {report.overtimeSummary.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No overtime recorded for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">OT Hours</TableHead>
                  <TableHead className="text-right">DT Hours</TableHead>
                  <TableHead className="text-right">Total OT</TableHead>
                  <TableHead className="text-right">OT Pay</TableHead>
                  <TableHead className="text-right">% OT</TableHead>
                  <TableHead className="text-right">Days with OT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.overtimeSummary.map((ot) => (
                  <TableRow key={ot.userId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ot.userName}</div>
                        <div className="text-xs text-gray-500">{ot.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatHours(ot.overtimeHours)}</TableCell>
                    <TableCell className="text-right">{formatHours(ot.doubleTimeHours)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatHours(ot.totalOTHours)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(ot.totalOTPay)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{formatPercent(ot.percentOT)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{ot.daysWithOT}</TableCell>
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
    <div className="space-y-4">
      {/* Report Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(report.summary.startDate)} - {formatDate(report.summary.endDate)}
          </span>
        </div>
        <span>Generated: {new Date(report.generatedAt).toLocaleString()}</span>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="by-person">By Person</TabsTrigger>
          <TabsTrigger value="by-project">By Project</TabsTrigger>
          <TabsTrigger value="by-cost-code">By Cost Code</TabsTrigger>
          <TabsTrigger value="overtime">Overtime</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          {renderSummaryTab()}
        </TabsContent>

        <TabsContent value="by-person" className="mt-4">
          {renderByPersonTab()}
        </TabsContent>

        <TabsContent value="by-project" className="mt-4">
          {renderByProjectTab()}
        </TabsContent>

        <TabsContent value="by-cost-code" className="mt-4">
          {renderByCostCodeTab()}
        </TabsContent>

        <TabsContent value="overtime" className="mt-4">
          {renderOvertimeTab()}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PayrollReportDisplay