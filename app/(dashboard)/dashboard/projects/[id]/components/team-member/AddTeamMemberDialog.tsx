// ==============================================
// File: AddTeamMemberDialog.tsx
// ==============================================

"use client"

import React, { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import { useCreateTeamMember } from '@/hooks/team-members'
import { TEAM_MEMBER_ROLES, TRADE_SPECIALTIES } from '@/types/team-members'
import { PhoneInputComponent } from '@/components/ui/phone-input'

interface AddTeamMemberDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    projectName: string
    onMemberAdded: (statusSuggestion?: any) => void  // UPDATED: Now accepts optional parameter
}

export const AddTeamMemberDialog: React.FC<AddTeamMemberDialogProps> = ({
    open,
    onOpenChange,
    projectId,
    projectName,
    onMemberAdded
}) => {

    // ==============================================
    // HOOKS
    // ==============================================
    const {
        formData,
        errors,
        isLoading,
        isSuccess,
        isError,
        hasErrors,
        canSubmit,
        updateFormData,
        clearFieldError,
        createTeamMember,
        reset,
        result  // ADD: Get the result from the hook
    } = useCreateTeamMember()

    // ==============================================
    // EFFECTS
    // ==============================================

    // Set project assignment and defaults when dialog opens
    useEffect(() => {
        if (open && projectId) {
            updateFormData('assignToProject', true)
            updateFormData('projectId', projectId)
            updateFormData('role', 'member') // Set default role to member
        }
    }, [open, projectId, updateFormData])

    // Handle successful creation - UPDATED
    useEffect(() => {
        console.log(result, 'result')
        if (isSuccess && result && onMemberAdded) {
            // Check if there's a status suggestion in the result
            const statusSuggestion = result?.data?.statusSuggestion

            setTimeout(() => {
                // Pass the status suggestion to parent if it exists
                if (statusSuggestion?.shouldSuggest) {
                    onMemberAdded(statusSuggestion)
                } else {
                    onMemberAdded() // Call without suggestion
                }
                handleClose()
            }, 1000) // Brief delay to show success message
        }
    }, [isSuccess, result, onMemberAdded])

    // ==============================================
    // COMPUTED VALUES
    // ==============================================

    // Manual validation following your existing pattern
    const hasRequiredFields = formData.firstName?.trim() &&
        formData.lastName?.trim() &&
        formData.email?.trim()

    const manualValidation = {
        hasEmergencyContactIssue: (formData.emergencyContactName?.trim() && !formData.emergencyContactPhone) ||
            (!formData.emergencyContactName?.trim() && formData.emergencyContactPhone),
        hasProjectAssignmentIssue: formData.assignToProject && !formData.projectId
    }

    const hasManualErrors = Object.values(manualValidation).some(Boolean)

    // Custom canSubmit logic (following your pattern)
    const canActuallySubmit = hasRequiredFields && !hasManualErrors && !isLoading

    // ==============================================
    // EVENT HANDLERS  
    // ==============================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Don't submit if validation fails
        if (!canActuallySubmit) {
            return
        }

        // Transform data following your existing pattern
        const submissionData = {
            ...formData,
            role: 'member' as const,
            // Clean up emergency contact fields - if name is empty, clear phone too
            emergencyContactName: formData.emergencyContactName?.trim() || undefined,
            emergencyContactPhone: formData.emergencyContactName?.trim()
                ? formData.emergencyContactPhone
                : undefined,
        }

        // Create cleaned data object
        const cleanedData: any = {
            firstName: submissionData.firstName,
            lastName: submissionData.lastName,
            email: submissionData.email,
            phone: submissionData.phone,
            role: submissionData.role,
            jobTitle: submissionData.jobTitle,
            tradeSpecialty: submissionData.tradeSpecialty,
            hourlyRate: submissionData.hourlyRate,
            overtimeRate: submissionData.overtimeRate,
            startDate: submissionData.startDate,
            certifications: submissionData.certifications,
            emergencyContactName: submissionData.emergencyContactName,
            emergencyContactPhone: submissionData.emergencyContactPhone,
            isActive: submissionData.isActive,
        }

        // Add project fields since this is for project assignment
        if (formData.assignToProject && formData.projectId) {
            cleanedData.projectId = formData.projectId
            cleanedData.hourlyRate = formData.projectHourlyRate
            cleanedData.overtimeRate = formData.projectOvertimeRate
            cleanedData.assignmentNotes = formData.projectNotes
        }

        // Remove undefined values
        Object.keys(cleanedData).forEach(key => {
            if (cleanedData[key] === undefined) {
                delete cleanedData[key]
            }
        })

        await createTeamMember(cleanedData)
        // The result will be handled in the useEffect above
    }

    const handleClose = () => {
        reset()
        onOpenChange(false)
    }

    // Handle input changes with error clearing and smart auto-calculation (following your pattern)
    const handleInputChange = (field: string, value: any) => {
        updateFormData(field as any, value)

        // Auto-calculate overtime rate (1.5x regular rate) for hourly rate changes
        // Only auto-calculate if overtime rate is empty or equals the previous 1.5x calculation
        if (field === "hourlyRate" && value) {
            const hourlyRate = parseFloat(value)
            if (!isNaN(hourlyRate)) {
                const newOvertimeRate = (hourlyRate * 1.5)

                // Only auto-update if:
                // 1. Overtime rate is empty, OR
                // 2. Overtime rate currently equals 1.5x the previous hourly rate
                const currentOvertimeRate = formData.overtimeRate
                const previousHourlyRate = formData.hourlyRate
                const shouldAutoUpdate = !currentOvertimeRate ||
                    (previousHourlyRate && currentOvertimeRate === (previousHourlyRate * 1.5))

                if (shouldAutoUpdate) {
                    updateFormData("overtimeRate", newOvertimeRate)
                }
            }
        }

        // Same logic for project hourly rate
        if (field === "projectHourlyRate" && value) {
            const hourlyRate = parseFloat(value)
            if (!isNaN(hourlyRate)) {
                const newOvertimeRate = (hourlyRate * 1.5)

                const currentOvertimeRate = formData.projectOvertimeRate
                const previousHourlyRate = formData.projectHourlyRate
                const shouldAutoUpdate = !currentOvertimeRate ||
                    (previousHourlyRate && currentOvertimeRate === (previousHourlyRate * 1.5))

                if (shouldAutoUpdate) {
                    updateFormData("projectOvertimeRate", newOvertimeRate)
                }
            }
        }
    }

    // ==============================================
    // RENDER
    // ==============================================
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-full sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                        Add New Team Member
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Create a new team member and assign them to <strong>{projectName}</strong>
                    </DialogDescription>
                </DialogHeader>

                {/* Validation Issues Warning */}
                {hasManualErrors && (
                    <Alert variant="destructive" className="text-sm">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <AlertDescription>
                            <span className="font-medium">⚠️ Form Validation Issues:</span>
                            <ul className="mt-2 text-sm space-y-1">
                                {manualValidation.hasEmergencyContactIssue && (
                                    <li>• Emergency contact name and phone must both be filled or both be empty</li>
                                )}
                                {manualValidation.hasProjectAssignmentIssue && (
                                    <li>• Project selection is required when assigning to project</li>
                                )}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-medium">Basic Information</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <Label htmlFor="firstName" className="text-sm">First Name *</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    placeholder="John"
                                    className={`text-sm ${errors.firstName ? 'border-red-500' : ''}`}
                                    required
                                />
                                {errors.firstName && (
                                    <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="lastName" className="text-sm">Last Name *</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    placeholder="Doe"
                                    className={`text-sm ${errors.lastName ? 'border-red-500' : ''}`}
                                    required
                                />
                                {errors.lastName && (
                                    <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="email" className="text-sm">Email Address *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="john.doe@example.com"
                                className={`text-sm ${errors.email ? 'border-red-500' : ''}`}
                                required
                            />
                            {errors.email && (
                                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                            <PhoneInputComponent
                                value={formData.phone || ''}
                                onChange={(value) => handleInputChange('phone', value)}
                                placeholder="Enter phone number"
                                className={`text-sm ${errors.phone ? 'border-red-500' : ''}`}
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                            )}
                        </div>
                    </div>

                    {/* Role & Specialty */}
                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-medium">Role & Specialty</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <Label htmlFor="role" className="text-sm">Role</Label>
                                <Select
                                    value="member"
                                    disabled={true}
                                >
                                    <SelectTrigger className="bg-gray-50 text-sm">
                                        <SelectValue placeholder="Member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="member">Member</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Role is automatically set to Member for new team members
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="tradeSpecialty" className="text-sm">Trade Specialty</Label>
                                <Select
                                    value={formData.tradeSpecialty}
                                    onValueChange={(value) => handleInputChange('tradeSpecialty', value)}
                                >
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Select trade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TRADE_SPECIALTIES.map((trade) => (
                                            <SelectItem key={trade.value} value={trade.value}>
                                                {trade.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="jobTitle" className="text-sm">Job Title</Label>
                            <Input
                                id="jobTitle"
                                value={formData.jobTitle || ''}
                                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                                placeholder="Site Supervisor, Lead Electrician, etc."
                                className="text-sm"
                            />
                        </div>
                    </div>

                    {/* Project Assignment Details */}
                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-medium">Project Assignment</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <Label htmlFor="projectHourlyRate" className="text-sm">Project Hourly Rate</Label>
                                <Input
                                    id="projectHourlyRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.projectHourlyRate || ''}
                                    onChange={(e) => handleInputChange('projectHourlyRate', parseFloat(e.target.value) || undefined)}
                                    placeholder="25.00"
                                    className="text-sm"
                                />
                            </div>

                            <div>
                                <Label htmlFor="projectOvertimeRate" className="text-sm">Overtime Rate</Label>
                                <Input
                                    id="projectOvertimeRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.projectOvertimeRate || ''}
                                    onChange={(e) => handleInputChange('projectOvertimeRate', parseFloat(e.target.value) || undefined)}
                                    placeholder="37.50"
                                    className="text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">Auto-calculated as 1.5x hourly rate (can be overridden)</p>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="projectNotes" className="text-sm">Assignment Notes</Label>
                            <Textarea
                                id="projectNotes"
                                value={formData.projectNotes || ''}
                                onChange={(e) => handleInputChange('projectNotes', e.target.value)}
                                placeholder="Special instructions or notes for this project assignment..."
                                rows={3}
                                className="text-sm"
                            />
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-medium">Emergency Contact</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <Label htmlFor="emergencyContactName" className="text-sm">Contact Name</Label>
                                <Input
                                    id="emergencyContactName"
                                    value={formData.emergencyContactName || ''}
                                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                                    placeholder="Jane Doe"
                                    className={`text-sm ${manualValidation.hasEmergencyContactIssue ? 'border-red-500' : ''}`}
                                />
                                {manualValidation.hasEmergencyContactIssue && formData.emergencyContactName?.trim() && !formData.emergencyContactPhone?.trim() && (
                                    <p className="text-sm text-red-600 mt-1">Emergency contact phone is required when name is provided</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="emergencyContactPhone" className="text-sm">Contact Phone</Label>
                                <PhoneInputComponent
                                    value={formData.emergencyContactPhone || ''}
                                    onChange={(value) => handleInputChange('emergencyContactPhone', value)}
                                    placeholder="Emergency contact phone"
                                    className={`text-sm ${manualValidation.hasEmergencyContactIssue ? 'border-red-500' : ''}`}
                                />
                                {manualValidation.hasEmergencyContactIssue && !formData.emergencyContactName?.trim() && formData.emergencyContactPhone?.trim() && (
                                    <p className="text-sm text-red-600 mt-1">Emergency contact name is required when phone is provided</p>
                                )}
                            </div>
                        </div>
                    </div>
                </form>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button
                        onClick={handleSubmit}
                        disabled={!canActuallySubmit || isLoading || isSuccess}
                        className="w-full sm:w-auto text-sm bg-orange-600 hover:bg-orange-700"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSuccess ? 'Created!' : 'Create Team Member'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="w-full sm:w-auto text-sm"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}