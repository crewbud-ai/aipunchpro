// ==============================================
// components/time-tracking/CurrentSessionDisplay.tsx - Active Session Display
// ==============================================

"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  Briefcase,
  Timer,
  Activity
} from "lucide-react"
import { cn } from "@/lib/utils"

// ==============================================
// INTERFACES
// ==============================================
interface CurrentSessionDisplayProps {
  session: {
    id: string
    projectId: string
    scheduleProjectId?: string
    projectName: string
    scheduleProjectTitle?: string
    startTime: string
    duration: number
    workType?: string
    trade?: string
  }
  duration: string
  compact?: boolean
  className?: string
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export function CurrentSessionDisplay({
  session,
  duration,
  compact = false,
  className
}: CurrentSessionDisplayProps) {
  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const startTime = new Date(`1970-01-01T${session.startTime}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  const workTypeLabel = session.workType ?
    session.workType.charAt(0).toUpperCase() + session.workType.slice(1) :
    'General Work'

  const tradeLabel = session.trade ?
    session.trade.charAt(0).toUpperCase() + session.trade.slice(1) :
    null

  // ==============================================
  // RENDER COMPACT VERSION
  // ==============================================
  if (compact) {
    return (
      <div className={cn("bg-green-50 border border-green-200 rounded-lg p-2.5 xs:p-3", className)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 xs:gap-2 min-w-0 flex-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
            <span className="font-medium text-green-800 text-xs xs:text-sm truncate">
              {session.projectName}
            </span>
          </div>
          <div className="flex items-center gap-1 text-green-700 shrink-0">
            <Timer className="h-3 w-3 shrink-0" />
            <span className="font-mono text-xs xs:text-sm font-semibold">{duration}</span>
          </div>
        </div>

        {session.scheduleProjectTitle && (
          <div className="mt-1 text-xs text-green-600 leading-snug truncate">
            {session.scheduleProjectTitle}
          </div>
        )}
      </div>
    )
  }

  // ==============================================
  // RENDER FULL VERSION
  // ==============================================
  return (
    <div className={cn("bg-green-50 border border-green-200 rounded-lg p-3 xs:p-4", className)}>
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 mb-2.5 xs:mb-3">
        <div className="flex items-center gap-1.5 xs:gap-2">
          <div className="w-2.5 h-2.5 xs:w-3 xs:h-3 bg-green-500 rounded-full animate-pulse shrink-0" />
          <span className="font-semibold text-sm xs:text-base text-green-800">Currently Working</span>
        </div>
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs self-start xs:self-auto">
          <Activity className="h-3 w-3 mr-1 shrink-0" />
          Active
        </Badge>
      </div>

      {/* Session Details - Mobile Responsive */}
      <div className="space-y-2.5 xs:space-y-3">
        {/* Project Information */}
        <div className="flex items-center gap-2 xs:gap-3">
          <Building2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm xs:text-base text-green-800 truncate leading-snug">
              {session.projectName}
            </div>
            {session.scheduleProjectTitle && (
              <div className="text-xs xs:text-sm text-green-600 truncate leading-snug mt-0.5">
                {session.scheduleProjectTitle}
              </div>
            )}
          </div>
        </div>

        {/* Time Information - Mobile Responsive */}
        <div className="grid grid-cols-2 gap-3 xs:gap-4">
          <div className="flex items-center gap-1.5 xs:gap-2">
            <Clock className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-green-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-green-600">Started</div>
              <div className="font-medium text-xs xs:text-sm text-green-800 leading-snug truncate">{startTime}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 xs:gap-2">
            <Timer className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-green-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-green-600">Duration</div>
              <div className="font-mono font-semibold text-xs xs:text-sm text-green-800 leading-snug">{duration}</div>
            </div>
          </div>
        </div>

        {/* Work Type and Trade - Mobile Responsive */}
        {(session.workType || session.trade) && (
          <div className="flex items-start gap-1.5 xs:gap-2">
            <Briefcase className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-green-600 shrink-0 mt-0.5" />
            <div className="flex gap-1.5 xs:gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                {workTypeLabel}
              </Badge>
              {tradeLabel && (
                <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                  {tradeLabel}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress Indicator - Mobile Responsive */}
      <div className="mt-3 xs:mt-4 pt-2.5 xs:pt-3 border-t border-green-200">
        <div className="flex items-center justify-between text-xs text-green-600 mb-1">
          <span>Session Progress</span>
          <span className="hidden xs:inline">Live tracking active</span>
          <span className="xs:hidden">Live</span>
        </div>
        <div className="mt-1 h-1 bg-green-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  )
}

// ==============================================
// EXPORTS
// ==============================================
export default CurrentSessionDisplay