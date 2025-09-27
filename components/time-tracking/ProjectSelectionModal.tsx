// ==============================================
// components/time-tracking/ProjectSelectionModal.tsx - Project Selection for Clock In
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  Calendar,
  MapPin,
  Briefcase,
  Play,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Import types and hooks
import { useClockInOut } from "@/hooks/time-tracking"
import { WORK_TYPE_OPTIONS, TRADE_TYPE_OPTIONS } from "@/types/time-tracking"
import type { ProjectForClockIn, ScheduleProjectForClockIn } from "@/types/time-tracking"

// ==============================================
// INTERFACES
// ==============================================
interface ProjectSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  projects: ProjectForClockIn[]
  isLoading?: boolean
}

interface ClockInFormData {
  projectId: string
  scheduleProjectId: string
  workType: string
  trade: string
  description: string
  useLocation: boolean
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export function ProjectSelectionModal({
  isOpen,
  onClose,
  onSuccess,
  projects,
  isLoading = false
}: ProjectSelectionModalProps) {
  // ==============================================
  // HOOKS
  // ==============================================
  const { clockIn, scheduleProjects, userInfo, error, clearError } = useClockInOut()

  // ==============================================
  // LOCAL STATE
  // ==============================================
  const [formData, setFormData] = useState<ClockInFormData>({
    projectId: '',
    scheduleProjectId: '',
    workType: '',
    trade: '',
    description: '',
    useLocation: false,
  })
  
  const [selectedProject, setSelectedProject] = useState<ProjectForClockIn | null>(null)
  const [filteredScheduleProjects, setFilteredScheduleProjects] = useState<ScheduleProjectForClockIn[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ==============================================
  // EFFECTS
  // ==============================================
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        projectId: '',
        scheduleProjectId: '',
        workType: userInfo?.tradeSpecialty || '',
        trade: userInfo?.tradeSpecialty || '',
        description: '',
        useLocation: false,
      })
      setSelectedProject(null)
      clearError()
    }
  }, [isOpen, userInfo, clearError])

  // Filter schedule projects based on selected project
  useEffect(() => {
    if (formData.projectId) {
      const filtered = scheduleProjects.filter(sp => sp.id === formData.projectId)
      setFilteredScheduleProjects(filtered)
    } else {
      setFilteredScheduleProjects([])
    }
  }, [formData.projectId, scheduleProjects])

  // Update selected project when projectId changes
  useEffect(() => {
    if (formData.projectId) {
      const project = projects.find(p => p.id === formData.projectId)
      setSelectedProject(project || null)
    } else {
      setSelectedProject(null)
    }
  }, [formData.projectId, projects])

  // ==============================================
  // HANDLERS
  // ==============================================
  const handleInputChange = (field: keyof ClockInFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear schedule project if project changes
    if (field === 'projectId') {
      setFormData(prev => ({
        ...prev,
        scheduleProjectId: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.projectId) {
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

      // Prepare clock in data
      const clockInData = {
        projectId: formData.projectId,
        scheduleProjectId: formData.scheduleProjectId || undefined,
        workType: (formData.workType as any) || undefined,
        trade: (formData.trade as any) || undefined,
        description: formData.description || undefined,
        location,
      }

      const result = await clockIn(clockInData)
      
      if (result) {
        onSuccess()
      }
    } catch (err) {
      console.error('Clock in error:', err)
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
  const canSubmit = formData.projectId && !isSubmitting && !isLoading
  const selectedScheduleProject = formData.scheduleProjectId 
    ? filteredScheduleProjects.find(sp => sp.id === formData.scheduleProjectId)
    : null

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-green-600" />
            Clock In to Project
          </DialogTitle>
          <DialogDescription>
            Select a project and provide work details to start tracking your time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Project *
            </Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) => handleInputChange('projectId', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <span>{project.name}</span>
                      {project.status === 'in_progress' && (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Schedule Project Selection (Optional) */}
          {filteredScheduleProjects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="scheduleProject" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Item (Optional)
              </Label>
              <Select
                value={formData.scheduleProjectId}
                onValueChange={(value) => handleInputChange('scheduleProjectId', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a schedule item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    <span className="text-gray-500">General project work</span>
                  </SelectItem>
                  {filteredScheduleProjects.map((scheduleProject) => (
                    <SelectItem key={scheduleProject.id} value={scheduleProject.id}>
                      <div className="flex items-center gap-2">
                        <span>{scheduleProject.title}</span>
                        {scheduleProject.trade && (
                          <span className="text-xs text-gray-500">({scheduleProject.trade})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Work Type and Trade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="workType">Work Type</Label>
              <Select
                value={formData.workType}
                onValueChange={(value) => handleInputChange('workType', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade">Trade</Label>
              <Select
                value={formData.trade}
                onValueChange={(value) => handleInputChange('trade', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trade" />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Work Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what you'll be working on..."
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

          {/* Selected Project Summary */}
          {selectedProject && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{selectedProject.name}</span>
                  </div>
                  {selectedScheduleProject && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>{selectedScheduleProject.title}</span>
                    </div>
                  )}
                  {(formData.workType || formData.trade) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="h-3 w-3" />
                      <span>
                        {formData.workType && WORK_TYPE_OPTIONS.find(w => w.value === formData.workType)?.label}
                        {formData.workType && formData.trade && ' • '}
                        {formData.trade && TRADE_TYPE_OPTIONS.find(t => t.value === formData.trade)?.label}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
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
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clocking In...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Work
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
export default ProjectSelectionModal