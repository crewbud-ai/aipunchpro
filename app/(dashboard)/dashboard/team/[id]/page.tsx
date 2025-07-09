"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Shield,
  Briefcase,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Building2,
  Users,
  Settings,
  Trash2,
  UserX,
  UserCheck,
  Copy,
  ExternalLink,
  Activity,
  History,
  Target,
  Award,
  Bell
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// Import our hooks and types
import { useTeamMember } from "@/hooks/team-members"
import { TRADE_SPECIALTIES } from "@/types/team-members"
import { withPermission } from "@/lib/permissions"

interface TeamMemberDetailPageProps {}

export default function TeamMemberDetailPage({}: TeamMemberDetailPageProps) {
  const params = useParams()
  const router = useRouter()
  const teamMemberId = params.id as string

  // State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Load team member data
  const {
    teamMember,
    isLoading,
    hasError,
    isNotFound,
    error,
    fullName,
    displayRole,
    displayTrade,
    isActive,
    hasHourlyRate,
    hasOvertimeRate,
    hasPhone,
    hasEmergencyContact,
    activeProjectCount,
    assignmentStatus,
    displayContactInfo,
    displayRates,
    displayStatus,
    statusColor,
    refreshTeamMember,
    updateTeamMemberStatus,
    clearError,
  } = useTeamMember(teamMemberId)

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="animate-pulse">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-10 w-10 bg-gray-200 rounded-md"></div>
              <div className="space-y-2">
                <div className="h-8 w-64 bg-gray-200 rounded"></div>
                <div className="h-4 w-48 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (hasError || isNotFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard/team">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Member Not Found</h1>
            </div>
          </div>

          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error || "The requested team member could not be found or you don't have access to view it."}
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
  if (!teamMember) {
    return null
  }

  // Helper functions
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not set'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString))
  }

  const getStatusBadgeProps = () => {
    if (!isActive) {
      return { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' }
    }
    
    switch (assignmentStatus) {
      case 'assigned':
        return { variant: 'default' as const, className: 'bg-green-100 text-green-800' }
      case 'not_assigned':
        return { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' }
      default:
        return { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' }
    }
  }

  const getTradeSpecialtyLabel = (tradeSpecialty?: string) => {
    if (!tradeSpecialty) return 'General'
    const trade = TRADE_SPECIALTIES.find(t => t.value === tradeSpecialty)
    return trade?.label || tradeSpecialty
  }

  const handleStatusToggle = async () => {
    try {
      await updateTeamMemberStatus(!isActive, 
        isActive ? 'Deactivated from team detail page' : 'Reactivated from team detail page'
      )
      await refreshTeamMember()
    } catch (error) {
      console.error('Error updating team member status:', error)
    }
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(teamMember.email)
    // You could add a toast notification here
  }

  const handleCopyPhone = () => {
    if (teamMember.phone) {
      navigator.clipboard.writeText(teamMember.phone)
      // You could add a toast notification here
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/team">
                <Button variant="outline" size="icon" className="shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`/placeholder.svg?height=48&width=48`} />
                  <AvatarFallback className="text-lg font-semibold bg-orange-100 text-orange-700">
                    {getInitials(teamMember.firstName, teamMember.lastName)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge {...getStatusBadgeProps()}>
                      {displayStatus}
                    </Badge>
                    <Badge variant="outline" className="text-gray-600">
                      {displayRole}
                    </Badge>
                    {teamMember.tradeSpecialty && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        {getTradeSpecialtyLabel(teamMember.tradeSpecialty)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {withPermission('team', 'edit',
                <Button 
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleCopyEmail}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Email
                  </DropdownMenuItem>
                  
                  {hasPhone && (
                    <DropdownMenuItem onClick={handleCopyPhone}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Phone
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem asChild>
                    <Link href={`mailto:${teamMember.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Link>
                  </DropdownMenuItem>

                  {withPermission('team', 'edit', 
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleStatusToggle}>
                        {isActive ? (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    </>
                  )}

                  {withPermission('team', 'remove',
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Member
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email Address</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{teamMember.email}</span>
                      </div>
                    </div>
                    
                    {hasPhone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone Number</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{teamMember.phone}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Date</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{formatDate(teamMember.startDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Role</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 capitalize">{displayRole}</span>
                      </div>
                    </div>

                    {teamMember.jobTitle && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Job Title</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{teamMember.jobTitle}</span>
                        </div>
                      </div>
                    )}

                    {teamMember.tradeSpecialty && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Trade Specialty</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Award className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{getTradeSpecialtyLabel(teamMember.tradeSpecialty)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pay Rates */}
            {(hasHourlyRate || hasOvertimeRate) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pay Rates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {hasHourlyRate && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Regular Hourly Rate</label>
                        <div className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(teamMember.hourlyRate)}
                          <span className="text-sm font-normal text-gray-500 ml-1">/hour</span>
                        </div>
                      </div>
                    )}

                    {hasOvertimeRate && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Overtime Rate</label>
                        <div className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(teamMember.overtimeRate)}
                          <span className="text-sm font-normal text-gray-500 ml-1">/hour</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {hasHourlyRate && hasOvertimeRate && teamMember.hourlyRate && teamMember.overtimeRate && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Overtime Multiplier:</strong> {(teamMember.overtimeRate / teamMember.hourlyRate).toFixed(1)}x regular rate
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Emergency Contact */}
            {hasEmergencyContact && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamMember.emergencyContactName && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Contact Name</label>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{teamMember.emergencyContactName}</span>
                        </div>
                      </div>
                    )}

                    {teamMember.emergencyContactPhone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{teamMember.emergencyContactPhone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {teamMember.certifications && teamMember.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {/* {.map((cert, index) => (
                      <Badge key={index} variant="outline" className="text-blue-600 border-blue-200">
                        {cert}
                      </Badge>
                    ))} */}
                    {teamMember.certifications}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Active Projects</span>
                    <Badge variant="outline" className="font-semibold">
                      {activeProjectCount}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Assignment Status</span>
                    <Badge {...getStatusBadgeProps()}>
                      {assignmentStatus === 'assigned' ? 'Assigned' : 
                       assignmentStatus === 'not_assigned' ? 'Available' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Account Status</span>
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Member Since</span>
                    <span className="text-sm font-medium">
                      {formatDate(teamMember.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Projects */}
            {teamMember.currentProjects && teamMember.currentProjects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Current Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamMember.currentProjects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{project.name}</p>
                          <p className="text-xs text-gray-500">
                            Joined {formatDate(project.joinedAt)}
                          </p>
                        </div>
                        <Link href={`/dashboard/projects/${project.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`mailto:${teamMember.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Link>
                  </Button>
                  
                  {hasPhone && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href={`tel:${teamMember.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call Phone
                      </Link>
                    </Button>
                  )}

                  {withPermission('projects', 'view',
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href={`/dashboard/projects?teamMember=${teamMemberId}`}>
                        <Building2 className="h-4 w-4 mr-2" />
                        View Projects
                      </Link>
                    </Button>
                  )}

                  {withPermission('schedule', 'view',
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href={`/dashboard/schedule?teamMember=${teamMemberId}`}>
                        <Calendar className="h-4 w-4 mr-2" />
                        View Schedule
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Dialog Placeholder */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update {fullName}'s information.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">Edit form will be implemented here...</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog Placeholder */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Team Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {fullName}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">Delete confirmation will be implemented here...</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}