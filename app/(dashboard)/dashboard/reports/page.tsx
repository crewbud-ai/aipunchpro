// ==============================================
// app/(dashboard)/dashboard/reports/page.tsx
// Central Reports Hub - UPDATED WITH PAYROLL REPORTS
// ==============================================

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, AlertCircle, CheckCircle, Download } from "lucide-react"
import { isAdmin, isSuperAdmin } from '@/lib/permissions'
import { payrollReportsApi } from '@/lib/api/payroll'
import {
  PayrollReportFilters,
  PayrollReportDisplay,
  ExportPayrollButton
} from '@/components/reports/payroll'
import type { PayrollReport, PayrollReportFilters as PayrollFilters } from '@/types/reports'

export default function ReportsPage() {
  // ==============================================
  // STATE
  // ==============================================
  const [report, setReport] = useState<PayrollReport | null>(null)
  const [currentFilters, setCurrentFilters] = useState<PayrollFilters | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check permissions
  const userIsAdmin = isAdmin() || isSuperAdmin()

  // ==============================================
  // HANDLERS
  // ==============================================
  const handleGenerateReport = async (filters: PayrollFilters) => {
    setIsLoading(true)
    setError(null)
    setReport(null)
    setCurrentFilters(filters)

    try {
      const result = await payrollReportsApi.getPayrollReport(filters)

      if (result.success && result.data?.report) {
        setReport(result.data.report)
      } else {
        setError('Failed to generate report. Please try again.')
      }
    } catch (err) {
      console.error('Report generation error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    if (!currentFilters) {
      setError('No report to export. Please generate a report first.')
      return
    }

    try {
      await payrollReportsApi.exportPayrollCSV(currentFilters)
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  // ==============================================
  // RENDER: PERMISSION CHECK
  // ==============================================
  if (!userIsAdmin) {
    return (
      <div className="space-y-4 xs:space-y-5 sm:space-y-6">
        <div className="px-2 xs:px-0">
          <h1 className="text-2xl xs:text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-xs xs:text-sm sm:text-base text-gray-600 mt-1">
            Access to payroll and analytics reports
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <AlertDescription className="text-xs xs:text-sm leading-snug">
            You do not have permission to view reports. Only administrators can access this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // ==============================================
  // RENDER: MAIN CONTENT
  // ==============================================
  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="px-2 xs:px-0">
        <h1 className="text-2xl xs:text-3xl font-bold text-gray-900">Payroll Reports</h1>
        <p className="text-xs xs:text-sm sm:text-base text-gray-600 mt-1">
          Generate detailed payroll reports for time tracking and labor costs
        </p>
      </div>

      {/* Filters Section */}
      <PayrollReportFilters
        onApplyFilters={handleGenerateReport}
        onExport={report ? handleExport : undefined}
        isLoading={isLoading}
        isExporting={false}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <AlertDescription className="text-xs xs:text-sm leading-snug">{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardHeader className="px-4 xs:px-5 sm:px-6">
            <CardTitle className="text-base xs:text-lg">Generating Report...</CardTitle>
            <CardDescription className="text-xs xs:text-sm leading-snug">
              Please wait while we fetch and process the data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 xs:space-y-4 px-4 xs:px-5 sm:px-6">
            <Skeleton className="h-24 xs:h-28 sm:h-32 w-full" />
            <Skeleton className="h-24 xs:h-28 sm:h-32 w-full" />
            <Skeleton className="h-24 xs:h-28 sm:h-32 w-full" />
          </CardContent>
        </Card>
      )}

      {/* Success State with Report */}
      {!isLoading && report && (
        <>
          {/* Success Message */}
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <AlertDescription className="text-xs xs:text-sm text-green-600 leading-snug">
              Report generated successfully! {report.summary.totalEntries} entries found.
            </AlertDescription>
          </Alert>

          {/* Export Button (standalone, above report) */}
          <div className="flex justify-end px-2 xs:px-0">
            <ExportPayrollButton
              filters={currentFilters!}
              variant="default"
            />
          </div>

          {/* Report Display */}
          <PayrollReportDisplay report={report} />
        </>
      )}

      {/* Empty State - No Report Yet */}
      {!isLoading && !report && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 xs:py-12 sm:py-16 px-4 xs:px-6">
            <FileText className="h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 text-gray-400 mb-3 xs:mb-4 flex-shrink-0" />
            <h3 className="text-base xs:text-lg font-semibold text-gray-900 mb-1.5 xs:mb-2 text-center">
              No Report Generated
            </h3>
            <p className="text-xs xs:text-sm sm:text-base text-gray-600 text-center max-w-md mb-4 xs:mb-5 sm:mb-6 leading-snug xs:leading-normal">
              Select your filters above and click "Generate Report" to create a detailed payroll report
              with employee hours, project costs, and overtime breakdown.
            </p>
            <div className="text-xs xs:text-sm text-gray-500 space-y-0.5 xs:space-y-1 w-full max-w-md">
              <p>• Time by Person - Employee breakdown</p>
              <p>• Time by Project - Project costs</p>
              <p>• Time by Cost Code - Trade/work type analysis</p>
              <p>• Overtime Summary - OT hours and costs</p>
              <p>• Detailed Entries - Complete time logs with notes</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Info Card */}
      {!isLoading && !report && !error && (
        <div className="grid gap-3 xs:gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader className="px-4 xs:px-5 sm:px-6">
              <CardTitle className="text-base xs:text-lg">What's Included</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 xs:space-y-3 px-4 xs:px-5 sm:px-6">
              <div className="text-xs xs:text-sm space-y-1.5 xs:space-y-2 leading-snug xs:leading-normal">
                <p><strong>Summary Totals:</strong> Overall hours, costs, and statistics</p>
                <p><strong>By Person:</strong> Individual employee breakdown with pay details</p>
                <p><strong>By Project:</strong> Project-wise hours and labor costs</p>
                <p><strong>By Cost Code:</strong> Trade and work type analysis</p>
                <p><strong>Overtime Summary:</strong> OT and double-time breakdown</p>
                <p><strong>Detailed Entries:</strong> Complete time logs with descriptions</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 xs:px-5 sm:px-6">
              <CardTitle className="text-base xs:text-lg">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 xs:space-y-3 px-4 xs:px-5 sm:px-6">
              <div className="text-xs xs:text-sm space-y-1.5 xs:space-y-2">
                <div className="flex items-start gap-1.5 xs:gap-2">
                  <Download className="h-3.5 w-3.5 xs:h-4 xs:w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">CSV Export</p>
                    <p className="text-gray-600 leading-snug xs:leading-normal">
                      Download complete report as CSV with all sections for use in Excel or payroll systems
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1.5 xs:mt-2 space-y-0.5 leading-snug">
                  <p>• Compatible with Excel, Google Sheets, and most payroll software</p>
                  <p>• Includes all data with proper formatting</p>
                  <p>• Can be imported into accounting systems</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Reports Section (Future Enhancement) */}
      {!isLoading && !report && !error && (
        <Card>
          <CardHeader className="px-4 xs:px-5 sm:px-6">
            <CardTitle className="text-base xs:text-lg">Quick Reports (Coming Soon)</CardTitle>
            <CardDescription className="text-xs xs:text-sm leading-snug">
              Pre-configured reports for common time periods
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2.5 xs:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-4 xs:px-5 sm:px-6">
            <div className="p-3 xs:p-4 border rounded-lg bg-gray-50 cursor-not-allowed opacity-60">
              <p className="font-semibold text-xs xs:text-sm">This Week</p>
              <p className="text-xs text-gray-600 leading-snug">Current week payroll summary</p>
            </div>
            <div className="p-3 xs:p-4 border rounded-lg bg-gray-50 cursor-not-allowed opacity-60">
              <p className="font-semibold text-xs xs:text-sm">Last Week</p>
              <p className="text-xs text-gray-600 leading-snug">Previous week complete report</p>
            </div>
            <div className="p-3 xs:p-4 border rounded-lg bg-gray-50 cursor-not-allowed opacity-60">
              <p className="font-semibold text-xs xs:text-sm">This Month</p>
              <p className="text-xs text-gray-600 leading-snug">Month-to-date summary</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}