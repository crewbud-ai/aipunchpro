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
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-start xs:items-center gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4">
                        <Link href="/dashboard/punchlist">
                            <Button variant="outline" size="icon" className="shrink-0">
                                <ArrowLeft className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                            </Button>
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 leading-tight xs:leading-normal truncate">
                                Create New Punchlist Item
                            </h1>
                            <p className="text-xs xs:text-sm sm:text-base text-gray-600 mt-0.5 xs:mt-0.5 sm:mt-1 line-clamp-2 leading-snug xs:leading-normal">
                                Track and manage construction defects and completion items
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
                        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">

                            {/* Render Current Step */}
                            {renderStepContent()}

                            {/* Show upload progress globally */}
                            {isUploadingFiles && (
                                <Alert>
                                    <Loader2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin shrink-0" />
                                    <AlertDescription className="text-xs xs:text-sm leading-snug">
                                        Uploading files... {uploadProgress}% complete. Please don't close this page.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Show upload error globally */}
                            {uploadError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                                    <AlertDescription className="text-xs xs:text-sm leading-snug">
                                        Upload Error: {uploadError}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Show general errors */}
                            {errors.general && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                                    <AlertDescription className="text-xs xs:text-sm leading-snug">
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
                                            disabled={isUploadingFiles}
                                            className="h-10 sm:h-11"
                                        >
                                            <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4" />
                                            <span className="text-sm sm:text-base">Previous</span>
                                        </Button>
                                    )}

                                    {currentStep === 1 && (
                                        <Link href="/dashboard/punchlist" >
                                            <Button
                                                variant="outline"
                                                className="h-10 sm:h-11 text-sm sm:text-base"
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
                                        className="order-1 md:order-2 w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white h-11 sm:h-12 text-base"
                                    >
                                        <span className="text-sm sm:text-base">Next</span>
                                        <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={!canSubmit || isUploadingFiles}
                                        className="order-1 md:order-2 w-full md:w-auto h-10 sm:h-11 bg-orange-600 hover:bg-orange-700"
                                    >
                                        {(isLoading || isUploadingFiles) ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                <span className="text-sm sm:text-base">
                                                    {isUploadingFiles ? 'Uploading...' : 'Creating...'}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                <span className="text-sm sm:text-base">Create Punchlist Item</span>
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
                    <Card className="mt-3 xs:mt-4">
                        <CardContent className="p-3 xs:p-4">
                            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0">
                                <div className="flex items-center gap-1.5 xs:gap-2">
                                    <Users className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-500 shrink-0" />
                                    <span className="text-xs xs:text-sm font-medium">Assignments:</span>
                                    <span className="text-xs xs:text-sm text-gray-600">
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
                    <Card className="mt-3 xs:mt-4">
                        <CardContent className="p-3 xs:p-4">
                            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0">
                                <div className="flex items-center gap-1.5 xs:gap-2">
                                    <Camera className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-500 shrink-0" />
                                    <span className="text-xs xs:text-sm font-medium">Files:</span>
                                    <span className="text-xs xs:text-sm text-gray-600">
                                        {(formData.photos?.length || 0)} photos, {(formData.attachments?.length || 0)} attachments
                                        {hasPendingFiles && `, ${pendingFiles.length} pending`}
                                    </span>
                                </div>
                                {isUploadingFiles && (
                                    <div className="flex items-center gap-1.5 xs:gap-2">
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