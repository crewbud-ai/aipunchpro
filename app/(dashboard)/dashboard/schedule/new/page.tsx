// ==============================================
// app/(dashboard)/dashboard/schedule/new/page.tsx - Create New Schedule Project (Real Data)
// ==============================================

"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Building,
  Target,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  X,
  User,
  RefreshCw
} from "lucide-react"
import Link from "next/link"

// Import our real hooks and types
import { useCreateScheduleProject } from "@/hooks/schedule-projects"
import { useProjects } from "@/hooks/projects"
import { useTeamMembers } from "@/hooks/team-members"
import { 
  TRADE_REQUIRED, 
  SCHEDULE_PRIORITY, 
  SCHEDULE_STATUS,
  type CreateScheduleProjectFormData 
} from "@/types/schedule-projects"

export default function CreateSchedulePage() {
  // ==============================================
  // HOOKS FOR REAL DATA
  // ==============================================

  // Schedule project creation hook
  const {
    formData,
    errors,
    isLoading,
    isSuccess,
    isError,
    hasErrors,
    canSubmit,
    currentStep,
    totalSteps,
    canGoNext,
    canGoPrev,
    isFirstStep,
    isLastStep,
    progressPercentage,
    updateFormData,
    clearFieldError,
    createScheduleProject,
    goToNextStep,
    goToPrevStep,
    reset,
  } = useCreateScheduleProject()

  // Projects data
  const { 
    projects, 
    isLoading: isProjectsLoading, 
    hasError: hasProjectsError,
    refreshProjects 
  } = useProjects()

  // Team members data with project filtering
  const {
    teamMembers,
    activeMembers,
    isLoading: isTeamMembersLoading,
    hasError: hasTeamMembersError,
    filterByProject,
    clearFilters: clearTeamMemberFilters,
    teamMembersByTrade,
  } = useTeamMembers()

  // ==============================================
  // LOCAL STATE
  // ==============================================
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [projectTeamMembers, setProjectTeamMembers] = useState<any[]>([])

  // ==============================================
  // COMPUTED VALUES
  // ==============================================

  // Filter active projects for assignment
  const activeProjects = projects.filter(project => 
    project.status === 'in_progress' || 
    project.status === 'not_started' ||
    project.status === 'on_track'
  )

  // Get project-filtered team members (active members assigned to selected project)
  const availableTeamMembers = useMemo(() => {
    if (!formData.projectId) return []
    
    // If we have a project selected, return active team members
    // The filterByProject will have already filtered them
    return activeMembers.filter(member => 
      member.assignmentStatus === 'assigned' && member.isActive
    )
  }, [activeMembers, formData.projectId])

  // Form validation for each step
  const stepValidation = useMemo(() => {
    const step1Valid = 
      formData.title.trim().length > 0 && 
      formData.projectId.length > 0 &&
      !errors.title && !errors.projectId

    const step2Valid = 
      formData.startDate.length > 0 &&
      formData.endDate.length > 0 &&
      !errors.startDate && !errors.endDate && !errors.startTime && !errors.endTime

    const step3Valid = 
      formData.assignedProjectMemberIds.length > 0 &&
      !errors.assignedProjectMemberIds

    return {
      1: step1Valid,
      2: step2Valid,
      3: step3Valid
    }
  }, [formData, errors])

  const canProceedToNext = stepValidation[currentStep as keyof typeof stepValidation]

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  
  // Project selection handler
  const handleProjectChange = async (projectId: string) => {
    updateFormData('projectId', projectId)
    const project = activeProjects.find(p => p.id === projectId)
    setSelectedProject(project)
    
    // Reset team member selection when project changes
    updateFormData('assignedProjectMemberIds', [])
    
    // Filter team members by the selected project
    if (projectId) {
      filterByProject(projectId)
    } else {
      clearTeamMemberFilters()
    }
  }

  // Team member selection - using user IDs for project_members lookup
  const handleTeamMemberToggle = (memberId: string) => {
    const currentMembers = formData.assignedProjectMemberIds
    const newMembers = currentMembers.includes(memberId)
      ? currentMembers.filter(id => id !== memberId)
      : [...currentMembers, memberId]
    updateFormData('assignedProjectMemberIds', newMembers)
  }

  // Date handlers
  const handleStartDateChange = (startDate: string) => {
    updateFormData('startDate', startDate)
    clearFieldError('startDate')
    
    // Auto-set end date if it's empty or before start date
    if (startDate && (!formData.endDate || new Date(formData.endDate) <= new Date(startDate))) {
      const nextDay = new Date(startDate)
      nextDay.setDate(nextDay.getDate() + 1)
      updateFormData('endDate', nextDay.toISOString().split('T')[0])
    }
  }

  // Form submission
  const handleSubmit = async () => {
    if (!canSubmit) return
    await createScheduleProject()
  }

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < totalSteps && canProceedToNext) {
      goToNextStep()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      goToPrevStep()
    }
  }

  // ==============================================
  // STEP COMPONENTS
  // ==============================================
  
  // Step 1: Work Information
  const WorkInfoStep = () => (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Work Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Kitchen Electrical Installation"
          value={formData.title}
          onChange={(e) => updateFormData('title', e.target.value)}
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the work to be performed..."
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          rows={3}
        />
      </div>

      {/* Project Selection */}
      <div className="space-y-2">
        <Label htmlFor="project">
          Project <span className="text-red-500">*</span>
        </Label>
        {isProjectsLoading ? (
          <div className="flex items-center space-x-2 p-2 border rounded">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading projects...</span>
          </div>
        ) : hasProjectsError ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load projects. 
              <Button variant="link" onClick={refreshProjects} className="p-0 ml-1 h-auto">
                <RefreshCw className="h-3 w-3 mr-1" />
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <Select value={formData.projectId} onValueChange={handleProjectChange}>
            <SelectTrigger className={errors.projectId ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {activeProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{project.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
              {activeProjects.length === 0 && (
                <div className="p-2 text-sm text-gray-500">
                  No active projects available
                </div>
              )}
            </SelectContent>
          </Select>
        )}
        {errors.projectId && (
          <p className="text-sm text-red-600">{errors.projectId}</p>
        )}
      </div>

      {/* Trade Required */}
      <div className="space-y-2">
        <Label htmlFor="trade">Trade Required</Label>
        <Select value={formData.tradeRequired} onValueChange={(value) => updateFormData('tradeRequired', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select trade" />
          </SelectTrigger>
          <SelectContent>
            {TRADE_REQUIRED.map((trade) => (
              <SelectItem key={trade} value={trade}>
                {trade.charAt(0).toUpperCase() + trade.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  // Step 2: Timing
  const TimingStep = () => (
    <div className="space-y-6">
      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            Start Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className={errors.startDate ? 'border-red-500' : ''}
          />
          {errors.startDate && (
            <p className="text-sm text-red-600">{errors.startDate}</p>
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
            className={errors.endDate ? 'border-red-500' : ''}
          />
          {errors.endDate && (
            <p className="text-sm text-red-600">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => updateFormData('startTime', e.target.value)}
            className={errors.startTime ? 'border-red-500' : ''}
          />
          {errors.startTime && (
            <p className="text-sm text-red-600">{errors.startTime}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => updateFormData('endTime', e.target.value)}
            className={errors.endTime ? 'border-red-500' : ''}
          />
          {errors.endTime && (
            <p className="text-sm text-red-600">{errors.endTime}</p>
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
          max="999.99"
          step="0.25"
          placeholder="e.g., 8.5"
          value={formData.estimatedHours || ''}
          onChange={(e) => updateFormData('estimatedHours', e.target.value ? parseFloat(e.target.value) : undefined)}
        />
      </div>
    </div>
  )

  // Step 3: Assignment & Details
  const AssignmentStep = () => (
    <div className="space-y-6">
      {/* Team Member Assignment */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>
            Assign Team Members <span className="text-red-500">*</span>
          </Label>
          {selectedProject && (
            <Badge variant="outline">
              Project: {selectedProject.name}
            </Badge>
          )}
        </div>

        {!formData.projectId ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a project first to see available team members.
            </AlertDescription>
          </Alert>
        ) : isTeamMembersLoading ? (
          <div className="flex items-center space-x-2 p-4 border rounded">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading team members...</span>
          </div>
        ) : hasTeamMembersError ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load team members for this project.
            </AlertDescription>
          </Alert>
        ) : availableTeamMembers.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No team members found assigned to this project. Please assign team members to the project first.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableTeamMembers.map((member) => (
              <div key={member.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                <Checkbox
                  id={member.id}
                  checked={formData.assignedProjectMemberIds.includes(member.id)}
                  onCheckedChange={() => handleTeamMemberToggle(member.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <Label htmlFor={member.id} className="text-sm font-medium">
                      {member.firstName} {member.lastName}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    {member.tradeSpecialty && (
                      <Badge variant="secondary" className="text-xs">
                        {member.tradeSpecialty}
                      </Badge>
                    )}
                    {member.jobTitle && (
                      <span className="text-xs text-gray-500">{member.jobTitle}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {errors.assignedProjectMemberIds && (
          <p className="text-sm text-red-600">{errors.assignedProjectMemberIds}</p>
        )}
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select value={formData.priority} onValueChange={(value) => updateFormData('priority', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {SCHEDULE_PRIORITY.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="e.g., Building A - 2nd Floor"
          value={formData.location}
          onChange={(e) => updateFormData('location', e.target.value)}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes or special instructions..."
          value={formData.notes}
          onChange={(e) => updateFormData('notes', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )

  // ==============================================
  // STEP METADATA
  // ==============================================
  const getStepMetadata = (step: number) => {
    switch (step) {
      case 1:
        return {
          icon: Building,
          title: "Work Information",
          description: "Enter the basic details about the scheduled work"
        }
      case 2:
        return {
          icon: Calendar,
          title: "Timing & Duration",
          description: "Set the schedule dates, times, and estimated hours"
        }
      case 3:
        return {
          icon: Users,
          title: "Assignment & Details",
          description: "Assign team members and add additional details"
        }
      default:
        return {
          icon: Building,
          title: "Schedule Setup",
          description: "Configure your schedule project"
        }
    }
  }

  const currentStepMeta = getStepMetadata(currentStep)
  const StepIcon = currentStepMeta.icon

  // ==============================================
  // RENDER STEP CONTENT
  // ==============================================
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <WorkInfoStep />
      case 2:
        return <TimingStep />
      case 3:
        return <AssignmentStep />
      default:
        return null
    }
  }

  // ==============================================
  // MAIN RENDER
  // ==============================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/schedule">
              <Button variant="outline" size="icon" className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Create New Schedule Project</h1>
              <p className="text-gray-600 mt-1">Schedule work with team assignments and timing details</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-gray-700">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StepIcon className="h-5 w-5" />
              {currentStepMeta.title}
            </CardTitle>
            <CardDescription>
              {currentStepMeta.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Render Current Step */}
            {renderStepContent()}

            {/* Show general errors */}
            {errors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {/* Navigation Buttons */}
            <Separator />
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <div className="flex gap-3 sm:flex-1">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    className="flex-1 sm:flex-none"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                )}

                {currentStep === 1 && (
                  <Link href="/dashboard/schedule" className="flex-1 sm:flex-none">
                    <Button variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                )}
              </div>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNext}
                  className="flex-1 sm:flex-none"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex-1 sm:flex-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Create Schedule Project
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}