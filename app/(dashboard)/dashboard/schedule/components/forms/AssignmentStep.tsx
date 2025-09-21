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
        <div className="space-y-6">
            {/* Mode indicator */}
            {mode === 'edit' && (
                <div className="flex items-center gap-2">
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
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                        {getLabel("Assign Team Members")} <span className="text-red-500">*</span>
                    </Label>
                    {selectedProject && (
                        <Badge variant="outline">
                            Project: {selectedProject.name}
                        </Badge>
                    )}
                </div>

                {!selectedProject ? (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Please select a project first to see available team members.
                        </AlertDescription>
                    </Alert>
                ) : isTeamMembersLoading ? (
                    <div className="flex items-center space-x-2 p-4 border rounded">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-600">Loading team members...</span>
                    </div>
                ) : hasTeamMembersError ? (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Failed to load team members for this project.
                        </AlertDescription>
                    </Alert>
                ) : availableTeamMembers.length === 0 ? (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            No team members found assigned to this project. Please assign team members to the project first.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-3">
                        {availableTeamMembers.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                            >
                                <Checkbox
                                    id={`member-${member.id}`}
                                    checked={formData.assignedProjectMemberIds.includes(member.id)}
                                    onCheckedChange={() => handleTeamMemberToggle(member.id)}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900">
                                            {member.firstName} {member.lastName}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                            {formatRoleLabel(member.role)}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {member.tradeSpecialty || 'General'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {errors.assignedProjectMemberIds && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.assignedProjectMemberIds}
                    </p>
                )}
            </div>

            {/* Priority and Status Section */}
            <div className={cn(
                "grid gap-6",
                hasEditFields ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            )}>
                {/* Priority */}
                <div>
                    <Label htmlFor="priority" className="text-base font-medium">
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
                            "mt-2",
                            errors.priority && "border-red-500 focus:border-red-500 focus:ring-red-500"
                        )}>
                            <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                            {SCHEDULE_PRIORITY.map((priority) => (
                                <SelectItem key={priority} value={priority}>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            priority === 'low' && "bg-green-500",        // Green - low priority
                                            priority === 'medium' && "bg-yellow-500",    // Yellow - medium priority  
                                            priority === 'high' && "bg-orange-500",      // Orange - high priority
                                            priority === 'critical' && "bg-red-500",     // Red - critical priority
                                        )} />
                                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.priority && (
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.priority}
                        </p>
                    )}
                </div>

                {/* Status (Edit Mode Only) */}
                {hasEditFields && (
                    <div>
                        <Label htmlFor="status" className="text-base font-medium">
                            Status
                            <Badge variant="outline" className="ml-2 text-xs">
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
                                "mt-2",
                                errors.status && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {SCHEDULE_STATUS.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                status === 'planned' && "bg-blue-500",      // Blue - planned
                                                status === 'in_progress' && "bg-yellow-500", // Yellow - active
                                                status === 'completed' && "bg-green-500",    // Green - done
                                                status === 'delayed' && "bg-orange-500",     // Orange - warning
                                                status === 'cancelled' && "bg-red-500",      // Red - stopped
                                            )} />
                                            {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.status}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Progress Percentage (Edit Mode Only) */}
            {hasEditFields && (
                <div>
                    <Label htmlFor="progressPercentage" className="text-base font-medium">
                        Progress Percentage
                        <Badge variant="outline" className="ml-2 text-xs">
                            Edit Mode
                        </Badge>
                    </Label>
                    <div className="mt-2 space-y-3">
                        <div className="flex items-center gap-4">
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
                                    "w-24",
                                    errors.progressPercentage && "border-red-500 focus:border-red-500 focus:ring-red-500"
                                )}
                            />
                            <span className="text-sm text-gray-600">%</span>
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
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.progressPercentage}
                        </p>
                    )}
                </div>
            )}

            {/* Location */}
            <div>
                <Label htmlFor="location" className="text-base font-medium">
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
                        "mt-2",
                        errors.location && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                />
                {errors.location && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.location}
                    </p>
                )}
            </div>

            {/* Notes */}
            <div>
                <Label htmlFor="notes" className="text-base font-medium">
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
                        "mt-2 resize-none",
                        errors.notes && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                />
                <div className="flex items-center justify-between mt-2">
                    {errors.notes && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.notes}
                        </p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">
                        {(formData.notes || '').length}/1000 characters
                    </p>
                </div>
            </div>

            {/* Mode-specific messaging */}
            {mode === 'edit' && (
                <Alert className="border-blue-200 bg-blue-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                        You can update assignments, progress, and status. Changes will be saved when you complete the form.
                    </AlertDescription>
                </Alert>
            )}

            {/* Selected team members summary */}
            {formData.assignedProjectMemberIds.length > 0 && (
                <Alert className="border-green-200 bg-green-50">
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                        <strong>{formData.assignedProjectMemberIds.length} team member(s) assigned:</strong>
                        <div className="mt-2 flex flex-wrap gap-1">
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