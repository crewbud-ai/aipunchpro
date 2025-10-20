// ==============================================
// components/time-tracking/TimeEntryDetailsDialog.tsx
// Updated to show payment/earnings information
// ==============================================

"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Clock, TrendingUp } from "lucide-react"
import { formatDateSmart, formatTime12Hour, getTimeEntryStatusColor } from '@/utils/format-functions'

// Type for the entry - properly handles the nested structure from API
interface TimeEntryForDialog {
  id: string
  date: string
  startTime?: string
  endTime?: string | null
  totalHours?: number

  // Hours breakdown
  regularHours?: number
  overtimeHours?: number
  doubleTimeHours?: number

  // Rates & Payment
  regularRate?: number
  overtimeRate?: number
  doubleTimeRate?: number
  totalPay?: number

  status: string
  workType?: string
  trade?: string
  description?: string
  workCompleted?: string
  issuesEncountered?: string

  // Nested structure from API
  project?: {
    id: string
    name: string
    status: string
    projectNumber?: string
  }
  scheduleProject?: {
    id: string
    title: string
    status: string
  } | null
  worker?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface TimeEntryDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  entry: TimeEntryForDialog | null
}

export function TimeEntryDetailsDialog({
  isOpen,
  onClose,
  entry
}: TimeEntryDetailsDialogProps) {


  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // ==============================================
  // DATA EXTRACTION - Handle nested structure
  // ==============================================
  const getProjectName = () => {
    return entry?.project?.name || 'Unknown Project'
  }

  const getScheduleProjectTitle = () => {
    return entry?.scheduleProject?.title || null
  }

  const getWorkerName = () => {
    if (entry?.worker) {
      return `${entry.worker.firstName} ${entry.worker.lastName}`
    }
    return null
  }

  if (!entry) return null

  // Calculate payment breakdown with proper null checks
  const hasPaymentInfo = entry.totalPay !== undefined && entry.totalPay !== null
  const regularPay = (entry.regularHours ?? 0) * (entry.regularRate ?? 0)
  const overtimePay = (entry.overtimeHours ?? 0) * (entry.overtimeRate ?? 0)
  const doubleTimePay = (entry.doubleTimeHours ?? 0) * (entry.doubleTimeRate ?? 0)

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base xs:text-lg">Time Entry Details</DialogTitle>
          <DialogDescription className="text-xs xs:text-sm leading-snug xs:leading-normal">
            View complete information for this time entry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 xs:space-y-4">
          {/* Basic Info - Mobile Responsive */}
          <div className="grid grid-cols-2 gap-3 xs:gap-4">
            <div>
              <p className="text-xs xs:text-sm text-gray-500">Date</p>
              <p className="font-medium text-sm xs:text-base leading-snug">{formatDateSmart(entry.date)}</p>
            </div>
            <div>
              <p className="text-xs xs:text-sm text-gray-500">Status</p>
              <Badge variant="outline" className={`${getTimeEntryStatusColor(entry.status)} text-xs`}>
                {getStatusLabel(entry.status)}
              </Badge>
            </div>
          </div>

          {/* Project Info - Mobile Responsive */}
          <div className="pt-2 xs:pt-2.5 sm:pt-3 border-t">
            <p className="text-xs xs:text-sm text-gray-500 mb-0.5 xs:mb-1">Project</p>
            <p className="font-medium text-sm xs:text-base leading-snug">{getProjectName()}</p>
            {entry.project?.projectNumber && (
              <p className="text-xs text-gray-500 mt-0.5">{entry.project.projectNumber}</p>
            )}
            {getScheduleProjectTitle() && (
              <div className="mt-1.5 xs:mt-2">
                <p className="text-xs xs:text-sm text-gray-500 mb-0.5">Schedule Task</p>
                <p className="text-xs xs:text-sm font-medium text-gray-700 leading-snug">{getScheduleProjectTitle()}</p>
              </div>
            )}
          </div>

          {/* Worker Info (if available) - Mobile Responsive */}
          {getWorkerName() && (
            <div className="pt-2 xs:pt-2.5 sm:pt-3 border-t">
              <p className="text-xs xs:text-sm text-gray-500 mb-0.5 xs:mb-1">Worker</p>
              <p className="font-medium text-sm xs:text-base leading-snug">{getWorkerName()}</p>
              {entry.worker?.email && (
                <p className="text-xs text-gray-500 mt-0.5">{entry.worker.email}</p>
              )}
            </div>
          )}

          {/* Time Info - Mobile Responsive */}
          <div className="grid grid-cols-2 xs:grid-cols-3 gap-3 xs:gap-4 pt-2 xs:pt-2.5 sm:pt-3 border-t">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Start Time</p>
              <p className="font-medium text-sm xs:text-base leading-snug">{entry.startTime && formatTime12Hour(entry.startTime)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">End Time</p>
              <p className="font-medium text-sm xs:text-base leading-snug">
                {entry.endTime ? formatTime12Hour(entry.endTime) : (
                  <span className="text-green-600">In Progress</span>
                )}
              </p>
            </div>
            <div className="col-span-2 xs:col-span-1">
              <p className="text-xs text-gray-500 mb-0.5">Total Hours</p>
              <p className="font-medium text-base xs:text-lg leading-snug">
                {entry.totalHours ? `${entry.totalHours.toFixed(2)}h` : '-'}
              </p>
            </div>
          </div>

          {/* ⭐ Payment/Earnings Section - Mobile Responsive */}
          {hasPaymentInfo && (
            <div className="pt-3 xs:pt-4 border-t">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-3 xs:p-4">
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0 mb-2.5 xs:mb-3">
                  <h3 className="text-xs xs:text-sm font-semibold text-green-900 flex items-center gap-1.5 xs:gap-2">
                    <DollarSign className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                    Earnings Breakdown
                  </h3>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs self-start xs:self-auto">
                    {entry.status === 'approved' ? 'Approved' : 'Pending'}
                  </Badge>
                </div>

                {/* Total Earnings - Mobile Responsive */}
                <div className="mb-3 xs:mb-4 pb-3 xs:pb-4 border-b border-green-200">
                  <p className="text-xs text-green-700 mb-1">Total Earnings</p>
                  <p className="text-2xl xs:text-3xl font-bold text-green-700">
                    ${(entry.totalPay ?? 0).toFixed(2)}
                  </p>
                </div>

                {/* Hours & Pay Breakdown - Mobile Responsive */}
                <div className="space-y-2.5 xs:space-y-3">
                  {/* Regular Hours */}
                  {(entry.regularHours ?? 0) > 0 && (
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 p-2.5 xs:p-3 bg-white rounded-lg border border-green-200">
                      <div className="flex-1">
                        <p className="text-xs text-gray-600">Regular Hours</p>
                        <p className="text-xs xs:text-sm font-semibold text-gray-900 leading-snug">
                          {(entry.regularHours ?? 0).toFixed(2)}h × ${(entry.regularRate ?? 0).toFixed(2)}/hr
                        </p>
                      </div>
                      <div className="text-left xs:text-right">
                        <p className="text-base xs:text-lg font-bold text-gray-900">
                          ${regularPay.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Overtime Hours */}
                  {(entry.overtimeHours ?? 0) > 0 && (
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 p-2.5 xs:p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                      <div className="flex-1">
                        <p className="text-xs text-yellow-700 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 shrink-0" />
                          Overtime Hours
                        </p>
                        <p className="text-xs xs:text-sm font-semibold text-gray-900 leading-snug">
                          {(entry.overtimeHours ?? 0).toFixed(2)}h × ${(entry.overtimeRate ?? 0).toFixed(2)}/hr
                        </p>
                      </div>
                      <div className="text-left xs:text-right">
                        <p className="text-base xs:text-lg font-bold text-yellow-800">
                          ${overtimePay.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Double Time Hours */}
                  {(entry.doubleTimeHours ?? 0) > 0 && (
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 p-2.5 xs:p-3 bg-red-50 rounded-lg border border-red-300">
                      <div className="flex-1">
                        <p className="text-xs text-red-700 flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          Double Time Hours
                        </p>
                        <p className="text-xs xs:text-sm font-semibold text-gray-900 leading-snug">
                          {(entry.doubleTimeHours ?? 0).toFixed(2)}h × ${(entry.doubleTimeRate ?? 0).toFixed(2)}/hr
                        </p>
                      </div>
                      <div className="text-left xs:text-right">
                        <p className="text-base xs:text-lg font-bold text-red-800">
                          ${doubleTimePay.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Status Note - Mobile Responsive */}
                <div className="mt-3 xs:mt-4 pt-2.5 xs:pt-3 border-t border-green-200">
                  <p className="text-xs text-green-700 text-center leading-snug">
                    {entry.status === 'approved'
                      ? '✓ This payment has been approved and will be included in the next payroll'
                      : '💡 Earnings are pending approval by your administrator'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Work Details - Mobile Responsive */}
          {entry.description && (
            <div className="pt-2 xs:pt-2.5 sm:pt-3 border-t">
              <p className="text-xs xs:text-sm text-gray-500 mb-1">Description</p>
              <p className="text-xs xs:text-sm bg-gray-50 p-2.5 xs:p-3 rounded-md leading-snug">{entry.description}</p>
            </div>
          )}

          {entry.workCompleted && (
            <div>
              <p className="text-xs xs:text-sm text-gray-500 mb-1">Work Completed</p>
              <p className="text-xs xs:text-sm bg-gray-50 p-2.5 xs:p-3 rounded-md leading-snug">{entry.workCompleted}</p>
            </div>
          )}

          {entry.issuesEncountered && (
            <div>
              <p className="text-xs xs:text-sm text-gray-500 mb-1">Issues/Notes</p>
              <p className="text-xs xs:text-sm bg-gray-50 p-2.5 xs:p-3 rounded-md leading-snug">{entry.issuesEncountered}</p>
            </div>
          )}

          {/* Additional Info - Mobile Responsive */}
          {(entry.workType || entry.trade) && (
            <div className="grid grid-cols-2 gap-3 xs:gap-4 pt-2 xs:pt-2.5 sm:pt-3 border-t">
              {entry.workType && (
                <div>
                  <p className="text-xs xs:text-sm text-gray-500 mb-0.5">Work Type</p>
                  <p className="font-medium text-sm xs:text-base capitalize leading-snug">{entry.workType.replace('_', ' ')}</p>
                </div>
              )}
              {entry.trade && (
                <div>
                  <p className="text-xs xs:text-sm text-gray-500 mb-0.5">Trade</p>
                  <p className="font-medium text-sm xs:text-base capitalize leading-snug">{entry.trade.replace('_', ' ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Dialog Actions - Mobile Responsive */}
          <div className="flex justify-end pt-3 xs:pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full xs:w-auto h-9 xs:h-10 text-sm xs:text-base"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}