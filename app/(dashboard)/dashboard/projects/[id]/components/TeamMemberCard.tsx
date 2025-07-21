"use client"

import React, { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Eye,
    MoreHorizontal,
    Phone,
    Mail,
    DollarSign,
    Calendar,
    User,
    Settings,
    UserMinus,
    AlertTriangle,
    Loader2
} from 'lucide-react'
import { useRemoveTeamMember } from '@/hooks/team-members/use-remove-team-member'

interface TeamMemberCardProps {
    member: any // Using your TeamMember type
    projectId: string
    onViewDetails: () => void
    onMemberUpdated: () => void
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
    member,
    projectId,
    onViewDetails,
    onMemberUpdated
}) => {

    const {
        isRemoving,
        removeError,
        removeSuccess,
        removeFromProject,
        clearError,
        reset
    } = useRemoveTeamMember()

    // ==============================================
    // COMPUTED VALUES
    // ==============================================

    // Get project-specific assignment info
    const projectAssignment = useMemo(() => {
        return member.currentProjects?.find((project: any) => project.id === projectId)
    }, [member.currentProjects, projectId])

    // Generate initials for avatar
    const initials = useMemo(() => {
        return `${member.firstName?.charAt(0) || ''}${member.lastName?.charAt(0) || ''}`.toUpperCase()
    }, [member.firstName, member.lastName])

    // Get member status color
    const getStatusColor = () => {
        if (!member.isActive) return 'bg-red-100 text-red-800'
        if (member.assignmentStatus === 'assigned') return 'bg-green-100 text-green-800'
        return 'bg-yellow-100 text-yellow-800'
    }

    // Get role display
    const getRoleDisplay = () => {
        switch (member.role) {
            case 'admin': return 'Administrator'
            case 'manager': return 'Project Manager'
            case 'supervisor': return 'Supervisor'
            case 'member': return 'Team Member'
            default: return member.role || 'Member'
        }
    }

    // Format rates
    const formatRate = (rate: number | null | undefined) => {
        if (!rate) return 'Not set'
        return `$${rate}/hr`
    }

    // Format date
    const formatDate = (date: string | null | undefined) => {
        if (!date) return 'Not set'
        return new Date(date).toLocaleDateString()
    }

    const handleRemoveFromProject = async () => {
        await removeFromProject({
            userId: member.id,
            projectId: projectId,
            reason: 'Removed from project by administrator',
            lastWorkingDay: new Date().toISOString()
        })

        setTimeout(() => {
            onMemberUpdated() // Refresh parent component
        }, 1000)
    }

    // ==============================================
    // RENDER
    // ==============================================
    return (
        <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            {/* Avatar */}
            <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                    {initials}
                </AvatarFallback>
            </Avatar>

            {/* Member Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 truncate">
                        {member.firstName} {member.lastName}
                    </h4>
                    <Badge variant="outline" className={getStatusColor()}>
                        {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {member.role && (
                        <Badge variant="secondary" className="text-xs">
                            {getRoleDisplay()}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                    {/* Email */}
                    <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-48">{member.email}</span>
                    </div>

                    {/* Phone (if available) */}
                    {member.phone && (
                        <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{member.phone}</span>
                        </div>
                    )}

                    {/* Trade Specialty (if available) */}
                    {member.tradeSpecialty && (
                        <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="capitalize">{member.tradeSpecialty}</span>
                        </div>
                    )}
                </div>

                {/* Project-specific info */}
                {projectAssignment && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {/* Join Date */}
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Joined: {formatDate(projectAssignment.joinedAt)}</span>
                        </div>

                        {/* Project Rate */}
                        {(projectAssignment.hourlyRate || member.hourlyRate) && (
                            <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span>Rate: {formatRate(projectAssignment.hourlyRate || member.hourlyRate)}</span>
                            </div>
                        )}

                        {/* Status */}
                        <Badge
                            variant="outline"
                            className={`text-xs ${projectAssignment.status === 'active'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}
                        >
                            {projectAssignment.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                {/* Quick View Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onViewDetails}
                >
                    <Eye className="h-4 w-4" />
                </Button>

                {/* More Actions Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onViewDetails}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onViewDetails}>
                            <Settings className="mr-2 h-4 w-4" />
                            Edit Assignment
                        </DropdownMenuItem>
                        {member.phone && (
                            <DropdownMenuItem asChild>
                                <a href={`tel:${member.phone}`}>
                                    <Phone className="mr-2 h-4 w-4" />
                                    Call
                                </a>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                            <a href={`mailto:${member.email}`}>
                                <Mail className="mr-2 h-4 w-4" />
                                Email
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600"
                            onClick={handleRemoveFromProject}
                            disabled={isRemoving}
                        >
                            {isRemoving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <UserMinus className="mr-2 h-4 w-4" />
                            )}
                            {isRemoving ? 'Removing...' : 'Remove from Project'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}