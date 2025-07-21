// ==============================================
// app/(dashboard)/dashboard/projects/[id]/components/TaskCreateDialog.tsx
// Task Creation Dialog - Following Team Management Pattern
// ==============================================

"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertCircle,
  CheckCircle,
  Calendar,
  Clock,
  Users,
  Briefcase,
  Target,
  FileText,
  Loader2,
  Plus,
  X,
} from "lucide-react"

// Import hooks and types
import { useCreateScheduleProject } from "@/hooks/schedule-projects"
import { useTeamMembers } from "@/hooks/team-members"
import type { CreateScheduleProjectFormData, CreateScheduleProjectData } from "@/types/schedule-projects"

// ==============================================
// INTERFACES
// ==============================================
interface TaskCreateDialogProps {
  projectId: string
  projectName: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// ==============================================
// CONSTANTS
// ==============================================
const TRADE_OPTIONS = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'framing', label: 'Framing' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'general', label: 'General' },
  { value: 'management', label: 'Management' },
  { value: 'safety', label: 'Safety' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'critical', label: 'Critical', color: 'text-red-600' },
]

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
]

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
const getDefaultFormData = (projectId: string): CreateScheduleProjectFormData => ({
  title: '',
  description: '',
  projectId: projectId,
  tradeRequired: '',
  
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  estimatedHours: undefined,
  
  assignedProjectMemberIds: [],
  priority: 'medium',
  status: 'planned',
  location: '',
  notes: '',
  dependsOn: [],
  
  currentStep: 1,
  completedSteps: [],
})

