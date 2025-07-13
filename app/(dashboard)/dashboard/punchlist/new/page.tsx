// ==============================================
// app/(dashboard)/dashboard/punchlist/new/page.tsx - UPDATED for Multiple Assignments
// ==============================================

"use client"

import React, { useState, useEffect, useMemo } from "react"
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
    AlertCircle,
    CheckCircle,
    Loader2,
} from "lucide-react"
import Link from "next/link"

// Import our real hooks and types
import { useCreatePunchlistItem } from "@/hooks/punchlist-items"
import { useProjects } from "@/hooks/projects"
import { useTeamMembers } from "@/hooks/team-members"

// Import sub-components
import { IssueDetailsStep, ProjectLocationStep, AssignmentStep, PhotosReviewStep } from "../components/forms"

export default function CreatePunchlistPage() {
    // ==============================================
    // HOOKS FOR REAL DATA
    // ==============================================

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
        createPunchlistItem,
        goToNextStep,
        goToPrevStep,
        
        isUploadingFiles,
        hasPendingFiles,
        pendingFiles,
        uploadProgress,
        uploadError,
        addPendingFiles,
        removePendingFile,
        uploadPhotos,
        uploadAttachments,
        removePhoto,
        removeAttachment,

        // NEW: Assignment management from hook
        assignedMemberCount,
        hasPrimaryAssignee,
    } = useCreatePunchlistItem()

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
        isLoading: isTeamMembersLoading,
        hasError: hasTeamMembersError,
        refreshTeamMembers,
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
        if (!formData.projectId) {
            console.log('❌ No project selected, returning empty array')
            return []
        }

        const filtered = teamMembers.filter(member => {
            // Check if member is assigned to the selected project
            const isAssignedToProject = member.currentProjects?.some(project =>
                project.id === formData.projectId
            )

            return member.isActive &&
                member.assignmentStatus === 'assigned' &&
                isAssignedToProject
        })

        return filtered
    }, [teamMembers, formData.projectId])

    // Form validation for each step
    const stepValidation = useMemo(() => {
        const step1Valid = formData.title.trim().length > 0

        const step2Valid =
            formData.projectId.length > 0 &&
            !errors.projectId

        const step3Valid = true // Assignment is optional

        // Include upload state in step 4 validation
        const step4Valid = canSubmit && !isUploadingFiles

        return {
            1: step1Valid,
            2: step2Valid,
            3: step3Valid,
            4: step4Valid
        } as Record<number, boolean>
    }, [formData, errors, canSubmit, currentStep, isUploadingFiles])

    const canProceedToNext = stepValidation[currentStep] || false

    // ==============================================
    // EVENT HANDLERS - MEMOIZED
    // ==============================================

    // Project selection handler
    const handleProjectChange = React.useCallback(async (projectId: string) => {
        updateFormData('projectId', projectId)
        const project = activeProjects.find(p => p.id === projectId)
        setSelectedProject(project)

        // UPDATED: Reset assignments when project changes
        updateFormData('assignedMembers', [])
    }, [updateFormData, activeProjects])

    // Form submission
    const handleSubmit = React.useCallback(async () => {
        if (!canSubmit || isUploadingFiles) return
        await createPunchlistItem()
    }, [canSubmit, createPunchlistItem, isUploadingFiles])

    // Navigation handlers
    const handleNext = React.useCallback(() => {
        if (currentStep < totalSteps && canProceedToNext) {
            goToNextStep()
        } else {
            console.log('❌ Cannot proceed to next step:', {
                reason: currentStep >= totalSteps ? 'Last step reached' : 'Validation failed',
                ourCanProceed: canProceedToNext
            })
        }
    }, [currentStep, totalSteps, canProceedToNext, goToNextStep])

    const handlePrevious = React.useCallback(() => {
        if (currentStep > 1 && !isUploadingFiles) {
            goToPrevStep()
        }
    }, [currentStep, goToPrevStep, isUploadingFiles])

    // ==============================================
    // STEP PROPS - PREPARED OUTSIDE RENDER
    // ==============================================
    const step1Props = {
        mode: 'create' as const,
        formData,
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void,
        clearFieldError,
    }

    const step2Props = {
        mode: 'create' as const,
        formData: {
            location: formData.location,
            roomArea: formData.roomArea,
            projectId: formData.projectId,
        },
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void,
        clearFieldError,
        activeProjects,
        isProjectsLoading,
        hasProjectsError,
        refreshProjects,
        handleProjectChange,
    }

    // UPDATED: Step 3 props for multiple assignments
    const step3Props = {
        mode: 'create' as const,
        formData: {
            assignedMembers: formData.assignedMembers, // FIXED: Use assignedMembers array
            dueDate: formData.dueDate,
            resolutionNotes: formData.resolutionNotes,
        },
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void,
        clearFieldError,
        selectedProject,
        isTeamMembersLoading,
        hasTeamMembersError,
        availableTeamMembers,
        refreshTeamMembers,
    }

    // Step 4 props with complete formData and upload props
    const step4Props = {
        mode: 'create' as const,
        formData,
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void,
        clearFieldError,
        
        // File upload props
        isUploadingFiles,
        hasPendingFiles,
        pendingFiles,
        uploadProgress,
        uploadError,
        addPendingFiles,
        removePendingFile,
        uploadPhotos,
        uploadAttachments,
        removePhoto,
        removeAttachment,
    }

    // ==============================================
    // STEP METADATA
    // ==============================================
    const getStepMetadata = (step: number) => {
        switch (step) {
            case 1:
                return {
                    icon: AlertTriangle,
                    title: "Issue Details",
                    description: "Describe the problem or work that needs to be addressed"
                }
            case 2:
                return {
                    icon: Building,
                    title: "Project & Location",
                    description: "Select the project and specify where the issue is located"
                }
            case 3:
                return {
                    icon: Users,
                    title: "Assignment & Timeline",
                    description: "Assign team members and set completion timeline" // UPDATED: plural
                }
            case 4:
                return {
                    icon: Camera,
                    title: "Photos & Review",
                    description: "Add photos and review all details before creating"
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
    // RENDER STEP CONTENT
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
    // MAIN RENDER
    // ==============================================
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/dashboard/punchlist">
                            <Button variant="outline" size="icon" className="shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">Create New Punchlist Item</h1>
                            <p className="text-gray-600 mt-1">Track and manage construction defects and completion items</p>
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
                    <form>
                        <CardContent className="space-y-6">

                            {/* Render Current Step */}
                            {renderStepContent()}

                            {/* Show upload progress globally */}
                            {isUploadingFiles && (
                                <Alert>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <AlertDescription>
                                        Uploading files... {uploadProgress}% complete. Please don't close this page.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Show upload error globally */}
                            {uploadError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>Upload Error: {uploadError}</AlertDescription>
                                </Alert>
                            )}

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
                                            disabled={isUploadingFiles}
                                            className="flex-1 sm:flex-none"
                                        >
                                            <ChevronLeft className="mr-2 h-4 w-4" />
                                            Previous
                                        </Button>
                                    )}

                                    {currentStep === 1 && (
                                        <Link href="/dashboard/punchlist" className="flex-1 sm:flex-none">
                                            <Button 
                                                variant="outline" 
                                                className="w-full"
                                                disabled={isUploadingFiles}
                                            >
                                                Cancel
                                            </Button>
                                        </Link>
                                    )}
                                </div>

                                {currentStep < totalSteps ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={!canProceedToNext || isUploadingFiles}
                                        className="flex-1 sm:flex-none"
                                    >
                                        Next
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={!canSubmit || isUploadingFiles}
                                        className="flex-1 sm:flex-none"
                                    >
                                        {(isLoading || isUploadingFiles) ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {isUploadingFiles ? 'Uploading...' : 'Creating...'}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Create Punchlist Item
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </form>
                </Card>

                {/* Assignment Summary (visible on all steps when assignments exist) */}
                {assignedMemberCount > 0 && currentStep !== 3 && (
                    <Card className="mt-4">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium">Assignments:</span>
                                    <span className="text-sm text-gray-600">
                                        {assignedMemberCount} team member{assignedMemberCount !== 1 ? 's' : ''} assigned
                                        {hasPrimaryAssignee && ' (has primary)'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* File upload summary (visible on all steps) */}
                {(hasPendingFiles || (formData.photos && formData.photos.length > 0) || (formData.attachments && formData.attachments.length > 0)) && currentStep !== 4 && (
                    <Card className="mt-4">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Camera className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium">Files:</span>
                                    <span className="text-sm text-gray-600">
                                        {(formData.photos?.length || 0)} photos, {(formData.attachments?.length || 0)} attachments
                                        {hasPendingFiles && `, ${pendingFiles.length} pending`}
                                    </span>
                                </div>
                                {isUploadingFiles && (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span className="text-xs text-gray-500">{uploadProgress}%</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}