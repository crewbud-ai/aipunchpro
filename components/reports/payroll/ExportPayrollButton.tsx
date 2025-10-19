// ==============================================
// components/reports/payroll/ExportPayrollButton.tsx
// Payroll Export Button Component
// ==============================================

"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileSpreadsheet, Loader2, CheckCircle } from "lucide-react"
import { payrollReportsApi } from '@/lib/api/payroll'
import type { PayrollReportFilters } from '@/types/reports'

// ==============================================
// INTERFACES
// ==============================================
interface ExportPayrollButtonProps {
  filters: PayrollReportFilters
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showDropdown?: boolean
  fileName?: string
}

type ExportFormat = 'csv' | 'pdf' | 'excel'

// ==============================================
// COMPONENT
// ==============================================
export function ExportPayrollButton({
  filters,
  disabled = false,
  variant = 'default',
  size = 'default',
  showDropdown = false,
  fileName
}: ExportPayrollButtonProps) {
  // ==============================================
  // STATE
  // ==============================================
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  // ==============================================
  // EXPORT HANDLER
  // ==============================================
  const handleExport = async (format: ExportFormat) => {
    if (isExporting) return

    setIsExporting(true)
    setExportSuccess(false)

    try {
      switch (format) {
        case 'csv':
          await payrollReportsApi.exportPayrollCSV(filters, fileName)
          break
        
        case 'pdf':
          await payrollReportsApi.exportPayrollPDF(filters, fileName)
          break
        
        case 'excel':
          // Future: Excel export
          throw new Error('Excel export coming soon')
        
        default:
          throw new Error('Invalid export format')
      }

      // Show success state briefly
      setExportSuccess(true)
      setTimeout(() => {
        setExportSuccess(false)
      }, 2000)

    } catch (error) {
      console.error('Export error:', error)
      // Error toast is shown by the API client
    } finally {
      setIsExporting(false)
    }
  }

  // ==============================================
  // RENDER: SIMPLE BUTTON (CSV only)
  // ==============================================
  if (!showDropdown) {
    return (
      <Button
        onClick={() => handleExport('csv')}
        disabled={disabled || isExporting}
        variant={variant}
        size={size}
        className="h-9 xs:h-10 text-sm xs:text-base"
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin flex-shrink-0" />
            <span className="hidden xs:inline">Exporting...</span>
            <span className="xs:hidden">Export...</span>
          </>
        ) : exportSuccess ? (
          <>
            <CheckCircle className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
            <span>Exported!</span>
          </>
        ) : (
          <>
            <Download className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
            <span className="hidden xs:inline">Export CSV</span>
            <span className="xs:hidden">Export</span>
          </>
        )}
      </Button>
    )
  }

  // ==============================================
  // RENDER: DROPDOWN WITH MULTIPLE FORMATS
  // ==============================================
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={disabled || isExporting}
          variant={variant}
          size={size}
          className="h-9 xs:h-10 text-sm xs:text-base"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin flex-shrink-0" />
              <span className="hidden xs:inline">Exporting...</span>
              <span className="xs:hidden">Export...</span>
            </>
          ) : exportSuccess ? (
            <>
              <CheckCircle className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
              <span>Exported!</span>
            </>
          ) : (
            <>
              <Download className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Export Report</span>
              <span className="xs:hidden">Export</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 xs:w-52">
        <DropdownMenuLabel className="text-xs xs:text-sm">Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="text-xs xs:text-sm"
        >
          <FileSpreadsheet className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
          <span>CSV (Recommended)</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="text-xs xs:text-sm"
        >
          <FileText className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
          <span>PDF (Coming Soon)</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={true}
          className="text-xs xs:text-sm"
        >
          <FileSpreadsheet className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
          <span>Excel (Coming Soon)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ExportPayrollButton