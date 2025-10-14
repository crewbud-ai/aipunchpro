"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, AlertCircle, User, Users, CheckCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    SCHEDULE_PRIORITY,
    SCHEDULE_STATUS,
    type CreateScheduleProjectFormData,
    type UpdateScheduleProjectFormData
} from "@/types/schedule-projects"
import { formatRoleLabel } from "@/utils/format-functions"

// ==============================================
// GENERIC FORM DATA TYPE
// ==============================================
type ScheduleProjectFormData = CreateScheduleProjectFormData | UpdateScheduleProjectFormData

// ==============================================
// PROPS INTERFACE
// ==============================================
interface AssignmentStepProps {
    mode?: 'create' | 'edit'
    formData: Pick<ScheduleProjectFormData, 'assignedProjectMemberIds' | 'priority' | 'location' | 'notes'> &
    Partial<Pick<UpdateScheduleProjectFormData, 'status' | 'progressPercentage' | 'dependsOn'>>
    errors: any
    updateFormData: (field: string, value: any) => void // Made more flexible
    clearFieldError: (field: string) => void
    selectedProject: any
    isTeamMembersLoading: boolean
    hasTeamMembersError: boolean
    availableTeamMembers: any[]
    handleTeamMemberToggle: (memberId: string) => void
}

// ==============================================
// COMPONENT
// ==============================================
export const AssignmentStep = React.memo<AssignmentStepProps>(({
    mode = 'create',
    formData,
    errors,
    updateFormData,
    clearFieldError,
    selectedProject,
    isTeamMembersLoading,
    hasTeamMembersError,
    availableTeamMembers,
    handleTeamMemberToggle
}) => {
    // Dynamic labels based on mode
    const getLabel = (base: string) => {
        return mode === 'edit' ? `${base}` : `${base}`
    }

    // Check if we have edit-only fields
    const hasEditFields = mode === 'edit' && 'status' in formData

    return (
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
            {/* Mode indicator */}
            {mode === 'edit' && (
                <div className="flex flex-wrap items-center gap-1.5 xs:gap-2">
                    <Badge variant="secondary" className="text-xs">
                        Editing Schedule
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Assignment & Details
                    </Badge>
                </div>
            )}

            {/* Team Member Assignment */}
            <div className="space-y-3 xs:space-y-4">
                <div className="flex flex-row xs:flex-col justify-between xs:items-center xs:justify-between gap-2 xs:gap-3">
                    <Label className="text-sm xs:text-base font-medium">
                        {getLabel("Assign Team Members")} <span className="text-red-500">*</span>
                    </Label>
                    {selectedProject && (
                        <Badge variant="outline" className="text-xs self-start xs:self-auto">
                            Project: {selectedProject.name}
                        </Badge>
                    )}
                </div>

                {!selectedProject ? (
                    <Alert>
                        <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                        <AlertDescription className="text-xs xs:text-sm leading-snug">
                            Please select a project first to see available team members.
                        </AlertDescription>
                    </Alert>
                ) : isTeamMembersLoading ? (
                    <div className="flex items-center space-x-2 p-3 xs:p-4 border rounded">
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        <span className="text-xs xs:text-sm text-gray-600">Loading team members...</span>
                    </div>
                ) : hasTeamMembersError ? (
                    <Alert>
                        <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                        <AlertDescription className="text-xs xs:text-sm leading-snug">
                            Failed to load team members for this project.
                        </AlertDescription>
                    </Alert>
                ) : availableTeamMembers.length === 0 ? (
                    <Alert>
                        <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                        <AlertDescription className="text-xs xs:text-sm leading-snug">
                            No team members found assigned to this project. Please assign team members to the project first.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-2 xs:space-y-3">
                        {availableTeamMembers.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center space-x-2 xs:space-x-3 p-2.5 xs:p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Checkbox
                                    id={`member-${member.id}`}
                                    checked={formData.assignedProjectMemberIds.includes(member.id)}
                                    onCheckedChange={() => handleTeamMemberToggle(member.id)}
                                    className="shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5 xs:gap-2">
                                        <User className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                                        <span className="text-xs xs:text-sm font-medium text-gray-900 truncate">
                                            {member.firstName} {member.lastName}
                                        </span>
                                        <Badge variant="outline" className="text-xs shrink-0">
                                            {formatRoleLabel(member.role)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-0.5 xs:mt-1 leading-snug">
                                        {member.tradeSpecialty || 'General'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {errors.assignedProjectMemberIds && (
                    <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                        <span className="leading-tight">{errors.assignedProjectMemberIds}</span>
                    </p>
                )}
            </div>

            {/* Priority and Status Section */}
            <div className={cn(
                "grid gap-3.5 xs:gap-4 sm:gap-6",
                hasEditFields ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            )}>
                {/* Priority */}
                <div>
                    <Label htmlFor="priority" className="text-sm xs:text-base font-medium">
                        {getLabel("Priority")} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={formData.priority}
                        onValueChange={(value: any) => {
                            updateFormData('priority', value)
                            clearFieldError('priority')
                        }}
                    >
                        <SelectTrigger className={cn(
                            "mt-1 sm:mt-2 h-10 sm:h-11 text-sm xs:text-base font-medium",
                            errors.priority && "border-red-500 focus:border-red-500 focus:ring-red-500"
                        )}>
                            <SelectValue className="text-sm xs:text-base font-medium" placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                            {SCHEDULE_PRIORITY.map((priority) => (
                                <SelectItem key={priority} value={priority} className="block text-sm xs:text-base h-10 xs:h-11">
                                    <div className="flex items-center gap-1.5 xs:gap-2 ">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            priority === 'low' && "bg-green-500",
                                            priority === 'medium' && "bg-yellow-500",
                                            priority === 'high' && "bg-orange-500",
                                            priority === 'critical' && "bg-red-500",
                                        )} />
                                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.priority && (
                        <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                            <span className="leading-tight">{errors.priority}</span>
                        </p>
                    )}
                </div>

                {/* Status (Edit Mode Only) */}
                {hasEditFields && (
                    <div>
                        <Label htmlFor="status" className="text-sm xs:text-base font-medium">
                            Status
                            <Badge variant="outline" className="ml-1.5 xs:ml-2 text-xs">
                                Edit Mode
                            </Badge>
                        </Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value: any) => {
                                updateFormData('status', value)
                                clearFieldError('status')
                            }}
                        >
                            <SelectTrigger className={cn(
                                "mt-1.5 xs:mt-2 text-sm xs:text-base h-10 xs:h-11",
                                errors.status && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {SCHEDULE_STATUS.map((status) => (
                                    <SelectItem key={status} value={status} className="text-sm xs:text-base">
                                        <div className="flex items-center gap-1.5 xs:gap-2">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full shrink-0",
                                                status === 'planned' && "bg-blue-500",
                                                status === 'in_progress' && "bg-yellow-500",
                                                status === 'completed' && "bg-green-500",
                                                status === 'delayed' && "bg-orange-500",
                                                status === 'cancelled' && "bg-red-500",
                                            )} />
                                            {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                                <span className="leading-tight">{errors.status}</span>
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Progress Percentage (Edit Mode Only) */}
            {hasEditFields && (
                <div>
                    <Label htmlFor="progressPercentage" className="text-sm xs:text-base font-medium">
                        Progress Percentage
                        <Badge variant="outline" className="ml-1.5 xs:ml-2 text-xs">
                            Edit Mode
                        </Badge>
                    </Label>
                    <div className="mt-1.5 xs:mt-2 space-y-2 xs:space-y-3">
                        <div className="flex items-center gap-3 xs:gap-4">
                            <Input
                                id="progressPercentage"
                                type="number"
                                min="0"
                                max="100"
                                step="5"
                                value={formData.progressPercentage || 0}
                                onChange={(e) => {
                                    const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                                    updateFormData('progressPercentage', value)
                                    clearFieldError('progressPercentage')
                                }}
                                className={cn(
                                    "w-20 xs:w-24 text-sm xs:text-base h-10 xs:h-11",
                                    errors.progressPercentage && "border-red-500 focus:border-red-500 focus:ring-red-500"
                                )}
                            />
                            <span className="text-xs xs:text-sm text-gray-600">%</span>
                        </div>
                        <Progress
                            value={formData.progressPercentage || 0}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>0%</span>
                            <span className="font-medium">
                                {formData.progressPercentage || 0}% Complete
                            </span>
                            <span>100%</span>
                        </div>
                    </div>
                    {errors.progressPercentage && (
                        <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                            <span className="leading-tight">{errors.progressPercentage}</span>
                        </p>
                    )}
                </div>
            )}

            {/* Location */}
            <div>
                <Label htmlFor="location" className="text-sm xs:text-base font-medium">
                    {getLabel("Location")}
                </Label>
                <Input
                    id="location"
                    placeholder="e.g., Building A - 2nd Floor"
                    value={formData.location}
                    onChange={(e) => {
                        updateFormData('location', e.target.value)
                        clearFieldError('location')
                    }}
                    className={cn(
                        "mt-1.5 xs:mt-2 text-sm xs:text-base h-10 xs:h-11",
                        errors.location && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                />
                {errors.location && (
                    <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                        <span className="leading-tight">{errors.location}</span>
                    </p>
                )}
            </div>

            {/* Notes */}
            <div>
                <Label htmlFor="notes" className="text-sm xs:text-base font-medium">
                    {getLabel("Notes")}
                </Label>
                <Textarea
                    id="notes"
                    placeholder="Additional notes or special instructions..."
                    value={formData.notes}
                    onChange={(e) => {
                        updateFormData('notes', e.target.value)
                        clearFieldError('notes')
                    }}
                    rows={3}
                    className={cn(
                        "mt-1.5 xs:mt-2 text-sm xs:text-base resize-none",
                        errors.notes && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                />
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 xs:gap-0 mt-1 xs:mt-1.5">
                    {errors.notes && (
                        <p className="text-xs xs:text-sm text-red-600 flex items-center gap-1 order-2 xs:order-1">
                            <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                            <span className="leading-tight">{errors.notes}</span>
                        </p>
                    )}
                    <p className="text-xs text-gray-500 order-1 xs:order-2 xs:ml-auto leading-tight">
                        {(formData.notes || '').length}/1000 characters
                    </p>
                </div>
            </div>

            {/* Mode-specific messaging */}
            {mode === 'edit' && (
                <Alert className="border-blue-200 bg-blue-50">
                    <CheckCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                    <AlertDescription className="text-xs xs:text-sm leading-snug">
                        You can update assignments, progress, and status. Changes will be saved when you complete the form.
                    </AlertDescription>
                </Alert>
            )}

            {/* Selected team members summary */}
            {formData.assignedProjectMemberIds.length > 0 && (
                <Alert className="border-green-200 bg-green-50">
                    <Users className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                    <AlertDescription className="text-xs xs:text-sm leading-snug">
                        <strong>{formData.assignedProjectMemberIds.length} team member(s) assigned:</strong>
                        <div className="mt-1.5 xs:mt-2 flex flex-wrap gap-1">
                            {availableTeamMembers
                                .filter(member => formData.assignedProjectMemberIds.includes(member.id))
                                .map(member => (
                                    <Badge key={member.id} variant="outline" className="text-xs">
                                        {member.firstName} {member.lastName}
                                    </Badge>
                                ))}
                        </div>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
})

AssignmentStep.displayName = 'AssignmentStep'