"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  TRADE_REQUIRED,
  type CreateScheduleProjectFormData,
  type UpdateScheduleProjectFormData
} from "@/types/schedule-projects"
import { formatStatusLabel, getStatusColor } from "@/utils/format-functions"

// ==============================================
// GENERIC FORM DATA TYPE
// ==============================================
type ScheduleProjectFormData = CreateScheduleProjectFormData | UpdateScheduleProjectFormData

// ==============================================
// PROPS INTERFACE
// ==============================================
interface WorkInfoStepProps {
  mode?: 'create' | 'edit'
  formData: Pick<ScheduleProjectFormData, 'title' | 'description' | 'projectId' | 'tradeRequired'>
  errors: any
  updateFormData: (field: string, value: any) => void // Made more flexible
  clearFieldError: (field: string) => void
  activeProjects: any[]
  isProjectsLoading: boolean
  hasProjectsError: boolean
  refreshProjects: () => void
  handleProjectChange: (projectId: string) => void
}

// ==============================================
// COMPONENT
// ==============================================
export const WorkInfoStep = React.memo<WorkInfoStepProps>(({
  mode = 'create',
  formData,
  errors,
  updateFormData,
  clearFieldError,
  activeProjects,
  isProjectsLoading,
  hasProjectsError,
  refreshProjects,
  handleProjectChange
}) => {
  // Dynamic labels based on mode
  const getLabel = (base: string) => {
    return mode === 'edit' ? `${base}` : `${base}`
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm xs:text-base font-medium">
          {getLabel("Work Title")} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => {
            updateFormData('title', e.target.value)
            clearFieldError('title')
          }}
          placeholder="e.g., Kitchen Electrical Installation"
          className={cn(
            "block text-sm xs:text-base h-10 xs:h-11",
            errors.title && "border-red-500 focus:border-red-500 focus:ring-red-500 ",
          )}
        />
        {errors.title && (
          <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
            <span className="leading-tight">{errors.title}</span>
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm xs:text-base font-medium">
          {getLabel("Description")}
        </Label>
        <Textarea
          id="description"
          placeholder="Describe the work to be performed..."
          value={formData.description}
          onChange={(e) => {
            updateFormData('description', e.target.value)
            clearFieldError('description')
          }}
          rows={3}
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

      {/* Project Selection */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Label htmlFor="project" className="text-sm xs:text-base font-medium">
            {getLabel("Project")} <span className="text-red-500">*</span>
          </Label>
          {mode === 'edit' && (
            <Badge variant="secondary" className="text-xs self-start sm:self-auto">
              {mode === 'edit' ? 'Editing' : 'Creating'}
            </Badge>
          )}
        </div>

        {isProjectsLoading ? (
          <div className="flex items-center space-x-2 p-3 border rounded-md">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span className="text-sm xs:text-base font-medium">Loading projects...</span>
          </div>
        ) : hasProjectsError ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-xs sm:text-sm">
              Failed to load projects.
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshProjects}
                className="ml-2 h-auto p-0 text-xs sm:text-sm text-red-600 hover:text-red-700"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <Select
            value={formData.projectId}
            onValueChange={(value) => {
              handleProjectChange(value)
              clearFieldError('projectId')
            }}
          >
            <SelectTrigger className={cn(
              "mt-1 sm:mt-2 h-10 sm:h-11 text-sm xs:text-base font-medium",
              errors.projectId && "border-red-500 focus:border-red-500 focus:ring-red-500"
            )}>
              <SelectValue className="text-sm xs:text-base font-medium" placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {activeProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}
                  className={cn(
                    "block text-sm xs:text-base h-10 xs:h-11"
                  )}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="truncate">{project.name}</span>
                    <Badge variant="outline" className={`ml-2 text-xs shrink-0 ${getStatusColor(project.status)}`}>
                      {formatStatusLabel(project.status)}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {errors.projectId && (
          <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
            <span className="leading-tight">{errors.projectId}</span>
          </p>
        )}
      </div>

      {/* Trade Required */}
      <div className="space-y-2">
        <Label htmlFor="tradeRequired" className="text-sm xs:text-base font-medium">
          {getLabel("Trade Required")}
        </Label>
        <Select
          value={formData.tradeRequired || "none"}
          onValueChange={(value) => {
            updateFormData('tradeRequired', value === "none" ? "" : value)
            clearFieldError('tradeRequired')
          }}
        >
          <SelectTrigger className={cn(
            "mt-1 sm:mt-2 h-10 sm:h-11 text-sm xs:text-base font-medium",
            errors.tradeRequired && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}>
            <SelectValue className="text-sm xs:text-base font-medium" placeholder="Select required trade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className={cn(
              "block text-sm xs:text-base h-10 xs:h-11"
            )}>
              <span className="text-gray-500">No specific trade required</span>
            </SelectItem>
            {TRADE_REQUIRED.map((trade) => (
              <SelectItem key={trade} value={trade} className={cn(
                "block text-sm xs:text-base h-10 xs:h-11"
              )}>
                {trade.charAt(0).toUpperCase() + trade.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tradeRequired && (
          <p className="text-xs sm:text-sm text-red-600 mt-1 sm:mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {errors.tradeRequired}
          </p>
        )}
      </div>
    </div>
  )
})

WorkInfoStep.displayName = 'WorkInfoStep'