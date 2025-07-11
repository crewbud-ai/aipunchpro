"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { SCHEDULE_PRIORITY, type CreateScheduleProjectFormData } from "@/types/schedule-projects"

interface AssignmentStepProps {
  mode?: 'create' | 'edit'
  formData: Pick<CreateScheduleProjectFormData, 'assignedProjectMemberIds' | 'priority' | 'location' | 'notes'>
  errors: any
  updateFormData: (field: keyof CreateScheduleProjectFormData, value: any) => void
  clearFieldError: (field: string) => void
  selectedProject: any
  isTeamMembersLoading: boolean
  hasTeamMembersError: boolean
  availableTeamMembers: any[]
  handleTeamMemberToggle: (memberId: string) => void
}

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
}) => (
  <div className="space-y-6">
    {/* Team Member Assignment */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          Assign Team Members <span className="text-red-500">*</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableTeamMembers.map((member) => (
            <div key={member.id} className="flex items-center space-x-2 p-3 border rounded-lg">
              <Checkbox
                id={`member-${member.id}`}
                checked={formData.assignedProjectMemberIds.includes(member.id)}
                onCheckedChange={() => handleTeamMemberToggle(member.id)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <Label htmlFor={`member-${member.id}`} className="text-sm font-medium">
                    {member.firstName} {member.lastName}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  {member.tradeSpecialty && (
                    <Badge variant="secondary" className="text-xs">
                      {member.tradeSpecialty}
                    </Badge>
                  )}
                  {member.jobTitle && (
                    <span className="text-xs text-gray-500">{member.jobTitle}</span>
                  )}
                </div>
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

    {/* Priority */}
    <div>
      <Label htmlFor="priority" className="text-base font-medium">Priority</Label>
      <Select value={formData.priority} onValueChange={(value) => updateFormData('priority', value)}>
        <SelectTrigger className="mt-2" id="priority">
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          {SCHEDULE_PRIORITY.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Location */}
    <div>
      <Label htmlFor="location" className="text-base font-medium">Location</Label>
      <Input
        id="location"
        placeholder="e.g., Building A - 2nd Floor"
        value={formData.location}
        onChange={(e) => {
          updateFormData('location', e.target.value)
          clearFieldError('location')
        }}
        className="mt-2"
      />
    </div>

    {/* Notes */}
    <div>
      <Label htmlFor="notes" className="text-base font-medium">Notes</Label>
      <Textarea
        id="notes"
        placeholder="Additional notes or special instructions..."
        value={formData.notes}
        onChange={(e) => {
          updateFormData('notes', e.target.value)
          clearFieldError('notes')
        }}
        rows={3}
        className="mt-2 resize-none"
      />
    </div>
  </div>
))

AssignmentStep.displayName = 'AssignmentStep'