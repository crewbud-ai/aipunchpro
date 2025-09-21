// ==============================================
// File: TeamMemberDetailsDialog.tsx
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, 
  Eye, 
  AlertCircle, 
  CheckCircle,
  Edit,
  Save,
  X,
  User,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  MapPin,
  Building,
  Settings,
  UserMinus,
  Clock,
  Activity,
  FileText,
  Users
} from 'lucide-react'
import { useTeamMember } from '@/hooks/team-members'
import { useRemoveTeamMember } from '@/hooks/team-members/use-remove-team-member'
import { formatDate, formatStatusLabel, getStatusColor } from '@/utils/format-functions'

interface TeamMemberDetailsDialogProps {
  memberId: string
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onMemberUpdated: () => void
}

export const TeamMemberDetailsDialog: React.FC<TeamMemberDetailsDialogProps> = ({
  memberId,
  projectId,
  open,
  onOpenChange,
  onMemberUpdated
}) => {
  // ==============================================
  // HOOKS
  // ==============================================
  const {
    teamMember,
    isLoading,
    hasError,
    error,
    loadTeamMember,
    refreshTeamMember,
    updateTeamMemberField,
    isUpdating
  } = useTeamMember()

  const {
    isRemoving,
    removeError,
    removeSuccess,
    successMessage: removeSuccessMessage,
    removeFromProject,
    clearError: clearRemoveError,
    reset: resetRemove
  } = useRemoveTeamMember()

  // ==============================================
  // LOCAL STATE
  // ==============================================
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    projectHourlyRate: '',
    projectOvertimeRate: '',
    projectNotes: ''
  })
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // ==============================================
  // EFFECTS
  // ==============================================
  
  // Load team member when dialog opens
  useEffect(() => {
    if (open && memberId) {
      loadTeamMember(memberId)
    }
  }, [open, memberId, loadTeamMember])

  // Initialize edit data when team member loads
  useEffect(() => {
    if (teamMember && projectId) {
      const projectAssignment = teamMember.currentProjects?.find(
        (project: any) => project.id === projectId
      )
      
      console.log(projectAssignment, 'projectAssignment')

      setEditData({
        projectHourlyRate: projectAssignment?.hourlyRate?.toString() || '',
        projectOvertimeRate: projectAssignment?.overtimeRate?.toString() || '',
        projectNotes: projectAssignment?.notes || ''
      })
    }
  }, [teamMember, projectId])

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  
  // Generate initials for avatar
  const initials = React.useMemo(() => {
    if (!teamMember) return ''
    return `${teamMember.firstName?.charAt(0) || ''}${teamMember.lastName?.charAt(0) || ''}`.toUpperCase()
  }, [teamMember])

  // Get project assignment details
  const projectAssignment = React.useMemo(() => {
    if (!teamMember || !projectId) return null
    return teamMember.currentProjects?.find((project: any) => project.id === projectId)
  }, [teamMember, projectId])

  // Get role display name
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'manager': return 'Project Manager'
      case 'supervisor': return 'Supervisor'
      case 'member': return 'Team Member'
      default: return role || 'Member'
    }
  }

  // Format rate
  const formatRate = (rate: number | null | undefined) => {
    if (!rate) return 'Not set'
    return `$${rate}/hr`
  }

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleEditToggle = () => {
    setIsEditing(!isEditing)
    setUpdateError(null)
    setUpdateSuccess(false)
  }

  const handleEditChange = (field: keyof typeof editData, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!teamMember) return

    setUpdateError(null)

    try {
      // In a real implementation, you would update the project assignment
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log('Updating project assignment:', {
        memberId,
        projectId,
        ...editData
      })

      setUpdateSuccess(true)
      setIsEditing(false)
      
      // Refresh and notify parent
      setTimeout(() => {
        refreshTeamMember()
        onMemberUpdated()
        setUpdateSuccess(false)
      }, 1000)

    } catch (error) {
      console.error('Update error:', error)
      setUpdateError('Failed to update assignment. Please try again.')
    }
  }

  const handleRemoveFromProject = async () => {
    console.log('Click to Remove From Project')
    if (!teamMember) return

    setUpdateError(null)
    clearRemoveError()

    try {
      await removeFromProject({
        userId: memberId,
        projectId: projectId,
        reason: 'Removed from project by administrator',
        lastWorkingDay: new Date().toISOString()
      })

      // Close dialog and refresh after successful removal
      setTimeout(() => {
        onMemberUpdated()
        onOpenChange(false)
      }, 1500)

    } catch (error) {
      console.error('Remove error:', error)
      // Error is handled by the hook
    }
  }

  const handleClose = () => {
    setIsEditing(false)
    setUpdateError(null)
    setUpdateSuccess(false)
    resetRemove() // Reset remove state
    onOpenChange(false)
  }

  // ==============================================
  // LOADING STATE
  // ==============================================
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Team Member Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ==============================================
  // ERROR STATE
  // ==============================================
  if (hasError || !teamMember) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Team Member Details</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Failed to load team member details'}
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // ==============================================
  // MAIN RENDER
  // ==============================================
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-medium text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">
                  {teamMember.firstName} {teamMember.lastName}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Badge variant={teamMember.isActive ? "default" : "secondary"}>
                    {teamMember.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">
                    {getRoleDisplay(teamMember.role)}
                  </Badge>
                  {teamMember.tradeSpecialty && (
                    <Badge variant="outline" className="capitalize">
                      {teamMember.tradeSpecialty}
                    </Badge>
                  )}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditToggle}
                disabled={isUpdating}
              >
                {isEditing ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Assignment
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Success/Error Messages */}
        {updateSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Assignment updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {removeSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {removeSuccessMessage || 'Team member removed from project successfully!'}
            </AlertDescription>
          </Alert>
        )}

        {updateError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{updateError}</AlertDescription>
          </Alert>
        )}

        {removeError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{removeError}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assignment">Project Assignment</TabsTrigger>
              <TabsTrigger value="contact">Contact Info</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="flex-1 overflow-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                      <p className="text-sm">{teamMember.firstName} {teamMember.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-sm">{teamMember.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Role</Label>
                      <p className="text-sm">{getRoleDisplay(teamMember.role)}</p>
                    </div>
                    {teamMember.jobTitle && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Job Title</Label>
                        <p className="text-sm">{teamMember.jobTitle}</p>
                      </div>
                    )}
                    {teamMember.tradeSpecialty && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Trade Specialty</Label>
                        <p className="text-sm capitalize">{teamMember.tradeSpecialty}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Default Rates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Default Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Hourly Rate</Label>
                      <p className="text-sm">{formatRate(teamMember.hourlyRate)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Overtime Rate</Label>
                      <p className="text-sm">{formatRate(teamMember.overtimeRate)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Projects */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Current Projects
                    <Badge variant="outline">
                      {teamMember.currentProjects?.length ?? 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teamMember.currentProjects && teamMember.currentProjects.length > 0 ? (
                    <div className="space-y-3">
                      {teamMember.currentProjects.map((project: any) => (
                        <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{project.name}</h4>
                            <p className="text-sm text-gray-600">
                              Joined: {formatDate(project.joinedAt)}
                            </p>
                          </div>
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-4">
                      Not assigned to any projects
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignment Tab */}
            <TabsContent value="assignment" className="flex-1 overflow-auto space-y-6">
              {projectAssignment ? (
                <div className="space-y-6">
                  {/* Assignment Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Project Assignment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Join Date</Label>
                          <p className="text-sm">{formatDate(projectAssignment.joinedAt)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 mr-2">Status</Label>
                          <Badge className={getStatusColor(projectAssignment.status)} variant={projectAssignment.status === 'active' ? 'default' : 'secondary'}>
                            {formatStatusLabel(projectAssignment.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project Rates */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Project Rates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="projectHourlyRate">Hourly Rate Override</Label>
                            <Input
                              id="projectHourlyRate"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Leave empty for default"
                              value={editData.projectHourlyRate}
                              onChange={(e) => handleEditChange('projectHourlyRate', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="projectOvertimeRate">Overtime Rate Override</Label>
                            <Input
                              id="projectOvertimeRate"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Leave empty for default"
                              value={editData.projectOvertimeRate}
                              onChange={(e) => handleEditChange('projectOvertimeRate', e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Effective Hourly Rate</Label>
                            <p className="text-sm">
                              {formatRate(projectAssignment.hourlyRate || teamMember.hourlyRate)}
                              {projectAssignment.hourlyRate && (
                                <span className="text-xs text-blue-600 ml-2">(Project Override)</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Effective Overtime Rate</Label>
                            <p className="text-sm">
                              {formatRate(projectAssignment.overtimeRate || teamMember.overtimeRate)}
                              {projectAssignment.overtimeRate && (
                                <span className="text-xs text-blue-600 ml-2">(Project Override)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Assignment Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Assignment Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <Textarea
                          placeholder="Add assignment notes..."
                          value={editData.projectNotes}
                          onChange={(e) => handleEditChange('projectNotes', e.target.value)}
                          rows={4}
                        />
                      ) : (
                        <p className="text-sm text-gray-600">
                          {projectAssignment.notes || 'No notes added'}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  {isEditing && (
                    <div className="flex justify-between">
                      <Button
                        variant="destructive"
                        onClick={handleRemoveFromProject}
                        disabled={isUpdating || isRemoving}
                      >
                        {isRemoving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="mr-2 h-4 w-4" />
                        )}
                        {isRemoving ? 'Removing...' : 'Remove from Project'}
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This member is not assigned to this project.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="flex-1 overflow-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                      <p className="text-sm">{teamMember.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-sm">{teamMember.email}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Contact Name</Label>
                      <p className="text-sm">{teamMember.emergencyContactName || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Contact Phone</Label>
                      <p className="text-sm">{teamMember.emergencyContactPhone || 'Not provided'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}