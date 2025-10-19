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
import { getStatusColor } from '@/utils/format-functions'

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

    const hasBlockers = (validationResult?.blockers?.length ?? 0) > 0
    const hasWarnings = (validationResult?.warnings?.length ?? 0) > 0
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-w-[calc(100vw-2rem)] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                        Confirm Status Change
                    </DialogTitle>
                    <DialogDescription className="flex flex-wrap items-center gap-1.5 xs:gap-2 text-xs xs:text-sm leading-snug">
                        <span>Change from</span>
                        <Badge className={cn("text-xs whitespace-nowrap", getStatusColor(currentStatus))} variant="outline">
                            {formatStatusLabel(currentStatus)}
                        </Badge>
                        <span>to</span>
                        <Badge className={cn("text-xs whitespace-nowrap", getStatusColor(newStatus))} variant="outline">
                            {formatStatusLabel(newStatus)}
                        </Badge>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2.5 xs:space-y-3">
                    {/* Loading State */}
                    {isValidating && (
                        <div className="flex items-center gap-1.5 xs:gap-2 p-2.5 xs:p-3 bg-gray-50 rounded-md">
                            <Loader2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin text-gray-600 flex-shrink-0" />
                            <span className="text-xs xs:text-sm text-gray-600">Checking dependencies...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <AlertDescription className="text-xs xs:text-sm leading-snug">{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Validation Results */}
                    {validationResult && !isValidating && (
                        <div className="space-y-2.5 xs:space-y-3">
                            {/* Blockers - Critical issues that prevent the change */}
                            {hasBlockers && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                    <AlertTitle className="text-sm xs:text-base">Cannot Change Status</AlertTitle>
                                    <AlertDescription className="text-xs xs:text-sm">
                                        <ul className="mt-1.5 xs:mt-2 space-y-0.5 xs:space-y-1">
                                            {(validationResult?.blockers ?? []).map((blocker, index) => (
                                                <li key={index} className="text-xs xs:text-sm flex items-start gap-1 leading-snug">
                                                    <span className="text-red-600 mt-0.5 flex-shrink-0">•</span>
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
                                    <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                                    <AlertTitle className="text-orange-800 text-sm xs:text-base">Important Notice</AlertTitle>
                                    <AlertDescription className="text-orange-700 text-xs xs:text-sm">
                                        <ul className="mt-1.5 xs:mt-2 space-y-0.5 xs:space-y-1">
                                            {(validationResult?.warnings ?? []).map((warning, index) => (
                                                <li key={index} className="text-xs xs:text-sm flex items-start gap-1 leading-snug">
                                                    <span className="text-orange-600 mt-0.5 flex-shrink-0">•</span>
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
                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    <AlertDescription className="text-green-800 text-xs xs:text-sm leading-snug">
                                        No issues detected. Ready to proceed.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 flex-col xs:flex-row">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="w-full xs:w-auto h-9 xs:h-10 text-sm xs:text-base"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isValidating || hasBlockers}
                        variant={hasWarnings ? "default" : "default"}
                        className={cn(
                            "w-full xs:w-auto h-9 xs:h-10 text-sm xs:text-base",
                            hasWarnings && "bg-orange-600 hover:bg-orange-700"
                        )}
                    >
                        {hasWarnings ? "Continue Anyway" : "Confirm Change"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
})

StatusValidationDialog.displayName = 'StatusValidationDialog'