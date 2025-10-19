"use client"

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  StatusCoordinationResult,
  CoordinatedProjectStatusResult
} from '@/types/projects/status-coordination'

interface StatusCoordinationDisplayProps {
  result: StatusCoordinationResult | CoordinatedProjectStatusResult | null
  isUpdating: boolean
  className?: string
  minimal?: boolean // New prop for even cleaner display
}

// Type guard functions
function isStatusCoordinationResult(result: any): result is StatusCoordinationResult {
  return result?.data && 'updatedCount' in result.data
}

function isCoordinatedProjectStatusResult(result: any): result is CoordinatedProjectStatusResult {
  return result?.data && 'cascadeResults' in result.data
}

export const StatusCoordinationDisplay = React.memo<StatusCoordinationDisplayProps>(({
  result,
  isUpdating,
  className,
  minimal = false
}) => {
  // Don't show anything during update - keep UI clean
  if (isUpdating) {
    return null
  }

  // Only show results if there's something meaningful to display
  if (!result?.success || !result.data) {
    return null
  }

  let updatedCount = 0
  let skippedCount = 0
  let scheduleProjects: Array<{ id: string; title: string; status: string }> = []

  // Handle StatusCoordinationResult (API format)
  if (isStatusCoordinationResult(result)) {
    updatedCount = result.data.updatedCount
    skippedCount = result.data.skippedCount
    scheduleProjects = result.data.scheduleProjects
  }
  // Handle CoordinatedProjectStatusResult (hook format)
  else if (isCoordinatedProjectStatusResult(result)) {
    updatedCount = result.data.cascadeResults.scheduleProjectsUpdated
    skippedCount = result.data.cascadeResults.scheduleProjectsSkipped
    scheduleProjects = result.data.cascadeResults.updatedScheduleProjects.map(sp => ({
      id: sp.id,
      title: sp.title,
      status: sp.newStatus
    }))
  }

  // Minimal mode - only show if there were updates
  if (minimal) {
    if (updatedCount === 0) return null

    return (
      <div className={cn("text-xs text-gray-500", className)}>
        {updatedCount} related item{updatedCount !== 1 ? 's' : ''} updated
      </div>
    )
  }

  // Standard mode - show success confirmation
  return (
    <Alert className={cn("border-green-200 bg-green-50", className)}>
      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
      <AlertDescription className="text-green-800">
        <div className="space-y-1.5 xs:space-y-2">
          <div className="font-medium text-xs xs:text-sm sm:text-base">Update completed successfully</div>

          {updatedCount > 0 && (
            <div className="flex flex-wrap gap-1.5 xs:gap-2 text-xs xs:text-sm">
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs whitespace-nowrap">
                ✅ {updatedCount} schedule project{updatedCount !== 1 ? 's' : ''} synced
              </Badge>
              {skippedCount > 0 && (
                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-xs whitespace-nowrap">
                  ⏭️ {skippedCount} skipped
                </Badge>
              )}
            </div>
          )}

          {updatedCount === 0 && skippedCount === 0 && (
            <div className="text-xs xs:text-sm text-green-700 leading-snug">
              No additional items required updates
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
})

StatusCoordinationDisplay.displayName = 'StatusCoordinationDisplay'