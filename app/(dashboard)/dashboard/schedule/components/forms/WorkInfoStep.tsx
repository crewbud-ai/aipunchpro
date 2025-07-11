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
import { TRADE_REQUIRED, type CreateScheduleProjectFormData } from "@/types/schedule-projects"

interface WorkInfoStepProps {
  mode?: 'create' | 'edit'
  formData: Pick<CreateScheduleProjectFormData, 'title' | 'description' | 'projectId' | 'tradeRequired'>
  errors: any
  updateFormData: (field: keyof CreateScheduleProjectFormData, value: any) => void
  clearFieldError: (field: string) => void
  activeProjects: any[]
  isProjectsLoading: boolean
  hasProjectsError: boolean
  refreshProjects: () => void
  handleProjectChange: (projectId: string) => void
}

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
}) => (
  <div className="space-y-6">
    {/* Title */}
    <div className="space-y-2">
      <Label htmlFor="title" className="text-base font-medium">
        Work Title <span className="text-red-500">*</span>
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
      <Label htmlFor="description" className="text-base font-medium">Description</Label>
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
      <Label htmlFor="project" className="text-base font-medium">
        Project <span className="text-red-500">*</span>
      </Label>
      {isProjectsLoading ? (
        <div className="flex items-center space-x-2 p-2 border rounded">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-600">Loading projects...</span>
        </div>
      ) : hasProjectsError ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load projects.
            <Button variant="link" onClick={refreshProjects} className="p-0 ml-1 h-auto">
              <RefreshCw className="h-3 w-3 mr-1" />
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Select value={formData.projectId} onValueChange={handleProjectChange}>
          <SelectTrigger className={cn("mt-2", errors.projectId && "border-red-500 focus:border-red-500 focus:ring-red-500")} id="project">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {activeProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{project.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
              </SelectItem>
            ))}
            {activeProjects.length === 0 && (
              <div className="p-2 text-sm text-gray-500">
                No active projects available
              </div>
            )}
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
      <Label htmlFor="trade" className="text-base font-medium">Trade Required</Label>
      <Select value={formData.tradeRequired} onValueChange={(value) => updateFormData('tradeRequired', value)}>
        <SelectTrigger className="mt-2" id="trade">
          <SelectValue placeholder="Select trade" />
        </SelectTrigger>
        <SelectContent>
          {TRADE_REQUIRED.map((trade) => (
            <SelectItem key={trade} value={trade}>
              {trade.charAt(0).toUpperCase() + trade.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
))

WorkInfoStep.displayName = 'WorkInfoStep'