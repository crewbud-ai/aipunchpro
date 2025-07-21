"use client"

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import type { StatusValidationResult } from '@/types/projects/status-coordination'

interface StatusValidationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    currentStatus: string
    newStatus: string
    onConfirm: () => void
}

export const StatusValidationDialog = React.memo<StatusValidationDialogProps>(({
    open,
    onOpenChange,
    projectId,
    currentStatus,
    newStatus,
    onConfirm
}) => {
    const [validationResult, setValidationResult] = useState<StatusValidationResult | null>(null)
    const [isValidating, setIsValidating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Validate status change when dialog opens
    useEffect(() => {
        if (!open || !projectId) return

        const validateStatusChange = async () => {
            setIsValidating(true)
            setError(null)

            try {
                const response = await fetch(`/api/projects/${projectId}/validate-status-change`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newStatus })
                })

                if (!response.ok) {
                    throw new Error('Validation request failed')
                }

                const result = await response.json()

                if (result.success) {
                    setValidationResult(result.data)
                } else {
                    setError(result.error || 'Validation failed')
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Validation failed')
            } finally {
                setIsValidating(false)
            }
        }

        validateStatusChange()
    }, [open, projectId, newStatus])

    const handleConfirm = () => {
        onConfirm()
        onOpenChange(false)
    }

    const handleCancel = () => {
        onOpenChange(false)
    }

    const formatStatusLabel = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
    }

    const hasBlockers = (validationResult?.blockers?.length ?? 0) > 0
    const hasWarnings = (validationResult?.warnings?.length ?? 0) > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Confirm Status Change</DialogTitle>
                    <DialogDescription>
                        Change project status from "{formatStatusLabel(currentStatus)}" to "{formatStatusLabel(newStatus)}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Loading State */}
                    {isValidating && (
                        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-md">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                            <span className="text-sm text-gray-600">Validating status change...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Validation Results */}
                    {validationResult && !isValidating && (
                        <>
                            {/* Blockers - Prevent status change */}
                            {hasBlockers && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Cannot Change Status</AlertTitle>
                                    <AlertDescription>
                                        <ul className="mt-2 space-y-1 list-disc list-inside">
                                            {(validationResult?.blockers ?? []).map((blocker, index) => (
                                                <li key={index} className="text-sm">{blocker}</li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Warnings - Allow but warn */}
                            {hasWarnings && !hasBlockers && (
                                <Alert>
                                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                                    <AlertTitle>Please Review</AlertTitle>
                                    <AlertDescription>
                                        <ul className="mt-2 space-y-1 list-disc list-inside">
                                            {(validationResult?.warnings ?? []).map((warning, index) => (
                                                <li key={index} className="text-sm">{warning}</li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Child Entity Summary */}
                            {validationResult.childEntityCounts && (
                                <div className="p-3 bg-gray-50 rounded-md">
                                    <div className="text-sm font-medium text-gray-700 mb-2">Impact Summary:</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {validationResult.childEntityCounts.scheduleProjects && (
                                            <div>
                                                <span className="text-gray-500">Schedule Projects:</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {Object.entries(validationResult.childEntityCounts.scheduleProjects).map(([status, count]) => (
                                                        <Badge key={status} variant="outline" className="text-xs">
                                                            {status}: {count}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {validationResult.childEntityCounts.activeTeamMembers !== undefined && (
                                            <div>
                                                <span className="text-gray-500">Team Members:</span>
                                                <Badge variant="outline" className="ml-1 text-xs">
                                                    {validationResult.childEntityCounts.activeTeamMembers}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* No Issues */}
                            {!hasBlockers && !hasWarnings && validationResult.canChange && (
                                <Alert>
                                    <Info className="h-4 w-4 text-blue-600" />
                                    <AlertDescription>
                                        Status change validated successfully. No issues detected.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isValidating || hasBlockers}
                        variant={hasWarnings ? "destructive" : "default"}
                    >
                        {hasWarnings ? "Continue Anyway" : "Confirm Change"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
})

StatusValidationDialog.displayName = 'StatusValidationDialog'