// ==============================================
// components/time-tracking/ClockOutModal.tsx - Clock Out Confirmation Modal
// ==============================================

"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Square,
  Clock,
  Building2,
  Timer,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Import hooks
import { useClockInOut } from "@/hooks/time-tracking"

// ==============================================
// INTERFACES
// ==============================================
interface ClockOutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentSession?: {
    id: string
    projectId: string
    scheduleProjectId?: string
    projectName: string
    scheduleProjectTitle?: string
    startTime: string
    duration: number
    workType?: string
    trade?: string
  } | null
  isLoading?: boolean
}

interface ClockOutFormData {
  description: string
  workCompleted: string
  issuesEncountered: string
  useLocation: boolean
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export function ClockOutModal({
  isOpen,
  onClose,
  onSuccess,
  currentSession,
  isLoading = false
}: ClockOutModalProps) {
  // ==============================================
  // HOOKS
  // ==============================================
  const { clockOut, error, clearError } = useClockInOut()

  // ==============================================
  // LOCAL STATE
  // ==============================================
  const [formData, setFormData] = useState<ClockOutFormData>({
    description: '',
    workCompleted: '',
    issuesEncountered: '',
    useLocation: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // ==============================================
  // EFFECTS
  // ==============================================

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        description: '',
        workCompleted: '',
        issuesEncountered: '',
        useLocation: false,
      })
      clearError()
    }
  }, [isOpen, clearError])

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const sessionDuration = currentSession ?
    Math.floor(currentSession.duration / 60) + 'h ' + (currentSession.duration % 60) + 'm' :
    '0h 0m'

  const startTime = currentSession ?
    new Date(`1970-01-01T${currentSession.startTime}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) : ''

  const endTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  // ==============================================
  // HANDLERS
  // ==============================================
  const handleInputChange = (field: keyof ClockOutFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentSession) {
      return
    }

    try {
      setIsSubmitting(true)
      clearError()

      // Get location if requested
      let location: { lat: number; lng: number } | undefined
      if (formData.useLocation && 'geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: true
            })
          })
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        } catch (err) {
          console.warn('Could not get location:', err)
        }
      }

      // Prepare clock out data
      const clockOutData = {
        description: formData.description || undefined,
        workCompleted: formData.workCompleted || undefined,
        issuesEncountered: formData.issuesEncountered || undefined,
        location,
      }

      const result = await clockOut(clockOutData)

      if (result) {
        onSuccess()
      }
    } catch (err) {
      console.error('Clock out error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const canSubmit = currentSession && !isSubmitting && !isLoading

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-scroll flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
            <Square className="h-4 w-4 xs:h-5 xs:w-5 text-red-600 shrink-0" />
            Clock Out
          </DialogTitle>
          <DialogDescription className="text-xs xs:text-sm leading-snug xs:leading-normal">
            Confirm your work session details before clocking out.
          </DialogDescription>
        </DialogHeader>

        {/* Session Summary - Mobile Responsive */}
        {currentSession && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 xs:p-4">
              <div className="space-y-2.5 xs:space-y-3">
                {/* Project Info */}
                <div className="flex items-start gap-1.5 xs:gap-2">
                  <Building2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm xs:text-base text-blue-800 leading-snug">{currentSession.projectName}</div>
                    {currentSession.scheduleProjectTitle && (
                      <div className="text-xs xs:text-sm text-blue-600 leading-snug mt-0.5">{currentSession.scheduleProjectTitle}</div>
                    )}
                  </div>
                </div>

                {/* Time Summary */}
                <div className="grid grid-cols-3 gap-2.5 xs:gap-3 sm:gap-4 text-center">
                  <div>
                    <div className="text-xs text-blue-600">Started</div>
                    <div className="font-medium text-xs xs:text-sm text-blue-800 leading-snug mt-0.5">{startTime}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600">Duration</div>
                    <div className="font-mono font-semibold text-xs xs:text-sm text-blue-800 leading-snug mt-0.5">{sessionDuration}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600">Ending</div>
                    <div className="font-medium text-xs xs:text-sm text-blue-800 leading-snug mt-0.5">{endTime}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 xs:space-y-4">
          {/* Work Description - Mobile Responsive */}
          <div className="space-y-1.5 xs:space-y-2">
            <Label htmlFor="description" className="text-sm xs:text-base">Work Summary (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Briefly describe what you worked on today..."
              disabled={isSubmitting}
              rows={2}
              className="text-sm xs:text-base resize-none"
            />
          </div>

          {/* Work Completed - Mobile Responsive */}
          <div className="space-y-1.5 xs:space-y-2">
            <Label htmlFor="workCompleted" className="text-sm xs:text-base">Work Completed (Optional)</Label>
            <Textarea
              id="workCompleted"
              value={formData.workCompleted}
              onChange={(e) => handleInputChange('workCompleted', e.target.value)}
              placeholder="What tasks did you complete?"
              disabled={isSubmitting}
              rows={2}
              className="text-sm xs:text-base resize-none"
            />
          </div>

          {/* Issues Encountered - Mobile Responsive */}
          <div className="space-y-1.5 xs:space-y-2">
            <Label htmlFor="issuesEncountered" className="text-sm xs:text-base">Issues or Notes (Optional)</Label>
            <Textarea
              id="issuesEncountered"
              value={formData.issuesEncountered}
              onChange={(e) => handleInputChange('issuesEncountered', e.target.value)}
              placeholder="Any issues, blockers, or important notes?"
              disabled={isSubmitting}
              rows={2}
              className="text-sm xs:text-base resize-none"
            />
          </div>

          {/* Location Option - Mobile Responsive */}
          <div className="flex items-center gap-1.5 xs:gap-2">
            <input
              type="checkbox"
              id="useLocation"
              checked={formData.useLocation}
              onChange={(e) => handleInputChange('useLocation', e.target.checked)}
              disabled={isSubmitting}
              className="rounded h-4 w-4"
            />
            <Label htmlFor="useLocation" className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm cursor-pointer">
              <MapPin className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
              Include my location
            </Label>
          </div>

          {/* Error Display - Mobile Responsive */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm xs:text-base leading-snug">{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Preview - Mobile Responsive */}
          {currentSession && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm xs:text-base leading-snug">
                You've worked {sessionDuration} today. Time will be submitted for approval.
              </AlertDescription>
            </Alert>
          )}

          {/* Dialog Footer - Mobile Responsive */}
          <DialogFooter className="gap-2 flex-col xs:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full xs:w-auto h-9 xs:h-10 text-sm xs:text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              variant="destructive"
              className="w-full xs:w-auto h-9 xs:h-10 text-sm xs:text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin" />
                  <span>Clocking Out...</span>
                </>
              ) : (
                <>
                  <Square className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
                  <span>End Work Day</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==============================================
// EXPORTS
// ==============================================
export default ClockOutModal