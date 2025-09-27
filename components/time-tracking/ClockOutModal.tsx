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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Square className="h-5 w-5 text-red-600" />
            Clock Out
          </DialogTitle>
          <DialogDescription>
            Confirm your work session details before clocking out.
          </DialogDescription>
        </DialogHeader>

        {/* Session Summary */}
        {currentSession && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="space-y-3">
                {/* Project Info */}
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-800">{currentSession.projectName}</div>
                    {currentSession.scheduleProjectTitle && (
                      <div className="text-sm text-blue-600">{currentSession.scheduleProjectTitle}</div>
                    )}
                  </div>
                </div>

                {/* Time Summary */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-blue-600">Started</div>
                    <div className="font-medium text-blue-800">{startTime}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600">Duration</div>
                    <div className="font-mono font-semibold text-blue-800">{sessionDuration}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600">Ending</div>
                    <div className="font-medium text-blue-800">{endTime}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Work Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Work Summary (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Briefly describe what you worked on today..."
              disabled={isSubmitting}
              rows={2}
            />
          </div>

          {/* Work Completed */}
          <div className="space-y-2">
            <Label htmlFor="workCompleted">Work Completed (Optional)</Label>
            <Textarea
              id="workCompleted"
              value={formData.workCompleted}
              onChange={(e) => handleInputChange('workCompleted', e.target.value)}
              placeholder="What tasks did you complete?"
              disabled={isSubmitting}
              rows={2}
            />
          </div>

          {/* Issues Encountered */}
          <div className="space-y-2">
            <Label htmlFor="issuesEncountered">Issues or Notes (Optional)</Label>
            <Textarea
              id="issuesEncountered"
              value={formData.issuesEncountered}
              onChange={(e) => handleInputChange('issuesEncountered', e.target.value)}
              placeholder="Any issues, blockers, or important notes?"
              disabled={isSubmitting}
              rows={2}
            />
          </div>

          {/* Location Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useLocation"
              checked={formData.useLocation}
              onChange={(e) => handleInputChange('useLocation', e.target.checked)}
              disabled={isSubmitting}
              className="rounded"
            />
            <Label htmlFor="useLocation" className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Include my location
            </Label>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Preview */}
          {currentSession && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You've worked {sessionDuration} today. Time will be submitted for approval.
              </AlertDescription>
            </Alert>
          )}

          {/* Dialog Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              variant="destructive"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clocking Out...
                </>
              ) : (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  End Work Day
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