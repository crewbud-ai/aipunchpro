// ==============================================
// app/(dashboard)/dashboard/punchlist/components/forms/ProjectLocationStep.tsx
// ==============================================

"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Building2, AlertCircle, RefreshCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Import types
import {
    type CreatePunchlistItemFormData,
    type UpdatePunchlistItemFormData
} from "@/types/punchlist-items"
import type { ProjectSummary } from "@/types/projects"

// ==============================================
// GENERIC FORM DATA TYPE
// ==============================================
type PunchlistItemFormData = CreatePunchlistItemFormData | UpdatePunchlistItemFormData

// ==============================================
// PROPS INTERFACE
// ==============================================
interface ProjectLocationStepProps {
    mode?: 'create' | 'edit'
    formData: {
        location: string
        roomArea: string
        projectId?: string // Only present in create mode
    }
    errors: any
    updateFormData: (field: string, value: any) => void
    clearFieldError: (field: string) => void
    activeProjects: ProjectSummary[]
    isProjectsLoading: boolean
    hasProjectsError: boolean
    refreshProjects: () => void
    handleProjectChange: (projectId: string) => void
    // For edit mode, pass the project info separately since UpdatePunchlistItemFormData doesn't have projectId
    selectedProject?: ProjectSummary
}

// ==============================================
// COMPONENT
// ==============================================
export const ProjectLocationStep = React.memo<ProjectLocationStepProps>(({
    mode = 'create',
    formData,
    errors,
    updateFormData,
    clearFieldError,
    activeProjects,
    isProjectsLoading,
    hasProjectsError,
    refreshProjects,
    handleProjectChange,
    selectedProject,
}: ProjectLocationStepProps) => {

    // Dynamic labels based on mode
    const getLabel = (base: string) => {
        return mode === 'edit' ? `Update ${base}` : base
    }

    // ==============================================
    // EVENT HANDLERS
    // ==============================================

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        updateFormData('location', value)
        if (errors.location) clearFieldError('location')
    }

    const handleRoomAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        updateFormData('roomArea', value)
        if (errors.roomArea) clearFieldError('roomArea')
    }

    // Selected project details - different logic for create vs edit
    const currentProject = mode === 'edit'
        ? selectedProject
        : activeProjects.find(p => p.id === formData.projectId)

    // Project is readonly in edit mode (typically can't change project assignment)
    const isProjectReadonly = mode === 'edit'

    // ==============================================
    // RENDER
    // ==============================================
    return (
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
            {/* Project Selection */}
            <div className="space-y-2">
                <Label htmlFor="project" className="text-sm xs:text-base font-medium">
                    {getLabel('Project')} <span className="text-red-500">*</span>
                </Label>

                {isProjectsLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 xs:h-11 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ) : hasProjectsError ? (
                    <div className="space-y-2">
                        <Alert variant="destructive">
                            <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                            <AlertDescription className="text-xs xs:text-sm leading-snug">
                                Failed to load projects. Please try again.
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={refreshProjects}
                                    className="ml-2 h-auto py-1 px-2"
                                >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Retry
                                </Button>
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : isProjectReadonly ? (
                    /* Project readonly display in edit mode */
                    <div className="p-2.5 xs:p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="flex items-center gap-1.5 xs:gap-2">
                            <Building2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                            <span className="font-medium text-sm xs:text-base">
                                {currentProject?.name || 'Unknown Project'}
                            </span>
                        </div>
                        {currentProject?.description && (
                            <div className="text-xs text-gray-500 mt-0.5 xs:mt-1 leading-snug">
                                {currentProject.description}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <Select value={formData.projectId || ""} onValueChange={handleProjectChange}>
                            <SelectTrigger className={cn(
                                "text-sm xs:text-base h-10 xs:h-11",
                                errors.projectId && "border-red-500"
                            )}>
                                <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            <SelectContent>
                                {activeProjects.map((project) => (
                                    <SelectItem key={project.id} value={project.id} className="text-sm xs:text-base">
                                        <div className="flex items-center gap-1.5 xs:gap-2">
                                            <Building2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                                            <div>
                                                <div className="font-medium">{project.name}</div>
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.projectId && (
                            <Alert variant="destructive" className="py-1.5 xs:py-2">
                                <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                                <AlertDescription className="text-xs xs:text-sm leading-snug">
                                    {errors.projectId}
                                </AlertDescription>
                            </Alert>
                        )}
                        <p className="text-xs text-gray-500 leading-tight">
                            Choose the project where this issue was found
                        </p>
                    </>
                )}

                {isProjectReadonly && (
                    <p className="text-xs text-gray-500 leading-tight">
                        Project assignment cannot be changed after creation
                    </p>
                )}
            </div>

            {/* Location Details Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 xs:gap-4">
                {/* General Location */}
                <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm xs:text-base font-medium">
                        {getLabel('Location/Area')}
                    </Label>
                    <Input
                        id="location"
                        placeholder="e.g. 2nd Floor, East Wing"
                        value={formData.location}
                        onChange={handleLocationChange}
                        className={cn(
                            "text-sm xs:text-base h-10 xs:h-11",
                            errors.location && "border-red-500"
                        )}
                    />
                    {errors.location && (
                        <Alert variant="destructive" className="py-1.5 xs:py-2">
                            <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                            <AlertDescription className="text-xs xs:text-sm leading-snug">
                                {errors.location}
                            </AlertDescription>
                        </Alert>
                    )}
                    <p className="text-xs text-gray-500 leading-tight">
                        General area within the project
                    </p>
                </div>

                {/* Specific Room/Area */}
                <div className="space-y-2">
                    <Label htmlFor="roomArea" className="text-sm xs:text-base font-medium">
                        {getLabel('Room/Specific Area')}
                    </Label>
                    <Input
                        id="roomArea"
                        placeholder="e.g. Conference Room B, Unit 204"
                        value={formData.roomArea}
                        onChange={handleRoomAreaChange}
                        className={cn(
                            "text-sm xs:text-base h-10 xs:h-11",
                            errors.roomArea && "border-red-500"
                        )}
                    />
                    {errors.roomArea && (
                        <Alert variant="destructive" className="py-1.5 xs:py-2">
                            <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                            <AlertDescription className="text-xs xs:text-sm leading-snug">
                                {errors.roomArea}
                            </AlertDescription>
                        </Alert>
                    )}
                    <p className="text-xs text-gray-500 leading-tight">
                        Specific room or area details
                    </p>
                </div>
            </div>

            {/* No Projects Available */}
            {!isProjectsLoading && !hasProjectsError && activeProjects.length === 0 && (
                <Alert>
                    <Building2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                    <AlertDescription className="text-xs xs:text-sm leading-snug">
                        No active projects found. You'll need to create a project first before adding punchlist items.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
})