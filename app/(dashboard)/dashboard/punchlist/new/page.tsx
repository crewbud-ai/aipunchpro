// ==============================================
// app/(dashboard)/dashboard/punchlist/new/page.tsx - Create Punchlist Item
// ==============================================

"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Building,
    AlertTriangle,
    Users,
    Camera,
    CheckCircle,
    Loader2,
} from "lucide-react"
import Link from "next/link"

// Import our real hooks and types (following schedule pattern)
import { useCreatePunchlistItem } from "@/hooks/punchlist-items"
import { useProjects } from "@/hooks/projects"
import { useTeamMembers } from "@/hooks/team-members"

// Import sub-components (we'll create these next)
import { IssueDetailsStep, ProjectLocationStep, AssignmentStep, PhotosReviewStep } from "../components/forms"

export default function CreatePunchlistPage() {
    // ==============================================
    // HOOKS FOR REAL DATA (Following schedule pattern)
    // ==============================================

    // Punchlist item creation hook
    const {
        formData,
        errors,
        isLoading,
        isSuccess,
        canSubmit,
        currentStep,
        totalSteps,
        progressPercentage,
        canGoNext,
        canGoPrev,
        isFirstStep,
        isLastStep,
        updateFormData,
        clearFieldError,
        createPunchlistItem,
        goToNextStep,
        goToPrevStep,
        reset,
    } = useCreatePunchlistItem()

    // Projects for selection
    const {
        projects: activeProjects,
        isLoading: isProjectsLoading,
        hasError: hasProjectsError,
        refreshProjects,
    } = useProjects({
        limit: 100,
        // Load active projects for punchlist assignment
    })

    // Team members for assignment
    const {
        teamMembers: allTeamMembers,
        isLoading: isTeamMembersLoading,
        hasError: hasTeamMembersError,
    } = useTeamMembers()

    // ==============================================
    // LOCAL STATE & COMPUTED VALUES
    // ==============================================
    
    // Selected project for filtering team members
    const selectedProject = useMemo(() => {
        return activeProjects.find(p => p.id === formData.projectId)
    }, [activeProjects, formData.projectId])

    // Available team members (filtered by selected project)
    const availableTeamMembers = useMemo(() => {
        if (!formData.projectId) return []
        
        // Filter team members who are assigned to the selected project
        return allTeamMembers.filter(member => 
            member.isActive && 
            member.currentProjects?.some(project => project.id === formData.projectId)
        )
    }, [allTeamMembers, formData.projectId])

    // Check if current step is valid
    const canProceedToNext = useMemo(() => {
        switch (currentStep) {
            case 1:
                // Issue Details step
                return !!(formData.title && formData.issueType && formData.priority)
            case 2:
                // Project & Location step
                return !!(formData.projectId)
            case 3:
                // Assignment step
                return true // Assignment is optional
            case 4:
                // Photos & Review step
                return canSubmit
            default:
                return false
        }
    }, [currentStep, formData, canSubmit])

    // ==============================================
    // EVENT HANDLERS (Following schedule pattern)
    // ==============================================

    // Project selection handler
    const handleProjectChange = useCallback((projectId: string) => {
        updateFormData('projectId', projectId)
        clearFieldError('projectId')
        
        // Clear assigned member if they're not in the new project
        if (formData.assignedProjectMemberId) {
            const newAvailableMembers = allTeamMembers.filter(member => 
                member.currentProjects?.some(project => project.id === projectId)
            )
            const memberStillAvailable = newAvailableMembers.some(member => 
                member.id === formData.assignedProjectMemberId
            )
            
            if (!memberStillAvailable) {
                updateFormData('assignedProjectMemberId', '')
            }
        }
    }, [updateFormData, clearFieldError, formData.assignedProjectMemberId, allTeamMembers])

    // Form submission
    const handleSubmit = useCallback(async () => {
        if (!canSubmit) return
        await createPunchlistItem()
    }, [canSubmit, createPunchlistItem])

    // Navigation handlers
    const handleNext = useCallback(() => {
        if (currentStep < totalSteps && canProceedToNext) {
            goToNextStep()
        }
    }, [currentStep, totalSteps, canProceedToNext, goToNextStep])

    const handlePrevious = useCallback(() => {
        if (currentStep > 1) {
            goToPrevStep()
        }
    }, [currentStep, goToPrevStep])

    // ==============================================
    // STEP PROPS - PREPARED OUTSIDE RENDER (Following schedule pattern)
    // ==============================================
    
    const step1Props = {
        formData,
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void,
        clearFieldError,
    }

    const step2Props = {
        formData,
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void,
        clearFieldError,
        activeProjects,
        isProjectsLoading,
        hasProjectsError,
        refreshProjects,
        handleProjectChange,
    }

    const step3Props = {
        formData,
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void,
        clearFieldError,
        selectedProject,
        isTeamMembersLoading,
        hasTeamMembersError,
        availableTeamMembers,
    }

    const step4Props = {
        formData,
        errors,
        selectedProject,
        availableTeamMembers,
    }

    // ==============================================
    // STEP METADATA (Following schedule pattern)
    // ==============================================
    const getStepMetadata = (step: number) => {
        switch (step) {
            case 1:
                return {
                    icon: AlertTriangle,
                    title: "Issue Details",
                    description: "Describe the problem or work needed"
                }
            case 2:
                return {
                    icon: Building,
                    title: "Project & Location",
                    description: "Select project and specify location"
                }
            case 3:
                return {
                    icon: Users,
                    title: "Assignment & Priority",
                    description: "Assign team member and set priority"
                }
            case 4:
                return {
                    icon: Camera,
                    title: "Photos & Review",
                    description: "Add photos and review details"
                }
            default:
                return {
                    icon: AlertTriangle,
                    title: "Punchlist Setup",
                    description: "Configure your punchlist item"
                }
        }
    }

    const currentStepMeta = getStepMetadata(currentStep)
    const StepIcon = currentStepMeta.icon

    // ==============================================
    // RENDER STEP CONTENT (Following schedule pattern)
    // ==============================================
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <IssueDetailsStep {...step1Props} />
            case 2:
                return <ProjectLocationStep {...step2Props} />
            case 3:
                return <AssignmentStep {...step3Props} />
            case 4:
                return <PhotosReviewStep {...step4Props} />
            default:
                return null
        }
    }

    // ==============================================
    // SUCCESS STATE (Following schedule pattern)
    // ==============================================
    if (isSuccess) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center py-12">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Punchlist Item Created Successfully!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Your punchlist item has been created and assigned.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/dashboard/punchlist">
                            <Button variant="outline">
                                View All Items
                            </Button>
                        </Link>
                        <Button onClick={reset}>
                            Create Another Item
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // ==============================================
    // MAIN RENDER (Following schedule pattern)
    // ==============================================
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/punchlist">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Punchlist
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Create Punchlist Item</h1>
                    <p className="text-gray-600">Add a new issue or work item to track</p>
                </div>
            </div>

            {/* Progress Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <StepIcon className="h-6 w-6 text-orange-600" />
                            <div>
                                <CardTitle className="text-lg">
                                    Step {currentStep} of {totalSteps}: {currentStepMeta.title}
                                </CardTitle>
                                <CardDescription>
                                    {currentStepMeta.description}
                                </CardDescription>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                                {Math.round(progressPercentage)}% Complete
                            </div>
                        </div>
                    </div>
                    <Progress value={progressPercentage} className="w-full" />
                </CardHeader>
            </Card>

            {/* Step Content */}
            <Card>
                <CardContent className="p-6">
                    {renderStepContent()}
                </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            {!isFirstStep && (
                                <Button
                                    variant="outline"
                                    onClick={handlePrevious}
                                    disabled={isLoading}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Previous
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {!isLastStep ? (
                                <Button
                                    onClick={handleNext}
                                    disabled={!canProceedToNext || isLoading}
                                    className="bg-orange-600 hover:bg-orange-700"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || isLoading}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Create Punchlist Item
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Error Display */}
                    {Object.keys(errors).length > 0 && (
                        <>
                            <Separator className="my-4" />
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Please fix the errors above before proceeding.
                                </AlertDescription>
                            </Alert>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}