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
      <div className={cn("bg-green-50 border border-green-200 rounded-lg p-3", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-medium text-green-800 text-sm">
              {session.projectName}
            </span>
          </div>
          <div className="flex items-center gap-1 text-green-700">
            <Timer className="h-3 w-3" />
            <span className="font-mono text-sm font-semibold">{duration}</span>
          </div>
        </div>
        
        {session.scheduleProjectTitle && (
          <div className="mt-1 text-xs text-green-600">
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
    <div className={cn("bg-green-50 border border-green-200 rounded-lg p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="font-semibold text-green-800">Currently Working</span>
        </div>
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
          <Activity className="h-3 w-3 mr-1" />
          Active
        </Badge>
      </div>

      {/* Session Details */}
      <div className="space-y-3">
        {/* Project Information */}
        <div className="flex items-center gap-3">
          <Building2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-green-800 truncate">
              {session.projectName}
            </div>
            {session.scheduleProjectTitle && (
              <div className="text-sm text-green-600 truncate">
                {session.scheduleProjectTitle}
              </div>
            )}
          </div>
        </div>

        {/* Time Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-xs text-green-600">Started</div>
              <div className="font-medium text-green-800">{startTime}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-xs text-green-600">Duration</div>
              <div className="font-mono font-semibold text-green-800">{duration}</div>
            </div>
          </div>
        </div>

        {/* Work Type and Trade */}
        {(session.workType || session.trade) && (
          <div className="flex items-center gap-2 flex-wrap">
            <Briefcase className="h-4 w-4 text-green-600" />
            <div className="flex gap-2 flex-wrap">
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

      {/* Progress Indicator */}
      <div className="mt-4 pt-3 border-t border-green-200">
        <div className="flex items-center justify-between text-xs text-green-600">
          <span>Session Progress</span>
          <span>Live tracking active</span>
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