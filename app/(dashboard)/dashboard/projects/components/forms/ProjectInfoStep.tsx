// ==============================================
// projects/components/forms/ProjectInfoStep.tsx - Mobile Responsive
// ==============================================

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
  mode?: 'create' | 'edit'
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
  mode = 'create',
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
  // RENDER HELPERS - Mobile Responsive
  // ==============================================
  
  // Name validation display (only for create mode)
  const renderNameValidation = () => {
    if (!formData.name || formData.name.trim().length <= 2) return null

    if (isCheckingName) {
      return (
        <div className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm text-blue-600 mt-1 xs:mt-1.5">
          <Loader2 className="h-3 w-3 xs:h-3.5 xs:w-3.5 animate-spin shrink-0" />
          <span className="leading-tight">Checking availability...</span>
        </div>
      )
    }

    if (lastCheckedName === formData.name) {
      if (isNameAvailable) {
        return (
          <div className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm text-green-600 mt-1 xs:mt-1.5">
            <CheckCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
            <span className="leading-tight">Project name is available</span>
          </div>
        )
      } else {
        return (
          <div className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5">
            <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
            <span className="leading-tight">This project name is already taken</span>
          </div>
        )
      }
    }

    return null
  }

  // Project number display - Mobile Responsive
  const renderProjectNumber = () => (
    <div>
      <Label className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base font-medium">
        <Hash className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
        <span>Project Number</span>
      </Label>
      <div className="mt-1.5 xs:mt-2 p-2.5 xs:p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="flex items-center justify-between gap-2">
          {mode === 'edit' ? (
            // Edit mode: Show existing project number (read-only)
            <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 min-w-0 flex-1">
              <span className="text-xs xs:text-sm text-gray-600 shrink-0">Project Number:</span>
              <span className="font-mono font-medium text-sm xs:text-base text-gray-900 truncate">
                {projectNumber || 'Not assigned'}
              </span>
            </div>
          ) : (
            // Create mode: Show generation status
            <>
              {isLoadingProjectNumber ? (
                <div className="flex items-center gap-1.5 xs:gap-2 min-w-0 flex-1">
                  <Loader2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin text-gray-400 shrink-0" />
                  <span className="text-xs xs:text-sm text-gray-600 truncate">Generating...</span>
                </div>
              ) : projectNumberError ? (
                <div className="flex items-center gap-1.5 xs:gap-2 min-w-0 flex-1">
                  <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-red-500 shrink-0" />
                  <span className="text-xs xs:text-sm text-red-600 truncate">Failed to generate</span>
                </div>
              ) : (
                <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 min-w-0 flex-1">
                  <span className="text-xs xs:text-sm text-gray-600 shrink-0">Auto-generated:</span>
                  <span className="font-mono font-medium text-sm xs:text-base text-gray-900 truncate">
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
                  className="ml-1 xs:ml-2 h-7 w-7 xs:h-8 xs:w-8 p-0 shrink-0"
                >
                  <RefreshCw className={cn(
                    "h-3 w-3 xs:h-3.5 xs:w-3.5", 
                    isLoadingProjectNumber && "animate-spin"
                  )} />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1 xs:mt-1.5 leading-snug">
        {mode === 'edit' 
          ? 'Project numbers cannot be changed after creation'
          : 'Project numbers are automatically generated for tracking purposes'
        }
      </p>
    </div>
  )

  // ==============================================
  // MAIN RENDER - Mobile Responsive
  // ==============================================
  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      <div className="space-y-3.5 xs:space-y-4">
        {/* Project Name - Mobile Responsive */}
        <div>
          <Label htmlFor="name" className="text-sm xs:text-base font-medium">
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
              "mt-1.5 xs:mt-2 text-sm xs:text-base h-10 xs:h-11",
              errors.name && "border-red-500 focus:border-red-500 focus:ring-red-500",
              mode === 'create' && isNameAvailable === false && "border-red-500 focus:border-red-500 focus:ring-red-500"
            )}
          />
          {renderNameValidation()}
          {errors.name && (
            <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
              <span className="leading-tight">{errors.name}</span>
            </p>
          )}
        </div>

        {/* Project Description - Mobile Responsive */}
        <div>
          <Label htmlFor="description" className="text-sm xs:text-base font-medium">
            Project Description
          </Label>
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
              "mt-1.5 xs:mt-2 text-sm xs:text-base resize-none",
              errors.description && "border-red-500 focus:border-red-500 focus:ring-red-500"
            )}
          />
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 xs:gap-2 mt-1.5 xs:mt-2">
            {errors.description && (
              <p className="text-xs xs:text-sm text-red-600 flex items-center gap-1 order-2 xs:order-1">
                <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                <span className="leading-tight">{errors.description}</span>
              </p>
            )}
            <p className="text-xs text-gray-500 order-1 xs:order-2 xs:ml-auto leading-tight">
              {(formData.description || '').length}/1000 characters
            </p>
          </div>
        </div>

        {/* Project Number - Mobile Responsive */}
        {renderProjectNumber()}
      </div>
    </div>
  )
}