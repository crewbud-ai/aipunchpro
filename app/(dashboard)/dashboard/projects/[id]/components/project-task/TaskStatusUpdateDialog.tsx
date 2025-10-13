// ==============================================
// app/(dashboard)/dashboard/projects/[id]/components/TaskStatusUpdateDialog.tsx
// Quick Status Update Dialog for Schedule Projects
// ==============================================

"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  XCircle,
  Loader2,
  Timer,
  FileText,
} from "lucide-react"

// Import hooks and types
import { useCoordinatedScheduleStatus } from "@/hooks/schedule-projects/use-coordinated-schedule-status"
import type { ScheduleProjectSummary } from "@/types/schedule-projects"

// ==============================================
// INTERFACES
// ==============================================
interface TaskStatusUpdateDialogProps {
  task: ScheduleProjectSummary | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface StatusOption {
  value: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  progressRequired?: boolean
  hoursRequired?: boolean
}

// ==============================================
// STATUS OPTIONS CONFIG
// ==============================================
const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'planned',
    label: 'Planned',
    description: 'Task is scheduled but not yet started',
    icon: Clock,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    progressRequired: false,
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    description: 'Work is currently being performed',
    icon: Play,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    progressRequired: true,
  },
  {
    value: 'completed',
    label: 'Completed',
    description: 'Task has been finished successfully',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    progressRequired: false,
    hoursRequired: true,
  },
  {
    value: 'delayed',
    label: 'Delayed',
    description: 'Task is behind schedule',
    icon: AlertCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    progressRequired: true,
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    description: 'Task has been cancelled',
    icon: XCircle,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    progressRequired: false,
  },
]

