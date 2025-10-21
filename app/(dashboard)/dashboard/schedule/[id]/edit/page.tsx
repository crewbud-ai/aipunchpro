// app/(dashboard)/dashboard/schedule/[id]/edit/page.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Building,
    Users,
    AlertCircle,
    CheckCircle,
    Loader2,
    Calendar,
    Save,
    X,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

// Import our real hooks and types
import { useScheduleProject } from "@/hooks/schedule-projects"
import { useUpdateScheduleProject } from "@/hooks/schedule-projects"
import { useProjects } from "@/hooks/projects"
import { useTeamMembers } from "@/hooks/team-members"

// Import sub-components
import { WorkInfoStep, TimingStep, AssignmentStep } from "../../components/forms"
import { Separator } from "@radix-ui/react-separator"
import { useRouter } from "next/navigation"

export default function EditSchedulePage() {
    const params = useParams()
    const router = useRouter()
    const scheduleId = params.id as string

    // ==============================================
    // HOOKS FOR REAL DATA
    // ==============================================

    // Load existing schedule project data
    const {
        scheduleProject,
        isLoading: isLoadingSchedule,
        isError: hasScheduleError,
        error: scheduleError,
        isNotFound,
    } = useScheduleProject(scheduleId)

    // Schedule project update hook
    const {
        formData,
        originalScheduleProject,
        hasChanges,
        errors,
        isLoading: isUpdating,
        canSubmit,
        isSuccess,
        currentStep,
        totalSteps,
        progressPercentage,
        initializeForm,
        updateFormData,
        clearFieldError,
        updateScheduleProject,
        goToNextStep,
        goToPrevStep,
    } = useUpdateScheduleProject(scheduleId)

    // Projects and team members data - FIX: Load all active projects, not just in_progress
    const {
        projects: activeProjects,
        isLoading: isProjectsLoading,
        hasError: hasProjectsError,
        refreshProjects,
    } = useProjects({
        // Load all non-completed projects for schedule assignment
        limit: 100,
    }) // Remove status filter to load all projects

    const {
        teamMembers: allTeamMembers,
        isLoading: isTeamMembersLoading,
        hasError: hasTeamMembersError,
    } = useTeamMembers()

    // ==============================================
    // DEBUG STATE 
    // ==============================================
    const [debugInfo, setDebugInfo] = useState({
        scheduleLoaded: false,
        formInitialized: false,
        dataLoadedAt: null as Date | null,
        formInitializedAt: null as Date | null,
    })

    // ==============================================
    // FORM INITIALIZATION WITH EXTENSIVE DEBUGGING
    // ==============================================
    useEffect(() => {

        if (scheduleProject) {
            setDebugInfo(prev => ({
                ...prev,
                scheduleLoaded: true,
                dataLoadedAt: new Date()
            }))

            if (!originalScheduleProject) {
                initializeForm(scheduleProject)

                setDebugInfo(prev => ({
                    ...prev,
                    formInitialized: true,
                    formInitializedAt: new Date()
                }))
            }
        }
    }, [scheduleProject, originalScheduleProject, initializeForm, scheduleId, isLoadingSchedule, hasScheduleError, isNotFound])

    // Debug current form data
    useEffect(() => {
    }, [formData, hasChanges, errors, canSubmit])

    // ==============================================
    // SUPPORTING DATA LOGIC
    // ==============================================

    // Get selected project
    const selectedProject = useMemo(() => {
        const project = activeProjects.find(p => p.id === formData.projectId)
        return project
    }, [activeProjects, formData.projectId])

    // Get available team members (for now, all active members)
    const availableTeamMembers = useMemo(() => {
        const members = allTeamMembers.filter(member => member.isActive)
        return members
    }, [allTeamMembers])

    // ==============================================
    // EVENT HANDLERS
    // ==============================================

    // Project change handler
    const handleProjectChange = React.useCallback(async (projectId: string) => {
        updateFormData('projectId', projectId)
        clearFieldError('projectId')

        // Clear assigned members when project changes
        updateFormData('assignedProjectMemberIds', [])
    }, [updateFormData, clearFieldError])

    // Team member toggle handler
    const handleTeamMemberToggle = React.useCallback((memberId: string) => {
        const currentMembers = formData.assignedProjectMemberIds || []
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
            const newEndDate = nextDay.toISOString().split('T')[0]
            updateFormData('endDate', newEndDate)
        }
    }, [updateFormData, clearFieldError, formData.endDate])

    // Form submission
    const handleSubmit = React.useCallback(async () => {
        // if (!canSubmit) return
        await updateScheduleProject()
    }, [canSubmit, updateScheduleProject, formData])

    // Navigation handlers
    const handleNext = React.useCallback(() => {
        if (currentStep < totalSteps) {
            goToNextStep()
        }
    }, [currentStep, totalSteps, goToNextStep])

    const handlePrevious = React.useCallback(() => {
        if (currentStep > 1) {
            goToPrevStep()
        }
    }, [currentStep, goToPrevStep])

    const handleCancel = () => {
        router.push(`/dashboard/schedule/${scheduleId}`)
    }

    // ==============================================
    // STEP PROPS - PREPARED OUTSIDE RENDER (with type casting and DEBUG)
    // ==============================================
    const step1Props = useMemo(() => ({
        mode: 'edit' as const,
        formData,
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void,
        clearFieldError: clearFieldError as (field: string) => void,
        activeProjects,
        isProjectsLoading,
        hasProjectsError,
        refreshProjects,
        handleProjectChange,
    }), [formData, errors, activeProjects, isProjectsLoading, hasProjectsError, refreshProjects, handleProjectChange, updateFormData, clearFieldError])

    // Debug what should be selected
    if (step1Props.activeProjects.length > 0 && step1Props.formData.projectId) {
        const shouldBeSelected = step1Props.activeProjects.find(p => p.id === step1Props.formData.projectId)
    }

    const step2Props = {
        mode: 'edit' as const,
        formData,
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void,
        clearFieldError: clearFieldError as (field: string) => void,
        handleStartDateChange,
    }

    const step3Props = {
        mode: 'edit' as const,
        formData,
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void,
        clearFieldError: clearFieldError as (field: string) => void,
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
    // LOADING STATE
    // ==============================================
    if (isLoadingSchedule) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-96" />
                        </div>
                    </div>
                    <Card className="mt-8">
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // ==============================================
    // ERROR STATE
    // ==============================================
    if (hasScheduleError || isNotFound) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {isNotFound
                                ? 'The schedule you are looking for does not exist or you do not have permission to access it.'
                                : `Error: ${scheduleError || 'Unknown error'}`
                            }
                        </AlertDescription>
                    </Alert>
                    <div className="mt-4">
                        <Button asChild variant="outline">
                            <Link href="/dashboard/schedule">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Schedule
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // ==============================================
    // SUCCESS STATE
    // ==============================================
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <h1 className="mt-4 text-2xl font-bold text-gray-900">Schedule Updated Successfully!</h1>
                        <p className="mt-2 text-gray-600">
                            Your changes have been saved successfully.
                        </p>
                        <div className="mt-6 space-x-3">
                            <Link href={`/dashboard/schedule/${scheduleId}`}>
                                <Button>
                                    View Schedule
                                </Button>
                            </Link>
                            <Link href="/dashboard/schedule">
                                <Button variant="outline">
                                    Back to Schedule
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ==============================================
    // MAIN RENDER WITH DEBUG INFO
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
                            <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 leading-tight xs:leading-normal truncate">
                                Edit Schedule
                            </h1>
                            <p className="text-xs xs:text-sm sm:text-base text-gray-600 mt-0.5 xs:mt-0.5 sm:mt-1 line-clamp-2 leading-snug xs:leading-normal">
                                Update your schedule project details
                            </p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm font-medium text-gray-700">
                            <span>Step {currentStep} of {totalSteps}</span>
                            <span className="hidden xs:inline">{Math.round(progressPercentage)}% Complete</span>
                            <span className="xs:hidden">{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-1.5 sm:h-2" />
                    </div>

                    {/* Unsaved changes warning */}
                    {hasChanges && (
                        <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                You have unsaved changes. Make sure to save before leaving this page.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Main Content Card */}
                <Card>
                    <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">
                        {renderStepContent()}
                        <Separator />
                        {/* Navigation */}
                        {/* <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 pt-4 sm:pt-6">
                            <div className="flex gap-2 sm:gap-3 order-2 md:order-1">
                                {currentStep > 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={handlePrevious}
                                        disabled={currentStep === 1}
                                        className="h-10 sm:h-11"
                                    >
                                        <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4" />
                                        <span className="text-sm sm:text-base">Previous</span>
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="flex-1 sm:flex-none h-10 sm:h-11 text-sm sm:text-base"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    <span className="text-sm sm:text-base">Cancel</span>
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                {currentStep < totalSteps ? (
                                    <Button
                                        onClick={handleNext}
                                        className="order-1 md:order-2 w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white h-11 sm:h-12 text-base"
                                    >
                                        <span className="text-sm sm:text-base">Next</span>
                                        <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSubmit}
                                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <Loader2 className="ml-1 sm:ml-2 h-4 w-4 animate-spin" />
                                                <span className="text-sm sm:text-base">Updating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="ml-1 sm:ml-2 h-4 w-4" />
                                                <span className="text-sm sm:text-base">Update Schedule</span>
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div> */}

                        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 pt-4 sm:pt-6">
                            <div className="flex gap-2 sm:gap-3 order-2 md:order-1">
                                {currentStep > 1 && (
                                    <Button
                                        variant="outline"
                                        onClick={handlePrevious}
                                        className="flex-1 sm:flex-none w-full md:w-auto"
                                    >
                                        <ChevronLeft className="mr-2 h-4 w-4" />
                                        Previous
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="flex-1 sm:flex-none w-full md:w-auto"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>
                            </div>

                            {currentStep < totalSteps ? (
                                <Button
                                    onClick={handleNext}
                                    className="order-1 md:order-2 w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white h-11 sm:h-12 text-base"
                                >
                                    <span className="text-sm sm:text-base">Next</span>
                                    <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    className="order-1 md:order-2 flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="ml-1 sm:ml-2 h-4 w-4 animate-spin" />
                                            <span className="text-sm sm:text-base">Updating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="ml-1 sm:ml-2 h-4 w-4" />
                                            <span className="text-sm sm:text-base">Update Schedule</span>
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