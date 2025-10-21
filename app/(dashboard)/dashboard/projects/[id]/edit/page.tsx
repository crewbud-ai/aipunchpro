// app/(dashboard)/dashboard/projects/[id]/edit/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ArrowLeft,
    Save,
    Loader2,
    AlertCircle,
    Building,
    MapPin,
    Calendar,
    ChevronRight,
    ChevronLeft,
    X,
    Eye
} from "lucide-react"
import { useProject } from "@/hooks/projects"
import { useUpdateProject, useProjectNameCheck } from "@/hooks/projects"
import { cn } from "@/lib/utils"

// Import shared components
import { ProjectInfoStep, LocationStep, DetailsStep } from "../../components/forms"

export default function EditProjectPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.id as string
    const [activeStep, setActiveStep] = useState(1)
    const totalSteps = 3
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    // ==============================================
    // HOOKS
    // ==============================================

    // Load existing project data
    const {
        project,
        isLoading: isLoadingProject,
        hasError: hasProjectError,
        error: projectError,
        isNotFound,
    } = useProject(projectId)

    // Update project hook
    const {
        formData,
        originalProject,
        hasChanges,
        errors,
        isLoading: isUpdating,
        hasErrors,
        canSubmit,
        isSuccess,
        initializeForm,
        updateFormData,
        clearFieldError,
        updateProject,
        resetForm,

        // Location functionality
        locationSuggestions,
        isLoadingLocation,
        locationError,
        searchLocationsFree,
        selectLocationFree,
        clearLocationSuggestions,
        hasLocationSuggestions,
    } = useUpdateProject()

    // Name checking for edit mode
    const {
        isChecking: isCheckingName,
        isAvailable: isNameAvailable,
        checkNameAvailability,
        lastChecked: lastCheckedName,
    } = useProjectNameCheck()

    // ==============================================
    // EFFECTS - MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    // ==============================================

    // Initialize form when project loads
    useEffect(() => {
        if (project && !originalProject) {
            initializeForm(project)
        }
    }, [project, originalProject, initializeForm])

    // Track unsaved changes
    useEffect(() => {
        setHasUnsavedChanges(hasChanges)
    }, [hasChanges])

    // Check name availability when name changes (debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (formData.name && formData.name.trim().length > 2 && originalProject) {
                // Only check if name is different from original
                if (formData.name !== originalProject.name) {
                    checkNameAvailability(formData.name)
                }
            }
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [formData.name, originalProject, checkNameAvailability])

    // FIXED: Redirect to projects list after successful update
    useEffect(() => {
        if (isSuccess) {
            // Small delay to show success state, then redirect
            const timer = setTimeout(() => {
                router.push('/dashboard/projects')
            }, 1000)

            return () => clearTimeout(timer)
        }
    }, [isSuccess, router])

    // ==============================================
    // STEP VALIDATION - MUST BE CALLED BEFORE CONDITIONAL RETURNS
    // ==============================================

    const stepValidation = useMemo(() => {
        // Only validate if we have the required data
        if (!originalProject) {
            return { 1: false, 2: false, 3: false }
        }

        // Step 1: Basic info + name availability
        const step1Valid =
            formData.name.trim().length > 0 &&
            formData.description.trim().length > 0 &&
            !errors.name && !errors.description &&
            (formData.name === originalProject.name || isNameAvailable) &&
            !isCheckingName

        // Step 2: Location (optional, so always valid)
        const step2Valid = !errors.locationSearch && !errors.selectedLocation

        // Step 3: Details validation (including tags validation)
        const step3Valid =
            !errors.startDate && !errors.endDate && !errors.priority && !errors.status &&
            !errors.budget && !errors.clientEmail && !errors.clientPhone && !errors.tags &&
            !errors.clientWebsite && !errors.actualStartDate && !errors.actualEndDate

        return {
            1: step1Valid,
            2: step2Valid,
            3: step3Valid
        }
    }, [formData, errors, originalProject, isNameAvailable, isCheckingName])

    const canProceedToNext = stepValidation[activeStep as keyof typeof stepValidation]

    // Fix hasErrors calculation - check for actual error values, not just keys
    const actualHasErrors = Object.values(errors).some(error => error !== undefined && error !== null && error !== '')

    // FIXED: Better canSave logic that allows saving when form is valid, regardless of change detection
    const canSave = useMemo(() => {
        // Only validate if we have the required data
        if (!originalProject) {
            return false
        }

        // Can save if:
        // 1. Form is valid (no errors and all required fields filled)
        // 2. Not currently updating
        // 3. Form is initialized
        const formIsValid = !actualHasErrors &&
            formData.name.trim().length > 0 &&
            formData.description.trim().length > 0 &&
            (formData.name === originalProject.name || isNameAvailable) &&
            !isCheckingName

        return formIsValid && !isUpdating && originalProject !== null
    }, [actualHasErrors, formData.name, formData.description, originalProject, isNameAvailable, isCheckingName, isUpdating])

    // ==============================================
    // LOADING AND ERROR STATES - AFTER ALL HOOKS
    // ==============================================

    if (isLoadingProject) {
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

    if (hasProjectError || isNotFound) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {isNotFound
                                ? "Project not found. It may have been deleted or you don't have permission to view it."
                                : projectError || "Failed to load project"
                            }
                        </AlertDescription>
                    </Alert>
                    <div className="mt-4">
                        <Button asChild variant="outline">
                            <Link href="/dashboard/projects">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Projects
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (!project || !originalProject) {
        return null
    }

    // ==============================================
    // EVENT HANDLERS
    // ==============================================

    // Navigation handlers
    const handleNext = () => {
        if (activeStep < totalSteps && canProceedToNext) {
            setActiveStep(activeStep + 1)
        }
    }

    const handlePrevious = () => {
        if (activeStep > 1) {
            setActiveStep(activeStep - 1)
        }
    }

    const handleSave = async () => {
        await updateProject()
    }

    const handleCancel = () => {
        if (hasUnsavedChanges) {
            if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                resetForm()
                router.push(`/dashboard/projects/${projectId}`)
            }
        } else {
            router.push(`/dashboard/projects/${projectId}`)
        }
    }

    // Location handlers
    const handleLocationInputChange = (value: string) => {
        updateFormData('locationSearch', value)
        // Clear selected location if input changes significantly
        if (formData.selectedLocation && value !== formData.selectedLocation.address) {
            updateFormData('selectedLocation', null)
        }
    }

    const handleLocationSelect = async (suggestion: any) => {
        await selectLocationFree(suggestion)
    }

    const handleLocationClear = () => {
        updateFormData('locationSearch', '')
        updateFormData('selectedLocation', null)
        clearLocationSuggestions()
    }

    // Date handlers
    const handleStartDateChange = (startDate: string) => {
        updateFormData('startDate', startDate)
        clearFieldError('startDate')

        // Auto-set end date to next day if start date is selected and end date is empty or before start date
        if (startDate && (!formData.endDate || new Date(formData.endDate) <= new Date(startDate))) {
            const nextDay = new Date(startDate)
            nextDay.setDate(nextDay.getDate() + 1)
            const nextDayString = nextDay.toISOString().split('T')[0]
            updateFormData('endDate', nextDayString)
        }
    }

    // ==============================================
    // STEP COMPONENTS PROPS
    // ==============================================
    const step1Props = {
        mode: 'edit' as const,
        formData: {
            name: formData.name,
            description: formData.description,
        },
        errors,
        isCheckingName,
        isNameAvailable,
        lastCheckedName,
        projectNumber: formData.projectNumber || '',
        isLoadingProjectNumber: false,
        projectNumberError: null,
        onFieldChange: updateFormData,
        onFieldErrorClear: clearFieldError,
        onRetryProjectNumber: () => { },
    }

    const step2Props = {
        mode: 'edit' as const,
        formData: {
            locationSearch: formData.locationSearch,
            selectedLocation: formData.selectedLocation,
        },
        errors,
        locationSuggestions,
        isLoadingLocation,
        locationError,
        hasLocationSuggestions,
        onLocationInputChange: handleLocationInputChange,
        onLocationSelect: handleLocationSelect,
        onLocationClear: handleLocationClear,
        onSearchLocations: searchLocationsFree,
        onFieldErrorClear: clearFieldError,
    }

    const step3Props = {
        mode: 'edit' as const,
        formData: {
            status: formData.status,
            priority: formData.priority,
            budget: formData.budget,
            spent: formData.spent,
            progress: formData.progress,
            startDate: formData.startDate,
            endDate: formData.endDate,
            actualStartDate: formData.actualStartDate,
            actualEndDate: formData.actualEndDate,
            estimatedHours: formData.estimatedHours,
            actualHours: formData.actualHours,
            clientName: formData.clientName,
            clientEmail: formData.clientEmail,
            clientPhone: formData.clientPhone,
            clientContactPerson: formData.clientContactPerson,
            clientWebsite: formData.clientWebsite,
            clientNotes: formData.clientNotes,
            projectManagerId: formData.projectManagerId,
            foremanId: formData.foremanId,
            tags: formData.tags, // FIXED: Ensure tags are included
        },
        errors,
        onFieldChange: updateFormData,
        onFieldErrorClear: clearFieldError,
        onStartDateChange: handleStartDateChange,
    }

    // ==============================================
    // COMPUTED VALUES
    // ==============================================
    const progressPercentage = (activeStep / totalSteps) * 100



    // ==============================================
    // RENDER STEP CONTENT
    // ==============================================
    const renderStepContent = () => {
        switch (activeStep) {
            case 1:
                return <ProjectInfoStep {...step1Props} />
            case 2:
                return <LocationStep {...step2Props} />
            case 3:
                return <DetailsStep {...step3Props} />
            default:
                return null
        }
    }

    // ==============================================
    // RENDER
    // ==============================================

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-start xs:items-center gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4">
                        <Link href={`/dashboard/projects/${projectId}`}>
                            <Button variant="outline" size="icon" className="shrink-0 h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10">
                                <ArrowLeft className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                            </Button>
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 leading-tight xs:leading-normal truncate">
                                Edit Project
                            </h1>
                            <p className="text-xs xs:text-sm sm:text-base text-gray-600 mt-0.5 xs:mt-0.5 sm:mt-1 line-clamp-2 leading-snug xs:leading-normal">
                                Update project details and settings
                            </p>
                        </div>

                        <div className="flex items-center gap-2 md:block hidden">
                            <Button asChild variant="ghost" size="sm">
                                <Link href={`/dashboard/projects/${projectId}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Project
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm font-medium text-gray-700">
                            <span>Step {activeStep} of {totalSteps}</span>
                            <span className="hidden xs:inline">{Math.round(progressPercentage)}% Complete</span>
                            <span className="xs:hidden">{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-1.5 sm:h-2" />
                    </div>
                </div>

                <Card>
                    <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">
                        {/* Step Content */}
                        {renderStepContent()}
                        <Separator />
                        {/* Navigation */}
                        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 pt-4 sm:pt-6">
                            <div className="flex gap-2 sm:gap-3 order-2 md:order-1">
                                {activeStep > 1 && (
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

                            {activeStep < totalSteps ? (
                                <Button
                                    onClick={handleNext}
                                    disabled={!canProceedToNext}
                                    className="order-1 md:order-2 w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white h-11 sm:h-12 text-base"
                                >
                                    <span className="text-sm sm:text-base">Next</span>
                                    <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSave}
                                    disabled={!canSave}
                                    className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            <span className="text-sm sm:text-base">Saving Changes...</span>
                                        </>
                                    ) : isSuccess ? (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            <span className="text-sm sm:text-base">Saved! Redirecting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            <span className="text-sm sm:text-base">Save Changes</span>
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        {/* Error Display - Show actual errors to debug the issue */}
                        {actualHasErrors && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <div>
                                        <p className="font-medium mb-2">Please fix the following errors:</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                            {Object.entries(errors).map(([field, error]) => (
                                                error && error !== '' && error !== null && error !== undefined && (
                                                    <li key={field}>
                                                        <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1')}:</span> {error}
                                                    </li>
                                                )
                                            ))}
                                        </ul>
                                        {/* Debug info to see what's causing the issue */}
                                        <details className="mt-2">
                                            <summary className="text-xs cursor-pointer">Debug Info (click to expand)</summary>
                                            <pre className="text-xs mt-1 bg-gray-100 p-2 rounded">{JSON.stringify(errors, null, 2)}</pre>
                                            <p className="text-xs mt-1">hasErrors (hook): {hasErrors.toString()}</p>
                                            <p className="text-xs">actualHasErrors: {actualHasErrors.toString()}</p>
                                            <p className="text-xs">canSubmit (hook): {canSubmit.toString()}</p>
                                            <p className="text-xs">canSave (local): {canSave?.toString() ?? 'null'}</p>
                                            <p className="text-xs">hasChanges: {hasChanges.toString()}</p>
                                            <p className="text-xs">hasUnsavedChanges: {hasUnsavedChanges.toString()}</p>
                                            <p className="text-xs">Tags: {JSON.stringify(formData.tags)}</p>
                                        </details>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}