// ==============================================
// MAIN COMPONENT
// ==============================================
export const TaskCreateDialog: React.FC<TaskCreateDialogProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  // ==============================================
  // STATE
  // ==============================================
  const [formData, setFormData] = useState<CreateScheduleProjectFormData>(() => 
    getDefaultFormData(projectId)
  )
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})

  // ==============================================
  // HOOKS
  // ==============================================
  const {
    createScheduleProject,
    isLoading,
    isSuccess,
    isError,
    result,
    errors: apiErrors,
    reset,
  } = useCreateScheduleProject()

  const { teamMembers, isLoading: isTeamLoading } = useTeamMembers()

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  
  // Get project team members (members assigned to this project)
  const projectTeamMembers = useMemo(() => {
    return teamMembers.filter(member => 
      member.isActive && 
      member.currentProjects?.some(project => project.id === projectId)
    )
  }, [teamMembers, projectId])

  const canSubmit = useMemo(() => {
    return Boolean(
      formData.title.trim() &&
      formData.startDate &&
      formData.endDate &&
      formData.assignedProjectMemberIds.length > 0 &&
      !isLoading
    )
  }, [formData, isLoading])

  const displayError = localErrors.general || (apiErrors ? Object.values(apiErrors)[0] : null)

  // ==============================================
  // EFFECTS
  // ==============================================
  
  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData(getDefaultFormData(projectId))
      setLocalErrors({})
      reset()
    }
  }, [isOpen, projectId, reset])

  // Handle success
  useEffect(() => {
    if (isSuccess && result) {
      onSuccess()
    }
  }, [isSuccess, result, onSuccess])

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  
  const updateFormData = (field: keyof CreateScheduleProjectFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    
    // Clear field error when user starts typing
    if (localErrors[field]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleTeamMemberToggle = (memberId: string, checked: boolean) => {
    const currentMembers = formData.assignedProjectMemberIds
    const newMembers = checked
      ? [...currentMembers, memberId]
      : currentMembers.filter(id => id !== memberId)
    
    updateFormData('assignedProjectMemberIds', newMembers)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = 'Task title is required'
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required'
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required'
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      
      if (endDate < startDate) {
        errors.endDate = 'End date must be on or after start date'
      }

      // If same day and both times provided, validate times
      if (formData.startTime && formData.endTime && 
          formData.startDate === formData.endDate &&
          formData.endTime <= formData.startTime) {
        errors.endTime = 'End time must be after start time for same-day work'
      }
    }

    if (formData.assignedProjectMemberIds.length === 0) {
      errors.assignedProjectMemberIds = 'At least one team member must be assigned'
    }

    if (formData.estimatedHours && formData.estimatedHours < 0) {
      errors.estimatedHours = 'Estimated hours cannot be negative'
    }

    setLocalErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      // Transform form data to API data format
      const apiData = {
        projectId: formData.projectId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        assignedProjectMemberIds: formData.assignedProjectMemberIds,
        tradeRequired: formData.tradeRequired || undefined, // Convert empty string to undefined
        status: formData.status,
        priority: formData.priority,
        estimatedHours: formData.estimatedHours,
        dependsOn: formData.dependsOn.length > 0 ? formData.dependsOn : undefined,
        location: formData.location.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      }

      await createScheduleProject(apiData)
    } catch (error) {
      console.error('Failed to create schedule project:', error)
      setLocalErrors({ general: 'Failed to create task. Please try again.' })
    }
  }

  const handleClose = () => {
    if (isLoading) return // Prevent closing while creating
    onClose()
  }

  // ==============================================
  // RENDER
  // ==============================================
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Task
          </DialogTitle>
          <DialogDescription>
            Create a new scheduled task for {projectName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {displayError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {isSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Task created successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Task Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="Enter task title..."
                  className={localErrors.title ? 'border-red-500' : ''}
                />
                {localErrors.title && (
                  <p className="text-sm text-red-600">{localErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Describe the work to be done..."
                  rows={3}
                />
              </div>

              {/* Trade Required */}
              <div className="space-y-2">
                <Label>Trade Required</Label>
                <Select
                  value={formData.tradeRequired || undefined}
                  onValueChange={(value) => updateFormData('tradeRequired', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trade specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific trade required</SelectItem>
                    {TRADE_OPTIONS.map((trade) => (
                      <SelectItem key={trade.value} value={trade.value}>
                        {trade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Timing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Schedule & Timing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateFormData('startDate', e.target.value)}
                    className={localErrors.startDate ? 'border-red-500' : ''}
                  />
                  {localErrors.startDate && (
                    <p className="text-sm text-red-600">{localErrors.startDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => updateFormData('endDate', e.target.value)}
                    className={localErrors.endDate ? 'border-red-500' : ''}
                  />
                  {localErrors.endDate && (
                    <p className="text-sm text-red-600">{localErrors.endDate}</p>
                  )}
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => updateFormData('startTime', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => updateFormData('endTime', e.target.value)}
                    className={localErrors.endTime ? 'border-red-500' : ''}
                  />
                  {localErrors.endTime && (
                    <p className="text-sm text-red-600">{localErrors.endTime}</p>
                  )}
                </div>
              </div>

              {/* Estimated Hours */}
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min="0"
                  step="0.25"
                  value={formData.estimatedHours || ''}
                  onChange={(e) => updateFormData('estimatedHours', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0.00"
                  className={localErrors.estimatedHours ? 'border-red-500' : ''}
                />
                {localErrors.estimatedHours && (
                  <p className="text-sm text-red-600">{localErrors.estimatedHours}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignment & Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Team Assignment
              </CardTitle>
              <CardDescription>
                Select team members to assign to this task
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Members */}
              {isTeamLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
                      <div className="w-4 h-4 bg-gray-200 rounded" />
                      <div className="w-8 h-8 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="w-32 h-4 bg-gray-200 rounded mb-1" />
                        <div className="w-20 h-3 bg-gray-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : projectTeamMembers.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No team members are assigned to this project yet. 
                    Please assign team members to the project first.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {projectTeamMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        checked={formData.assignedProjectMemberIds.includes(member.id)}
                        onCheckedChange={(checked) => handleTeamMemberToggle(member.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-2">
                          {member.tradeSpecialty && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {member.tradeSpecialty}
                            </div>
                          )}
                          {member.jobTitle && (
                            <span>• {member.jobTitle}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {localErrors.assignedProjectMemberIds && (
                <p className="text-sm text-red-600">{localErrors.assignedProjectMemberIds}</p>
              )}
            </CardContent>
          </Card>

          {/* Priority & Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Priority & Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => updateFormData('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-current ${priority.color}`} />
                            {priority.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Initial Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => updateFormData('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  placeholder="Specific location within the project site..."
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  placeholder="Additional notes, special instructions, or requirements..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Task...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}