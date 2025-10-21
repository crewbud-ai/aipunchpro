// ==============================================
// app/(dashboard)/dashboard/schedule/new/page.tsx - UPDATED VERSION
// ==============================================

"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Calendar,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Building,
    Users,
    AlertCircle,
    CheckCircle,
    Loader2,
    X,
} from "lucide-react"
import Link from "next/link"

// Import our real hooks and types
import { useCreateScheduleProject } from "@/hooks/schedule-projects"
import { useProjects } from "@/hooks/projects"
import { useTeamMembers } from "@/hooks/team-members"

// Import sub-components (like projects structure)
import { WorkInfoStep, TimingStep, AssignmentStep } from "../components/forms"

export default function CreateSchedulePage() {
    // ==============================================
    // HOOKS FOR REAL DATA
    // ==============================================

    // Schedule project creation hook
    const {
        formData,
        errors,
        isLoading,
        canSubmit,
        currentStep,
        totalSteps,
        progressPercentage,
        updateFormData,
        clearFieldError,
        createScheduleProject,
        goToNextStep,
        goToPrevStep,
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
        activeMembers,
        isLoading: isTeamMembersLoading,
        hasError: hasTeamMembersError,
        filterByProject,
        clearFilters: clearTeamMemberFilters,
    } = useTeamMembers()

    // ==============================================
    // LOCAL STATE
    // ==============================================
    const [selectedProject, setSelectedProject] = useState<any>(null)

    // ==============================================
    // COMPUTED VALUES
    // ==============================================

    // Filter active projects for assignment
    const activeProjects = useMemo(() => projects.filter(project =>
        project.status === 'in_progress' ||
        project.status === 'not_started' ||
        project.status === 'on_track'
    ), [projects])

    // Get project-filtered team members
    const availableTeamMembers = useMemo(() => {
        if (!formData.projectId) return []
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
    // EVENT HANDLERS - MEMOIZED
    // ==============================================

    // Project selection handler
    const handleProjectChange = React.useCallback(async (projectId: string) => {
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
    }, [updateFormData, activeProjects, filterByProject, clearTeamMemberFilters])

    // Team member selection
    const handleTeamMemberToggle = React.useCallback((memberId: string) => {
        const currentMembers = formData.assignedProjectMemberIds
        const newMembers = currentMembers.includes(memberId)
            ? currentMembers.filter(id => id !== memberId)
            : [...currentMembers, memberId]
        updateFormData('assignedProjectMemberIds', newMembers)
    }, [formData.assignedProjectMemberIds, updateFormData])

    // Date handlers
    const handleStartDateChange = React.useCallback((startDate: string) => {
        updateFormData('startDate', startDate)
        clearFieldError('startDate')

        // Auto-set end date if it's empty or before start date
        if (startDate && (!formData.endDate || new Date(formData.endDate) <= new Date(startDate))) {
            const nextDay = new Date(startDate)
            nextDay.setDate(nextDay.getDate() + 1)
            updateFormData('endDate', nextDay.toISOString().split('T')[0])
        }
    }, [updateFormData, clearFieldError, formData.endDate])

    // Form submission
    const handleSubmit = React.useCallback(async () => {
        if (!canSubmit) return
        await createScheduleProject()
    }, [canSubmit, createScheduleProject])

    // Navigation handlers
    const handleNext = React.useCallback(() => {
        if (currentStep < totalSteps && canProceedToNext) {
            goToNextStep()
        }
    }, [currentStep, totalSteps, canProceedToNext, goToNextStep])

    const handlePrevious = React.useCallback(() => {
        if (currentStep > 1) {
            goToPrevStep()
        }
    }, [currentStep, goToPrevStep])

    // ==============================================
    // STEP PROPS - PREPARED OUTSIDE RENDER
    // ==============================================
    const step1Props = {
        formData,
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void, // Type cast
        clearFieldError,
        activeProjects,
        isProjectsLoading,
        hasProjectsError,
        refreshProjects,
        handleProjectChange,
    }

    const step2Props = {
        formData,
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void, // Type cast
        clearFieldError,
        handleStartDateChange,
    }

    const step3Props = {
        formData,
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void, // Type cast
        clearFieldError,
        selectedProject,
        isTeamMembersLoading,
        hasTeamMembersError,
        availableTeamMembers,
        handleTeamMemberToggle,
    }

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
                return <WorkInfoStep {...step1Props} />
            case 2:
                return <TimingStep {...step2Props} />
            case 3:
                return <AssignmentStep {...step3Props} />
            default:
                return null
        }
    }

    // ==============================================
    // MAIN RENDER
    // ==============================================
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-start xs:items-center gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4">
                        <Link href="/dashboard/schedule">
                            <Button variant="outline" size="icon" className="shrink-0 h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10">
                                <ArrowLeft className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                            </Button>
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                                Create New Schedule Project
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 mt-1">
                                Schedule work with team assignments and timing details
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm font-medium text-gray-700">
                            <span>Step {currentStep} of {totalSteps}</span>
                            <span className="hidden xs:inline">{Math.round(progressPercentage)}% Complete</span>
                            <span className="xs:hidden">{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-1.5 sm:h-2" />
                    </div>
                </div>

                {/* Form Card */}
                <Card>
                    <form>
                        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">

                            {/* Render Current Step */}
                            {renderStepContent()}

                            {/* Show general errors */}
                            {errors.general && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <AlertDescription className="text-sm sm:text-base">
                                        {errors.general}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Navigation Buttons */}
                            <Separator />
                            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 pt-4 sm:pt-6">
                                <div className="flex gap-2 sm:gap-3 order-2 md:order-1">
                                    {currentStep > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handlePrevious}
                                            className="h-10 sm:h-11"
                                        >
                                            <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4" />
                                            <span className="text-sm sm:text-base">Previous</span>
                                        </Button>
                                    )}

                                    {currentStep === 1 && (
                                        <Link href="/dashboard/schedule" className="flex-1 sm:flex-none">
                                            <Button variant="outline" className="h-10 sm:h-11">
                                                <X className="mr-1 sm:mr-2 h-4 w-4" />
                                                <span className="text-sm sm:text-base">Cancel</span>
                                            </Button>
                                        </Link>
                                    )}
                                </div>

                                {currentStep < totalSteps ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={!canProceedToNext}
                                        className="order-1 md:order-2 w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white h-11 sm:h-12 text-base"
                                    >
                                        <span className="text-sm sm:text-base">Next</span>
                                        <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={!canSubmit}
                                        className="order-1 md:order-2 w-full md:w-auto h-10 sm:h-11 bg-orange-600 hover:bg-orange-700"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                <span className="text-sm sm:text-base">Creating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                <span className="text-sm sm:text-base">Create Schedule Project</span>
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </form>
                </Card>
            </div>
        </div>
    )
}