// ==============================================
// MAIN COMPONENT
// ==============================================
export const TaskStatusUpdateDialog: React.FC<TaskStatusUpdateDialogProps> = ({
  task,
  isOpen,
  onClose,
  onSuccess,
}) => {
  // ==============================================
  // STATE
  // ==============================================
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [progressPercentage, setProgressPercentage] = useState<number>(0)
  const [actualHours, setActualHours] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [skipValidation, setSkipValidation] = useState<boolean>(false)
  const [localError, setLocalError] = useState<string>('')

  // ==============================================
  // HOOKS
  // ==============================================
  const {
    updateScheduleStatusCoordinated,
    isUpdating,
    error: coordinationError,
  } = useCoordinatedScheduleStatus()

  // ==============================================
  // EFFECTS
  // ==============================================

  // Initialize form when task changes
  useEffect(() => {
    if (task && isOpen) {
      setSelectedStatus(task.status)
      setProgressPercentage(task.progressPercentage || 0)
      setActualHours(task.actualHours || 0)
      setNotes('')
      setSkipValidation(false)
      setLocalError('')
    }
  }, [task, isOpen])

  // ==============================================
  // COMPUTED VALUES
  // ==============================================

  const selectedStatusOption = STATUS_OPTIONS.find(opt => opt.value === selectedStatus)

  const canSubmit = selectedStatus &&
    (!selectedStatusOption?.progressRequired || progressPercentage >= 0) &&
    (!selectedStatusOption?.hoursRequired || actualHours > 0)

  const hasChanges = task && (
    selectedStatus !== task.status ||
    progressPercentage !== (task.progressPercentage || 0) ||
    actualHours !== (task.actualHours || 0) ||
    notes.trim() !== ''
  )

  // ==============================================
  // EVENT HANDLERS
  // ==============================================

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status)
    setLocalError('')

    // Auto-adjust progress based on status
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status)
    if (statusOption) {
      if (status === 'completed') {
        setProgressPercentage(100)
      } else if (status === 'cancelled') {
        setProgressPercentage(0)
      } else if (status === 'planned' && progressPercentage > 0) {
        setProgressPercentage(0)
      }
    }
  }

  const handleSubmit = async () => {
    if (!task || !canSubmit) return

    setLocalError('')

    try {
      // Validate inputs
      if (selectedStatusOption?.progressRequired && progressPercentage < 0) {
        setLocalError('Progress percentage is required for this status')
        return
      }

      if (selectedStatusOption?.hoursRequired && actualHours <= 0) {
        setLocalError('Actual hours must be greater than 0 for completed tasks')
        return
      }

      // Update status using coordination hook
      await updateScheduleStatusCoordinated({
        scheduleProjectId: task.id,
        status: selectedStatus as any,
        progressPercentage: selectedStatusOption?.progressRequired ? progressPercentage : undefined,
        actualHours: actualHours > 0 ? actualHours : undefined,
        notes: notes.trim() || undefined,
        skipDependencyValidation: skipValidation,
        skipProjectSync: false, // Always sync with project
      })

      // Success - close dialog and refresh
      onSuccess()
      onClose()

    } catch (error) {
      console.error('Failed to update task status:', error)
      setLocalError(error instanceof Error ? error.message : 'Failed to update task status')
    }
  }

  const handleClose = () => {
    if (isUpdating) return // Prevent closing while updating
    onClose()
  }

  // ==============================================
  // RENDER
  // ==============================================

  if (!task) return null

  const displayError = localError || coordinationError

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[95vw] max-w-[95vw] sm:w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Timer className="h-4 w-4 sm:h-5 sm:w-5" />
            Update Task Status
          </DialogTitle>
          <DialogDescription className="text-sm">
            Update the status and progress for "{task.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Current Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-xs sm:text-sm font-medium text-gray-900">Current Status</div>
              <Badge variant="outline" className={STATUS_OPTIONS.find(opt => opt.value === task.status)?.color}>
                {STATUS_OPTIONS.find(opt => opt.value === task.status)?.label}
              </Badge>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs sm:text-sm font-medium text-gray-900">{task.progressPercentage || 0}%</div>
              <div className="text-xs text-gray-600">Progress</div>
            </div>
          </div>

          {/* Error Display */}
          {displayError && (
            <Alert variant="destructive" className="text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          {/* Status Selection */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm font-medium">New Status</Label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => {
                const Icon = option.icon
                return (
                  <div
                    key={option.value}
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg cursor-pointer transition-colors ${selectedStatus === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                    onClick={() => handleStatusChange(option.value)}
                  >
                    <Icon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm">{option.label}</div>
                      <div className="text-xs text-gray-600">{option.description}</div>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <div className={`w-4 h-4 border-2 rounded-full ${selectedStatus === option.value
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                        }`}>
                        {selectedStatus === option.value && (
                          <div className="w-full h-full bg-white rounded-full scale-50" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Progress Percentage (if required) */}
          {selectedStatusOption?.progressRequired && (
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-xs sm:text-sm font-medium">Progress Percentage</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={progressPercentage}
                    onChange={(e) => setProgressPercentage(Number(e.target.value))}
                    className="w-20 text-sm"
                  />
                  <span className="text-xs sm:text-sm text-gray-600">%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
          )}

          {/* Actual Hours (if status is completed or user wants to update) */}
          {(selectedStatusOption?.hoursRequired || selectedStatus === 'in_progress') && (
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-xs sm:text-sm font-medium">
                Actual Hours
                {selectedStatusOption?.hoursRequired && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Input
                  type="number"
                  min="0"
                  step="0.25"
                  value={actualHours}
                  onChange={(e) => setActualHours(Number(e.target.value))}
                  className="w-24 text-sm"
                  placeholder="0.0"
                />
                <span className="text-xs sm:text-sm text-gray-600">hours</span>
                {task.estimatedHours && (
                  <span className="text-xs text-gray-500">
                    (Est: {task.estimatedHours}h)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm font-medium">Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this status change..."
              className="resize-none text-sm"
              rows={3}
            />
          </div>

          {/* Advanced Options */}
          {selectedStatus !== task.status && (
            <div className="space-y-2 sm:space-y-3">
              <Separator />
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="skipValidation"
                  checked={skipValidation}
                  onChange={(e) => setSkipValidation(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 flex-shrink-0"
                />
                <Label htmlFor="skipValidation" className="text-xs sm:text-sm">
                  Skip dependency validation
                </Label>
              </div>
              <p className="text-xs text-gray-500">
                Check this to bypass validation of task dependencies and prerequisites
              </p>
            </div>
          )}

          {/* Summary of Changes */}
          {hasChanges && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-blue-900">Summary of Changes</span>
              </div>
              <div className="space-y-1 text-xs text-blue-800">
                {selectedStatus !== task.status && (
                  <div>Status: {task.status} → {selectedStatus}</div>
                )}
                {progressPercentage !== (task.progressPercentage || 0) && (
                  <div>Progress: {task.progressPercentage || 0}% → {progressPercentage}%</div>
                )}
                {actualHours !== (task.actualHours || 0) && (
                  <div>Hours: {task.actualHours || 0}h → {actualHours}h</div>
                )}
                {notes.trim() && (
                  <div>Notes: Added</div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || !hasChanges || isUpdating}
            className="w-full sm:w-auto text-sm bg-orange-600 hover:bg-orange-700"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Update Status
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUpdating}
            className="w-full sm:w-auto text-sm"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}