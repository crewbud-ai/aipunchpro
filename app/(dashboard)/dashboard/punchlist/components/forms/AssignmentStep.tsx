// ==============================================
// app/(dashboard)/dashboard/punchlist/components/forms/AssignmentStep.tsx
// ==============================================

"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { User, AlertCircle, RefreshCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Import types
import {
    PUNCHLIST_STATUS_OPTIONS,
    type CreatePunchlistItemFormData,
    type UpdatePunchlistItemFormData
} from "@/types/punchlist-items"
import type { TeamMemberSummary } from "@/types/team-members"

// ==============================================
// GENERIC FORM DATA TYPE
// ==============================================
type PunchlistItemFormData = CreatePunchlistItemFormData | UpdatePunchlistItemFormData

// ==============================================
// PROPS INTERFACE
// ==============================================
interface AssignmentStepProps {
    mode?: 'create' | 'edit'
    formData: Pick<PunchlistItemFormData, 'assignedProjectMemberId' | 'dueDate' | 'resolutionNotes'> &
    Partial<Pick<UpdatePunchlistItemFormData, 'status'>>
    errors: any
    updateFormData: (field: string, value: any) => void
    clearFieldError: (field: string) => void
    selectedProject: any
    isTeamMembersLoading: boolean
    hasTeamMembersError: boolean
    availableTeamMembers: TeamMemberSummary[]
    refreshTeamMembers: () => Promise<void>
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
    refreshTeamMembers,
}: AssignmentStepProps) => {

    // Dynamic labels based on mode
    const getLabel = (base: string) => {
        return mode === 'edit' ? `Update ${base}` : base
    }

    // ==============================================
    // EVENT HANDLERS
    // ==============================================

    const handleAssigneeChange = (memberId: string) => {
        updateFormData('assignedProjectMemberId', memberId === 'unassigned' ? '' : memberId)
        if (errors.assignedProjectMemberId) clearFieldError('assignedProjectMemberId')
    }

    const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        updateFormData('dueDate', value)
        if (errors.dueDate) clearFieldError('dueDate')
    }

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        updateFormData('resolutionNotes', value)
        if (errors.resolutionNotes) clearFieldError('resolutionNotes')
    }

    const handleStatusChange = (value: string) => {
        updateFormData('status', value)
        if (errors.status) clearFieldError('status')
    }

    // Find assigned team member
    const assignedMember = availableTeamMembers.find(member => member.id === formData.assignedProjectMemberId)

    // ==============================================
    // RENDER
    // ==============================================
    return (
        <div className="space-y-6">
            {/* Assignment Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Team Member Assignment */}
                <div className="space-y-2">
                    <Label htmlFor="assignee" className="text-sm font-medium">
                        {getLabel('Assign To')}
                    </Label>

                    {(() => {
                        console.log(availableTeamMembers, 'availableTeamMembers')
                        console.log('Multiple logs here')
                        return null
                    })()}

                    {isTeamMembersLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    ) : hasTeamMembersError ? (
                        <div className="space-y-2">
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Failed to load team members.
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={refreshTeamMembers}
                                        className="ml-2"
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Retry
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        </div>
                    ) : (
                        <>
                            <Select
                                value={formData.assignedProjectMemberId || 'unassigned'}
                                onValueChange={handleAssigneeChange}
                            >
                                <SelectTrigger className={cn(errors.assignedProjectMemberId && "border-red-500")}>
                                    <SelectValue placeholder="Choose team member" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span>Unassigned</span>
                                        </div>
                                    </SelectItem>
                                    {availableTeamMembers.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <div className="font-medium">
                                                        {member.firstName} {member.lastName}
                                                    </div>
                                                    {member.jobTitle && (
                                                        <div className="text-xs text-gray-500">
                                                            {member.jobTitle}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.assignedProjectMemberId && (
                                <Alert variant="destructive" className="py-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                        {errors.assignedProjectMemberId}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <p className="text-xs text-gray-500">
                                Optional: Leave unassigned if not ready to assign
                            </p>
                        </>
                    )}
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-sm font-medium">
                        {getLabel('Due Date')}
                    </Label>
                    <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={handleDueDateChange}
                        className={cn(errors.dueDate && "border-red-500")}
                    />
                    {errors.dueDate && (
                        <Alert variant="destructive" className="py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                                {errors.dueDate}
                            </AlertDescription>
                        </Alert>
                    )}
                    <p className="text-xs text-gray-500">
                        Optional: When should this issue be resolved?
                    </p>
                </div>
            </div>

            {/* Status Update (Edit Mode Only) */}
            {mode === 'edit' && (
                <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">
                        Update Status
                    </Label>
                    <Select
                        value={formData.status || 'open'}
                        onValueChange={handleStatusChange}
                    >
                        <SelectTrigger className={cn(errors.status && "border-red-500")}>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {PUNCHLIST_STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    <span>{option.label}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.status && (
                        <Alert variant="destructive" className="py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                                {errors.status}
                            </AlertDescription>
                        </Alert>
                    )}
                    <p className="text-xs text-gray-500">
                        Update the current status of this punchlist item
                    </p>
                </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
                <Label htmlFor="resolutionNotes" className="text-sm font-medium">
                    {getLabel('Additional Notes')}
                </Label>
                <Textarea
                    id="resolutionNotes"
                    placeholder="Add any special instructions, requirements, or additional context..."
                    value={formData.resolutionNotes}
                    onChange={handleNotesChange}
                    rows={3}
                    className={cn(errors.resolutionNotes && "border-red-500")}
                />
                {errors.resolutionNotes && (
                    <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            {errors.resolutionNotes}
                        </AlertDescription>
                    </Alert>
                )}
                <p className="text-xs text-gray-500">
                    Optional: Include any special instructions or requirements
                </p>
            </div>

            {/* No Team Members Available */}
            {!isTeamMembersLoading && !hasTeamMembersError && availableTeamMembers.length === 0 && (
                <Alert>
                    <User className="h-4 w-4" />
                    <AlertDescription>
                        No team members found. You can still create the punchlist item and assign it later.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
})