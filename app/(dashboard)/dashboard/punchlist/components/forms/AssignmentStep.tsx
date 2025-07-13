// ==============================================
// app/(dashboard)/dashboard/punchlist/components/forms/AssignmentStep.tsx - UPDATED for Multiple Assignments
// ==============================================

"use client"

import React, { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { User, AlertCircle, RefreshCw, Loader2, Plus, X, Check, ChevronsUpDown, Crown, Users, Shield, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

// Import types
import {
    PUNCHLIST_STATUS_OPTIONS,
    ASSIGNMENT_ROLE_OPTIONS,
    type CreatePunchlistItemFormData,
    type UpdatePunchlistItemFormData,
    type AssignmentRole
} from "@/types/punchlist-items"
import type { TeamMemberSummary } from "@/types/team-members"

// ==============================================
// GENERIC FORM DATA TYPE
// ==============================================
type PunchlistItemFormData = CreatePunchlistItemFormData | UpdatePunchlistItemFormData

// ==============================================
// PROPS INTERFACE (UPDATED)
// ==============================================
interface AssignmentStepProps {
    mode?: 'create' | 'edit'
    formData: Pick<PunchlistItemFormData, 'assignedMembers' | 'dueDate' | 'resolutionNotes'> &
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
// ROLE ICONS MAPPING
// ==============================================
const getRoleIcon = (role: AssignmentRole) => {
    switch (role) {
        case 'primary':
            return Crown
        case 'secondary':
            return Users
        case 'inspector':
            return Eye
        case 'supervisor':
            return Shield
        default:
            return User
    }
}

const getRoleColor = (role: AssignmentRole) => {
    switch (role) {
        case 'primary':
            return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'secondary':
            return 'bg-gray-100 text-gray-800 border-gray-200'
        case 'inspector':
            return 'bg-green-100 text-green-800 border-green-200'
        case 'supervisor':
            return 'bg-purple-100 text-purple-800 border-purple-200'
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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

    // ==============================================
    // LOCAL STATE
    // ==============================================
    const [isAssignmentPopoverOpen, setIsAssignmentPopoverOpen] = useState(false)
    const [selectedMemberId, setSelectedMemberId] = useState<string>('')
    const [selectedRole, setSelectedRole] = useState<AssignmentRole>('primary')

    // ==============================================
    // COMPUTED VALUES
    // ==============================================
    const assignedMembers = formData.assignedMembers || []
    const assignedMemberIds = new Set(assignedMembers.map(a => a.projectMemberId))
    const availableForAssignment = availableTeamMembers.filter(member => !assignedMemberIds.has(member.id))
    const hasPrimaryAssignee = assignedMembers.some(a => a.role === 'primary')

    // Dynamic labels based on mode
    const getLabel = (base: string) => {
        return mode === 'edit' ? `Update ${base}` : base
    }

    // ==============================================
    // ASSIGNMENT MANAGEMENT
    // ==============================================
    const handleAddAssignment = () => {
        if (!selectedMemberId) return

        const selectedMember = availableTeamMembers.find(m => m.id === selectedMemberId)
        if (!selectedMember) return

        const newAssignment = {
            projectMemberId: selectedMemberId,
            role: selectedRole,
            // Use form-compatible structure
            projectMemberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
            projectMemberTrade: selectedMember.tradeSpecialty,
        }

        // If adding primary and one already exists, change existing to secondary
        let updatedAssignments = [...assignedMembers]
        if (selectedRole === 'primary' && hasPrimaryAssignee) {
            updatedAssignments = updatedAssignments.map(a => 
                a.role === 'primary' ? { ...a, role: 'secondary' as AssignmentRole } : a
            )
        }

        updatedAssignments.push(newAssignment)
        updateFormData('assignedMembers', updatedAssignments)
        
        // Clear selection
        setSelectedMemberId('')
        setSelectedRole('primary')
        setIsAssignmentPopoverOpen(false)
        
        // Clear errors
        if (errors.assignedMembers) clearFieldError('assignedMembers')
    }

    const handleRemoveAssignment = (projectMemberId: string) => {
        const updatedAssignments = assignedMembers.filter(a => a.projectMemberId !== projectMemberId)
        updateFormData('assignedMembers', updatedAssignments)
    }

    const handleUpdateRole = (projectMemberId: string, newRole: AssignmentRole) => {
        let updatedAssignments = [...assignedMembers]
        
        // If changing to primary, change existing primary to secondary
        if (newRole === 'primary' && hasPrimaryAssignee) {
            updatedAssignments = updatedAssignments.map(a => 
                a.role === 'primary' && a.projectMemberId !== projectMemberId 
                    ? { ...a, role: 'secondary' as AssignmentRole } 
                    : a
            )
        }

        // Update the specific assignment
        updatedAssignments = updatedAssignments.map(a => 
            a.projectMemberId === projectMemberId ? { ...a, role: newRole } : a
        )

        updateFormData('assignedMembers', updatedAssignments)
    }

    // ==============================================
    // OTHER EVENT HANDLERS
    // ==============================================
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

    // ==============================================
    // RENDER ASSIGNMENT SELECTION
    // ==============================================
    const renderAssignmentSelection = () => {
        if (isTeamMembersLoading) {
            return (
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            )
        }

        if (hasTeamMembersError) {
            return (
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
            )
        }

        if (availableForAssignment.length === 0) {
            return (
                <Alert>
                    <User className="h-4 w-4" />
                    <AlertDescription>
                        {availableTeamMembers.length === 0 
                            ? "No team members found for this project."
                            : "All available team members have been assigned."
                        }
                    </AlertDescription>
                </Alert>
            )
        }

        return (
            <div className="space-y-3">
                <Popover open={isAssignmentPopoverOpen} onOpenChange={setIsAssignmentPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isAssignmentPopoverOpen}
                            className="w-full justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Add Team Member
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search team members..." />
                            <CommandEmpty>No team member found.</CommandEmpty>
                            <CommandGroup>
                                {availableForAssignment.map((member) => (
                                    <CommandItem
                                        key={member.id}
                                        value={`${member.firstName} ${member.lastName}`}
                                        onSelect={() => {
                                            setSelectedMemberId(member.id)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedMemberId === member.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex items-center gap-2 flex-1">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <div>
                                                <div className="font-medium">
                                                    {member.firstName} {member.lastName}
                                                </div>
                                                {member.tradeSpecialty && (
                                                    <div className="text-xs text-gray-500">
                                                        {member.tradeSpecialty}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </Command>

                        {selectedMemberId && (
                            <div className="border-t p-3 space-y-3">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Role</Label>
                                    <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AssignmentRole)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ASSIGNMENT_ROLE_OPTIONS.map((option) => {
                                                const Icon = getRoleIcon(option.value)
                                                return (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="h-4 w-4" />
                                                            <span>{option.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button 
                                    onClick={handleAddAssignment}
                                    className="w-full"
                                    size="sm"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Assignment
                                </Button>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
            </div>
        )
    }

    // ==============================================
    // RENDER ASSIGNED MEMBERS LIST
    // ==============================================
    const renderAssignedMembers = () => {
        if (assignedMembers.length === 0) {
            return (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No team members assigned yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add team members to track who will work on this issue</p>
                </div>
            )
        }

        return (
            <div className="space-y-2">
                {assignedMembers.map((assignment) => {
                    const member = availableTeamMembers.find(m => m.id === assignment.projectMemberId)
                    
                    // Handle both form data structure and API structure
                    const memberName = (() => {
                        if ('user' in assignment && assignment.user) {
                            return `${assignment.user.firstName} ${assignment.user.lastName}`
                        }
                        if ('projectMemberName' in assignment && assignment.projectMemberName) {
                            return assignment.projectMemberName
                        }
                        return member ? `${member.firstName} ${member.lastName}` : 'Unknown Member'
                    })()
                    
                    const memberTrade = (() => {
                        if ('user' in assignment && assignment.user?.tradeSpecialty) {
                            return assignment.user.tradeSpecialty
                        }
                        if ('projectMemberTrade' in assignment && assignment.projectMemberTrade) {
                            return assignment.projectMemberTrade
                        }
                        return member?.tradeSpecialty
                    })()
                    
                    const RoleIcon = getRoleIcon(assignment.role)

                    return (
                        <div
                            key={assignment.projectMemberId}
                            className="flex items-center justify-between p-3 border rounded-lg bg-white"
                        >
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-gray-400" />
                                <div>
                                    <div className="font-medium text-sm">{memberName}</div>
                                    {memberTrade && (
                                        <div className="text-xs text-gray-500">{memberTrade}</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Role Badge with Dropdown */}
                                <Select 
                                    value={assignment.role} 
                                    onValueChange={(value) => handleUpdateRole(assignment.projectMemberId, value as AssignmentRole)}
                                >
                                    <SelectTrigger className="w-auto h-7 px-2 border-0 bg-transparent">
                                        <Badge className={cn("text-xs", getRoleColor(assignment.role))}>
                                            <RoleIcon className="h-3 w-3 mr-1" />
                                            {ASSIGNMENT_ROLE_OPTIONS.find(r => r.value === assignment.role)?.label}
                                        </Badge>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ASSIGNMENT_ROLE_OPTIONS.map((option) => {
                                            const Icon = getRoleIcon(option.value)
                                            return (
                                                <SelectItem key={option.value} value={option.value}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4" />
                                                        <span>{option.label}</span>
                                                    </div>
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>

                                {/* Remove Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveAssignment(assignment.projectMemberId)}
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    // ==============================================
    // RENDER
    // ==============================================
    return (
        <div className="space-y-6">
            {/* Team Assignment Section */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">
                        {getLabel('Team Assignment')}
                    </Label>
                    <p className="text-xs text-gray-500">
                        Assign team members to work on this issue. You can assign multiple people with different roles.
                    </p>
                </div>

                {/* Assignment Selection */}
                {renderAssignmentSelection()}

                {/* Assigned Members List */}
                {renderAssignedMembers()}

                {/* Assignment Errors */}
                {errors.assignedMembers && (
                    <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            {errors.assignedMembers}
                        </AlertDescription>
                    </Alert>
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

            {/* No Team Members Available Warning */}
            {!isTeamMembersLoading && !hasTeamMembersError && availableTeamMembers.length === 0 && (
                <Alert>
                    <User className="h-4 w-4" />
                    <AlertDescription>
                        No team members found for this project. You can still create the punchlist item and assign team members later.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
})