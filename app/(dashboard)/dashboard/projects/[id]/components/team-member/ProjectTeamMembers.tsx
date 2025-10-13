"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Plus,
  UserPlus,
  Mail,
  Phone,
  Clock,
  DollarSign,
  AlertCircle,
  Eye,
  Settings
} from 'lucide-react'
import { useTeamMembers } from '@/hooks/team-members'
import { TeamMemberCard } from '../team-member/TeamMemberCard'
import { AddTeamMemberDialog } from './AddTeamMemberDialog'
import { AssignTeamMemberDialog } from './AssignTeamMemberDialog'
import { TeamMemberDetailsDialog } from './TeamMemberDetailsDialog'

interface ProjectTeamMembersProps {
  projectId: string
  projectName: string
  projectStatus: string
  onMemberAdded?: (statusSuggestion?: any) => void
}

export const ProjectTeamMembers: React.FC<ProjectTeamMembersProps> = ({
  projectId,
  projectName,
  projectStatus,
  onMemberAdded
}) => {
  // ==============================================
  // HOOKS
  // ==============================================
  const {
    teamMembers,
    isLoading,
    hasError,
    error,
    refreshTeamMembers
  } = useTeamMembers()

  // ==============================================
  // LOCAL STATE
  // ==============================================
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  // ==============================================
  // COMPUTED VALUES
  // ==============================================

  // Filter team members assigned to this project
  const projectTeamMembers = useMemo(() => {
    return teamMembers.filter(member =>
      member.currentProjects?.some(project => project.id === projectId)
    )
  }, [teamMembers, projectId])

  // Get unassigned active team members for assignment
  const availableMembers = useMemo(() => {
    return teamMembers.filter(member =>
      member.isActive &&
      !member.currentProjects?.some(project => project.id === projectId)
    )
  }, [teamMembers, projectId])

  // Stats
  const stats = useMemo(() => {
    const total = projectTeamMembers.length
    const active = projectTeamMembers.filter(m => m.isActive).length
    const roles = projectTeamMembers.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return { total, active, roles }
  }, [projectTeamMembers])

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleMemberAdded = (statusSuggestion?: any) => {
    refreshTeamMembers()
    setShowAddDialog(false)

    // Pass the suggestion up to parent if callback exists
    if (onMemberAdded) {
      onMemberAdded(statusSuggestion)
    }
  }

  const handleMemberAssigned = (statusSuggestion?: any) => {
    refreshTeamMembers()
    setShowAssignDialog(false)

    // Pass the suggestion up to parent if callback exists
    if (onMemberAdded) {
      onMemberAdded(statusSuggestion)
    }
  }

  const handleMemberUpdated = () => {
    refreshTeamMembers()
  }

  const handleViewDetails = (memberId: string) => {
    setSelectedMemberId(memberId)
  }

  const closeDetailsDialog = () => {
    setSelectedMemberId(null)
  }

  // ==============================================
  // LOADING STATE
  // ==============================================
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                  <Skeleton className="h-2 sm:h-3 w-16 sm:w-24" />
                </div>
                <Skeleton className="h-5 w-12 sm:h-6 sm:w-16 flex-shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ==============================================
  // ERROR STATE
  // ==============================================
  if (hasError) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <Alert variant="destructive" className="text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Failed to load team members'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // ==============================================
  // MAIN RENDER
  // ==============================================
  return (
    <>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              <CardTitle className="text-base sm:text-lg">Team Members</CardTitle>
              <Badge variant="outline" className="ml-2 text-xs">
                {stats.total}
              </Badge>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {availableMembers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssignDialog(true)}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <UserPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Assign Member</span>
                  <span className="sm:hidden">Assign</span>
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setShowAddDialog(true)}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Add New Member</span>
                <span className="sm:hidden">Add New</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {/* Team Stats */}
          {stats.total > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-600">Total Members</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-green-700">{stats.active}</div>
                <div className="text-xs text-green-600">Active</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-blue-700">
                  {Object.keys(stats.roles).length}
                </div>
                <div className="text-xs text-blue-600">Different Roles</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-purple-700">
                  {projectTeamMembers.filter(m => m.currentProjects?.length === 1).length}
                </div>
                <div className="text-xs text-purple-600">Dedicated</div>
              </div>
            </div>
          )}

          {/* Team Members List */}
          {stats.total === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No team members assigned</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-4">
                Start building your team by adding members to this project.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto text-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Member
                </Button>
                {availableMembers.length > 0 && (
                  <Button variant="outline" onClick={() => setShowAssignDialog(true)} className="w-full sm:w-auto text-sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Existing Member
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {projectTeamMembers.map(member => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  projectId={projectId}
                  onViewDetails={() => handleViewDetails(member.id)}
                  onMemberUpdated={handleMemberUpdated}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddTeamMemberDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        projectId={projectId}
        projectName={projectName}
        onMemberAdded={handleMemberAdded}
      />

      <AssignTeamMemberDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        projectId={projectId}
        projectName={projectName}
        availableMembers={availableMembers}
        onMemberAssigned={handleMemberAssigned}
      />

      {selectedMemberId && (
        <TeamMemberDetailsDialog
          memberId={selectedMemberId}
          projectId={projectId}
          open={!!selectedMemberId}
          onOpenChange={closeDetailsDialog}
          onMemberUpdated={handleMemberUpdated}
        />
      )}
    </>
  )
}