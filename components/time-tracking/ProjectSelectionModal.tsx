// ==============================================
// components/time-tracking/ProjectSelectionModal.tsx - COMPLETE FIXED VERSION
// Only shows schedule project dropdown when schedule projects exist and user is assigned
// ==============================================

"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  Play,
  AlertCircle,
  Loader2,
  CheckCircle,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Import types and hooks
import { useClockInOut } from "@/hooks/time-tracking"
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
  description: string
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
  const { clockIn, scheduleProjects, error, clearError } = useClockInOut()

  // ==============================================
  // LOCAL STATE
  // ==============================================
  const [formData, setFormData] = useState<ClockInFormData>({
    projectId: '',
    scheduleProjectId: 'none',
    description: '',
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
        scheduleProjectId: 'none',
        description: '',
      })
      setSelectedProject(null)
      clearError()
    }
  }, [isOpen, clearError])

  // Filter schedule projects by selected project's ID
  useEffect(() => {
    if (formData.projectId && scheduleProjects.length > 0) {
      // Filter schedule projects that belong to the selected project
      // AND where the user is assigned (already filtered by backend)
      const filtered = scheduleProjects.filter(sp => sp.projectId === formData.projectId)
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
  const handleInputChange = (field: keyof ClockInFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear schedule project if project changes
    if (field === 'projectId') {
      setFormData(prev => ({
        ...prev,
        scheduleProjectId: 'none'
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

      // Prepare simplified clock in data
      const clockInData = {
        projectId: formData.projectId,
        scheduleProjectId: formData.scheduleProjectId !== 'none' ? formData.scheduleProjectId : undefined,  // Changed
        description: formData.description || undefined,
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
  const selectedScheduleProject = formData.scheduleProjectId && formData.scheduleProjectId !== 'none'
    ? filteredScheduleProjects.find(sp => sp.id === formData.scheduleProjectId)
    : null

  // ==============================================
  // RENDER
  // ==============================================
  return ( 
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
            <Play className="h-4 w-4 xs:h-5 xs:w-5 text-green-600 shrink-0" />
            Clock In to Project
          </DialogTitle>
          <DialogDescription className="text-xs xs:text-sm leading-snug xs:leading-normal">
            Select a project and optional task to start tracking your time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 xs:space-y-4">
          {/* Project Selection - REQUIRED */}
          <div className="space-y-1.5 xs:space-y-2">
            <Label htmlFor="project" className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base">
              <Building2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
              Project *
            </Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) => handleInputChange('projectId', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-9 xs:h-10 text-sm xs:text-base">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-1.5 xs:gap-2">
                      <span className="text-sm xs:text-base">{project.name}</span>
                      {project.status === 'in_progress' && (
                        <CheckCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-green-500 shrink-0" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Schedule Project Selection - ONLY SHOW IF THERE ARE SCHEDULE PROJECTS */}
          {formData.projectId && filteredScheduleProjects.length > 0 && (
            <div className="space-y-1.5 xs:space-y-2">
              <Label htmlFor="scheduleProject" className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base">
                <Calendar className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                Scheduled Task (Optional)
              </Label>
              <Select
                value={formData.scheduleProjectId}
                onValueChange={(value) => handleInputChange('scheduleProjectId', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-9 xs:h-10 text-sm xs:text-base">
                  <SelectValue placeholder="Select a scheduled task or skip for general work" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-gray-500 text-sm xs:text-base">General project work (no specific task)</span>
                  </SelectItem>
                  {filteredScheduleProjects.map((scheduleProject) => (
                    <SelectItem key={scheduleProject.id} value={scheduleProject.id}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm xs:text-base">{scheduleProject.title}</span>
                        <div className="flex gap-1.5 xs:gap-2 text-xs text-gray-500 flex-wrap">
                          {scheduleProject.trade && <span>Trade: {scheduleProject.trade}</span>}
                          {scheduleProject.priority && <span>• Priority: {scheduleProject.priority}</span>}
                          <span>• {scheduleProject.status}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 flex items-center gap-1 leading-snug">
                <Info className="h-3 w-3 shrink-0" />
                {filteredScheduleProjects.length} task(s) assigned to you in this project
              </p>
            </div>
          )}

          {/* Info message when project selected but no schedule projects */}
          {formData.projectId && filteredScheduleProjects.length === 0 && (
            <div className="text-sm text-gray-600 p-2.5 xs:p-3 bg-gray-50 rounded border border-gray-200">
              <p className="font-medium flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm">
                <Info className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                No scheduled tasks assigned
              </p>
              <p className="text-xs mt-1 leading-snug">
                You'll be working on general project activities.
              </p>
            </div>
          )}

          {/* Description - OPTIONAL */}
          <div className="space-y-1.5 xs:space-y-2">
            <Label htmlFor="description" className="text-sm xs:text-base">Work Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of what you'll be working on..."
              disabled={isSubmitting}
              rows={2}
              maxLength={500}
              className="text-sm xs:text-base resize-none"
            />
            <p className="text-xs text-gray-500 leading-snug">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Selected Project Summary */}
          {selectedProject && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 xs:p-4">
                <div className="space-y-1.5 xs:space-y-2">
                  <div className="flex items-center gap-1.5 xs:gap-2">
                    <Building2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-blue-600 shrink-0" />
                    <span className="font-medium text-blue-900 text-sm xs:text-base leading-snug">{selectedProject.name}</span>
                  </div>
                  {selectedScheduleProject && (
                    <div className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm text-blue-700">
                      <Calendar className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                      <span className="leading-snug">{selectedScheduleProject.title}</span>
                    </div>
                  )}
                  {!selectedScheduleProject && formData.projectId && (
                    <div className="text-xs xs:text-sm text-blue-700 flex items-center gap-1 leading-snug">
                      <CheckCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                      <span>Working on general project activities</span>
                    </div>
                  )}
                  {formData.description && (
                    <p className="text-xs xs:text-sm text-blue-700 mt-1.5 xs:mt-2 pt-1.5 xs:pt-2 border-t border-blue-300 leading-snug">
                      {formData.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm xs:text-base leading-snug">{error}</AlertDescription>
            </Alert>
          )}

          {/* Dialog Footer */}
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
              className="bg-green-600 hover:bg-green-700 w-full xs:w-auto h-9 xs:h-10 text-sm xs:text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Play className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
                  <span>Start Work</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ProjectSelectionModal