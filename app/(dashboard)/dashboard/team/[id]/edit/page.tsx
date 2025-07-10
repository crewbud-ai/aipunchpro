// File: app/(dashboard)/dashboard/team/[id]/edit/page.tsx

"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

// Import the PhoneInputComponent
import { PhoneInputComponent } from "@/components/ui/phone-input"

// Import our hooks and types
import { useTeamMember } from "@/hooks/team-members"
import { useUpdateTeamMember } from "@/hooks/team-members"
import { TEAM_MEMBER_ROLES, TRADE_SPECIALTIES } from "@/types/team-members"
import { useProjects } from "@/hooks/projects"

// Extend the UpdateTeamMemberFormData to include project assignment fields
interface ExtendedUpdateTeamMemberFormData {
    // All existing fields from UpdateTeamMemberFormData
    firstName: string
    lastName: string
    email: string
    phone: string
    role: any // TeamMember['role']
    jobTitle: string
    tradeSpecialty?: any // TeamMember['tradeSpecialty']
    hourlyRate?: number
    overtimeRate?: number
    startDate: string
    certifications: string[]
    emergencyContactName: string
    emergencyContactPhone: string
    isActive: boolean

    // Project assignment fields (from CreateTeamMemberFormData)
    assignToProject?: boolean
    projectId?: string
    projectHourlyRate?: number
    projectOvertimeRate?: number
    projectNotes?: string

    // UI state helpers
    isCheckingEmail?: boolean
    isEmailAvailable?: boolean
    lastCheckedEmail?: string
    hasUnsavedChanges?: boolean
    modifiedFields?: Set<string>
    currentStep?: number
    completedSteps?: number[]
}

