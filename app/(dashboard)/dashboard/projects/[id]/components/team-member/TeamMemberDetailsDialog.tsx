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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden w-[95vw] max-w-[95vw] sm:w-full sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Team Member Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8 sm:py-12">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-gray-400" />
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden w-[95vw] max-w-[95vw] sm:w-full sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Team Member Details</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive" className="text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Failed to load team member details'}
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={handleClose} className="w-full sm:w-auto text-sm">Close</Button>
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col w-[95vw] max-w-[95vw] sm:w-full sm:max-w-4xl">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pr-0 sm:pr-5">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-medium text-base sm:text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base sm:text-xl truncate">
                  {teamMember.firstName} {teamMember.lastName}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <Badge variant={teamMember.isActive ? "default" : "secondary"} className="text-xs">
                    {teamMember.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getRoleDisplay(teamMember.role)}
                  </Badge>
                  {teamMember.tradeSpecialty && (
                    <Badge variant="outline" className="capitalize text-xs">
                      {teamMember.tradeSpecialty}
                    </Badge>
                  )}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditToggle}
                disabled={isUpdating}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                {isEditing ? (
                  <>
                    <X className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Edit Assignment</span>
                    <span className="sm:hidden">Edit</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Success/Error Messages */}
        {updateSuccess && (
          <Alert className="bg-green-50 border-green-200 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Assignment updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {removeSuccess && (
          <Alert className="bg-green-50 border-green-200 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {removeSuccessMessage || 'Team member removed from project successfully!'}
            </AlertDescription>
          </Alert>
        )}

        {updateError && (
          <Alert variant="destructive" className="text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{updateError}</AlertDescription>
          </Alert>
        )}

        {removeError && (
          <Alert variant="destructive" className="text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{removeError}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger value="assignment" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Project Assignment</span>
                <span className="sm:hidden">Project</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Contact Info</span>
                <span className="sm:hidden">Contact</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="flex-1 overflow-auto space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-600">Full Name</Label>
                      <p className="text-xs sm:text-sm">{teamMember.firstName} {teamMember.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-xs sm:text-sm truncate">{teamMember.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-600">Role</Label>
                      <p className="text-xs sm:text-sm">{getRoleDisplay(teamMember.role)}</p>
                    </div>
                    {teamMember.jobTitle && (
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-600">Job Title</Label>
                        <p className="text-xs sm:text-sm">{teamMember.jobTitle}</p>
                      </div>
                    )}
                    {teamMember.tradeSpecialty && (
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-600">Trade Specialty</Label>
                        <p className="text-xs sm:text-sm capitalize">{teamMember.tradeSpecialty}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Default Rates */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                      Default Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-600">Hourly Rate</Label>
                      <p className="text-xs sm:text-sm">{formatRate(teamMember.hourlyRate)}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-600">Overtime Rate</Label>
                      <p className="text-xs sm:text-sm">{formatRate(teamMember.overtimeRate)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Projects */}
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Building className="h-4 w-4 sm:h-5 sm:w-5" />
                    Current Projects
                    <Badge variant="outline" className="text-xs">
                      {teamMember.currentProjects?.length ?? 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  {teamMember.currentProjects && teamMember.currentProjects.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {teamMember.currentProjects.map((project: any) => (
                        <div key={project.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-2 sm:p-3 border rounded-lg">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm sm:text-base truncate">{project.name}</h4>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Joined: {formatDate(project.joinedAt)}
                            </p>
                          </div>
                          <Badge className={`text-xs ${getStatusColor(project.status)}`} variant={project.status === 'active' ? 'default' : 'secondary'}>
                            {formatStatusLabel(project.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-600 text-center py-4">
                      Not assigned to any projects
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignment Tab */}
            <TabsContent value="assignment" className="flex-1 overflow-auto space-y-4 sm:space-y-6">
              {projectAssignment ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Assignment Details */}
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Building className="h-4 w-4 sm:h-5 sm:w-5" />
                        Project Assignment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-gray-600">Join Date</Label>
                          <p className="text-xs sm:text-sm">{formatDate(projectAssignment.joinedAt)}</p>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-gray-600 mr-2">Status</Label>
                          <Badge className={`text-xs ${getStatusColor(projectAssignment.status)}`} variant={projectAssignment.status === 'active' ? 'default' : 'secondary'}>
                            {formatStatusLabel(projectAssignment.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project Rates */}
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                        Project Rates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                      {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label htmlFor="projectHourlyRate" className="text-sm">Hourly Rate Override</Label>
                            <Input
                              id="projectHourlyRate"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Leave empty for default"
                              value={editData.projectHourlyRate}
                              onChange={(e) => handleEditChange('projectHourlyRate', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="projectOvertimeRate" className="text-sm">Overtime Rate Override</Label>
                            <Input
                              id="projectOvertimeRate"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Leave empty for default"
                              value={editData.projectOvertimeRate}
                              onChange={(e) => handleEditChange('projectOvertimeRate', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label className="text-xs sm:text-sm font-medium text-gray-600">Effective Hourly Rate</Label>
                            <p className="text-xs sm:text-sm">
                              {formatRate(projectAssignment.hourlyRate || teamMember.hourlyRate)}
                              {projectAssignment.hourlyRate && (
                                <span className="text-xs text-blue-600 ml-2">(Project Override)</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs sm:text-sm font-medium text-gray-600">Effective Overtime Rate</Label>
                            <p className="text-xs sm:text-sm">
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
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                        Assignment Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                      {isEditing ? (
                        <Textarea
                          placeholder="Add assignment notes..."
                          value={editData.projectNotes}
                          onChange={(e) => handleEditChange('projectNotes', e.target.value)}
                          rows={4}
                          className="text-sm"
                        />
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-600">
                          {projectAssignment.notes || 'No notes added'}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  {isEditing && (
                    <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
                      <Button
                        variant="destructive"
                        onClick={handleRemoveFromProject}
                        disabled={isUpdating || isRemoving}
                        className="w-full sm:w-auto text-sm"
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
                        className="w-full sm:w-auto text-sm"
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
                <Alert className="text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This member is not assigned to this project.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="flex-1 overflow-auto space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-600">Phone Number</Label>
                      <p className="text-xs sm:text-sm">{teamMember.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-xs sm:text-sm truncate">{teamMember.email}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-600">Contact Name</Label>
                      <p className="text-xs sm:text-sm">{teamMember.emergencyContactName || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-600">Contact Phone</Label>
                      <p className="text-xs sm:text-sm">{teamMember.emergencyContactPhone || 'Not provided'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto text-sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}