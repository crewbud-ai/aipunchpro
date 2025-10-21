// ==============================================
// app/(dashboard)/dashboard/punchlist/[id]/edit/page.tsx - MULTI-STEP RESPONSIVE EDIT
// ==============================================

"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ArrowLeft,
    Save,
    Loader2,
    AlertCircle,
    FileText,
    MapPin,
    Users,
    Camera,
    ChevronRight,
    ChevronLeft,
    X,
    Eye
} from "lucide-react"
import { cn } from "@/lib/utils"

// Import hooks and types
import { usePunchlistItem, useUpdatePunchlistItem } from "@/hooks/punchlist-items"
import { useProjects } from "@/hooks/projects"
import { useTeamMembers } from "@/hooks/team-members"
import { UpdatePunchlistItemFormData } from "@/types/punchlist-items"

// Import form components
import {
    IssueDetailsStep,
    ProjectLocationStep,
    AssignmentStep,
    PhotosReviewStep
} from "../../components/forms"

export default function EditPunchlistItemPage() {
    const params = useParams()
    const router = useRouter()
    const punchlistItemId = params.id as string

    // Local state for multi-step navigation
    const [activeStep, setActiveStep] = useState(1)
    const totalSteps = 4

    // ==============================================
    // HOOKS
    // ==============================================

    // Load existing punchlist item
    const {
        punchlistItem,
        isLoading: isLoadingItem,
        isError,
        isNotFound,
        error,
        loadPunchlistItem,
    } = usePunchlistItem()

    // Update punchlist item hook
    const {
        formData,
        errors,
        isLoading: isUpdating,
        canSubmit,
        hasChanges,
        isInitialized,
        updateFormData,
        clearFieldError,
        updatePunchlistItem,
        initializeForm,
        resetForm,

        // File upload functionality
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

        // Assignment management
        addAssignment,
        removeAssignment,
        updateAssignmentRole,
    } = useUpdatePunchlistItem(punchlistItemId)

    const {
        projects: activeProjects,
        isLoading: isProjectsLoading,
        hasError: hasProjectsError,
        refreshProjects,
    } = useProjects()

    const {
        teamMembers: availableTeamMembers,
        isLoading: isTeamMembersLoading,
        hasError: hasTeamMembersError,
        refreshTeamMembers,
    } = useTeamMembers()

    // ==============================================
    // LOAD PUNCHLIST ITEM
    // ==============================================
    useEffect(() => {
        if (punchlistItemId) {
            loadPunchlistItem(punchlistItemId)
        }
    }, [punchlistItemId, loadPunchlistItem])

    // ==============================================
    // INITIALIZE FORM WITH PUNCHLIST ITEM DATA
    // ==============================================
    useEffect(() => {
        if (punchlistItem && !isInitialized) {
            initializeForm(punchlistItem)
        }
    }, [punchlistItem, isInitialized, initializeForm])

    // ==============================================
    // FIND SELECTED PROJECT
    // ==============================================
    const selectedProject = useMemo(() => {
        if (!punchlistItem?.projectId || !activeProjects) return undefined
        return activeProjects.find(p => p.id === punchlistItem.projectId)
    }, [punchlistItem?.projectId, activeProjects])

    // ==============================================
    // COMPUTED VALUES
    // ==============================================
    const progressPercentage = (activeStep / totalSteps) * 100

    // Step validation
    const stepValidation = useMemo(() => {
        const step1Valid = Boolean(
            formData.title?.trim() &&
            formData.issueType &&
            !errors.title &&
            !errors.description &&
            !errors.issueType
        )

        const step2Valid = Boolean(
            formData.location?.trim() &&
            !errors.location &&
            !errors.roomArea
        )

        const step3Valid = Boolean(
            !errors.assignedMembers &&
            !errors.dueDate &&
            !errors.resolutionNotes
        )

        const step4Valid = Boolean(
            !errors.photos &&
            !errors.attachments &&
            !isUploadingFiles
        )

        return {
            1: step1Valid,
            2: step2Valid,
            3: step3Valid,
            4: step4Valid
        }
    }, [formData, errors, isUploadingFiles])

    const canProceedToNext = stepValidation[activeStep as keyof typeof stepValidation]

    // ==============================================
    // EVENT HANDLERS
    // ==============================================

    // Project change handler (disabled in edit mode)
    const handleProjectChange = React.useCallback((projectId: string) => {
        console.log('Project change not allowed in edit mode:', projectId)
    }, [])

    // Team member assignment handlers
    const handleAddAssignment = React.useCallback((projectMemberId: string) => {
        addAssignment(projectMemberId, 'primary')
    }, [addAssignment])

    const handleRemoveAssignment = React.useCallback((projectMemberId: string) => {
        removeAssignment(projectMemberId)
    }, [removeAssignment])

    // Navigation handlers
    const handleNext = React.useCallback(() => {
        if (activeStep < totalSteps && canProceedToNext) {
            setActiveStep(activeStep + 1)
        }
    }, [activeStep, totalSteps, canProceedToNext])

    const handlePrevious = React.useCallback(() => {
        if (activeStep > 1) {
            setActiveStep(activeStep - 1)
        }
    }, [activeStep])

    const handleCancel = () => {
        if (hasChanges) {
            const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?')
            if (!confirmed) return
        }
        router.push(`/dashboard/punchlist/${punchlistItemId}`)
    }

    // Form submission
    const handleSubmit = React.useCallback(async () => {
        if (canSubmit) {
            await updatePunchlistItem()
        }
    }, [canSubmit, updatePunchlistItem])

    // ==============================================
    // STEP PROPS
    // ==============================================
    const step1Props = {
        mode: 'edit' as const,
        formData: {
            title: formData.title || '',
            description: formData.description || '',
            issueType: (formData.issueType || '') as '' | 'safety' | 'defect' | 'incomplete' | 'change_request' | 'quality' | 'rework',
            priority: formData.priority || 'medium',
        },
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void,
        clearFieldError: clearFieldError as (field: string) => void,
    }

    const step2Props = {
        mode: 'edit' as const,
        formData: {
            location: formData.location || '',
            roomArea: formData.roomArea || '',
        },
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void,
        clearFieldError: clearFieldError as (field: string) => void,
        activeProjects: activeProjects || [],
        isProjectsLoading,
        hasProjectsError,
        refreshProjects,
        handleProjectChange,
        selectedProject,
    }

    const step3Props = {
        mode: 'edit' as const,
        formData: {
            assignedMembers: formData.assignedMembers || [],
            dueDate: formData.dueDate || '',
            resolutionNotes: formData.resolutionNotes || '',
        },
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void,
        clearFieldError: clearFieldError as (field: string) => void,
        selectedProject,
        isTeamMembersLoading,
        hasTeamMembersError,
        availableTeamMembers: availableTeamMembers || [],
        refreshTeamMembers,
        addAssignment: handleAddAssignment,
        removeAssignment: handleRemoveAssignment,
        updateAssignmentRole,
    }

    const step4Props = {
        mode: 'edit' as const,
        formData: formData as UpdatePunchlistItemFormData,
        errors,
        updateFormData: updateFormData as (field: string, value: any) => void,
        clearFieldError: clearFieldError as (field: string) => void,
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
    // RENDER STEP CONTENT
    // ==============================================
    const renderStepContent = () => {
        switch (activeStep) {
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
    // RENDER LOADING STATE
    // ==============================================
    if (isLoadingItem || !isInitialized) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-3xl p-4 xs:p-6 sm:p-8">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-8 w-64" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>
                        <Skeleton className="h-2 w-full" />
                        <Card>
                            <CardContent className="space-y-6 p-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-32 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    // ==============================================
    // RENDER ERROR STATE
    // ==============================================
    if (isError || isNotFound) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-3xl p-4 xs:p-6 sm:p-8">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/punchlist">
                                <Button variant="outline" size="icon">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold">Error Loading Punchlist Item</h1>
                                <p className="text-sm text-muted-foreground">
                                    {isNotFound ? 'Punchlist item not found' : 'Unable to load punchlist item'}
                                </p>
                            </div>
                        </div>

                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {error || 'Failed to load punchlist item. Please try again.'}
                            </AlertDescription>
                        </Alert>

                        <Button onClick={() => router.push('/dashboard/punchlist')}>
                            Back to Punchlist
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // ==============================================
    // MAIN RENDER
    // ==============================================
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-3xl">
                {/* Header - Mobile Responsive */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-start xs:items-center gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4">
                        <Link href={`/dashboard/punchlist/${punchlistItemId}`}>
                            <Button variant="outline" size="icon" className="shrink-0 h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10">
                                <ArrowLeft className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                            </Button>
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 leading-tight xs:leading-normal truncate">
                                Edit Punchlist Item
                            </h1>
                            <p className="text-xs xs:text-sm sm:text-base text-gray-600 mt-0.5 xs:mt-0.5 sm:mt-1 line-clamp-2 leading-snug xs:leading-normal">
                                Update punchlist item details
                            </p>
                        </div>

                        <div className="hidden md:block">
                            <Button asChild variant="ghost" size="sm">
                                <Link href={`/dashboard/punchlist/${punchlistItemId}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Progress Bar - Mobile Responsive */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm font-medium text-gray-700">
                            <span>Step {activeStep} of {totalSteps}</span>
                            <span className="hidden xs:inline">{Math.round(progressPercentage)}% Complete</span>
                            <span className="xs:hidden">{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-1.5 sm:h-2" />
                    </div>

                    {/* Unsaved changes warning */}
                    {hasChanges && (
                        <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs xs:text-sm">
                                You have unsaved changes. Make sure to save before leaving this page.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Upload Progress */}
                {isUploadingFiles && (
                    <Alert className="mb-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription className="text-xs xs:text-sm">
                            Uploading files... {uploadProgress}%
                        </AlertDescription>
                    </Alert>
                )}

                {/* Main Content Card */}
                <Card>
                    <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">
                        {renderStepContent()}

                        <Separator />

                        {/* Navigation - Mobile Responsive */}
                        <div className="fflex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 pt-4 sm:pt-6">
                            <div className="flex gap-2 sm:gap-3 order-2 md:order-1">
                                {activeStep > 1 && (
                                    <Button
                                        variant="outline"
                                        onClick={handlePrevious}
                                        disabled={isUpdating || isUploadingFiles}
                                        className="h-10 sm:h-11"
                                    >
                                        <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4" />
                                        <span className="text-sm sm:text-base">Previous</span>
                                    </Button>
                                )}

                                <Link href={`/dashboard/punchlist/${punchlistItemId}`} >
                                    <Button
                                        variant="outline"
                                        disabled={isUpdating || isUploadingFiles}
                                        className="flex-1 sm:flex-none h-10 sm:h-11 text-sm sm:text-base"
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        <span className="text-sm sm:text-base">Cancel</span>
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex items-center gap-3 order-1 md:order-2">
                                {hasChanges && activeStep === totalSteps && (
                                    <Button
                                        variant="outline"
                                        onClick={resetForm}
                                        disabled={isUpdating || isUploadingFiles}
                                        className=" text-sm sm:text-base"
                                    >
                                        <span className="text-sm sm:text-base">Reset</span>
                                    </Button>
                                )}

                                {activeStep < totalSteps ? (
                                    <Button
                                        onClick={handleNext}
                                        disabled={!canProceedToNext || isUpdating || isUploadingFiles}
                                        className="order-1 md:order-2 w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white h-11 sm:h-12 text-base"
                                    >
                                        <span className="text-sm sm:text-base">Next</span>
                                        <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!canSubmit || isUpdating || isUploadingFiles}
                                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                                    >
                                        {isUpdating || isUploadingFiles ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                <span className="text-sm sm:text-base">
                                                    {isUploadingFiles ? 'Uploading...' : 'Saving...'}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                <span className="text-sm sm:text-base">
                                                    Save Changes
                                                </span>
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Form Errors */}
                {errors._form && errors._form.length > 0 && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs xs:text-sm">
                            {errors._form[0]}
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    )
}