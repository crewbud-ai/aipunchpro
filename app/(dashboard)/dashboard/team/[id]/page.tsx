"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
    DialogFooter,
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
    Bell,
    Loader2
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// Import our hooks and types
import { useTeamMember } from "@/hooks/team-members"
import { useDeleteTeamMember } from "@/hooks/team-members"
import { TRADE_SPECIALTIES } from "@/types/team-members"
import { withPermission } from "@/lib/permissions"
import { formatCurrency, formatDate } from "@/utils/format-functions"

interface TeamMemberDetailPageProps { }

export default function TeamMemberDetailPage({ }: TeamMemberDetailPageProps) {
    const params = useParams()
    const router = useRouter()
    const teamMemberId = params.id as string

    // State
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

    // Delete functionality
    const {
        isDeleting,
        error: deleteError,
        hasError: hasDeleteError,
        isSuccess: isDeleteSuccess,
        deleteTeamMember,
        clearError: clearDeleteError,
    } = useDeleteTeamMember()

    // Handle delete confirmation
    const handleDeleteClick = () => {
        if (teamMember) {
            setIsDeleteDialogOpen(true)
        }
    }

    const handleConfirmDelete = async () => {
        if (teamMember) {
            // Call deleteTeamMember directly with the ID
            await deleteTeamMember(teamMember.id)
        }
    }

    const handleCancelDelete = () => {
        setIsDeleteDialogOpen(false)
        clearDeleteError()
    }

    // Close delete dialog on success
    useEffect(() => {
        if (isDeleteSuccess) {
            setIsDeleteDialogOpen(false)
            // The hook will automatically redirect to /dashboard/team
        }
    }, [isDeleteSuccess])

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
            <div className="mx-auto max-w-5xl">
                {/* Delete Success Message - Mobile Responsive */}
                {isDeleteSuccess && (
                    <div className="mb-4 xs:mb-5 sm:mb-6">
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 xs:h-5 xs:w-5 text-green-600" />
                            <AlertDescription className="text-green-800 text-sm xs:text-base leading-snug xs:leading-normal">
                                Team member deleted successfully! Redirecting to team list...
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {/* Header - Mobile Responsive */}
                {/* <div className="mb-6 xs:mb-7 sm:mb-8"> */}
                <div className="flex flex-col sm:flex-row xs:items-start xs:justify-between gap-4 xs:gap-5 sm:gap-6">
                    {/* Left Side - Profile Info */}
                    <div className="flex items-start gap-2.5 xs:gap-3 sm:gap-4 min-w-0 flex-1">
                        <Link href="/dashboard/team">
                            <Button variant="outline" size="icon" className="shrink-0 h-9 w-9 xs:h-10 xs:w-10">
                                <ArrowLeft className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                            </Button>
                        </Link>

                        <div className="flex items-start gap-2.5 xs:gap-3 sm:gap-4 min-w-0 flex-1">
                            <Avatar className="h-10 w-10 xs:h-12 xs:w-12 shrink-0">
                                <AvatarImage src={`/placeholder.svg?height=48&width=48`} />
                                <AvatarFallback className="text-base xs:text-lg font-semibold bg-orange-100 text-orange-700">
                                    {getInitials(teamMember.firstName, teamMember.lastName)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                                <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 truncate leading-tight">{fullName}</h1>
                                <div className="flex items-center gap-1.5 xs:gap-2 mt-1 xs:mt-1.5 flex-wrap">
                                    <Badge {...getStatusBadgeProps()} className="text-xs">
                                        {displayStatus}
                                    </Badge>
                                    <Badge variant="outline" className="text-gray-600 text-xs">
                                        {displayRole}
                                    </Badge>
                                    {teamMember.tradeSpecialty && (
                                        <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs">
                                            {getTradeSpecialtyLabel(teamMember.tradeSpecialty)}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Actions - Mobile Responsive */}
                    <div className="flex items-center gap-1.5 xs:gap-2 self-end xs:self-auto sm:w-auto w-full">
                        {withPermission('team', 'edit',
                            <Link href={`/dashboard/team/${teamMemberId}/edit`} className="flex-1 xs:flex-initial w-auto sm:w-full">
                                <Button
                                    variant="outline"
                                    className="w-full xs:w-auto h-9 xs:h-10 text-sm xs:text-base"
                                >
                                    <Edit className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                                    <span className="hidden xs:inline">Edit</span>
                                    <span className="xs:hidden">Edit</span>
                                </Button>
                            </Link>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 xs:h-10 xs:w-10">
                                    <MoreVertical className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 xs:w-48">
                                <DropdownMenuLabel className="text-xs xs:text-sm">Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem className="cursor-pointer text-xs xs:text-sm" onClick={handleCopyEmail}>
                                    <Copy className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-2" />
                                    Copy Email
                                </DropdownMenuItem>

                                {hasPhone && (
                                    <DropdownMenuItem className="cursor-pointer text-xs xs:text-sm" onClick={handleCopyPhone}>
                                        <Copy className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-2" />
                                        Copy Phone
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuItem className="cursor-pointer text-xs xs:text-sm" asChild>
                                    <Link href={`mailto:${teamMember.email}`}>
                                        <Mail className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-2" />
                                        Send Email
                                    </Link>
                                </DropdownMenuItem>

                                {withPermission('team', 'edit',
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="cursor-pointer text-xs xs:text-sm" onClick={handleStatusToggle}>
                                            {isActive ? (
                                                <>
                                                    <UserX className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-2" />
                                                    Deactivate
                                                </>
                                            ) : (
                                                <>
                                                    <UserCheck className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-2" />
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
                                            className="text-red-600 hover:text-red-700 cursor-pointer text-xs xs:text-sm"
                                            onClick={handleDeleteClick}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-2" />
                                            Delete Member
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {/* </div> */}

                {/* Main Content Grid - Mobile Responsive */}
                <div className="grid gap-4 xs:gap-5 sm:gap-6 lg:grid-cols-3 py-4 sm:py-6">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-4 xs:space-y-5 sm:space-y-6">
                        {/* Personal Information - Mobile Responsive */}
                        <Card>
                            <CardHeader className="p-4 xs:p-5 sm:p-6">
                                <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                    <User className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                    Personal Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                                <div className="grid gap-4 xs:gap-5 sm:gap-6 md:grid-cols-2">
                                    <div className="space-y-3 xs:space-y-4">
                                        <div>
                                            <label className="text-xs xs:text-sm font-medium text-gray-500">Email Address</label>
                                            <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 xs:mt-1">
                                                <Mail className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                                                <span className="text-sm xs:text-base text-gray-900 truncate">{teamMember.email}</span>
                                            </div>
                                        </div>

                                        {hasPhone && (
                                            <div>
                                                <label className="text-xs xs:text-sm font-medium text-gray-500">Phone Number</label>
                                                <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 xs:mt-1">
                                                    <Phone className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                                                    <span className="text-sm xs:text-base text-gray-900">{teamMember.phone}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-xs xs:text-sm font-medium text-gray-500">Start Date</label>
                                            <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 xs:mt-1">
                                                <Calendar className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                                                <span className="text-sm xs:text-base text-gray-900">{formatDate(teamMember.startDate)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 xs:space-y-4">
                                        <div>
                                            <label className="text-xs xs:text-sm font-medium text-gray-500">Role</label>
                                            <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 xs:mt-1">
                                                <Shield className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                                                <span className="text-sm xs:text-base text-gray-900 capitalize">{displayRole}</span>
                                            </div>
                                        </div>

                                        {teamMember.jobTitle && (
                                            <div>
                                                <label className="text-xs xs:text-sm font-medium text-gray-500">Job Title</label>
                                                <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 xs:mt-1">
                                                    <Briefcase className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                                                    <span className="text-sm xs:text-base text-gray-900">{teamMember.jobTitle}</span>
                                                </div>
                                            </div>
                                        )}

                                        {teamMember.tradeSpecialty && (
                                            <div>
                                                <label className="text-xs xs:text-sm font-medium text-gray-500">Trade Specialty</label>
                                                <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 xs:mt-1">
                                                    <Award className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                                                    <span className="text-sm xs:text-base text-gray-900">{getTradeSpecialtyLabel(teamMember.tradeSpecialty)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pay Rates - Mobile Responsive */}
                        {(hasHourlyRate || hasOvertimeRate) && (
                            <Card>
                                <CardHeader className="p-4 xs:p-5 sm:p-6">
                                    <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                        <DollarSign className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                        Pay Rates
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                                    <div className="grid gap-3 xs:gap-4 md:grid-cols-2">
                                        {hasHourlyRate && (
                                            <div>
                                                <label className="text-xs xs:text-sm font-medium text-gray-500">Regular Hourly Rate</label>
                                                <div className="text-xl xs:text-2xl font-bold text-gray-900 mt-0.5 xs:mt-1">
                                                    {formatCurrency(teamMember.hourlyRate)}
                                                    <span className="text-xs xs:text-sm font-normal text-gray-500 ml-1">/hour</span>
                                                </div>
                                            </div>
                                        )}

                                        {hasOvertimeRate && (
                                            <div>
                                                <label className="text-xs xs:text-sm font-medium text-gray-500">Overtime Rate</label>
                                                <div className="text-xl xs:text-2xl font-bold text-gray-900 mt-0.5 xs:mt-1">
                                                    {formatCurrency(teamMember.overtimeRate)}
                                                    <span className="text-xs xs:text-sm font-normal text-gray-500 ml-1">/hour</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {hasHourlyRate && hasOvertimeRate && teamMember.hourlyRate && teamMember.overtimeRate && (
                                        <div className="mt-3 xs:mt-4 p-2.5 xs:p-3 bg-blue-50 rounded-lg">
                                            <p className="text-xs xs:text-sm text-blue-700 leading-snug xs:leading-normal">
                                                <strong>Overtime Multiplier:</strong> {(teamMember.overtimeRate / teamMember.hourlyRate).toFixed(1)}x regular rate
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Emergency Contact - Mobile Responsive */}
                        {hasEmergencyContact && (
                            <Card>
                                <CardHeader className="p-4 xs:p-5 sm:p-6">
                                    <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                        <Bell className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                        Emergency Contact
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                                    <div className="space-y-2.5 xs:space-y-3">
                                        {teamMember.emergencyContactName && (
                                            <div>
                                                <label className="text-xs xs:text-sm font-medium text-gray-500">Contact Name</label>
                                                <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 xs:mt-1">
                                                    <User className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                                                    <span className="text-sm xs:text-base text-gray-900">{teamMember.emergencyContactName}</span>
                                                </div>
                                            </div>
                                        )}

                                        {teamMember.emergencyContactPhone && (
                                            <div>
                                                <label className="text-xs xs:text-sm font-medium text-gray-500">Contact Phone</label>
                                                <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 xs:mt-1">
                                                    <Phone className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                                                    <span className="text-sm xs:text-base text-gray-900">{teamMember.emergencyContactPhone}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Certifications - Mobile Responsive */}
                        {teamMember.certifications && teamMember.certifications.length > 0 && (
                            <Card>
                                <CardHeader className="p-4 xs:p-5 sm:p-6">
                                    <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                        <Award className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                        Certifications
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                                    <div className="flex flex-wrap gap-1.5 xs:gap-2">
                                        {teamMember.certifications}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Sidebar - Mobile Responsive */}
                    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
                        {/* Quick Stats - Mobile Responsive */}
                        <Card>
                            <CardHeader className="p-4 xs:p-5 sm:p-6">
                                <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                    <Activity className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                    Quick Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                                <div className="space-y-3 xs:space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs xs:text-sm text-gray-500">Active Projects</span>
                                        <Badge variant="outline" className="font-semibold text-xs">
                                            {activeProjectCount}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs xs:text-sm text-gray-500">Assignment Status</span>
                                        <Badge {...getStatusBadgeProps()} className="text-xs">
                                            {assignmentStatus === 'assigned' ? 'Assigned' :
                                                assignmentStatus === 'not_assigned' ? 'Available' : 'Inactive'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs xs:text-sm text-gray-500">Account Status</span>
                                        <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                                            {isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs xs:text-sm text-gray-500">Member Since</span>
                                        <span className="text-xs xs:text-sm font-medium">
                                            {formatDate(teamMember.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Current Projects - Mobile Responsive */}
                        {teamMember.currentProjects && teamMember.currentProjects.length > 0 && (
                            <Card>
                                <CardHeader className="p-4 xs:p-5 sm:p-6">
                                    <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                        <Building2 className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                        Current Projects
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                                    <div className="space-y-2.5 xs:space-y-3">
                                        {teamMember.currentProjects.map((project) => (
                                            <div key={project.id} className="flex items-center justify-between p-2.5 xs:p-3 bg-gray-50 rounded-lg gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs xs:text-sm font-medium text-gray-900 truncate leading-snug">{project.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Joined {formatDate(project.joinedAt)}
                                                    </p>
                                                </div>
                                                <Link href={`/dashboard/projects/${project.id}`}>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 xs:h-8 xs:w-8 p-0">
                                                        <ExternalLink className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Actions - Mobile Responsive */}
                        <Card>
                            <CardHeader className="p-4 xs:p-5 sm:p-6">
                                <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                    <Target className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                                <div className="space-y-1.5 xs:space-y-2">
                                    <Button variant="outline" className="w-full justify-start h-9 xs:h-10 text-xs xs:text-sm" asChild>
                                        <Link href={`mailto:${teamMember.email}`}>
                                            <Mail className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                                            Send Email
                                        </Link>
                                    </Button>

                                    {hasPhone && (
                                        <Button variant="outline" className="w-full justify-start h-9 xs:h-10 text-xs xs:text-sm" asChild>
                                            <Link href={`tel:${teamMember.phone}`}>
                                                <Phone className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                                                Call Phone
                                            </Link>
                                        </Button>
                                    )}

                                    {withPermission('projects', 'view',
                                        <Button variant="outline" className="w-full justify-start h-9 xs:h-10 text-xs xs:text-sm" asChild>
                                            <Link href={`/dashboard/projects?teamMember=${teamMemberId}`}>
                                                <Building2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                                                View Projects
                                            </Link>
                                        </Button>
                                    )}

                                    {withPermission('schedule', 'view',
                                        <Button variant="outline" className="w-full justify-start h-9 xs:h-10 text-xs xs:text-sm" asChild>
                                            <Link href={`/dashboard/schedule?teamMember=${teamMemberId}`}>
                                                <Calendar className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                                                View Schedule
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Delete Confirmation Dialog - Mobile Responsive */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-[425px] max-w-[calc(100vw-2rem)]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                <AlertCircle className="h-4 w-4 xs:h-5 xs:w-5 text-red-500 shrink-0" />
                                Delete Team Member
                            </DialogTitle>
                            <DialogDescription className="text-sm xs:text-base leading-snug xs:leading-normal">
                                Are you sure you want to delete <strong>{fullName}</strong>? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Show delete error if any */}
                        {hasDeleteError && (
                            <Alert className="border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800 text-sm xs:text-base leading-snug xs:leading-normal">
                                    {deleteError || 'Failed to delete team member. Please try again.'}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="py-3 xs:py-4">
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 xs:p-4">
                                <div className="flex">
                                    <AlertCircle className="h-4 w-4 xs:h-5 xs:w-5 text-red-400 mr-2 xs:mr-3 mt-0.5 shrink-0" />
                                    <div className="text-xs xs:text-sm">
                                        <h4 className="font-medium text-red-800 mb-1">This will permanently:</h4>
                                        <ul className="text-red-700 space-y-0.5 xs:space-y-1 leading-snug">
                                            <li>• Remove {fullName} from all projects</li>
                                            <li>• Delete all their time tracking records</li>
                                            <li>• Remove their account access</li>
                                            <li>• Archive their profile data</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 flex-col xs:flex-row">
                            <Button
                                variant="outline"
                                onClick={handleCancelDelete}
                                disabled={isDeleting}
                                className="w-full xs:w-auto h-9 xs:h-10 text-sm xs:text-base"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="w-full xs:w-auto h-9 xs:h-10 text-sm xs:text-base"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                                        Delete Member
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}