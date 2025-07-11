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
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-medium">
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
            "mt-2 text-base",
            errors.title && "border-red-500 focus:border-red-500 focus:ring-red-500",
          )}
        />
        {errors.title && (
          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-medium">
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

      {/* Project Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="project" className="text-base font-medium">
            {getLabel("Project")} <span className="text-red-500">*</span>
          </Label>
          {mode === 'edit' && (
            <Badge variant="secondary" className="text-xs">
              {mode === 'edit' ? 'Editing' : 'Creating'}
            </Badge>
          )}
        </div>
        
        {isProjectsLoading ? (
          <div className="flex items-center space-x-2 p-3 border rounded-md">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading projects...</span>
          </div>
        ) : hasProjectsError ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load projects. 
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refreshProjects}
                className="ml-2 h-auto p-0 text-red-600 hover:text-red-700"
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
              "mt-2",
              errors.projectId && "border-red-500 focus:border-red-500 focus:ring-red-500"
            )}>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {activeProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{project.name}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {project.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {errors.projectId && (
          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.projectId}
          </p>
        )}
      </div>

      {/* Trade Required */}
      <div className="space-y-2">
        <Label htmlFor="tradeRequired" className="text-base font-medium">
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
            "mt-2",
            errors.tradeRequired && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}>
            <SelectValue placeholder="Select required trade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-gray-500">No specific trade required</span>
            </SelectItem>
            {TRADE_REQUIRED.map((trade) => (
              <SelectItem key={trade} value={trade}>
                {trade.charAt(0).toUpperCase() + trade.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tradeRequired && (
          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.tradeRequired}
          </p>
        )}
      </div>
    </div>
  )
})

WorkInfoStep.displayName = 'WorkInfoStep'