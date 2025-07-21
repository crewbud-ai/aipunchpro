"use client"

import React, { useState, useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCoordinatedProjectStatus } from '@/hooks/projects/use-coordinated-project-status'
import { StatusCoordinationDisplay } from './StatusCoordinationDisplay'
import { StatusValidationDialog } from './StatusValidationDialog'
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
        if (newStatus === project.status || disabled) return

        const significantChanges = ['completed', 'cancelled', 'on_hold']
        const needsValidation = significantChanges.includes(newStatus) ||
            (project.status === 'completed' && newStatus !== 'completed')

        if (needsValidation) {
            setPendingStatus(newStatus)
            setShowValidationDialog(true)
        } else {
            performStatusUpdate(newStatus)
        }
    }, [project.status, disabled])

    const performStatusUpdate = useCallback(async (newStatus: string) => {
        try {
            reset()

            const result = await updateProjectStatusCoordinated({
                projectId: project.id,
                status: newStatus as any,
                notes: `Status updated to ${newStatus} via project details`
            })

            if (result.success) {
                onStatusChange?.(newStatus)
            }
        } catch (error) {
            console.error('Status update failed:', error)
        }
    }, [project.id, updateProjectStatusCoordinated, onStatusChange, reset])

    return (
        <div className={cn("space-y-4", className)}>
            {/* Status Selector */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Label htmlFor="project-status">Project Status</Label>
                    {isUpdating && <RefreshCw className="h-3 w-3 animate-spin text-gray-500" />}
                </div>

                <Select
                    value={project.status}
                    onValueChange={handleStatusSelect}
                    disabled={disabled || isUpdating}
                >
                    <SelectTrigger id="project-status" className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PROJECT_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                                <Badge className={cn("text-xs", status.color)}>
                                    {status.label}
                                </Badge>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Coordination Results Display */}
            <StatusCoordinationDisplay
                result={result}
                isUpdating={isUpdating}
            />

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
