"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"

// Import the PhoneInputComponent
import { PhoneInputComponent } from "@/components/ui/phone-input"

// Import our new hook and types
import { useCreateTeamMember } from "@/hooks/team-members"
import { TEAM_MEMBER_ROLES, TRADE_SPECIALTIES } from "@/types/team-members"
import { useProjects } from "@/hooks/projects"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

export default function AddTeamMemberPage() {
  // Use our professional hook
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
  } = useCreateTeamMember()

  // Load projects for the dropdown
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Transform data to match API expectations
    const submissionData = {
      ...formData,
      role: 'member' as const,
      // Convert certifications array to string (API expects string)
      certifications: Array.isArray(formData.certifications)
        ? formData.certifications.join(', ')
        : formData.certifications || '',
      // Clean up emergency contact fields - if name is empty, clear phone too
      emergencyContactName: formData.emergencyContactName?.trim() || undefined,
      emergencyContactPhone: formData.emergencyContactName?.trim()
        ? formData.emergencyContactPhone
        : undefined,
    }

    // Create cleaned data object with proper typing
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

    // Add project fields only if assigning to project
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

  // Additional validation check - ensure required fields are filled
  const hasRequiredFields = formData.firstName?.trim() &&
    formData.lastName?.trim() &&
    formData.email?.trim() &&
    formData.hourlyRate &&
    formData.tradeSpecialty &&
    formData.phone &&
    formData.jobTitle

  // Manual validation to bypass hook issues
  const manualValidation = {
    hasEmergencyContactIssue: (formData.emergencyContactName?.trim() && !formData.emergencyContactPhone) ||
      (!formData.emergencyContactName?.trim() && formData.emergencyContactPhone),
    hasOvertimeIssue: formData.overtimeRate && !formData.hourlyRate,
    hasProjectAssignmentIssue: formData.assignToProject && !formData.projectId
  }

  const hasManualErrors = Object.values(manualValidation).some(Boolean)

  const canActuallySubmit = hasRequiredFields && !hasManualErrors && !isLoading

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start xs:items-center gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4">
            <Link href="/dashboard/team">
              <Button variant="outline" size="icon" className="shrink-0 h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10">
                <ArrowLeft className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 leading-tight xs:leading-normal truncate">
                Add Team Member
              </h1>
              <p className="text-xs xs:text-sm sm:text-base text-gray-600 mt-0.5 xs:mt-0.5 sm:mt-1 line-clamp-2 leading-snug xs:leading-normal">
                Add a new member to your construction team
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <Card>
          <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-3.5 xs:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <Label htmlFor="firstName" className="text-sm xs:text-base font-medium">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Enter First Name..."
                      className={cn(
                        "mt-1.5 xs:mt-2 text-sm xs:text-base resize-none",
                        errors.firstName && "border-red-500 focus:border-red-500 focus:ring-red-500"
                      )}
                      required
                    />
                    {errors.firstName && (
                      <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                        <span className="leading-tight">{errors.firstName}</span>
                      </p>
                    )}

                  </div>

                  {/* Last Name */}
                  <div>
                    <Label htmlFor="lastName" className="text-sm xs:text-base font-medium">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Enter Last Name..."
                      className={cn(
                        "mt-1.5 xs:mt-2 text-sm xs:text-base resize-none",
                        errors.lastName && "border-red-500 focus:border-red-500 focus:ring-red-500"
                      )}
                      required
                    />
                    {errors.lastName && (
                      <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                        <span className="leading-tight">{errors.lastName}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-sm xs:text-base font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    placeholder="john@company.com"
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={cn(
                      "mt-1.5 xs:mt-2 text-sm xs:text-base resize-none",
                      errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                    required
                  />
                  {errors.email && (
                    <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                      <span className="leading-tight">{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* Phone - Using PhoneInputComponent */}
                <div>
                  <Label htmlFor="phone" className="text-sm xs:text-base font-medium">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <PhoneInputComponent
                    id="phone"
                    value={formData.phone}
                    onChange={(value) => handleInputChange("phone", value)}
                    placeholder="(555) 123-4567"
                    error={!!errors.phone}
                    className={cn(
                      "mt-1.5 xs:mt-2 text-sm xs:text-base resize-none",
                      errors.phone && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                  />
                  {errors.phone && (
                    <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                      <span className="leading-tight">{errors.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Work Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Work Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Role - Fixed to 'member' for MVP */}
                  <div>
                    <Label htmlFor="role" className="text-sm xs:text-base font-medium">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value="member"
                      disabled={true}
                    >
                      <SelectTrigger className="bg-gray-50">
                        <SelectValue className="text-sm xs:text-base font-medium" placeholder="Member" />
                      </SelectTrigger>
                      <SelectContent className="text-sm xs:text-base font-medium">
                        <SelectItem className="text-sm xs:text-base font-medium" value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Role is automatically set to Member for new team members
                    </p>
                  </div>

                  {/* Trade Specialty */}
                  <div>
                    <Label htmlFor="tradeSpecialty" className="text-sm xs:text-base font-medium">
                      Trade/Specialty <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.tradeSpecialty || "none"}
                      onValueChange={(value) => handleInputChange("tradeSpecialty", value === "none" ? undefined : value)}
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
                      <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                        <span className="leading-tight">{errors.tradeSpecialty}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Job Title */}
                <div>
                  <Label htmlFor="jobTitle" className="text-sm xs:text-base font-medium">
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                    placeholder="e.g., Senior Electrician, Site Supervisor"
                    className={cn(
                      "mt-1.5 xs:mt-2 text-sm xs:text-base resize-none",
                      errors.jobTitle && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                  />
                  {errors.jobTitle && (
                    <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                      <span className="leading-tight">{errors.jobTitle}</span>
                    </p>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <Label htmlFor="startDate" className="text-sm xs:text-base font-medium">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    className={cn(
                      "mt-1.5 xs:mt-2 text-sm xs:text-base resize-none",
                      errors.startDate && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                  />
                  {errors.startDate && (
                    <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                      <span className="leading-tight">{errors.startDate}</span>
                    </p>
                  )}
                </div>

                {/* Rates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hourly Rate */}
                  <div>
                    <Label htmlFor="hourlyRate" className="text-sm xs:text-base font-medium">
                      Hourly Rate ($) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hourlyRate || ""}
                      onChange={(e) => handleInputChange("hourlyRate", parseFloat(e.target.value) || undefined)}
                      placeholder="25.00"
                      className={cn(
                        "mt-1.5 xs:mt-2 text-sm xs:text-base resize-none",
                        errors.hourlyRate && "border-red-500 focus:border-red-500 focus:ring-red-500"
                      )}
                    />
                    {errors.hourlyRate && (
                      <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                        <span className="leading-tight">{errors.hourlyRate}</span>
                      </p>
                    )}
                  </div>

                  {/* Overtime Rate - Auto-calculated but editable */}
                  <div>
                    <Label htmlFor="overtimeRate" className="text-sm xs:text-base font-medium">Overtime Rate ($)</Label>
                    <Input
                      id="overtimeRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.overtimeRate || ""}
                      onChange={(e) => handleInputChange("overtimeRate", parseFloat(e.target.value) || undefined)}
                      placeholder="Auto-calculated as 1.5x hourly rate"
                      className={cn(
                        "mt-1.5 xs:mt-2 text-sm xs:text-base resize-none",
                        errors.overtimeRate && "border-red-500 focus:border-red-500 focus:ring-red-500"
                      )}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-calculated as 1.5x hourly rate, but you can adjust if needed
                    </p>
                    {errors.overtimeRate && (
                      <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                        <span className="leading-tight">{errors.overtimeRate}</span>
                      </p>
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
                      checked={formData.assignToProject}
                      onChange={(e) => handleInputChange("assignToProject", e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <Label htmlFor="assignToProject" className="text-sm xs:text-base font-medium">
                      Assign to a project immediately
                    </Label>
                  </div>

                  {/* Project Selection - Only show if checkbox is checked */}
                  {formData.assignToProject && (
                    <div className="space-y-4 pl-6 border-l-2 border-orange-100">
                      <div>
                        <Label htmlFor="projectId" className="text-sm xs:text-base font-medium">Select Project *</Label>
                        <Select
                          value={formData.projectId || "none"}
                          onValueChange={(value) => handleInputChange("projectId", value === "none" ? undefined : value)}
                        >
                          <SelectTrigger className={errors.projectId ? "border-red-500" : ""}>
                            <SelectValue className="text-sm xs:text-base font-medium" placeholder="Choose a project" />
                          </SelectTrigger>
                          <SelectContent className="text-sm xs:text-base font-medium">
                            <SelectItem className="text-sm xs:text-base font-medium" value="none">Choose a project</SelectItem>
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
                          <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                            <span className="leading-tight">{errors.projectId}</span>
                          </p>
                        )}
                      </div>

                      {/* Project Assignment Notes */}
                      <div>
                        <Label htmlFor="projectNotes" className="text-sm xs:text-base font-medium">Assignment Notes</Label>
                        <Input
                          id="projectNotes"
                          value={formData.projectNotes}
                          onChange={(e) => handleInputChange("projectNotes", e.target.value)}
                          placeholder="Any special notes about this assignment..."
                          className={cn(
                            "mt-1.5 xs:mt-2 text-sm xs:text-base resize-none",
                            errors.projectNotes && "border-red-500 focus:border-red-500 focus:ring-red-500"
                          )}
                        />
                        {errors.projectNotes && (
                          <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                            <span className="leading-tight">{errors.projectNotes}</span>
                          </p>
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
                    <Label htmlFor="emergencyContactName" className="text-sm xs:text-base font-medium">Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                      placeholder="Emergency contact full name"
                      className={cn(
                        "mt-1.5 xs:mt-2 text-sm xs:text-base resize-none",
                        errors.emergencyContactName && "border-red-500 focus:border-red-500 focus:ring-red-500"
                      )}
                    />
                    {errors.emergencyContactName && (
                      <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                        <span className="leading-tight">{errors.emergencyContactName}</span>
                      </p>
                    )}
                  </div>

                  {/* Emergency Contact Phone - Using PhoneInputComponent */}
                  <div>
                    <Label htmlFor="emergencyContactPhone" className="text-sm xs:text-base font-medium">Contact Phone</Label>
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
                      className={cn(
                        "mt-1.5 xs:mt-2 text-sm xs:text-base resize-none",
                        errors.emergencyContactPhone && "border-red-500 focus:border-red-500 focus:ring-red-500"
                      )}
                    />
                    {errors.emergencyContactPhone && (
                      <p className="text-xs xs:text-sm text-red-600 mt-1 xs:mt-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                        <span className="leading-tight">{errors.emergencyContactPhone}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Submit Buttons */}
              <div className="flex flex-col md:flex-row md:justify-end justify-between   items-stretch md:items-center gap-3 pt-4 sm:pt-6">
                <Button
                  type="submit"
                  disabled={!canActuallySubmit}
                  className="w-full md:w-auto h-10 sm:h-11 bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="text-sm sm:text-base">Adding...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      <span className="text-sm sm:text-base">Add Team Member</span>
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