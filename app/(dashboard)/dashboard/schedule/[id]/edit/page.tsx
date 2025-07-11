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

export default function EditSchedulePage() {
    const params = useParams()
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
        console.log('=== SCHEDULE DATA LOADING DEBUG ===')
        console.log('Schedule ID:', scheduleId)
        console.log('Schedule Project:', scheduleProject)
        console.log('Original Schedule Project:', originalScheduleProject)
        console.log('Loading Status:', isLoadingSchedule)
        console.log('Error Status:', hasScheduleError)
        console.log('Not Found:', isNotFound)
        
        if (scheduleProject) {
            setDebugInfo(prev => ({
                ...prev, 
                scheduleLoaded: true,
                dataLoadedAt: new Date()
            }))
            
            console.log('✅ Schedule Project Data Received:')
            console.log('- ID:', scheduleProject.id)
            console.log('- Title:', scheduleProject.title)
            console.log('- Project ID:', scheduleProject.projectId)
            console.log('- Start Date:', scheduleProject.startDate)
            console.log('- End Date:', scheduleProject.endDate)
            console.log('- Assigned Members:', scheduleProject.assignedProjectMemberIds)
            console.log('- Status:', scheduleProject.status)
            console.log('- Priority:', scheduleProject.priority)
            
            if (!originalScheduleProject) {
                console.log('🔄 Initializing form with schedule project data...')
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
        console.log('=== FORM DATA DEBUG ===')
        console.log('Current Form Data:', formData)
        console.log('Has Changes:', hasChanges)
        console.log('Form Errors:', errors)
        console.log('Can Submit:', canSubmit)
    }, [formData, hasChanges, errors, canSubmit])

    // ==============================================
    // SUPPORTING DATA LOGIC
    // ==============================================

    // Get selected project
    const selectedProject = useMemo(() => {
        const project = activeProjects.find(p => p.id === formData.projectId)
        console.log('=== PROJECT SELECTION DEBUG ===')
        console.log('Looking for project ID:', formData.projectId)
        console.log('Available projects:', activeProjects.length, 'projects')
        console.log('Available projects list:', activeProjects.map(p => ({ id: p.id, name: p.name, status: p.status })))
        console.log('Selected project:', project)
        return project
    }, [activeProjects, formData.projectId])

    // Get available team members (for now, all active members)
    const availableTeamMembers = useMemo(() => {
        const members = allTeamMembers.filter(member => member.isActive)
        console.log('Available team members:', members.length, 'members')
        return members
    }, [allTeamMembers])

    // ==============================================
    // EVENT HANDLERS
    // ==============================================

    // Project change handler
    const handleProjectChange = React.useCallback(async (projectId: string) => {
        console.log('Project changed to:', projectId)
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
        console.log('Team member toggled:', memberId, 'New members:', newMembers)
        updateFormData('assignedProjectMemberIds', newMembers)
    }, [formData.assignedProjectMemberIds, updateFormData])

    // Date handlers
    const handleStartDateChange = React.useCallback((startDate: string) => {
        console.log('Start date changed to:', startDate)
        updateFormData('startDate', startDate)
        clearFieldError('startDate')

        // Auto-set end date if it's empty or before start date
        if (startDate && (!formData.endDate || new Date(formData.endDate) <= new Date(startDate))) {
            const nextDay = new Date(startDate)
            nextDay.setDate(nextDay.getDate() + 1)
            const newEndDate = nextDay.toISOString().split('T')[0]
            console.log('Auto-setting end date to:', newEndDate)
            updateFormData('endDate', newEndDate)
        }
    }, [updateFormData, clearFieldError, formData.endDate])

    // Form submission
    const handleSubmit = React.useCallback(async () => {
        console.log('Submit clicked - Can submit:', canSubmit)
        console.log('Current form data:', formData)
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

    // Debug the step1Props
    console.log('=== STEP 1 PROPS DEBUG ===')
    console.log('Step1Props activeProjects:', step1Props.activeProjects.length, 'projects')
    console.log('Step1Props isProjectsLoading:', step1Props.isProjectsLoading)
    console.log('Step1Props hasProjectsError:', step1Props.hasProjectsError)
    console.log('Step1Props formData.projectId:', step1Props.formData.projectId)
    console.log('Step1Props mode:', step1Props.mode)
    
    // Debug what should be selected
    if (step1Props.activeProjects.length > 0 && step1Props.formData.projectId) {
        const shouldBeSelected = step1Props.activeProjects.find(p => p.id === step1Props.formData.projectId)
        console.log('🎯 Project that should be selected:', shouldBeSelected?.name)
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
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="space-y-6">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                        <Skeleton className="h-96 w-full" />
                    </div>
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
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                        <h1 className="mt-4 text-2xl font-bold text-gray-900">
                            {isNotFound ? 'Schedule Not Found' : 'Error Loading Schedule'}
                        </h1>
                        <p className="mt-2 text-gray-600">
                            {isNotFound 
                                ? 'The schedule you are looking for does not exist or you do not have permission to access it.'
                                : `Error: ${scheduleError || 'Unknown error'}`
                            }
                        </p>
                        <div className="mt-6">
                            <Link href="/dashboard/schedule">
                                <Button variant="outline">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
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
    // SUCCESS STATE
    // ==============================================
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
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
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/dashboard/schedule">
                            <Button variant="outline" size="icon" className="shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Schedule</h1>
                            <p className="text-gray-600 mt-1">
                                Update your schedule project details
                            </p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Step {currentStep} of {totalSteps}</span>
                            <span className="text-gray-600">{Math.round(progressPercentage)}% Complete</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
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
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 text-orange-600">
                                <StepIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">{currentStepMeta.title}</CardTitle>
                                <CardDescription>{currentStepMeta.description}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {renderStepContent()}
                    </CardContent>
                </Card>

                {/* Navigation Footer */}
                <div className="mt-8 flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>

                    <div className="flex items-center gap-3">
                        {currentStep < totalSteps ? (
                            <Button
                                onClick={handleNext}
                                className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Update Schedule
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Form Errors */}
                {Object.keys(errors).length > 0 && (
                    <Alert className="mt-6 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Please fix the errors above before continuing.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    )
}