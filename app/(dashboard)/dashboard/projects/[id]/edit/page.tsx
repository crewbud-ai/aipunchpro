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

  // Name checking for edit mode (same as create page)
  const {
    isChecking: isCheckingName,
    isAvailable: isNameAvailable,
    checkNameAvailability,
    lastChecked: lastCheckedName,
  } = useProjectNameCheck()

  // ==============================================
  // EFFECTS
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

  // Check name availability when name changes (debounced) - same as create page
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
  }, [formData.name, checkNameAvailability, originalProject])

  // Location search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.locationSearch && formData.locationSearch.length > 2) {
        searchLocationsFree(formData.locationSearch)
      } else {
        clearLocationSuggestions()
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [formData.locationSearch, searchLocationsFree, clearLocationSuggestions])

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const progressPercentage = (activeStep / totalSteps) * 100

  // Form validation for each step (same as create page)
  const stepValidation = useMemo(() => {
    // Step 1: Project name is required and available (if checked) - same logic as create
    const step1Valid = 
      formData.name.trim().length > 0 && 
      !errors.name && 
      !errors.description &&
      // In edit mode: name is valid if it's the same as original OR available
      (formData.name === originalProject?.name || isNameAvailable !== false) &&
      !isCheckingName // Must not be currently checking

    const step2Valid = Boolean(formData.selectedLocation) && !errors.selectedLocation && !errors.location
    
    // Step 3: Only check for actual validation errors, not all fields
    const step3Valid = !errors.startDate && !errors.endDate && !errors.estimatedHours && 
      !errors.budget && !errors.clientEmail && !errors.clientPhone && !errors.tags &&
      !errors.clientWebsite // Include website validation
    
    return {
      1: step1Valid,
      2: step2Valid, 
      3: step3Valid
    }
  }, [formData, errors, originalProject, isNameAvailable, isCheckingName])

  const canProceedToNext = stepValidation[activeStep as keyof typeof stepValidation]

  // Fix hasErrors calculation - check for actual error values, not just keys
  const actualHasErrors = Object.values(errors).some(error => error !== undefined && error !== null && error !== '')

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  
  // Navigation handlers (same as create page)
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
    console.log('Save clicked - Form Data:', formData)
    console.log('Save clicked - Errors:', errors)
    console.log('Save clicked - Can Submit:', canSubmit)
    console.log('Save clicked - Has Changes:', hasChanges)
    console.log('Save clicked - Has Unsaved Changes:', hasUnsavedChanges)
    console.log('Save clicked - Actual Has Errors:', actualHasErrors)
    
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

  // Location handlers (same as create page)
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

  // Date handlers (same as create page)
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
  // STEP COMPONENTS PROPS (same structure as create page)
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
    onRetryProjectNumber: () => {},
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
  }

  const step3Props = {
    mode: 'edit' as const,
    formData: {
      startDate: formData.startDate,
      endDate: formData.endDate,
      budget: formData.budget,
      estimatedHours: formData.estimatedHours,
      clientName: formData.clientName,
      clientContactPerson: formData.clientContactPerson,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      clientWebsite: formData.clientWebsite,
      clientNotes: formData.clientNotes,
      tags: formData.tags,
    },
    errors,
    onFieldChange: updateFormData,
    onFieldErrorClear: clearFieldError,
    onStartDateChange: handleStartDateChange,
  }

  // ==============================================
  // RENDER STEP CONTENT (same as create page)
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
  // STEP METADATA (same as create page)
  // ==============================================
  const getStepMetadata = (step: number) => {
    switch (step) {
      case 1:
        return {
          icon: Building,
          title: "Project Information",
          description: "Update the basic information about your project"
        }
      case 2:
        return {
          icon: MapPin,
          title: "Project Location",
          description: "Update the project location"
        }
      case 3:
        return {
          icon: Calendar,
          title: "Timeline, Budget & Client Details",
          description: "Update timeline, budget and client information"
        }
      default:
        return {
          icon: Building,
          title: "Project Setup",
          description: "Configure your project"
        }
    }
  }

  const currentStepMeta = getStepMetadata(activeStep)
  const StepIcon = currentStepMeta.icon

  // ==============================================
  // LOADING STATE
  // ==============================================
  if (isLoadingProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==============================================
  // ERROR STATES
  // ==============================================
  if (isNotFound) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
        <p className="text-gray-600 mb-6">The project you're trying to edit doesn't exist or has been deleted.</p>
        <Link href="/dashboard/projects">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>
    )
  }

  if (hasProjectError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/projects/${projectId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Project</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{projectError}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!project) return null

  // ==============================================
  // MAIN RENDER (same structure as create page)
  // ==============================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header - Same structure as create page */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/projects/${projectId}`}>
                <Button variant="outline" size="icon" className="shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
                <p className="text-gray-600 mt-1">Update project information, location, and details</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/dashboard/projects/${projectId}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Project
                </Button>
              </Link>
            </div>
          </div>

          {/* Progress Bar - Same as create page */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-gray-700">
              <span>Step {activeStep} of {totalSteps}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Form Card - Same structure as create page */}
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

            {/* Navigation Buttons - Same as create page */}
            <Separator />
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <div className="flex gap-3 sm:flex-1">
                {activeStep > 1 && (
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

                {activeStep === 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1 sm:flex-none"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>

              {activeStep < totalSteps ? (
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
                  onClick={handleSave}
                  disabled={!canSubmit || isUpdating || !hasUnsavedChanges}
                  className="flex-1 sm:flex-none"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes {!hasUnsavedChanges && '(No changes)'}
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
                      <p className="text-xs">canSubmit: {canSubmit.toString()}</p>
                    </details>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Step Indicator - Same as create page */}
            <div className="flex justify-center pt-4">
              <div className="flex space-x-2">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      i + 1 === activeStep
                        ? "bg-blue-600"
                        : i + 1 < activeStep
                        ? "bg-green-600"
                        : "bg-gray-300"
                    )}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}