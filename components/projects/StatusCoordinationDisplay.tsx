"use client"

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { 
  StatusCoordinationResult, 
  CoordinatedProjectStatusResult 
} from '@/types/projects/status-coordination'

interface StatusCoordinationDisplayProps {
  result: StatusCoordinationResult | CoordinatedProjectStatusResult | null
  isUpdating: boolean
  className?: string
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
  className
}) => {
  // Show loading state
  if (isUpdating) {
    return (
      <Alert className={cn("border-blue-200 bg-blue-50", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="text-blue-800">
          Coordinating status across modules...
        </AlertDescription>
      </Alert>
    )
  }

  // Show coordination results - handle both result types
  if (result?.success && result.data) {
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
    
    return (
      <Alert className={cn("border-green-200 bg-green-50", className)}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="space-y-2">
            <div className="font-medium">Status coordination completed successfully!</div>
            
            <div className="flex flex-wrap gap-2 text-sm">
              {updatedCount > 0 && (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  ✅ {updatedCount} schedule project{updatedCount !== 1 ? 's' : ''} updated
                </Badge>
              )}
              
              {skippedCount > 0 && (
                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                  ⏭️ {skippedCount} schedule project{skippedCount !== 1 ? 's' : ''} skipped
                </Badge>
              )}
            </div>

            {scheduleProjects?.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-green-700 hover:text-green-900">
                  View updated schedule projects
                </summary>
                <ul className="mt-2 ml-4 space-y-1 list-disc">
                  {scheduleProjects.map((schedule) => (
                    <li key={schedule.id}>
                      <span className="font-medium">{schedule.title}</span>
                      <span className="text-gray-600"> → {schedule.status}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Show error state
  if (result && !result.success) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {result.error || result.message || 'Status coordination failed'}
        </AlertDescription>
      </Alert>
    )
  }

  return null
})

StatusCoordinationDisplay.displayName = 'StatusCoordinationDisplay'