"use client"

import React, { useState, useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCoordinatedProjectStatus } from '@/hooks/projects/use-coordinated-project-status'
import { StatusValidationDialog } from './StatusValidationDialog'
import { toast } from '@/hooks/use-toast'
import type {
    ProjectStatusManagerProps,
    CoordinatedProjectStatusUpdate
} from '@/types/projects/status-coordination'

const PROJECT_STATUSES = [
    { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'on_track', label: 'On Track', color: 'bg-green-100 text-green-800' },
    { value: 'ahead_of_schedule', label: 'Ahead of Schedule', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'behind_schedule', label: 'Behind Schedule', color: 'bg-orange-100 text-orange-800' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
] as const

export const ProjectStatusManager = React.memo<ProjectStatusManagerProps>(({
    project,
    onStatusChange,
    className,
    disabled = false
}) => {
    const [showValidationDialog, setShowValidationDialog] = useState(false)
    const [pendingStatus, setPendingStatus] = useState<string | null>(null)

    const {
        updateProjectStatusCoordinated,
        isUpdating,
        result,
        error,
        reset
    } = useCoordinatedProjectStatus()

    const handleStatusSelect = useCallback((newStatus: string) => {
        if (newStatus === project.status || disabled || isUpdating) return

        const significantChanges = ['completed', 'cancelled', 'on_hold']
        const needsValidation = significantChanges.includes(newStatus) ||
            (project.status === 'completed' && newStatus !== 'completed')

        if (needsValidation) {
            setPendingStatus(newStatus)
            setShowValidationDialog(true)
        } else {
            performStatusUpdate(newStatus)
        }
    }, [project.status, disabled, isUpdating])

    const performStatusUpdate = useCallback(async (newStatus: string) => {
        try {
            reset()

            const result = await updateProjectStatusCoordinated({
                projectId: project.id,
                status: newStatus as any,
                notes: `Status updated to ${newStatus} via project details`
            })

            if (result.success) {
                // Show success toast with professional messaging
                const updatedCount = result.data?.cascadeResults?.scheduleProjectsUpdated || 0
                const statusLabel = PROJECT_STATUSES.find(s => s.value === newStatus)?.label || newStatus

                let message = `Project status updated to ${statusLabel}`
                if (updatedCount > 0) {
                    message += ` • ${updatedCount} related item${updatedCount > 1 ? 's' : ''} synced`
                }

                toast({
                    title: "Status Updated",
                    description: message,
                    duration: 3000,
                })

                onStatusChange?.(newStatus)
            } else {
                // Handle failure case
                toast({
                    title: "Update Failed",
                    description: result.message || "Failed to update project status",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error('Status update failed:', error)
            toast({
                title: "Update Failed",
                description: "An error occurred while updating the status",
                variant: "destructive",
            })
        }
    }, [project.id, updateProjectStatusCoordinated, onStatusChange, reset])

    const getCurrentStatusBadge = () => {
        const currentStatus = PROJECT_STATUSES.find(s => s.value === project.status)
        if (!currentStatus) return null

        return (
            <Badge className={cn("text-xs", currentStatus.color)} variant="outline">
                {currentStatus.label}
            </Badge>
        )
    }

    return (
        <div className={cn("space-y-2 xs:space-y-3", className)}>
            {/* Status Selector - Mobile Responsive */}
            <div className="space-y-1.5 xs:space-y-2">
                <div className="flex items-center gap-1.5 xs:gap-2">
                    <Label htmlFor="project-status" className="text-xs xs:text-sm font-medium">
                        Project Status
                    </Label>
                    {isUpdating && (
                        <RefreshCw className="h-3 w-3 xs:h-3.5 xs:w-3.5 animate-spin text-gray-500 flex-shrink-0" />
                    )}
                </div>

                <div className="flex items-center gap-2 xs:gap-3">
                    <Select
                        value={project.status}
                        onValueChange={handleStatusSelect}
                        disabled={disabled || isUpdating}
                    >
                        <SelectTrigger
                            id="project-status"
                            className="w-full xs:w-48 h-9 xs:h-10 text-sm xs:text-base"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PROJECT_STATUSES.map((status) => (
                                <SelectItem
                                    key={status.value}
                                    value={status.value}
                                    className="text-xs xs:text-sm"
                                >
                                    <Badge
                                        className={cn("text-xs whitespace-nowrap", status.color)}
                                        variant="outline"
                                    >
                                        {status.label}
                                    </Badge>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Success feedback (commented out but kept responsive) */}
            {/* {result?.success && !isUpdating && !error && (
    <Alert className="py-1.5 xs:py-2 bg-green-50 border-green-200">
      <CheckCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-green-600 flex-shrink-0" />
      <AlertDescription className="text-xs xs:text-sm text-green-800 leading-snug">
        Status updated successfully
      </AlertDescription>
    </Alert>
  )} */}

            {/* Status Validation Dialog */}
            <StatusValidationDialog
                open={showValidationDialog}
                onOpenChange={setShowValidationDialog}
                projectId={project.id}
                currentStatus={project.status}
                newStatus={pendingStatus || ''}
                onConfirm={() => {
                    if (pendingStatus) {
                        performStatusUpdate(pendingStatus)
                        setPendingStatus(null)
                    }
                }}
            />
        </div>
    )
})

ProjectStatusManager.displayName = 'ProjectStatusManager'