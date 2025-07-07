// projects/components/forms/ProjectInfoStep.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Hash,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CreateProjectFormData, ProjectFormErrors } from "@/types/projects"

interface ProjectInfoStepProps {
  mode?: 'create' | 'edit'  // NEW: Support both modes
  formData: Pick<CreateProjectFormData, 'name' | 'description'>
  errors: ProjectFormErrors
  isCheckingName: boolean
  isNameAvailable: boolean | null
  lastCheckedName: string
  projectNumber: string
  isLoadingProjectNumber: boolean
  projectNumberError: string | null
  onFieldChange: (field: keyof CreateProjectFormData, value: any) => void
  onFieldErrorClear: (field: keyof ProjectFormErrors) => void
  onRetryProjectNumber: () => void
}

export function ProjectInfoStep({
  mode = 'create', // Default to create mode
  formData,
  errors,
  isCheckingName,
  isNameAvailable,
  lastCheckedName,
  projectNumber,
  isLoadingProjectNumber,
  projectNumberError,
  onFieldChange,
  onFieldErrorClear,
  onRetryProjectNumber,
}: ProjectInfoStepProps) {
  
  // ==============================================
  // RENDER HELPERS
  // ==============================================
  
  // Name validation display (only for create mode)
  const renderNameValidation = () => {
    // if (mode === 'edit') return null // Skip name validation in edit mode
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

  // Project number display (different behavior for create vs edit)
  const renderProjectNumber = () => (
    <div>
      <Label className="flex items-center gap-2 text-base font-medium">
        <Hash className="h-4 w-4" />
        Project Number
      </Label>
      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="flex items-center justify-between">
          {mode === 'edit' ? (
            // Edit mode: Show existing project number (read-only)
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Project Number:</span>
              <span className="font-mono font-medium text-gray-900">
                {projectNumber || 'Not assigned'}
              </span>
            </div>
          ) : (
            // Create mode: Show generation status
            <>
              {isLoadingProjectNumber ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-600">Generating...</span>
                </div>
              ) : projectNumberError ? (
                <div className="flex items-center gap-2 flex-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">Failed to generate</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Auto-generated:</span>
                  <span className="font-mono font-medium text-gray-900">
                    {projectNumber || 'Failed to generate'}
                  </span>
                </div>
              )}
              
              {(projectNumberError || !projectNumber) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetryProjectNumber}
                  disabled={isLoadingProjectNumber}
                  className="ml-2"
                >
                  <RefreshCw className={cn("h-3 w-3", isLoadingProjectNumber && "animate-spin")} />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {mode === 'edit' 
          ? 'Project numbers cannot be changed after creation'
          : 'Project numbers are automatically generated for tracking purposes'
        }
      </p>
    </div>
  )

  // ==============================================
  // MAIN RENDER
  // ==============================================
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Project Name */}
        <div>
          <Label htmlFor="name" className="text-base font-medium">
            Project Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              onFieldChange('name', e.target.value)
              onFieldErrorClear('name')
            }}
            placeholder="Enter project name..."
            className={cn(
              "mt-2 text-base",
              errors.name && "border-red-500 focus:border-red-500 focus:ring-red-500",
              mode === 'create' && isNameAvailable === false && "border-red-500 focus:border-red-500 focus:ring-red-500"
            )}
          />
          {renderNameValidation()}
          {errors.name && (
            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Project Description */}
        <div>
          <Label htmlFor="description" className="text-base font-medium">Project Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => {
              onFieldChange('description', e.target.value)
              onFieldErrorClear('description')
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

        {/* Project Number */}
        {renderProjectNumber()}
      </div>
    </div>
  )
}