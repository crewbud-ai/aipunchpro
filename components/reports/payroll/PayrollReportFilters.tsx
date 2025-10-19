// ==============================================
// components/reports/payroll/PayrollReportFilters.tsx
// Payroll Report Filters Component
// ==============================================

"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, Filter, X, Download } from "lucide-react"
import type { PayrollReportFilters } from '@/types/reports'
import { DATE_RANGE_PRESETS } from '@/types/reports'

// ==============================================
// INTERFACES
// ==============================================
interface PayrollReportFiltersProps {
  onApplyFilters: (filters: PayrollReportFilters) => void
  onExport?: () => void
  isLoading?: boolean
  isExporting?: boolean
}

interface FiltersFormState {
  dateRangePreset: string
  startDate: string
  endDate: string
  projectId: string
  userId: string
  status: string
  includeNotes: boolean
  includeDetailedEntries: boolean
}

// ==============================================
// COMPONENT
// ==============================================
export function PayrollReportFilters({
  onApplyFilters,
  onExport,
  isLoading = false,
  isExporting = false
}: PayrollReportFiltersProps) {
  // ==============================================
  // STATE
  // ==============================================
  const [formState, setFormState] = useState<FiltersFormState>({
    dateRangePreset: 'this-month',
    startDate: '',
    endDate: '',
    projectId: '',
    userId: '',
    status: 'all',
    includeNotes: true,
    includeDetailedEntries: true
  })

  // ==============================================
  // INITIALIZE WITH DEFAULT DATE RANGE
  // ==============================================
  useEffect(() => {
    const preset = DATE_RANGE_PRESETS.find(p => p.value === 'this-month')
    if (preset) {
      const range = preset.getDateRange()
      setFormState(prev => ({
        ...prev,
        startDate: range.startDate,
        endDate: range.endDate
      }))
    }
  }, [])

  // ==============================================
  // HANDLERS
  // ==============================================
  const handlePresetChange = (preset: string) => {
    setFormState(prev => ({ ...prev, dateRangePreset: preset }))

    if (preset !== 'custom') {
      const presetData = DATE_RANGE_PRESETS.find(p => p.value === preset)
      if (presetData) {
        const range = presetData.getDateRange()
        setFormState(prev => ({
          ...prev,
          startDate: range.startDate,
          endDate: range.endDate
        }))
      }
    }
  }

  const handleStartDateChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      startDate: value,
      dateRangePreset: 'custom'
    }))
  }

  const handleEndDateChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      endDate: value,
      dateRangePreset: 'custom'
    }))
  }

  const handleApplyFilters = () => {
    // Validate dates
    if (!formState.startDate || !formState.endDate) {
      alert('Please select start and end dates')
      return
    }

    const filters: PayrollReportFilters = {
      startDate: formState.startDate,
      endDate: formState.endDate,
      projectId: formState.projectId || undefined,
      userId: formState.userId || undefined,
      status: formState.status === 'all' ? undefined : formState.status as any,
      includeNotes: formState.includeNotes,
      includeDetailedEntries: formState.includeDetailedEntries
    }

    onApplyFilters(filters)
  }

  const handleReset = () => {
    const preset = DATE_RANGE_PRESETS.find(p => p.value === 'this-month')
    const range = preset?.getDateRange() || { startDate: '', endDate: '' }

    setFormState({
      dateRangePreset: 'this-month',
      startDate: range.startDate,
      endDate: range.endDate,
      projectId: '',
      userId: '',
      status: 'all',
      includeNotes: true,
      includeDetailedEntries: true
    })
  }

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <Card>
      <CardHeader className="px-4 xs:px-5 sm:px-6">
        <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
          <Filter className="h-4 w-4 xs:h-5 xs:w-5 flex-shrink-0" />
          Report Filters
        </CardTitle>
        <CardDescription className="text-xs xs:text-sm leading-snug xs:leading-normal">
          Select date range and filters for the payroll report
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 xs:px-5 sm:px-6">
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
          {/* Date Range Section */}
          <div className="space-y-3 xs:space-y-4">
            <div className="space-y-1.5 xs:space-y-2">
              <Label htmlFor="date-preset" className="text-sm xs:text-base">Date Range Preset</Label>
              <Select
                value={formState.dateRangePreset}
                onValueChange={handlePresetChange}
              >
                <SelectTrigger id="date-preset" className="h-9 xs:h-10 text-sm xs:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_PRESETS.map(preset => (
                    <SelectItem key={preset.value} value={preset.value} className="text-sm xs:text-base">
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4">
              <div className="space-y-1.5 xs:space-y-2">
                <Label htmlFor="start-date" className="text-sm xs:text-base">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formState.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="h-9 xs:h-10 text-sm xs:text-base"
                />
              </div>

              <div className="space-y-1.5 xs:space-y-2">
                <Label htmlFor="end-date" className="text-sm xs:text-base">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formState.endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="h-9 xs:h-10 text-sm xs:text-base"
                />
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5 xs:space-y-2">
            <Label htmlFor="status" className="text-sm xs:text-base">Status Filter</Label>
            <Select
              value={formState.status}
              onValueChange={(value) => setFormState(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger id="status" className="h-9 xs:h-10 text-sm xs:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm xs:text-base">All Statuses</SelectItem>
                <SelectItem value="pending" className="text-sm xs:text-base">Pending Only</SelectItem>
                <SelectItem value="approved" className="text-sm xs:text-base">Approved Only</SelectItem>
                <SelectItem value="clocked_out" className="text-sm xs:text-base">Clocked Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optional: Project Filter - Can be enhanced with multi-select */}
          {/* Commenting out for MVP - can be added later */}
          {/* 
          <div className="space-y-1.5 xs:space-y-2">
            <Label htmlFor="project" className="text-sm xs:text-base">Project Filter (Optional)</Label>
            <Select
              value={formState.projectId}
              onValueChange={(value) => setFormState(prev => ({ ...prev, projectId: value }))}
            >
              <SelectTrigger id="project" className="h-9 xs:h-10 text-sm xs:text-base">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" className="text-sm xs:text-base">All Projects</SelectItem>
                // Add project options dynamically
              </SelectContent>
            </Select>
          </div>
          */}

          {/* Options */}
          <div className="space-y-2.5 xs:space-y-3">
            <Label className="text-sm xs:text-base">Report Options</Label>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-notes"
                checked={formState.includeNotes}
                onCheckedChange={(checked) =>
                  setFormState(prev => ({ ...prev, includeNotes: checked as boolean }))
                }
                className="h-4 w-4"
              />
              <label
                htmlFor="include-notes"
                className="text-xs xs:text-sm font-medium leading-snug cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include work notes and descriptions
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-detailed"
                checked={formState.includeDetailedEntries}
                onCheckedChange={(checked) =>
                  setFormState(prev => ({ ...prev, includeDetailedEntries: checked as boolean }))
                }
                className="h-4 w-4"
              />
              <label
                htmlFor="include-detailed"
                className="text-xs xs:text-sm font-medium leading-snug cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include detailed time entries in export
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col xs:flex-row flex-wrap gap-2 xs:gap-3 pt-3 xs:pt-4 border-t">
            <Button
              onClick={handleApplyFilters}
              disabled={isLoading || !formState.startDate || !formState.endDate}
              className="flex-1 xs:flex-none h-9 xs:h-10 text-sm xs:text-base"
            >
              {isLoading ? (
                <>
                  <div className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="hidden xs:inline">Generating...</span>
                  <span className="xs:hidden">Loading...</span>
                </>
              ) : (
                <>
                  <Calendar className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Generate Report</span>
                  <span className="xs:hidden">Generate</span>
                </>
              )}
            </Button>

            {onExport && (
              <Button
                onClick={onExport}
                variant="outline"
                disabled={isExporting || isLoading}
                className="flex-1 xs:flex-none h-9 xs:h-10 text-sm xs:text-base"
              >
                {isExporting ? (
                  <>
                    <div className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span className="hidden xs:inline">Exporting...</span>
                    <span className="xs:hidden">Export...</span>
                  </>
                ) : (
                  <>
                    <Download className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Export CSV</span>
                    <span className="xs:hidden">Export</span>
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleReset}
              variant="ghost"
              disabled={isLoading || isExporting}
              className="h-9 xs:h-10 text-sm xs:text-base"
            >
              <X className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
              Reset
            </Button>
          </div>

          {/* Info Text */}
          <div className="text-xs text-gray-500 space-y-0.5 xs:space-y-1 leading-snug">
            <p>• Reports can cover up to 1 year of data</p>
            <p>• Large date ranges may take longer to generate</p>
            <p>• CSV export includes all selected sections</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PayrollReportFilters