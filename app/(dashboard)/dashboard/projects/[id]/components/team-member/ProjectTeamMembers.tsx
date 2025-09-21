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

  const handleMemberAssigned = () => {
    refreshTeamMembers()
    setShowAssignDialog(false)
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
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
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Team Members</CardTitle>
              <Badge variant="outline" className="ml-2">
                {stats.total}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {availableMembers.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAssignDialog(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Member
                </Button>
              )}
              <Button 
                size="sm"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Member
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Team Stats */}
          {stats.total > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-600">Total Members</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{stats.active}</div>
                <div className="text-xs text-green-600">Active</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {Object.keys(stats.roles).length}
                </div>
                <div className="text-xs text-blue-600">Different Roles</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">
                  {projectTeamMembers.filter(m => m.currentProjects?.length === 1).length}
                </div>
                <div className="text-xs text-purple-600">Dedicated</div>
              </div>
            </div>
          )}

          {/* Team Members List */}
          {stats.total === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members assigned</h3>
              <p className="text-gray-600 mb-4">
                Start building your team by adding members to this project.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Member
                </Button>
                {availableMembers.length > 0 && (
                  <Button variant="outline" onClick={() => setShowAssignDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Existing Member
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
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