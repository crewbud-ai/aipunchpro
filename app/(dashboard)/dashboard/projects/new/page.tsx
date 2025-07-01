"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Building, 
  User, 
  Hash,
  Clock,
  Info,
  ChevronRight,
  ChevronLeft,
  X
} from "lucide-react"
import { useCreateProject, useProjectNameCheck } from "@/hooks/projects"
import { cn } from "@/lib/utils"

export default function CreateProjectPage() {
  const [activeStep, setActiveStep] = useState(1)
  const totalSteps = 3
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  
  const {
    formData,
    updateFormData,
    createProject,
    isLoading,
    isSuccess,
    hasErrors,
    errors,
    canSubmit,
    clearFieldError,
    validateForm,
  } = useCreateProject()

  const {
    isChecking: isCheckingName,
    isAvailable: isNameAvailable,
    checkNameAvailability,
    lastCheckedName,
  } = useProjectNameCheck()

  // Progress calculation
  const progressPercentage = (activeStep / totalSteps) * 100

  // Location suggestions (mock data - replace with actual API)
  const mockLocationSuggestions = [
    "Downtown Business District, New York, NY",
    "Financial District, Manhattan, NY", 
    "Midtown East, New York, NY",
    "Brooklyn Heights, Brooklyn, NY",
    "Long Island City, Queens, NY"
  ]

  // Check name availability when name changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.name && formData.name.trim().length > 2) {
        checkNameAvailability(formData.name)
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.name, checkNameAvailability])

  // Location suggestions handler
  const handleLocationSearch = (value: string) => {
    updateFormData('location', value)
    if (value.length > 2) {
      // Filter mock suggestions based on input
      const filtered = mockLocationSuggestions.filter(location =>
        location.toLowerCase().includes(value.toLowerCase())
      )
      setLocationSuggestions(filtered)
      setShowLocationSuggestions(filtered.length > 0)
    } else {
      setShowLocationSuggestions(false)
    }
  }

  const selectLocationSuggestion = (location: string) => {
    updateFormData('location', location)
    setShowLocationSuggestions(false)
  }

  // Form validation for each step
  const stepValidation = useMemo(() => {
    const step1Valid = formData.name.trim().length > 0 && !errors.name && !errors.description && !errors.projectNumber && !errors.location
    const step2Valid = !errors.startDate && !errors.endDate && !errors.estimatedHours
    const step3Valid = !errors.budget && !errors.clientName && !errors.clientContact && !errors.address && !errors.tags
    
    return {
      1: step1Valid,
      2: step2Valid, 
      3: step3Valid
    }
  }, [formData.name, errors])

  const canProceedToNext = stepValidation[activeStep as keyof typeof stepValidation]

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
    }
  }

  const renderNameValidation = () => {
    if (!formData.name || formData.name.trim().length <= 2) return null

    if (isCheckingName) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600 mt-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Checking availability...</span>
        </div>
      )
    }

    if (lastCheckedName === formData.name) {
      if (isNameAvailable) {
        return (
          <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
            <CheckCircle className="h-3 w-3" />
            <span>Project name is available</span>
          </div>
        )
      } else {
        return (
          <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
            <AlertCircle className="h-3 w-3" />
            <span>This project name is already taken</span>
          </div>
        )
      }
    }

    return null
  }

  // Tags management
  const addTag = (tagText: string) => {
    const currentTags = formData.tags || []
    if (tagText.trim() && !currentTags.includes(tagText.trim()) && currentTags.length < 10) {
      updateFormData('tags', [...currentTags, tagText.trim()])
    }
  }

  const removeTag = (tagToRemove: string) => {
    const currentTags = formData.tags || []
    updateFormData('tags', currentTags.filter(tag => tag !== tagToRemove))
  }

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const input = e.currentTarget
      addTag(input.value)
      input.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/projects">
              <Button variant="outline" size="icon" className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Create New Project</h1>
              <p className="text-gray-600 mt-1">Set up a new construction project for your team</p>
            </div>
            {isSuccess && (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 hidden sm:flex">
                <CheckCircle className="h-3 w-3 mr-1" />
                Created Successfully
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Step {activeStep} of {totalSteps}</span>
              <span className="text-gray-600">{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Global Errors */}
        {errors.general && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Steps Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Project Setup</CardTitle>
                <CardDescription>Complete all steps to create your project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    id: 1,
                    title: "Basic Information",
                    description: "Project details and identification",
                    icon: Building,
                    required: true
                  },
                  {
                    id: 2,
                    title: "Timeline & Scope", 
                    description: "Schedule and work estimates",
                    icon: Calendar,
                    required: false
                  },
                  {
                    id: 3,
                    title: "Budget & Client",
                    description: "Financial and client information", 
                    icon: DollarSign,
                    required: false
                  }
                ].map((step) => {
                  const isActive = activeStep === step.id
                  const isCompleted = activeStep > step.id && stepValidation[step.id as keyof typeof stepValidation]
                  const hasError = !stepValidation[step.id as keyof typeof stepValidation] && activeStep > step.id
                  
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer",
                        isActive && "bg-orange-50 border border-orange-200",
                        isCompleted && "bg-green-50 border border-green-200",
                        hasError && "bg-red-50 border border-red-200",
                        !isActive && !isCompleted && !hasError && "hover:bg-gray-50"
                      )}
                      onClick={() => setActiveStep(step.id)}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                        isActive && "border-orange-600 bg-orange-600 text-white",
                        isCompleted && "border-green-600 bg-green-600 text-white",
                        hasError && "border-red-600 bg-red-600 text-white",
                        !isActive && !isCompleted && !hasError && "border-gray-300 text-gray-600"
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : hasError ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <step.icon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={cn(
                          "font-medium text-sm",
                          isActive && "text-orange-900",
                          isCompleted && "text-green-900",
                          hasError && "text-red-900",
                          !isActive && !isCompleted && !hasError && "text-gray-900"
                        )}>
                          {step.title}
                          {step.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{step.description}</div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {activeStep === 1 && <Building className="h-5 w-5 text-orange-600" />}
                  {activeStep === 2 && <Calendar className="h-5 w-5 text-orange-600" />}
                  {activeStep === 3 && <DollarSign className="h-5 w-5 text-orange-600" />}
                  Step {activeStep}: {
                    activeStep === 1 ? "Basic Information" :
                    activeStep === 2 ? "Timeline & Scope" :
                    "Budget & Client"
                  }
                </CardTitle>
                <CardDescription>
                  {activeStep === 1 && "Enter the essential project details and identification information"}
                  {activeStep === 2 && "Set project timeline and estimate the scope of work"}
                  {activeStep === 3 && "Add budget information and client details"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Step 1: Basic Information */}
                {activeStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="flex items-center gap-2 text-base font-medium">
                          <Building className="h-4 w-4" />
                          Project Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => {
                            updateFormData('name', e.target.value)
                            clearFieldError('name')
                          }}
                          placeholder="e.g., Downtown Office Complex"
                          className={cn(
                            "mt-2 text-base",
                            errors.name && "border-red-500 focus:border-red-500 focus:ring-red-500"
                          )}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.name}
                          </p>
                        )}
                        {renderNameValidation()}
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-base font-medium">Project Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description || ''}
                          onChange={(e) => {
                            updateFormData('description', e.target.value)
                            clearFieldError('description')
                          }}
                          placeholder="Brief description of the project scope, objectives, and key deliverables..."
                          rows={4}
                          className={cn(
                            "mt-2 text-base resize-none",
                            errors.description && "border-red-500 focus:border-red-500 focus:ring-red-500"
                          )}
                        />
                        <div className="flex items-center justify-between mt-2">
                          {errors.description && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 ml-auto">
                            {(formData.description || '').length}/1000 characters
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="projectNumber" className="flex items-center gap-2 text-base font-medium">
                          <Hash className="h-4 w-4" />
                          Project Number
                        </Label>
                        <Input
                          id="projectNumber"
                          value={formData.projectNumber || ''}
                          onChange={(e) => {
                            updateFormData('projectNumber', e.target.value)
                            clearFieldError('projectNumber')
                          }}
                          placeholder="e.g., PRJ-2024-001"
                          className={cn(
                            "mt-2 text-base",
                            errors.projectNumber && "border-red-500 focus:border-red-500 focus:ring-red-500"
                          )}
                        />
                        {errors.projectNumber && (
                          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.projectNumber}
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <Label htmlFor="location" className="flex items-center gap-2 text-base font-medium">
                          <MapPin className="h-4 w-4" />
                          Location
                        </Label>
                        <Input
                          id="location"
                          value={formData.location || ''}
                          onChange={(e) => handleLocationSearch(e.target.value)}
                          onFocus={() => formData.location && formData.location.length > 2 && setShowLocationSuggestions(true)}
                          placeholder="e.g., Downtown District, New York"
                          className={cn(
                            "mt-2 text-base",
                            errors.location && "border-red-500 focus:border-red-500 focus:ring-red-500"
                          )}
                        />
                        
                        {/* Location Suggestions Dropdown */}
                        {showLocationSuggestions && locationSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {locationSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm"
                                onClick={() => selectLocationSuggestion(suggestion)}
                              >
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  {suggestion}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {errors.location && (
                          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.location}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Project Setup Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-900 mb-1">Default Project Settings</h4>
                          <p className="text-sm text-blue-700">
                            New projects will start with status <strong>"Not Started"</strong> and <strong>medium priority</strong>. 
                            These settings will automatically update as work progresses.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Timeline & Scope */}
                {activeStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="startDate" className="flex items-center gap-2 text-base font-medium">
                          <Calendar className="h-4 w-4" />
                          Start Date
                        </Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate || ''}
                          onChange={(e) => {
                            updateFormData('startDate', e.target.value)
                            clearFieldError('startDate')
                          }}
                          className={cn(
                            "mt-2 text-base",
                            errors.startDate && "border-red-500 focus:border-red-500 focus:ring-red-500"
                          )}
                        />
                        {errors.startDate && (
                          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.startDate}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="endDate" className="flex items-center gap-2 text-base font-medium">
                          <Calendar className="h-4 w-4" />
                          Expected End Date
                        </Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate || ''}
                          onChange={(e) => {
                            updateFormData('endDate', e.target.value)
                            clearFieldError('endDate')
                          }}
                          className={cn(
                            "mt-2 text-base",
                            errors.endDate && "border-red-500 focus:border-red-500 focus:ring-red-500"
                          )}
                        />
                        {errors.endDate && (
                          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.endDate}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="estimatedHours" className="flex items-center gap-2 text-base font-medium">
                        <Clock className="h-4 w-4" />
                        Estimated Hours
                      </Label>
                      <Input
                        id="estimatedHours"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.estimatedHours || ''}
                        onChange={(e) => {
                          updateFormData('estimatedHours', e.target.value ? parseFloat(e.target.value) : undefined)
                          clearFieldError('estimatedHours')
                        }}
                        placeholder="e.g., 2000"
                        className={cn(
                          "mt-2 text-base",
                          errors.estimatedHours && "border-red-500 focus:border-red-500 focus:ring-red-500"
                        )}
                      />
                      {errors.estimatedHours && (
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.estimatedHours}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-2">
                        Total estimated work hours for project completion (optional)
                      </p>
                    </div>

                    {/* Timeline calculation */}
                    {formData.startDate && formData.endDate && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-900 mb-2">Project Timeline</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-green-700">Duration:</span>
                            <p className="font-medium text-green-900">
                              {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                            </p>
                          </div>
                          <div>
                            <span className="text-green-700">Start:</span>
                            <p className="font-medium text-green-900">{new Date(formData.startDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-green-700">End:</span>
                            <p className="font-medium text-green-900">{new Date(formData.endDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Budget & Client */}
                {activeStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="budget" className="flex items-center gap-2 text-base font-medium">
                        <DollarSign className="h-4 w-4" />
                        Project Budget
                      </Label>
                      <Input
                        id="budget"
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.budget || ''}
                        onChange={(e) => {
                          updateFormData('budget', e.target.value ? parseFloat(e.target.value) : undefined)
                          clearFieldError('budget')
                        }}
                        placeholder="e.g., 1000000"
                        className={cn(
                          "mt-2 text-base",
                          errors.budget && "border-red-500 focus:border-red-500 focus:ring-red-500"
                        )}
                      />
                      {errors.budget && (
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.budget}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-2">
                        Total allocated budget for this project (optional)
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Client Information
                      </h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="clientName" className="text-base font-medium">Client Name</Label>
                          <Input
                            id="clientName"
                            value={formData.clientName || ''}
                            onChange={(e) => {
                              updateFormData('clientName', e.target.value)
                              clearFieldError('clientName')
                            }}
                            placeholder="e.g., ABC Construction Corp"
                            className={cn(
                              "mt-2 text-base",
                              errors.clientName && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                          />
                          {errors.clientName && (
                            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.clientName}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="clientContact" className="text-base font-medium">Client Contact</Label>
                          <Input
                            id="clientContact"
                            value={formData.clientContact || ''}
                            onChange={(e) => {
                              updateFormData('clientContact', e.target.value)
                              clearFieldError('clientContact')
                            }}
                            placeholder="email@company.com or +1-555-0123"
                            className={cn(
                              "mt-2 text-base",
                              errors.clientContact && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                          />
                          {errors.clientContact && (
                            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.clientContact}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address" className="text-base font-medium">Project Address</Label>
                        <Textarea
                          id="address"
                          value={formData.address || ''}
                          onChange={(e) => {
                            updateFormData('address', e.target.value)
                            clearFieldError('address')
                          }}
                          placeholder="123 Main Street, Suite 100, Downtown District, City, State 12345"
                          rows={3}
                          className={cn(
                            "mt-2 text-base resize-none",
                            errors.address && "border-red-500 focus:border-red-500 focus:ring-red-500"
                          )}
                        />
                        {errors.address && (
                          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.address}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label htmlFor="tags" className="text-base font-medium">Project Tags</Label>
                      <div className="mt-2">
                        <Input
                          id="tags"
                          placeholder="Type a tag and press Enter (e.g., commercial, high-rise)"
                          onKeyDown={handleTagInput}
                          className="text-base"
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          Press Enter or comma to add tags. Maximum 10 tags allowed.
                        </p>
                      </div>
                      
                      {formData.tags && formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.tags.map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-sm px-3 py-1 flex items-center gap-1"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {errors.tags && (
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.tags}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
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
                      <Link href="/dashboard/projects" className="flex-1 sm:flex-none">
                        <Button variant="outline" className="w-full">
                          Cancel
                        </Button>
                      </Link>
                    )}
                  </div>

                  {activeStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={!canProceedToNext}
                      className="bg-orange-600 hover:bg-orange-700 flex-1 sm:flex-none"
                    >
                      Next Step
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canSubmit || isLoading}
                      className="bg-orange-600 hover:bg-orange-700 flex-1 sm:flex-none"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Project...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create Project
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Summary (visible on last step) */}
            {activeStep === 3 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Project Summary
                  </CardTitle>
                  <CardDescription>Review your project details before creating</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-600">Project Name:</span>
                        <p className="text-gray-900 font-medium">{formData.name}</p>
                      </div>
                      
                      {formData.projectNumber && (
                        <div>
                          <span className="font-medium text-gray-600">Project Number:</span>
                          <p className="text-gray-900">{formData.projectNumber}</p>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <p className="text-gray-900">
                          <Badge variant="outline" className="bg-gray-100">Not Started (default)</Badge>
                        </p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-600">Priority:</span>
                        <p className="text-gray-900">
                          <Badge variant="outline" className="bg-orange-100">Medium (default)</Badge>
                        </p>
                      </div>

                      {formData.location && (
                        <div>
                          <span className="font-medium text-gray-600">Location:</span>
                          <p className="text-gray-900">{formData.location}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {formData.budget && (
                        <div>
                          <span className="font-medium text-gray-600">Budget:</span>
                          <p className="text-gray-900 font-medium">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(formData.budget)}
                          </p>
                        </div>
                      )}
                      
                      {formData.clientName && (
                        <div>
                          <span className="font-medium text-gray-600">Client:</span>
                          <p className="text-gray-900">{formData.clientName}</p>
                        </div>
                      )}

                      {formData.estimatedHours && (
                        <div>
                          <span className="font-medium text-gray-600">Estimated Hours:</span>
                          <p className="text-gray-900">{formData.estimatedHours.toLocaleString()} hours</p>
                        </div>
                      )}

                      {(formData.startDate || formData.endDate) && (
                        <div>
                          <span className="font-medium text-gray-600">Timeline:</span>
                          <p className="text-gray-900">
                            {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'TBD'} 
                            {' → '} 
                            {formData.endDate ? new Date(formData.endDate).toLocaleDateString() : 'TBD'}
                          </p>
                        </div>
                      )}

                      {formData.tags && formData.tags.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-600">Tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {formData.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {formData.description && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="font-medium text-gray-600">Description:</span>
                      <p className="text-gray-900 mt-1 text-sm leading-relaxed">{formData.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}