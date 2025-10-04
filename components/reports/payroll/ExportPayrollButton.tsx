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
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : exportSuccess ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Exported!
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
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
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : exportSuccess ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Exported!
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          CSV (Recommended)
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
        >
          <FileText className="mr-2 h-4 w-4" />
          PDF (Coming Soon)
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={true}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel (Coming Soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ExportPayrollButton