export default function EditTeamMemberPage() {
    const params = useParams()
    const router = useRouter()
    const teamMemberId = params.id as string

    // Load existing team member data
    const {
        teamMember,
        isLoading: isLoadingTeamMember,
        hasError: hasTeamMemberError,
        error: teamMemberError,
        isNotFound,
    } = useTeamMember(teamMemberId)

    // Update team member hook (simplified - back to working version)
    const {
        formData,
        originalTeamMember,
        hasChanges,
        errors,
        isLoading: isUpdating,
        hasErrors,
        canSubmit,
        isSuccess,
        isInitialized,
        initializeForm,
        updateFormData: baseUpdateFormData,
        clearFieldError,
        updateTeamMember,
        resetForm,
        reset,
    } = useUpdateTeamMember()

    // Simple state for project assignment fields only
    const [projectAssignmentData, setProjectAssignmentData] = useState({
        assignToProject: false,
        projectId: undefined as string | undefined,
        projectHourlyRate: undefined as number | undefined,
        projectOvertimeRate: undefined as number | undefined,
        projectNotes: '',
    })

    // Custom update function that handles both core and project assignment fields
    const updateFormData = (field: string, value: any) => {
        // Handle project assignment fields
        if (['assignToProject', 'projectId', 'projectHourlyRate', 'projectOvertimeRate', 'projectNotes'].includes(field)) {
            setProjectAssignmentData(prev => ({
                ...prev,
                [field]: value,
            }))
        } else {
            // Handle core team member fields
            baseUpdateFormData(field as any, value)
        }
    }

    // Check if project assignment has changed
    const hasProjectAssignmentChanges = useEffect(() => {
        // This will trigger a re-render when project assignment data changes
    }, [projectAssignmentData])

    // Enhanced canSubmit that includes project assignment changes
    const canActuallySubmit = canSubmit ||
        (formData.firstName && formData.lastName && formData.email && !hasErrors && !isUpdating)
    const {
        projects,
        isLoading: isProjectsLoading,
        hasError: hasProjectsError
    } = useProjects()

    // Filter only active projects for assignment
    const activeProjects = projects.filter(project =>
        project.status === 'in_progress' ||
        project.status === 'not_started' ||
        project.status === 'on_track'
    )

    // Initialize form when team member loads (simplified)
    useEffect(() => {
        if (teamMember && !isInitialized) {
            initializeForm(teamMember)

            // Auto-check project assignment if team member has current projects
            if (teamMember.currentProjects && teamMember.currentProjects.length > 0) {
                const currentProject = teamMember.currentProjects[0]
                setProjectAssignmentData({
                    assignToProject: true,
                    projectId: currentProject.id,
                    projectHourlyRate: currentProject.hourlyRate,
                    projectOvertimeRate: currentProject.overtimeRate,
                    projectNotes: currentProject.notes || "",
                })
            }
        }
    }, [teamMember, isInitialized, initializeForm])

    // Handle successful update
    useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(() => {
                router.push(`/dashboard/team/${teamMemberId}`)
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [isSuccess, router, teamMemberId])

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        console.log('Current form data:', formData) // Debug log
        console.log('Current project assignment data:', projectAssignmentData) // Debug log

        // Prepare the complete update data including project assignment
        const completeUpdateData = {
            id: teamMemberId, // Required id field
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            jobTitle: formData.jobTitle,
            tradeSpecialty: formData.tradeSpecialty,
            hourlyRate: formData.hourlyRate,
            overtimeRate: formData.overtimeRate,
            startDate: formData.startDate,
            certifications: formData.certifications,
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
            isActive: formData.isActive,

            // Add project assignment fields
            assignToProject: projectAssignmentData.assignToProject,
            projectId: projectAssignmentData.projectId,
            projectHourlyRate: projectAssignmentData.projectHourlyRate,
            projectOvertimeRate: projectAssignmentData.projectOvertimeRate,
            projectNotes: projectAssignmentData.projectNotes,
        }

        console.log('Complete update data being sent:', completeUpdateData) // Debug log

        // Call updateTeamMember with the complete data
        await updateTeamMember(completeUpdateData as any)
    }

    // Handle input changes with error clearing and smart auto-calculation
    const handleInputChange = (field: keyof typeof formData, value: any) => {
        updateFormData(field, value)

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
    }

    // Handle cancel with unsaved changes check
    const handleCancel = () => {
        if (hasChanges) {
            if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                router.push(`/dashboard/team/${teamMemberId}`)
            }
        } else {
            router.push(`/dashboard/team/${teamMemberId}`)
        }
    }

    // Loading state
    if (isLoadingTeamMember) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="animate-pulse">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-10 w-10 bg-gray-200 rounded-md"></div>
                            <div className="space-y-2">
                                <div className="h-8 w-64 bg-gray-200 rounded"></div>
                                <div className="h-4 w-48 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        <div className="h-96 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            </div>
        )
    }

    // Error state
    if (hasTeamMemberError || isNotFound) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/dashboard/team">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Team Member</h1>
                            <p className="text-gray-600 mt-1">Team member not found</p>
                        </div>
                    </div>

                    <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            {teamMemberError || "The requested team member could not be found or you don't have access to edit it."}
                        </AlertDescription>
                    </Alert>

                    <div className="mt-6">
                        <Link href="/dashboard/team">
                            <Button variant="outline">
                                ← Back to Team
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // No team member data
    if (!teamMember || !isInitialized) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="animate-pulse">
                        <div className="h-96 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href={`/dashboard/team/${teamMemberId}`}>
                            <Button variant="outline" size="icon" className="shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Team Member</h1>
                            <p className="text-gray-600 mt-1">
                                Update {teamMember.firstName} {teamMember.lastName}'s information
                            </p>
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                {isSuccess && (
                    <div className="mb-6">
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center space-x-2 text-green-800">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="font-medium">Team member updated successfully!</span>
                                    <span className="text-sm">Redirecting to team member details...</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Error Message */}
                {hasErrors && errors.general && (
                    <div className="mb-6">
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="pt-6">
                                <div className="text-red-800">
                                    <span className="font-medium">❌ Error:</span> {errors.general}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Changes Indicator */}
                {hasChanges && (
                    <div className="mb-6">
                        <Card className="border-amber-200 bg-amber-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center space-x-2 text-amber-800">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                                    <span className="font-medium">You have unsaved changes</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Main Form Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Team Member Information</CardTitle>
                        <CardDescription>Update the details for this team member</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Personal Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Personal Information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* First Name */}
                                    <div>
                                        <Label htmlFor="firstName">First Name *</Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                                            className={errors.firstName ? "border-red-500" : ""}
                                            required
                                        />
                                        {errors.firstName && (
                                            <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
                                        )}
                                    </div>

                                    {/* Last Name */}
                                    <div>
                                        <Label htmlFor="lastName">Last Name *</Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                                            className={errors.lastName ? "border-red-500" : ""}
                                            required
                                        />
                                        {errors.lastName && (
                                            <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        className={errors.email ? "border-red-500" : ""}
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                                    )}
                                </div>

                                {/* Phone - Using PhoneInputComponent */}
                                <div>
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <PhoneInputComponent
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(value) => handleInputChange("phone", value)}
                                        placeholder="(555) 123-4567"
                                        error={!!errors.phone}
                                        className={errors.phone ? "border-red-500" : ""}
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Work Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Work Information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Role - Fixed to current role, but disabled for members */}
                                    <div>
                                        <Label htmlFor="role">Role</Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value) => handleInputChange("role", value)}
                                            disabled={formData.role === 'member'} // Disable if current role is member
                                        >
                                            <SelectTrigger className={formData.role === 'member' ? "bg-gray-50" : (errors.role ? "border-red-500" : "")}>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TEAM_MEMBER_ROLES.map((role) => (
                                                    <SelectItem key={role.value} value={role.value}>
                                                        {role.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {formData.role === 'member' && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Role is set to Member and cannot be changed
                                            </p>
                                        )}
                                        {errors.role && (
                                            <p className="text-sm text-red-500 mt-1">{errors.role}</p>
                                        )}
                                    </div>

                                    {/* Trade Specialty */}
                                    <div>
                                        <Label htmlFor="tradeSpecialty">Trade/Specialty</Label>
                                        <Select
                                            value={formData.tradeSpecialty || "none"}
                                            onValueChange={(value) => updateFormData("tradeSpecialty", value === "none" ? undefined : value)}
                                        >
                                            <SelectTrigger className={errors.tradeSpecialty ? "border-red-500" : ""}>
                                                <SelectValue placeholder="Select trade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Select trade</SelectItem>
                                                {TRADE_SPECIALTIES.map((trade) => (
                                                    <SelectItem key={trade.value} value={trade.value}>
                                                        {trade.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.tradeSpecialty && (
                                            <p className="text-sm text-red-500 mt-1">{errors.tradeSpecialty}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Job Title */}
                                <div>
                                    <Label htmlFor="jobTitle">Job Title</Label>
                                    <Input
                                        id="jobTitle"
                                        value={formData.jobTitle}
                                        onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                                        placeholder="e.g., Senior Electrician, Site Supervisor"
                                        className={errors.jobTitle ? "border-red-500" : ""}
                                    />
                                    {errors.jobTitle && (
                                        <p className="text-sm text-red-500 mt-1">{errors.jobTitle}</p>
                                    )}
                                </div>

                                {/* Start Date */}
                                <div>
                                    <Label htmlFor="startDate">Start Date</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => handleInputChange("startDate", e.target.value)}
                                        className={errors.startDate ? "border-red-500" : ""}
                                    />
                                    {errors.startDate && (
                                        <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>
                                    )}
                                </div>

                                {/* Rates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Hourly Rate */}
                                    <div>
                                        <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                                        <Input
                                            id="hourlyRate"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.hourlyRate || ""}
                                            onChange={(e) => handleInputChange("hourlyRate", parseFloat(e.target.value) || undefined)}
                                            placeholder="25.00"
                                            className={errors.hourlyRate ? "border-red-500" : ""}
                                        />
                                        {errors.hourlyRate && (
                                            <p className="text-sm text-red-500 mt-1">{errors.hourlyRate}</p>
                                        )}
                                    </div>

                                    {/* Overtime Rate - Auto-calculated but editable */}
                                    <div>
                                        <Label htmlFor="overtimeRate">Overtime Rate ($)</Label>
                                        <Input
                                            id="overtimeRate"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.overtimeRate || ""}
                                            onChange={(e) => handleInputChange("overtimeRate", parseFloat(e.target.value) || undefined)}
                                            placeholder="Auto-calculated as 1.5x hourly rate"
                                            className={errors.overtimeRate ? "border-red-500" : ""}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Auto-calculated as 1.5x hourly rate, but you can adjust if needed
                                        </p>
                                        {errors.overtimeRate && (
                                            <p className="text-sm text-red-500 mt-1">{errors.overtimeRate}</p>
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* Project Assignment */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Project Assignment (Optional)</h3>

                                <div className="space-y-4">
                                    {/* Assign to Project Checkbox */}
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="assignToProject"
                                            checked={projectAssignmentData.assignToProject}
                                            onChange={(e) => updateFormData("assignToProject", e.target.checked)}
                                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                        />
                                        <Label htmlFor="assignToProject" className="text-sm font-medium">
                                            Assign to a project immediately
                                        </Label>
                                    </div>

                                    {/* Project Selection - Only show if checkbox is checked */}
                                    {projectAssignmentData.assignToProject && (
                                        <div className="space-y-4 pl-6 border-l-2 border-orange-100">
                                            <div>
                                                <Label htmlFor="projectId">Select Project *</Label>
                                                <Select
                                                    value={projectAssignmentData.projectId || "none"}
                                                    onValueChange={(value) => updateFormData("projectId", value === "none" ? undefined : value)}
                                                >
                                                    <SelectTrigger className={errors.projectId ? "border-red-500" : ""}>
                                                        <SelectValue placeholder="Choose a project" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">Choose a project</SelectItem>
                                                        {isProjectsLoading ? (
                                                            <SelectItem value="loading" disabled>Loading projects...</SelectItem>
                                                        ) : hasProjectsError ? (
                                                            <SelectItem value="error" disabled>Error loading projects</SelectItem>
                                                        ) : activeProjects.length === 0 ? (
                                                            <SelectItem value="empty" disabled>No active projects available</SelectItem>
                                                        ) : (
                                                            activeProjects.map((project) => (
                                                                <SelectItem key={project.id} value={project.id}>
                                                                    {project.name}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {errors.projectId && (
                                                    <p className="text-sm text-red-500 mt-1">{errors.projectId}</p>
                                                )}
                                            </div>

                                            {/* Project Assignment Notes */}
                                            <div>
                                                <Label htmlFor="projectNotes">Assignment Notes</Label>
                                                <Input
                                                    id="projectNotes"
                                                    value={projectAssignmentData.projectNotes}
                                                    onChange={(e) => updateFormData("projectNotes", e.target.value)}
                                                    placeholder="Any special notes about this assignment..."
                                                    className={errors.projectNotes ? "border-red-500" : ""}
                                                />
                                                {errors.projectNotes && (
                                                    <p className="text-sm text-red-500 mt-1">{errors.projectNotes}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Emergency Contact</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Emergency Contact Name */}
                                    <div>
                                        <Label htmlFor="emergencyContactName">Contact Name</Label>
                                        <Input
                                            id="emergencyContactName"
                                            value={formData.emergencyContactName}
                                            onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                                            placeholder="Emergency contact full name"
                                            className={errors.emergencyContactName ? "border-red-500" : ""}
                                        />
                                        {errors.emergencyContactName && (
                                            <p className="text-sm text-red-500 mt-1">{errors.emergencyContactName}</p>
                                        )}
                                    </div>

                                    {/* Emergency Contact Phone - Using PhoneInputComponent */}
                                    <div>
                                        <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                                        <PhoneInputComponent
                                            id="emergencyContactPhone"
                                            value={formData.emergencyContactPhone}
                                            onChange={(value) => {
                                                // Only set the value if it's a complete phone number or clear it
                                                const cleanValue = value && value.length >= 12 ? value : undefined
                                                handleInputChange("emergencyContactPhone", cleanValue)
                                            }}
                                            placeholder="(555) 123-4567"
                                            error={!!errors.emergencyContactPhone}
                                            className={errors.emergencyContactPhone ? "border-red-500" : ""}
                                        />
                                        {errors.emergencyContactPhone && (
                                            <p className="text-sm text-red-500 mt-1">{errors.emergencyContactPhone}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex justify-end gap-4 pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    //   disabled={!canActuallySubmit}
                                    className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Update Team Member
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}