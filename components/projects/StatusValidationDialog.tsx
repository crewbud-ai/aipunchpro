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
import { Loader2, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
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
            setValidationResult(null)

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

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'not_started': return 'bg-gray-100 text-gray-800'
            case 'in_progress': return 'bg-blue-100 text-blue-800'
            case 'on_track': return 'bg-green-100 text-green-800'
            case 'ahead_of_schedule': return 'bg-emerald-100 text-emerald-800'
            case 'behind_schedule': return 'bg-orange-100 text-orange-800'
            case 'on_hold': return 'bg-yellow-100 text-yellow-800'
            case 'completed': return 'bg-green-100 text-green-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const hasBlockers = (validationResult?.blockers?.length ?? 0) > 0
    const hasWarnings = (validationResult?.warnings?.length ?? 0) > 0
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Confirm Status Change
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                        <span>Change from</span>
                        <Badge className={cn("text-xs", getStatusBadgeColor(currentStatus))} variant="outline">
                            {formatStatusLabel(currentStatus)}
                        </Badge>
                        <span>to</span>
                        <Badge className={cn("text-xs", getStatusBadgeColor(newStatus))} variant="outline">
                            {formatStatusLabel(newStatus)}
                        </Badge>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Loading State */}
                    {isValidating && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                            <span className="text-sm text-gray-600">Checking dependencies...</span>
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
                        <div className="space-y-3">
                            {/* Blockers - Critical issues that prevent the change */}
                            {hasBlockers && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Cannot Change Status</AlertTitle>
                                    <AlertDescription>
                                        <ul className="mt-2 space-y-1">
                                            {(validationResult?.blockers ?? []).map((blocker, index) => (
                                                <li key={index} className="text-sm flex items-start gap-1">
                                                    <span className="text-red-600 mt-0.5">•</span>
                                                    <span>{blocker}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Warnings - Important but not blocking */}
                            {hasWarnings && !hasBlockers && (
                                <Alert className="border-orange-200 bg-orange-50">
                                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                                    <AlertTitle className="text-orange-800">Important Notice</AlertTitle>
                                    <AlertDescription className="text-orange-700">
                                        <ul className="mt-2 space-y-1">
                                            {(validationResult?.warnings ?? []).map((warning, index) => (
                                                <li key={index} className="text-sm flex items-start gap-1">
                                                    <span className="text-orange-600 mt-0.5">•</span>
                                                    <span>{warning}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* No issues detected */}
                            {!hasBlockers && !hasWarnings && (
                                <Alert className="border-green-200 bg-green-50">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                        No issues detected. Ready to proceed.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isValidating || hasBlockers}
                        variant={hasWarnings ? "default" : "default"}
                        className={hasWarnings ? "bg-orange-600 hover:bg-orange-700" : ""}
                    >
                        {hasWarnings ? "Continue Anyway" : "Confirm Change"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
})

StatusValidationDialog.displayName = 'StatusValidationDialog'