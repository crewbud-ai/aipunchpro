// ==============================================
// File: AssignTeamMemberDialog.tsx
// ==============================================

"use client"

import React, { useState, useMemo } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  UserPlus, 
  AlertCircle, 
  CheckCircle,
  Search,
  Users,
  DollarSign,
  Mail,
  Phone,
  User
} from 'lucide-react'
import { useAssignTeamMembers } from '@/hooks/team-members/use-assign-team-members'

interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  tradeSpecialty?: string
  hourlyRate?: number
  isActive: boolean
}

interface AssignTeamMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
  availableMembers: TeamMember[]
  onMemberAssigned: () => void
}

export const AssignTeamMemberDialog: React.FC<AssignTeamMemberDialogProps> = ({
  open,
  onOpenChange,
  projectId,
  projectName,
  availableMembers,
  onMemberAssigned
}) => {
  // ==============================================
  // HOOKS
  // ==============================================
  const {
    isAssigning,
    assignmentError,
    assignmentSuccess,
    successMessage,
    assignMembers,
    clearError,
    reset
  } = useAssignTeamMembers()

  // ==============================================
  // LOCAL STATE
  // ==============================================
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [assignmentNotes, setAssignmentNotes] = useState('')
  const [hourlyRateOverrides, setHourlyRateOverrides] = useState<Record<string, number>>({})

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  
  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return availableMembers
    
    const query = searchQuery.toLowerCase()
    return availableMembers.filter(member => 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.tradeSpecialty?.toLowerCase().includes(query)
    )
  }, [availableMembers, searchQuery])

  // Generate initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

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

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(filteredMembers.map(member => member.id))
    }
  }

  const handleRateOverride = (memberId: string, rate: number) => {
    setHourlyRateOverrides(prev => ({
      ...prev,
      [memberId]: rate
    }))
  }

  const handleAssign = async () => {
    if (selectedMembers.length === 0) return

    clearError()

    try {
      // Prepare assignment data for each selected member
      const assignments = selectedMembers.map(memberId => ({
        userId: memberId,
        projectId,
        hourlyRate: hourlyRateOverrides[memberId] || undefined,
        notes: assignmentNotes.trim() || undefined,
        status: 'active' as const
      }))

      await assignMembers(assignments)

      // Close dialog and refresh after showing success message
      setTimeout(() => {
        handleClose()
        onMemberAssigned()
      }, 1500)

    } catch (error) {
      console.error('Assignment error:', error)
      // Error is handled by the hook
    }
  }

  const handleClose = () => {
    // Reset all state
    setSelectedMembers([])
    setSearchQuery('')
    setAssignmentNotes('')
    setHourlyRateOverrides({})
    reset() // Reset hook state
    onOpenChange(false)
  }

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Team Members
          </DialogTitle>
          <DialogDescription>
            Assign existing team members to <strong>{projectName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-6">
          {/* Search and Select All */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or trade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Select All */}
            {filteredMembers.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedMembers.length === filteredMembers.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium">
                    Select All ({filteredMembers.length} members)
                  </Label>
                </div>
                <Badge variant="outline">
                  {selectedMembers.length} selected
                </Badge>
              </div>
            )}
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {availableMembers.length === 0 ? 'No available members' : 'No members found'}
                </h3>
                <p className="text-gray-600">
                  {availableMembers.length === 0 
                    ? 'All active team members are already assigned to this project.'
                    : 'Try adjusting your search criteria.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                      selectedMembers.includes(member.id) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => handleMemberToggle(member.id)}
                  >
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => handleMemberToggle(member.id)}
                    />

                    {/* Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                        {getInitials(member.firstName, member.lastName)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {member.firstName} {member.lastName}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {getRoleDisplay(member.role)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-48">{member.email}</span>
                        </div>

                        {member.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{member.phone}</span>
                          </div>
                        )}

                        {member.tradeSpecialty && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="capitalize">{member.tradeSpecialty}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rate Override */}
                    {selectedMembers.includes(member.id) && (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="text-sm text-gray-600">
                          <DollarSign className="h-3 w-3 inline mr-1" />
                          Default: ${member.hourlyRate || '0'}/hr
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Override rate"
                          className="w-24 h-8 text-sm"
                          value={hourlyRateOverrides[member.id] || ''}
                          onChange={(e) => handleRateOverride(member.id, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignment Notes */}
          {selectedMembers.length > 0 && (
            <>
              <Separator />
              <div>
                <Label htmlFor="notes">Assignment Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any special instructions or notes for this assignment..."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={selectedMembers.length === 0 || isAssigning || assignmentSuccess}
          >
            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {assignmentSuccess ? 'Assigned!' : `Assign ${selectedMembers.length} Member${selectedMembers.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}