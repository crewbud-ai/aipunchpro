// ==============================================
// app/(dashboard)/dashboard/projects/[id]/components/reports/ProjectReports.tsx
// Project-Specific Reports Component
// ==============================================

"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Download,
  FileText,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Calendar,
  Activity,
  BarChart3
} from "lucide-react"
import { payrollReportsApi } from '@/lib/api/payroll'
import { toast } from '@/hooks/use-toast'

// ==============================================
// INTERFACES
// ==============================================
interface ProjectReportsProps {
  projectId: string
  projectName: string
  projectStatus: string
}

// ==============================================
// COMPONENT
// ==============================================
export function ProjectReports({ projectId, projectName, projectStatus }: ProjectReportsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [activeReportTab, setActiveReportTab] = useState('quick-export')

  // ==============================================
  // QUICK EXPORT HANDLERS
  // ==============================================
  const handleQuickExport = async (period: 'this-week' | 'this-month' | 'this-quarter' | 'all-time') => {
    setIsExporting(true)

    try {
      const now = new Date()
      let startDate: string
      let endDate: string = now.toISOString().split('T')[0]

      switch (period) {
        case 'this-week': {
          const dayOfWeek = now.getDay()
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - dayOfWeek)
          startDate = startOfWeek.toISOString().split('T')[0]
          break
        }
        case 'this-month': {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          startDate = startOfMonth.toISOString().split('T')[0]
          break
        }
        case 'this-quarter': {
          const quarter = Math.floor(now.getMonth() / 3)
          const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1)
          startDate = startOfQuarter.toISOString().split('T')[0]
          break
        }
        case 'all-time': {
          // Set to 1 year ago
          const oneYearAgo = new Date(now)
          oneYearAgo.setFullYear(now.getFullYear() - 1)
          startDate = oneYearAgo.toISOString().split('T')[0]
          break
        }
      }

      const filters = {
        startDate,
        endDate,
        projectId,
        status: 'all' as const,
        includeNotes: true,
        includeDetailedEntries: true
      }

      const filename = `${projectName.replace(/\s+/g, '-')}-payroll-${period}`

      await payrollReportsApi.exportPayrollCSV(filters, filename)

      toast({
        title: "Export Successful",
        description: `Project payroll report for ${period.replace('-', ' ')} has been exported.`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export project report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Reports</h2>
          <p className="text-gray-600 mt-1">
            Generate and export reports for {projectName}
          </p>
        </div>
      </div>

      <Tabs value={activeReportTab} onValueChange={setActiveReportTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="quick-export">Quick Export</TabsTrigger>
          <TabsTrigger value="custom">Custom Report</TabsTrigger>
          <TabsTrigger value="overview">Project Overview</TabsTrigger>
        </TabsList>

        {/* Quick Export Tab */}
        <TabsContent value="quick-export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Quick Payroll Export
              </CardTitle>
              <CardDescription>
                Export payroll data for this project by time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  onClick={() => handleQuickExport('this-week')}
                  disabled={isExporting}
                  variant="outline"
                  className="h-auto py-4 flex-col items-start"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold">This Week</span>
                  </div>
                  <span className="text-xs text-gray-600">
                    Export payroll for current week
                  </span>
                </Button>

                <Button
                  onClick={() => handleQuickExport('this-month')}
                  disabled={isExporting}
                  variant="outline"
                  className="h-auto py-4 flex-col items-start"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold">This Month</span>
                  </div>
                  <span className="text-xs text-gray-600">
                    Export payroll for current month
                  </span>
                </Button>

                <Button
                  onClick={() => handleQuickExport('this-quarter')}
                  disabled={isExporting}
                  variant="outline"
                  className="h-auto py-4 flex-col items-start"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4" />
                    <span className="font-semibold">This Quarter</span>
                  </div>
                  <span className="text-xs text-gray-600">
                    Export payroll for current quarter
                  </span>
                </Button>

                <Button
                  onClick={() => handleQuickExport('all-time')}
                  disabled={isExporting}
                  variant="outline"
                  className="h-auto py-4 flex-col items-start"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4" />
                    <span className="font-semibold">All Time</span>
                  </div>
                  <span className="text-xs text-gray-600">
                    Export all project payroll data
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Report Tab */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Custom Report Options
              </CardTitle>
              <CardDescription>
                For advanced filtering and custom date ranges, use the central reports page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Visit the{' '}
                  <a
                    href={`/dashboard/reports?projectId=${projectId}`}
                    className="font-medium underline"
                  >
                    Central Reports Page
                  </a>
                  {' '}for advanced reporting options with custom date ranges, status filters, and detailed breakdowns.
                </AlertDescription>
              </Alert>

              <div className="mt-4">
                <Button asChild variant="default">
                  <a href={`/dashboard/reports?projectId=${projectId}`}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Open in Reports
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Reports
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">
                  Report types available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Export Formats
                </CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">CSV</div>
                <p className="text-xs text-muted-foreground">
                  PDF coming soon
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Project Status
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="capitalize">
                  {projectStatus.replace('_', ' ')}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Current project status
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report Types</CardTitle>
              <CardDescription>
                Available reports for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">Payroll & Time Tracking</h4>
                    <p className="text-sm text-gray-600">
                      Export detailed time entries, labor costs, and overtime for this project
                    </p>
                  </div>
                  <Badge>Available</Badge>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Users className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">Team Performance</h4>
                    <p className="text-sm text-gray-600">
                      View hours logged by each team member on this project
                    </p>
                  </div>
                  <Badge>Available</Badge>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg opacity-50">
                  <DollarSign className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">Cost Analysis</h4>
                    <p className="text-sm text-gray-600">
                      Detailed breakdown of project costs vs budget
                    </p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg opacity-50">
                  <Activity className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">Progress Report</h4>
                    <p className="text-sm text-gray-600">
                      Schedule adherence, milestones, and completion status
                    </p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProjectReports