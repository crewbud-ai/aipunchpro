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
  
  // ==============================================
  // FORMAT FUNCTIONS
  // ==============================================
  const formatTime = (time?: string | null) => {
    if (!time) return '-'
    // Handle both HH:MM and HH:MM:SS formats
    const parts = time.split(':')
    const hours = parts[0]
    const minutes = parts[1]
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clocked_in':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'clocked_out':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'approved':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

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
          <DialogTitle>Time Entry Details</DialogTitle>
          <DialogDescription>
            View complete information for this time entry
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{formatDate(entry.date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant="outline" className={getStatusColor(entry.status)}>
                {getStatusLabel(entry.status)}
              </Badge>
            </div>
          </div>

          {/* Project Info */}
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-500">Project</p>
            <p className="font-medium">{getProjectName()}</p>
            {entry.project?.projectNumber && (
              <p className="text-xs text-gray-500">{entry.project.projectNumber}</p>
            )}
            {getScheduleProjectTitle() && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Schedule Task</p>
                <p className="text-sm font-medium text-gray-700">{getScheduleProjectTitle()}</p>
              </div>
            )}
          </div>

          {/* Worker Info (if available) */}
          {getWorkerName() && (
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-500">Worker</p>
              <p className="font-medium">{getWorkerName()}</p>
              {entry.worker?.email && (
                <p className="text-xs text-gray-500">{entry.worker.email}</p>
              )}
            </div>
          )}

          {/* Time Info */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div>
              <p className="text-sm text-gray-500">Start Time</p>
              <p className="font-medium">{formatTime(entry.startTime)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Time</p>
              <p className="font-medium">
                {entry.endTime ? formatTime(entry.endTime) : (
                  <span className="text-green-600">In Progress</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Hours</p>
              <p className="font-medium text-lg">
                {entry.totalHours ? `${entry.totalHours.toFixed(2)}h` : '-'}
              </p>
            </div>
          </div>

          {/* ⭐ NEW: Payment/Earnings Section */}
          {hasPaymentInfo && (
            <div className="pt-4 border-t">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-green-900 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Earnings Breakdown
                  </h3>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    {entry.status === 'approved' ? 'Approved' : 'Pending'}
                  </Badge>
                </div>

                {/* Total Earnings */}
                <div className="mb-4 pb-4 border-b border-green-200">
                  <p className="text-xs text-green-700 mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-green-700">
                    ${(entry.totalPay ?? 0).toFixed(2)}
                  </p>
                </div>

                {/* Hours & Pay Breakdown */}
                <div className="space-y-3">
                  {/* Regular Hours */}
                  {(entry.regularHours ?? 0) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                      <div>
                        <p className="text-xs text-gray-600">Regular Hours</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {(entry.regularHours ?? 0).toFixed(2)}h × ${(entry.regularRate ?? 0).toFixed(2)}/hr
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ${regularPay.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Overtime Hours */}
                  {(entry.overtimeHours ?? 0) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                      <div>
                        <p className="text-xs text-yellow-700 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Overtime Hours
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {(entry.overtimeHours ?? 0).toFixed(2)}h × ${(entry.overtimeRate ?? 0).toFixed(2)}/hr
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-yellow-800">
                          ${overtimePay.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Double Time Hours */}
                  {(entry.doubleTimeHours ?? 0) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-300">
                      <div>
                        <p className="text-xs text-red-700 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Double Time Hours
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {(entry.doubleTimeHours ?? 0).toFixed(2)}h × ${(entry.doubleTimeRate ?? 0).toFixed(2)}/hr
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-800">
                          ${doubleTimePay.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Status Note */}
                <div className="mt-4 pt-3 border-t border-green-200">
                  <p className="text-xs text-green-700 text-center">
                    {entry.status === 'approved' 
                      ? '✓ This payment has been approved and will be included in the next payroll' 
                      : '💡 Earnings are pending approval by your administrator'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Work Details */}
          {entry.description && (
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-sm bg-gray-50 p-3 rounded-md">{entry.description}</p>
            </div>
          )}

          {entry.workCompleted && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Work Completed</p>
              <p className="text-sm bg-gray-50 p-3 rounded-md">{entry.workCompleted}</p>
            </div>
          )}

          {entry.issuesEncountered && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Issues/Notes</p>
              <p className="text-sm bg-gray-50 p-3 rounded-md">{entry.issuesEncountered}</p>
            </div>
          )}

          {/* Additional Info */}
          {(entry.workType || entry.trade) && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              {entry.workType && (
                <div>
                  <p className="text-sm text-gray-500">Work Type</p>
                  <p className="font-medium capitalize">{entry.workType.replace('_', ' ')}</p>
                </div>
              )}
              {entry.trade && (
                <div>
                  <p className="text-sm text-gray-500">Trade</p>
                  <p className="font-medium capitalize">{entry.trade.replace('_', ' ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Dialog Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}