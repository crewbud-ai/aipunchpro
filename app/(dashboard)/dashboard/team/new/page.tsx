"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

// Import our new hook and types
import { useCreateTeamMember } from "@/hooks/team-members"
import { TEAM_MEMBER_ROLES, TRADE_SPECIALTIES } from "@/types/team-members"
import { useProjects } from "@/hooks/projects"

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
    
    // Ensure role is always 'member' for MVP
    const submissionData = {
      ...formData,
      role: 'member' as const,
    }
    
    await createTeamMember(submissionData)
  }

  // Handle input changes with error clearing
  const handleInputChange = (field: keyof typeof formData, value: any) => {
    updateFormData(field, value)
    
    // Auto-calculate overtime rate (1.5x regular rate) for hourly rate changes
    if (field === "hourlyRate" && value) {
      const hourlyRate = parseFloat(value)
      if (!isNaN(hourlyRate)) {
        const overtimeRate = (hourlyRate * 1.5)
        updateFormData("overtimeRate", overtimeRate)
      }
    }
  }

  // Load projects for assignment dropdown (we'll implement this in the next step)
  // const { projects } = useProjects() // We'll add this later

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/team">
              <Button variant="outline" size="icon" className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add Team Member</h1>
              <p className="text-gray-600 mt-1">
                Add a new member to your construction team
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
                  <span className="font-medium">✅ Team member added successfully!</span>
                  <span className="text-sm">Redirecting to team member details...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Message */}
        {isError && errors.general && (
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

        {/* Main Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Team Member Information</CardTitle>
            <CardDescription>Enter the details for the new team member</CardDescription>
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

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(555) 123-4567"
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
                  {/* Role - Fixed to 'member' for MVP */}
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value="member"
                      disabled={true}
                    >
                      <SelectTrigger className="bg-gray-50">
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

                  {/* Trade Specialty */}
                  <div>
                    <Label htmlFor="tradeSpecialty">Trade/Specialty</Label>
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

                  {/* Overtime Rate - Auto-calculated */}
                  <div>
                    <Label htmlFor="overtimeRate">Overtime Rate ($)</Label>
                    <Input
                      id="overtimeRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.overtimeRate || ""}
                      className="bg-gray-50"
                      disabled={true}
                      placeholder="Auto-calculated"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically calculated as 1.5x hourly rate
                    </p>
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
                    <Label htmlFor="assignToProject" className="text-sm font-medium">
                      Assign to a project immediately
                    </Label>
                  </div>

                  {/* Project Selection - Only show if checkbox is checked */}
                  {formData.assignToProject && (
                    <div className="space-y-4 pl-6 border-l-2 border-orange-100">
                      <div>
                        <Label htmlFor="projectId">Select Project *</Label>
                        <Select 
                          value={formData.projectId || "none"} 
                          onValueChange={(value) => handleInputChange("projectId", value === "none" ? undefined : value)}
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
                          value={formData.projectNotes}
                          onChange={(e) => handleInputChange("projectNotes", e.target.value)}
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

                  {/* Emergency Contact Phone */}
                  <div>
                    <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                      placeholder="(555) 123-4567"
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
                  onClick={() => window.history.back()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!canSubmit || isLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading ? "Adding..." : "Add Team Member"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}