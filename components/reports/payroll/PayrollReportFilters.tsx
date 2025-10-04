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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Report Filters
        </CardTitle>
        <CardDescription>
          Select date range and filters for the payroll report
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Date Range Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="date-preset">Date Range Preset</Label>
              <Select
                value={formState.dateRangePreset}
                onValueChange={handlePresetChange}
              >
                <SelectTrigger id="date-preset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_PRESETS.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formState.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formState.endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <Label htmlFor="status">Status Filter</Label>
            <Select
              value={formState.status}
              onValueChange={(value) => setFormState(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending Only</SelectItem>
                <SelectItem value="approved">Approved Only</SelectItem>
                <SelectItem value="clocked_out">Clocked Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optional: Project Filter - Can be enhanced with multi-select */}
          {/* Commenting out for MVP - can be added later */}
          {/* 
          <div>
            <Label htmlFor="project">Project Filter (Optional)</Label>
            <Select
              value={formState.projectId}
              onValueChange={(value) => setFormState(prev => ({ ...prev, projectId: value }))}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Projects</SelectItem>
                // Add project options dynamically
              </SelectContent>
            </Select>
          </div>
          */}

          {/* Options */}
          <div className="space-y-3">
            <Label>Report Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-notes"
                checked={formState.includeNotes}
                onCheckedChange={(checked) => 
                  setFormState(prev => ({ ...prev, includeNotes: checked as boolean }))
                }
              />
              <label
                htmlFor="include-notes"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
              />
              <label
                htmlFor="include-detailed"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Include detailed time entries in export
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button
              onClick={handleApplyFilters}
              disabled={isLoading || !formState.startDate || !formState.endDate}
              className="flex-1 md:flex-none"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>

            {onExport && (
              <Button
                onClick={onExport}
                variant="outline"
                disabled={isExporting || isLoading}
                className="flex-1 md:flex-none"
              >
                {isExporting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleReset}
              variant="ghost"
              disabled={isLoading || isExporting}
            >
              <X className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Info Text */}
          <div className="text-xs text-gray-500 space-y-1">
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