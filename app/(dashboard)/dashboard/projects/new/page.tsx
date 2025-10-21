"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Calendar,
  Building,
  ChevronRight,
  ChevronLeft,
  User,
  CheckCircle
} from "lucide-react"
import { useCreateProject, useProjectNameCheck } from "@/hooks/projects"
import { cn } from "@/lib/utils"

// Import sub-components
import { ProjectInfoStep, LocationStep, DetailsStep } from "../components/forms"

export default function CreateProjectPage() {
  const [activeStep, setActiveStep] = useState(1)
  const totalSteps = 3

  // ==============================================
  // HOOKS
  // ==============================================
  const {
    formData,
    updateFormData,
    updateFormDataBulk,
    createProject,
    isLoading,
    hasErrors,
    errors,
    canSubmit,
    clearFieldError,
    validateForm,

    // Location autocomplete
    locationSuggestions,
    isLoadingLocation,
    locationError,
    searchLocationsFree,
    selectLocationFree,
    clearLocationSuggestions,
    hasLocationSuggestions,

    // Project number
    projectNumber,
    isLoadingProjectNumber,
    projectNumberError,
    generateProjectNumber,
  } = useCreateProject()

  const {
    isChecking: isCheckingName,
    isAvailable: isNameAvailable,
    checkNameAvailability,
    lastChecked: lastCheckedName,
  } = useProjectNameCheck()

  // ==============================================
  // EFFECTS
  // ==============================================

  // Auto-generate project number on mount
  useEffect(() => {
    generateProjectNumber()
  }, [generateProjectNumber])

  // Check name availability when name changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.name && formData.name.trim().length > 2) {
        checkNameAvailability(formData.name)
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.name, checkNameAvailability])

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

  // Form validation for each step
  const stepValidation = useMemo(() => {
    // Step 1: Project name is required and available (if checked)
    const step1Valid =
      formData.name.trim().length > 0 &&
      !errors.name &&
      !errors.description &&
      (isNameAvailable !== false) && // Name must not be unavailable
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
  }, [formData, errors, isNameAvailable, isCheckingName])

  const canProceedToNext = stepValidation[activeStep as keyof typeof stepValidation]

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

  const handleSubmit = async () => {
    if (validateForm()) {
      await createProject()
    } else {
      console.log('Validation failed')
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
    // Check if this is a map selection (has isMapSelection flag or coordinates directly)
    if (suggestion.isMapSelection || suggestion.coordinates) {
      // Handle map selection directly without API call
      updateFormDataBulk({
        locationSearch: suggestion.description,
        selectedLocation: {
          address: suggestion.description,
          displayName: suggestion.structured_formatting?.main_text || suggestion.displayName || 'Selected Location',
          coordinates: suggestion.coordinates,
          placeId: suggestion.place_id,
        },
      })

      // Clear suggestions and loading state
      clearLocationSuggestions()
    } else {
      // Handle normal dropdown selection
      await selectLocationFree(suggestion)
    }
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
    formData,
    errors,
    isCheckingName,
    isNameAvailable,
    lastCheckedName,
    projectNumber,
    isLoadingProjectNumber,
    projectNumberError,
    onFieldChange: updateFormData,
    onFieldErrorClear: clearFieldError,
    onRetryProjectNumber: generateProjectNumber,
  }

  const step2Props = {
    formData,
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
    formData,
    errors,
    onFieldChange: updateFormData,
    onFieldErrorClear: clearFieldError,
    onStartDateChange: handleStartDateChange,
  }

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
  // STEP METADATA
  // ==============================================
  const getStepMetadata = (step: number) => {
    switch (step) {
      case 1:
        return {
          icon: Building,
          title: "Project Information",
          description: "Enter the basic information about your project"
        }
      case 2:
        return {
          icon: Building,
          title: "Project Location",
          description: "Select the project location"
        }
      case 3:
        return {
          icon: Calendar,
          title: "Timeline, Budget & Client Details",
          description: "Set timeline, budget and add client information"
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
  // MAIN RENDER
  // ==============================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl">
        {/* Header - Mobile Responsive */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start xs:items-center gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4">
            <Link href="/dashboard/projects">
              <Button variant="outline" size="icon" className="shrink-0 h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10">
                <ArrowLeft className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 leading-tight xs:leading-normal truncate">
                Create New Project
              </h1>
              <p className="text-xs xs:text-sm sm:text-base text-gray-600 mt-0.5 xs:mt-0.5 sm:mt-1 line-clamp-2 leading-snug xs:leading-normal">
                Set up your project with location, timeline, and client details
              </p>
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
        </div>

        {/* Form Card - Mobile Responsive */}
        <Card>
          {/* <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <StepIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="truncate text-md md:tsxt-lg">{currentStepMeta.title}</span>
            </CardTitle>
            <CardDescription className="text-sm !mt-0">
              {currentStepMeta.description}
            </CardDescription>
          </CardHeader> */}

          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">
            {/* Render Current Step */}
            {renderStepContent()}

            {/* Navigation Buttons - Mobile Responsive */}
            <Separator />
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 pt-4 sm:pt-6">

              {/* Left side (Previous / Cancel button) */}
              <div className="flex gap-2 sm:gap-3 order-2 md:order-1">
                {activeStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    className="h-10 sm:h-11 w-full md:w-auto"
                  >
                    <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="text-sm sm:text-base">Previous</span>
                  </Button>
                )}

                {activeStep === 1 && (
                  <Link className="w-full md:w-auto" href="/dashboard/projects">
                    <Button
                      variant="outline"
                      className="h-10 sm:h-11 w-full md:w-auto text-sm sm:text-base"
                    >
                      Cancel
                    </Button>
                  </Link>
                )}
              </div>

              {/* Right side (Next / Submit button) */}
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
                  onClick={handleSubmit}
                  disabled={!canSubmit || isLoading}
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
                      <span className="text-sm sm:text-base">Create Project</span>
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