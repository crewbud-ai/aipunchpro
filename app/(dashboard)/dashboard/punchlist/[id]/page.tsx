// ==============================================
// UPDATED: Punchlist Item Details Page with Multiple Assignments
// ==============================================

"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast" //  ADD: Toast instead of alert
import {
    ArrowLeft,
    Edit,
    Calendar,
    MapPin,
    User,
    Building,
    AlertTriangle,
    CheckCircle,
    Clock,
    Camera,
    Paperclip,
    Play,
    Pause,
    XCircle,
    Loader2,
    AlertCircle,
    FileText,
    Eye,
    Share,
    Download,
    MoreHorizontal,
    Target,
    Activity,
    Users,
    Mail,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    X,
    Wrench,
    Timer,
    Flag,
    Crown,
    Shield,
    UserCheck,
    UserPlus,
    ExternalLink
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Import hooks and types
import { usePunchlistItem } from "@/hooks/punchlist-items"
import { useProjects } from "@/hooks/projects"
import { useTeamMembers } from "@/hooks/team-members"
import {
    PUNCHLIST_STATUS_OPTIONS,
    PUNCHLIST_PRIORITY_OPTIONS,
    getPunchlistStatusColor,
    getPunchlistPriorityColor,
    getIssueTypeLabel,
    getTradeCategoryLabel,
    type PunchlistStatus
} from "@/types/punchlist-items"
import { withPermission } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { formatDate, formatDateTime, formatStatusLabel, getPunchListTeamRoleColor, getStatusColor } from "@/utils/format-functions"

export default function PunchlistItemPage() {
    const params = useParams()
    const router = useRouter()
    const punchlistItemId = params.id as string

    // ==============================================
    // LOCAL STATE
    // ==============================================
    const [activeTab, setActiveTab] = useState("overview")
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)



    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(false)

    // ==============================================
    // UTILITY FUNCTIONS
    // ==============================================



    const formatRoleLabel = (role: string) => {
        return role.charAt(0).toUpperCase() + role.slice(1)
    }

    // ==============================================
    // HOOKS
    // ==============================================
    const {
        punchlistItem,
        isLoading,
        isError,
        isNotFound,
        error,
        loadPunchlistItem,
        refreshPunchlistItem,
        updateStatus,
    } = usePunchlistItem(punchlistItemId)

    const { projects } = useProjects()
    const { teamMembers } = useTeamMembers()

    // ==============================================
    // EFFECTS
    // ==============================================
    useEffect(() => {
        if (punchlistItemId && !punchlistItem) {
            loadPunchlistItem(punchlistItemId)
        }
    }, [punchlistItemId, punchlistItem, loadPunchlistItem])

    // ==============================================
    // Computed values for multiple assignments
    // ==============================================
    const project = punchlistItem?.project || projects.find(p => p.id === punchlistItem?.projectId)

    // Handle multiple assignments properly
    const assignedMembers = useMemo(() => {
        if (!punchlistItem?.assignedMembers) {
            return []
        }

        // If it's already an array, use it
        if (Array.isArray(punchlistItem.assignedMembers)) {
            return punchlistItem.assignedMembers
        }

        // If it's a single assignment (backward compatibility)
        if (punchlistItem.assignedMember) {
            return [{
                id: punchlistItem.assignedMember.id,
                projectMemberId: punchlistItem.assignedMember.id,
                role: 'primary',
                assignedAt: punchlistItem.createdAt,
                assignedBy: punchlistItem.reportedBy,
                isActive: true,
                user: punchlistItem.assignedMember.user,
                hourlyRate: null
            }]
        }

        return []
    }, [punchlistItem])

    // Assignment analysis
    const assignmentStats = useMemo(() => {
        const primaryAssignee = assignedMembers.find(member => member.role === 'primary')
        const secondaryAssignees = assignedMembers.filter(member => member.role === 'secondary')
        const inspectors = assignedMembers.filter(member => member.role === 'inspector')
        const supervisors = assignedMembers.filter(member => member.role === 'supervisor')

        return {
            total: assignedMembers.length,
            primary: primaryAssignee,
            secondary: secondaryAssignees,
            inspectors,
            supervisors,
            hasInspector: inspectors.length > 0,
            hasSupervisor: supervisors.length > 0
        }
    }, [assignedMembers])

    const reporter = punchlistItem?.reporter

    const isOverdue = punchlistItem?.dueDate && new Date(punchlistItem.dueDate) < new Date()
    const canEdit = withPermission('punchlist', 'edit', true)
    const canUpdateStatus = withPermission('punchlist', 'edit', true)

    // Status actions based on current status
    const statusActions = useMemo(() => {
        if (!punchlistItem || !canUpdateStatus) return []

        const actions = []

        switch (punchlistItem.status) {
            case 'open':
                actions.push({
                    label: 'Start Work',
                    icon: Play,
                    action: () => handleStatusUpdate('in_progress'),
                    variant: 'default',
                    className: 'bg-blue-600 hover:bg-blue-700'
                })
                break
            case 'assigned':
                actions.push({
                    label: 'Start Work',
                    icon: Play,
                    action: () => handleStatusUpdate('in_progress'),
                    variant: 'default',
                    className: 'bg-blue-600 hover:bg-blue-700'
                })
                break
            case 'in_progress':
                actions.push({
                    label: 'Mark Complete',
                    icon: CheckCircle,
                    action: () => handleStatusUpdate('completed'),
                    variant: 'default',
                    className: 'bg-green-600 hover:bg-green-700'
                })
                actions.push({
                    label: 'Put On Hold',
                    icon: Pause,
                    action: () => handleStatusUpdate('on_hold'),
                    variant: 'outline'
                })
                break
            case 'pending_review':
                actions.push({
                    label: 'Approve',
                    icon: CheckCircle,
                    action: () => handleStatusUpdate('completed'),
                    variant: 'default',
                    className: 'bg-green-600 hover:bg-green-700'
                })
                actions.push({
                    label: 'Reject',
                    icon: XCircle,
                    action: () => handleStatusUpdate('rejected'),
                    variant: 'destructive'
                })
                break
            case 'on_hold':
                actions.push({
                    label: 'Resume Work',
                    icon: Play,
                    action: () => handleStatusUpdate('in_progress'),
                    variant: 'default',
                    className: 'bg-orange-600 hover:bg-orange-700'
                })
                break
            case 'completed':
                actions.push({
                    label: 'Reopen',
                    icon: Play,
                    action: () => handleStatusUpdate('in_progress'),
                    variant: 'outline'
                })
                break
            case 'rejected':
                actions.push({
                    label: 'Restart',
                    icon: Play,
                    action: () => handleStatusUpdate('assigned'),
                    variant: 'outline'
                })
                break
        }

        return actions
    }, [punchlistItem, canUpdateStatus])

    // Calculate progress percentage based on status
    const getProgressPercentage = () => {
        if (!punchlistItem) return 0
        switch (punchlistItem.status) {
            case 'open': return 0
            case 'assigned': return 10
            case 'in_progress': return 50
            case 'pending_review': return 90
            case 'completed': return 100
            case 'rejected': return 0
            case 'on_hold': return 25
            default: return 0
        }
    }

    // ==============================================
    // EVENT HANDLERS
    // ==============================================
    const handleStatusUpdate = async (newStatus: PunchlistStatus) => {
        if (punchlistItem) {
            try {
                setIsUpdatingStatus(true)
                await updateStatus({
                    id: punchlistItem.id,
                    status: newStatus,
                    resolutionNotes: `Status changed to ${newStatus}`,
                })

                //  SUCCESS TOAST instead of alert
                toast({
                    title: "Status Updated",
                    description: `Punchlist item status changed to ${PUNCHLIST_STATUS_OPTIONS.find(s => s.value === newStatus)?.label}.`,
                })

                refreshPunchlistItem()
            } catch (error) {
                console.error('Failed to update status:', error)

                //  ERROR TOAST instead of alert
                toast({
                    title: "Update Failed",
                    description: "Failed to update status. Please try again.",
                    variant: "destructive",
                })
            } finally {
                setIsUpdatingStatus(false)
            }
        }
    }

    const handleImageClick = (index: number) => {
        setSelectedImageIndex(index)
    }

    const handleImageNavigation = (direction: 'prev' | 'next') => {
        if (!punchlistItem?.photos || selectedImageIndex === null) return

        if (direction === 'prev') {
            setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : punchlistItem.photos.length - 1)
        } else {
            setSelectedImageIndex(selectedImageIndex < punchlistItem.photos.length - 1 ? selectedImageIndex + 1 : 0)
        }
    }


    const punchlistTabs = [
        { id: 'overview', label: 'Overview', icon: Eye },
        { id: 'photos', label: 'Photos & Files', icon: Camera },
        { id: 'team', label: `Team (${assignmentStats.total})`, icon: Users },
        { id: 'activity', label: 'Activity', icon: Activity }
    ]


    const checkScroll = () => {
        const container = scrollContainerRef.current
        if (!container) return

        const hasOverflow = container.scrollWidth > container.clientWidth
        setShowLeftArrow(hasOverflow && container.scrollLeft > 10)
        setShowRightArrow(
            hasOverflow && container.scrollLeft < container.scrollWidth - container.clientWidth - 10
        )
    }

    // Setup scroll listeners
    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        // Initial check
        setTimeout(checkScroll, 100)

        // Add listeners
        window.addEventListener('resize', checkScroll)

        return () => {
            window.removeEventListener('resize', checkScroll)
        }
    }, [punchlistTabs])

    // Scroll functions
    const scrollLeft = () => {
        scrollContainerRef.current?.scrollBy({ left: -150, behavior: 'smooth' })
    }

    const scrollRight = () => {
        scrollContainerRef.current?.scrollBy({ left: 150, behavior: 'smooth' })
    }

    // ==============================================
    // LOADING STATE
    // ==============================================
    if (isLoading) {
        return (
            <div className="space-y-4 xs:space-y-5 sm:space-y-6">
                <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-4">
                    <Skeleton className="h-9 w-9 xs:h-10 xs:w-10 shrink-0" />
                    <div className="flex-1 w-full min-w-0">
                        <Skeleton className="h-6 xs:h-7 sm:h-8 w-full xs:w-64 mb-1.5 xs:mb-2" />
                        <Skeleton className="h-4 xs:h-5 w-full xs:w-96" />
                    </div>
                    <Skeleton className="h-9 xs:h-10 w-full xs:w-24 shrink-0" />
                </div>

                <div className="grid gap-3 xs:gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="p-3 xs:p-4 sm:p-6">
                                <Skeleton className="h-4 xs:h-5 sm:h-6 w-24 xs:w-32" />
                            </CardHeader>
                            <CardContent className="p-3 xs:p-4 sm:p-6 pt-0">
                                <Skeleton className="h-6 xs:h-7 sm:h-8 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    // ==============================================
    // ERROR STATE
    // ==============================================
    if (isError || isNotFound) {
        return (
            <div className="space-y-4 xs:space-y-5 sm:space-y-6">
                <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-4">
                    <Button variant="outline" size="icon" asChild className="h-9 w-9 xs:h-10 xs:w-10 shrink-0">
                        <Link href="/dashboard/punchlist">
                            <ArrowLeft className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                        </Link>
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                            Punchlist Item Not Found
                        </h1>
                        <p className="text-xs xs:text-sm text-gray-600">
                            The punchlist item you're looking for could not be found.
                        </p>
                    </div>
                </div>

                <Alert variant="destructive" className="py-2 xs:py-3">
                    <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                    <AlertDescription className="text-xs xs:text-sm leading-snug">
                        {error || "This punchlist item doesn't exist or you don't have permission to view it."}
                    </AlertDescription>
                </Alert>

                <div className="flex flex-col xs:flex-row gap-2">
                    <Button asChild className="w-full xs:w-auto">
                        <Link href="/dashboard/punchlist">
                            Back to Punchlist
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    // ==============================================
    // MAIN RENDER
    // ==============================================
    if (!punchlistItem) return null

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start gap-2.5 xs:gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="flex items-start gap-2.5 xs:gap-3 sm:gap-4 min-w-0 flex-1">
                        <Link href="/dashboard/punchlist">
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 h-9 w-9 xs:h-10 xs:w-10"
                            >
                                <ArrowLeft className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                            </Button>
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 truncate">
                                {punchlistItem.title}
                            </h1>
                            <div className="flex items-center gap-1.5 xs:gap-2 mt-1 flex-wrap">
                                {project && (
                                    <div className="flex items-center gap-1.5 xs:gap-2 text-gray-600">
                                        <Building className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                                        <span className="text-xs xs:text-sm truncate">{project.name}</span>
                                    </div>
                                )}
                                <Badge className={cn("text-xs shrink-0", getPunchlistStatusColor(punchlistItem.status))}>
                                    {PUNCHLIST_STATUS_OPTIONS.find(s => s.value === punchlistItem.status)?.label || punchlistItem.status}
                                </Badge>
                                <Badge className={cn("text-xs shrink-0", getPunchlistPriorityColor(punchlistItem.priority))}>
                                    {PUNCHLIST_PRIORITY_OPTIONS.find(p => p.value === punchlistItem.priority)?.label || punchlistItem.priority}
                                </Badge>
                                {isOverdue && (
                                    <Badge variant="destructive" className="text-xs shrink-0">
                                        <Clock className="mr-0.5 xs:mr-1 h-2.5 w-2.5 xs:h-3 xs:w-3" />
                                        Overdue
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* <div className="flex-1 min-w-0 w-full sm:w-auto">

                    </div> */}

                    {/* Action Buttons - Desktop */}
                    <div className="hidden sm:flex items-center flex-wrap md:flex-nowrap gap-2 shrink-0">
                        {statusActions.map((action, index) => (
                            <Button
                                key={index}
                                variant={action.variant as any}
                                size="sm"
                                onClick={action.action}
                                disabled={isUpdatingStatus}
                                className={cn("h-9 text-xs", action.className)}
                            >
                                {isUpdatingStatus ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin shrink-0" />
                                ) : (
                                    <action.icon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                                )}
                                {action.label}
                            </Button>
                        ))}

                        {canEdit && (
                            <Button variant="outline" size="sm" asChild className="h-9 text-xs">
                                <Link href={`/dashboard/punchlist/${punchlistItem.id}/edit`}>
                                    <Edit className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                                    <span className="hidden lg:inline">Edit</span>
                                </Link>
                            </Button>
                        )}
                    </div>

                    {/* Action Buttons - Mobile */}
                    <div className="flex sm:hidden w-full gap-1">
                        {statusActions.map((action, index) => (
                            <Button
                                key={index}
                                variant={action.variant as any}
                                size="sm"
                                onClick={action.action}
                                disabled={isUpdatingStatus}
                                className={cn("h-9 text-xs", action.className)}
                            >
                                {isUpdatingStatus ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Play className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                {action.label}
                            </Button>
                        ))}
                        {canEdit && (
                            <Button variant="outline" size="sm" asChild className="flex-1 h-9 text-xs">
                                <Link href={`/dashboard/punchlist/${punchlistItem.id}/edit`}>
                                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 py-4 sm:py-6">
                    <Card>
                        <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2 px-4 xs:px-6 pt-4 xs:pt-6">
                            <CardTitle className="text-xs xs:text-sm font-medium">Progress</CardTitle>
                            <TrendingUp className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3 xs:p-4 sm:pt-0">
                            <div className="text-xl xs:text-2xl font-bold">{getProgressPercentage()}%</div>
                            <Progress value={getProgressPercentage()} className="mt-1.5 xs:mt-2 h-1.5 xs:h-2" />
                            <p className="text-xs text-muted-foreground mt-1.5 xs:mt-2 truncate">
                                {PUNCHLIST_STATUS_OPTIONS.find(s => s.value === punchlistItem.status)?.label}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2 px-4 xs:px-6 pt-4 xs:pt-6">
                            <CardTitle className="text-xs xs:text-sm font-medium">Priority</CardTitle>
                            <Flag className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3 xs:p-4 sm:pt-0">
                            <div className="text-xl xs:text-2xl font-bold capitalize truncate">{punchlistItem.priority}</div>
                            <p className="text-xs text-muted-foreground truncate">
                                {getIssueTypeLabel(punchlistItem.issueType)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2 px-4 xs:px-6 pt-4 xs:pt-6">
                            <CardTitle className="text-xs xs:text-sm font-medium">Time Estimate</CardTitle>
                            <Timer className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3 xs:p-4 sm:pt-0">
                            <div className="text-xl xs:text-2xl font-bold">
                                {punchlistItem.estimatedHours || 0}h
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                                {punchlistItem.actualHours ? `${punchlistItem.actualHours}h actual` : 'Not started'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0 pb-2 px-4 xs:px-6 pt-4 xs:pt-6">
                            <CardTitle className="text-xs xs:text-sm font-medium">Team</CardTitle>
                            <Users className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3 xs:p-4 sm:pt-0">
                            <div className="text-xl xs:text-2xl font-bold">
                                {assignmentStats.total}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                                {assignmentStats.total === 0 ? 'Unassigned' :
                                    assignmentStats.total === 1 ? 'member assigned' : 'members assigned'}
                            </p>
                            {assignmentStats.primary && (
                                <p className="text-xs text-orange-600 mt-0.5 xs:mt-1 truncate">
                                    Primary: {assignmentStats.primary.user?.firstName} {assignmentStats.primary.user?.lastName}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 xs:space-y-4">
                    {/* Mobile: Horizontal Scroll with Arrows */}
                    <div className="sm:hidden relative px-10">
                        <TabsList
                            ref={scrollContainerRef}
                            className={cn(
                                "flex w-full justify-start h-auto bg-transparent border-0 p-0",
                                "overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2 gap-2"
                            )}
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                            }}
                            onScroll={checkScroll}
                        >
                            {punchlistTabs.map((tab) => {
                                const IconComponent = tab.icon
                                return (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className={cn(
                                            "flex items-center justify-center gap-1.5 min-w-[120px] snap-start",
                                            "text-xs font-medium py-2 px-3 rounded-lg transition-all duration-200 shrink-0",
                                            // Default state
                                            "bg-white border border-gray-200",
                                            "text-gray-600 shadow-sm",
                                            "hover:border-gray-300",
                                            // Active state - Subtle orange
                                            "data-[state=active]:bg-orange-50 data-[state=active]:border-orange-500",
                                            "data-[state=active]:text-orange-700",
                                            "data-[state=active]:shadow-md"
                                        )}
                                    >
                                        <IconComponent className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{tab.label}</span>
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>

                        {/* Left Arrow - Only show if can scroll left */}
                        {showLeftArrow && (
                            <button
                                type="button"
                                onClick={scrollLeft}
                                className={cn(
                                    "absolute left-0 top-0 z-20",
                                    "bg-white border border-gray-300 rounded-full shadow-lg",
                                    "w-8 h-8 flex items-center justify-center",
                                    "hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all"
                                )}
                                aria-label="Scroll left"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-gray-700"
                                >
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                        )}

                        {/* Right Arrow - Only show if can scroll right */}
                        {showRightArrow && (
                            <button
                                type="button"
                                onClick={scrollRight}
                                className={cn(
                                    "absolute right-0 top-0 z-20",
                                    "bg-white border border-gray-300 rounded-full shadow-lg",
                                    "w-8 h-8 flex items-center justify-center",
                                    "hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all"
                                )}
                                aria-label="Scroll right"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-gray-700"
                                >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        )}

                        {/* Fade indicators on edges */}
                        <div className="absolute top-0 left-8 bottom-2 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
                        <div className="absolute top-0 right-8 bottom-2 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
                    </div>

                    {/* Desktop: Grid layout */}
                    <TabsList
                        className={cn(
                            "hidden sm:grid w-full h-auto bg-gray-50 border border-gray-200 shadow-sm",
                            "sm:grid-cols-4",
                            "gap-1.5 p-2 rounded-lg"
                        )}
                    >
                        {punchlistTabs.map((tab) => {
                            const IconComponent = tab.icon
                            return (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className={cn(
                                        "flex items-center justify-center gap-2",
                                        "text-sm font-medium py-2.5 px-3 rounded-md transition-all duration-200",
                                        // Default state
                                        "bg-white text-gray-600 border border-transparent",
                                        "hover:text-gray-900 hover:shadow-sm",
                                        // Active state - Subtle orange
                                        "data-[state=active]:bg-orange-50",
                                        "data-[state=active]:text-orange-700",
                                        "data-[state=active]:border-orange-500",
                                        "data-[state=active]:shadow-sm"
                                    )}
                                >
                                    <IconComponent className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{tab.label}</span>
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 xs:space-y-5 sm:space-y-6">
                        <div className="grid gap-4 xs:gap-5 sm:gap-6 grid-cols-1 md:grid-cols-3">

                            {/* Main Content Area */}
                            <div className="md:col-span-2 space-y-4 xs:space-y-5 sm:space-y-6">
                                {/* Issue Details */}
                                <Card>
                                    <CardHeader className="p-4 xs:p-5 sm:p-6">
                                        <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                            <AlertTriangle className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                            Issue Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 xs:space-y-4 p-4 xs:p-5 sm:p-6 pt-0">
                                        {punchlistItem.description && (
                                            <div>
                                                <h4 className="font-medium mb-1.5 xs:mb-2 text-sm xs:text-base">Description</h4>
                                                <p className="text-gray-600 text-xs xs:text-sm leading-relaxed">{punchlistItem.description}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                                            <div>
                                                <h4 className="font-medium mb-1 text-xs xs:text-sm">Issue Type</h4>
                                                <Badge variant="outline" className="text-xs">
                                                    {getIssueTypeLabel(punchlistItem.issueType)}
                                                </Badge>
                                            </div>
                                            {punchlistItem.tradeCategory && (
                                                <div>
                                                    <h4 className="font-medium mb-1 text-xs xs:text-sm">Trade Category</h4>
                                                    <Badge variant="outline" className="text-xs">
                                                        {getTradeCategoryLabel(punchlistItem.tradeCategory)}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        {(punchlistItem.location || punchlistItem.roomArea) && (
                                            <div>
                                                <h4 className="font-medium mb-1.5 xs:mb-2 text-sm xs:text-base">Location</h4>
                                                <div className="flex items-center gap-1.5 xs:gap-2 text-gray-600">
                                                    <MapPin className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                                                    <span className="text-xs xs:text-sm">
                                                        {punchlistItem.location}
                                                        {punchlistItem.roomArea && ` - ${punchlistItem.roomArea}`}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {punchlistItem.resolutionNotes && (
                                            <div>
                                                <h4 className="font-medium mb-1.5 xs:mb-2 text-sm xs:text-base">Resolution Notes</h4>
                                                <p className="text-gray-600 bg-gray-50 p-2.5 xs:p-3 rounded text-xs xs:text-sm leading-relaxed">
                                                    {punchlistItem.resolutionNotes}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Progress Tracking */}
                                <Card>
                                    <CardHeader className="p-4 xs:p-5 sm:p-6">
                                        <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                            <Target className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                            Progress Tracking
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 xs:space-y-4 p-4 xs:p-5 sm:p-6 pt-0">
                                        <div>
                                            <div className="flex justify-between text-xs xs:text-sm mb-1.5 xs:mb-2">
                                                <span>Completion</span>
                                                <span className="font-medium">{getProgressPercentage()}%</span>
                                            </div>
                                            <Progress value={getProgressPercentage()} className="h-1.5 xs:h-2" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 xs:gap-4 text-xs xs:text-sm">
                                            {punchlistItem.estimatedHours && (
                                                <div>
                                                    <p className="text-gray-600">Estimated Hours</p>
                                                    <p className="font-medium">{punchlistItem.estimatedHours} hrs</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-gray-600">Actual Hours</p>
                                                <p className="font-medium">{punchlistItem.actualHours || 0} hrs</p>
                                            </div>
                                        </div>

                                        {punchlistItem.requiresInspection && (
                                            <div className="p-2.5 xs:p-3 bg-yellow-50 border border-yellow-200 rounded">
                                                <div className="flex items-center gap-1.5 xs:gap-2">
                                                    <Eye className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-yellow-600 shrink-0" />
                                                    <span className="text-xs xs:text-sm font-medium text-yellow-800">
                                                        Requires Inspection
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-4 xs:space-y-5 sm:space-y-6">
                                {/* Schedule Info */}
                                <Card>
                                    <CardHeader className="p-4 xs:p-5 sm:p-6">
                                        <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                            <Calendar className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                            Timeline
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 xs:space-y-4 p-4 xs:p-5 sm:p-6 pt-0">
                                        <div>
                                            <p className="text-xs xs:text-sm text-gray-600 mb-0.5 xs:mb-1">Created</p>
                                            <p className="font-medium text-xs xs:text-sm">{formatDateTime(punchlistItem.createdAt)}</p>
                                        </div>

                                        {punchlistItem.dueDate && (
                                            <div>
                                                <p className="text-xs xs:text-sm text-gray-600 mb-0.5 xs:mb-1">Due Date</p>
                                                <p className={cn("font-medium text-xs xs:text-sm", isOverdue && 'text-red-600')}>
                                                    {formatDate(punchlistItem.dueDate)}
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-xs xs:text-sm text-gray-600 mb-0.5 xs:mb-1">Last Updated</p>
                                            <p className="font-medium text-xs xs:text-sm">{formatDateTime(punchlistItem.updatedAt)}</p>
                                        </div>

                                        {punchlistItem.completedAt && (
                                            <div>
                                                <p className="text-xs xs:text-sm text-gray-600 mb-0.5 xs:mb-1">Completed</p>
                                                <p className="font-medium text-xs xs:text-sm">{formatDateTime(punchlistItem.completedAt)}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Project Info */}
                                {project && (
                                    <Card>
                                        <CardHeader className="p-4 xs:p-5 sm:p-6">
                                            <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                                <Building className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                                Project
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                                            <div className="flex items-center gap-2 mb-1.5 xs:mb-2">
                                                <Link
                                                    href={`/dashboard/projects/${project.id}`}
                                                    className="text-orange-600 hover:text-orange-700 font-medium text-xs xs:text-sm"
                                                >
                                                    {project.name}
                                                </Link>
                                            </div>
                                            <Badge variant="outline" className={cn("text-xs", getStatusColor(project.status))}>
                                                {formatStatusLabel(project.status)}
                                            </Badge>
                                        </CardContent>
                                        <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                                            <div className="space-y-2.5 xs:space-y-3">
                                                <div key={project.id} className="flex items-center justify-between p-2.5 xs:p-3 bg-gray-50 rounded-lg gap-2">
                                                    <div className="flex gap-2">
                                                        <p className="text-xs xs:text-sm font-medium text-gray-900 truncate leading-snug">{project.name}</p>
                                                        <Badge variant="outline" className={cn("text-xs", getStatusColor(project.status))}>
                                                            {formatStatusLabel(project.status)}
                                                        </Badge>
                                                    </div>
                                                    <Link href={`/dashboard/projects/${project.id}`}>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 xs:h-8 xs:w-8 p-0">
                                                            <ExternalLink className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Quick Stats */}
                                <Card>
                                    <CardHeader className="p-4 xs:p-5 sm:p-6">
                                        <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                            <Target className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                            Quick Stats
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2.5 xs:space-y-3 p-4 xs:p-5 sm:p-6 pt-0">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 text-xs xs:text-sm">Status</span>
                                            <Badge className={cn("text-xs", getPunchlistStatusColor(punchlistItem.status))}>
                                                {PUNCHLIST_STATUS_OPTIONS.find(s => s.value === punchlistItem.status)?.label}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 text-xs xs:text-sm">Priority</span>
                                            <Badge className={cn("text-xs", getPunchlistPriorityColor(punchlistItem.priority))}>
                                                {PUNCHLIST_PRIORITY_OPTIONS.find(p => p.value === punchlistItem.priority)?.label}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 text-xs xs:text-sm">Progress</span>
                                            <span className="font-medium text-xs xs:text-sm">{getProgressPercentage()}%</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 text-xs xs:text-sm">Photos</span>
                                            <span className="font-medium text-xs xs:text-sm">{punchlistItem.photos?.length || 0}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="photos" className="space-y-4 xs:space-y-5 sm:space-y-6">
                        {/* Photos Section */}
                        {punchlistItem.photos && punchlistItem.photos.length > 0 ? (
                            <Card>
                                <CardHeader className="p-4 xs:p-5 sm:p-6">
                                    <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                        <Camera className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                        Photos ({punchlistItem.photos.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 xs:gap-4">
                                        {punchlistItem.photos.map((photoUrl, index) => (
                                            <div
                                                key={index}
                                                className="relative group cursor-pointer"
                                                onClick={() => handleImageClick(index)}
                                            >
                                                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                                                    <Image
                                                        src={photoUrl}
                                                        alt={`Photo ${index + 1}`}
                                                        width={200}
                                                        height={200}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                                                    <Eye className="h-5 w-5 xs:h-6 xs:w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="text-center py-8 xs:py-10 sm:py-12 p-4 xs:p-5 sm:p-6">
                                    <Camera className="h-10 w-10 xs:h-12 xs:w-12 text-gray-400 mx-auto mb-3 xs:mb-4" />
                                    <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-1.5 xs:mb-2">No photos available</h3>
                                    <p className="text-gray-600 text-xs xs:text-sm">Photos will appear here when uploaded.</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Attachments Section */}
                        {punchlistItem.attachments && punchlistItem.attachments.length > 0 ? (
                            <Card>
                                <CardHeader className="p-4 xs:p-5 sm:p-6">
                                    <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                        <Paperclip className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                        Attachments ({punchlistItem.attachments.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                                    <div className="space-y-1.5 xs:space-y-2">
                                        {punchlistItem.attachments.map((attachmentUrl, index) => {
                                            const fileName = attachmentUrl.split('/').pop() || `Attachment ${index + 1}`
                                            return (
                                                <div key={index} className="flex items-center justify-between p-2.5 xs:p-3 border rounded-lg hover:bg-gray-50">
                                                    <div className="flex items-center gap-1.5 xs:gap-2 min-w-0 flex-1">
                                                        <FileText className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                                                        <span className="text-xs xs:text-sm truncate">{fileName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 xs:gap-2 shrink-0">
                                                        <Button variant="ghost" size="sm" asChild className="h-7 w-7 xs:h-8 xs:w-8 p-0">
                                                            <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                                                                <Eye className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                                                            </a>
                                                        </Button>
                                                        <Button variant="ghost" size="sm" asChild className="h-7 w-7 xs:h-8 xs:w-8 p-0">
                                                            <a href={attachmentUrl} download>
                                                                <Download className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="text-center py-8 xs:py-10 sm:py-12 p-4 xs:p-5 sm:p-6">
                                    <Paperclip className="h-10 w-10 xs:h-12 xs:w-12 text-gray-400 mx-auto mb-3 xs:mb-4" />
                                    <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-1.5 xs:mb-2">No attachments</h3>
                                    <p className="text-gray-600 text-xs xs:text-sm">File attachments will appear here when uploaded.</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="team" className="space-y-4 xs:space-y-5 sm:space-y-6">
                        <Card>
                            <CardHeader className="p-4 xs:p-5 sm:p-6">
                                <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                    <Users className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                    Team Assignments ({assignmentStats.total})
                                </CardTitle>
                                <CardDescription className="text-xs xs:text-sm">
                                    Multiple team members can be assigned with different roles
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 xs:space-y-5 sm:space-y-6 p-4 xs:p-5 sm:p-6 pt-0">
                                {assignmentStats.total > 0 ? (
                                    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
                                        {/* Primary Assignee */}
                                        {assignmentStats.primary && (
                                            <div>
                                                <div className="flex items-center gap-1.5 xs:gap-2 mb-2 xs:mb-3">
                                                    <Crown className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-orange-600 shrink-0" />
                                                    <h4 className="font-medium text-gray-900 text-sm xs:text-base">Primary Assignee</h4>
                                                </div>
                                                <div className="flex items-center gap-3 xs:gap-4 p-3 xs:p-4 border-2 border-orange-200 bg-orange-50 rounded-lg">
                                                    <div className="w-10 h-10 xs:w-12 xs:h-12 bg-orange-200 rounded-full flex items-center justify-center shrink-0">
                                                        <Crown className="h-5 w-5 xs:h-6 xs:w-6 text-orange-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
                                                            <p className="font-medium text-gray-900 text-xs xs:text-sm truncate">
                                                                {assignmentStats.primary.user?.firstName} {assignmentStats.primary.user?.lastName}
                                                            </p>
                                                            <Badge className={cn("text-xs", getPunchListTeamRoleColor('primary'))}>
                                                                Primary
                                                            </Badge>
                                                            {assignmentStats.primary.user?.tradeSpecialty && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {assignmentStats.primary.user.tradeSpecialty}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs xs:text-sm text-gray-600">Lead responsible for completion</p>
                                                        {assignmentStats.primary.user?.email && (
                                                            <div className="flex items-center gap-1.5 xs:gap-2 mt-1.5 xs:mt-2">
                                                                <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                                                                <a
                                                                    href={`mailto:${assignmentStats.primary.user.email}`}
                                                                    className="text-xs xs:text-sm text-blue-600 hover:underline truncate"
                                                                >
                                                                    {assignmentStats.primary.user.email}
                                                                </a>
                                                            </div>
                                                        )}
                                                        {assignmentStats.primary.hourlyRate && (
                                                            <p className="text-xs text-gray-500 mt-0.5 xs:mt-1">
                                                                Rate: ${assignmentStats.primary.hourlyRate}/hr
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Secondary Assignees */}
                                        {assignmentStats.secondary.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-1.5 xs:gap-2 mb-2 xs:mb-3">
                                                    <User className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-blue-600 shrink-0" />
                                                    <h4 className="font-medium text-gray-900 text-sm xs:text-base">
                                                        Secondary Assignees ({assignmentStats.secondary.length})
                                                    </h4>
                                                </div>
                                                <div className="space-y-2 xs:space-y-3">
                                                    {assignmentStats.secondary.map((member, index) => (
                                                        <div key={member.id || index} className="flex items-center gap-3 xs:gap-4 p-3 xs:p-4 border border-blue-200 bg-blue-50 rounded-lg">
                                                            <div className="w-8 h-8 xs:w-10 xs:h-10 bg-blue-200 rounded-full flex items-center justify-center shrink-0">
                                                                <User className="h-4 w-4 xs:h-5 xs:w-5 text-blue-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
                                                                    <p className="font-medium text-gray-900 text-xs xs:text-sm truncate">
                                                                        {member.user?.firstName} {member.user?.lastName}
                                                                    </p>
                                                                    <Badge className={cn("text-xs", getPunchListTeamRoleColor('secondary'))}>
                                                                        Secondary
                                                                    </Badge>
                                                                    {member.user?.tradeSpecialty && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {member.user.tradeSpecialty}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs xs:text-sm text-gray-600">Supporting team member</p>
                                                                {member.user?.email && (
                                                                    <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 xs:mt-1">
                                                                        <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                                                                        <a
                                                                            href={`mailto:${member.user.email}`}
                                                                            className="text-xs xs:text-sm text-blue-600 hover:underline truncate"
                                                                        >
                                                                            {member.user.email}
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Inspectors */}
                                        {assignmentStats.inspectors.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-1.5 xs:gap-2 mb-2 xs:mb-3">
                                                    <Shield className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-purple-600 shrink-0" />
                                                    <h4 className="font-medium text-gray-900 text-sm xs:text-base">
                                                        Inspectors ({assignmentStats.inspectors.length})
                                                    </h4>
                                                </div>
                                                <div className="space-y-2 xs:space-y-3">
                                                    {assignmentStats.inspectors.map((member, index) => (
                                                        <div key={member.id || index} className="flex items-center gap-3 xs:gap-4 p-3 xs:p-4 border border-purple-200 bg-purple-50 rounded-lg">
                                                            <div className="w-8 h-8 xs:w-10 xs:h-10 bg-purple-200 rounded-full flex items-center justify-center shrink-0">
                                                                <Shield className="h-4 w-4 xs:h-5 xs:w-5 text-purple-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
                                                                    <p className="font-medium text-gray-900 text-xs xs:text-sm truncate">
                                                                        {member.user?.firstName} {member.user?.lastName}
                                                                    </p>
                                                                    <Badge className={cn("text-xs", getPunchListTeamRoleColor('inspector'))}>
                                                                        Inspector
                                                                    </Badge>
                                                                    {member.user?.tradeSpecialty && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {member.user.tradeSpecialty}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs xs:text-sm text-gray-600">Quality control and inspection</p>
                                                                {member.user?.email && (
                                                                    <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 xs:mt-1">
                                                                        <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                                                                        <a
                                                                            href={`mailto:${member.user.email}`}
                                                                            className="text-xs xs:text-sm text-blue-600 hover:underline truncate"
                                                                        >
                                                                            {member.user.email}
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Supervisors */}
                                        {assignmentStats.supervisors.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-1.5 xs:gap-2 mb-2 xs:mb-3">
                                                    <UserCheck className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-green-600 shrink-0" />
                                                    <h4 className="font-medium text-gray-900 text-sm xs:text-base">
                                                        Supervisors ({assignmentStats.supervisors.length})
                                                    </h4>
                                                </div>
                                                <div className="space-y-2 xs:space-y-3">
                                                    {assignmentStats.supervisors.map((member, index) => (
                                                        <div key={member.id || index} className="flex items-center gap-3 xs:gap-4 p-3 xs:p-4 border border-green-200 bg-green-50 rounded-lg">
                                                            <div className="w-8 h-8 xs:w-10 xs:h-10 bg-green-200 rounded-full flex items-center justify-center shrink-0">
                                                                <UserCheck className="h-4 w-4 xs:h-5 xs:w-5 text-green-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
                                                                    <p className="font-medium text-gray-900 text-xs xs:text-sm truncate">
                                                                        {member.user?.firstName} {member.user?.lastName}
                                                                    </p>
                                                                    <Badge className={cn("text-xs", getPunchListTeamRoleColor('supervisor'))}>
                                                                        Supervisor
                                                                    </Badge>
                                                                    {member.user?.tradeSpecialty && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {member.user.tradeSpecialty}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs xs:text-sm text-gray-600">Project oversight and management</p>
                                                                {member.user?.email && (
                                                                    <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 xs:mt-1">
                                                                        <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                                                                        <a
                                                                            href={`mailto:${member.user.email}`}
                                                                            className="text-xs xs:text-sm text-blue-600 hover:underline truncate"
                                                                        >
                                                                            {member.user.email}
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Assignment Summary */}
                                        <div className="pt-3 xs:pt-4 border-t">
                                            <h4 className="font-medium text-gray-900 mb-2 xs:mb-3 text-sm xs:text-base">Assignment Summary</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4 text-xs xs:text-sm">
                                                <div className="text-center p-2.5 xs:p-3 bg-orange-50 rounded-lg">
                                                    <Crown className="h-4 w-4 xs:h-5 xs:w-5 text-orange-600 mx-auto mb-0.5 xs:mb-1" />
                                                    <p className="font-medium text-orange-800">Primary</p>
                                                    <p className="text-orange-600">{assignmentStats.primary ? 1 : 0}</p>
                                                </div>
                                                <div className="text-center p-2.5 xs:p-3 bg-blue-50 rounded-lg">
                                                    <User className="h-4 w-4 xs:h-5 xs:w-5 text-blue-600 mx-auto mb-0.5 xs:mb-1" />
                                                    <p className="font-medium text-blue-800">Secondary</p>
                                                    <p className="text-blue-600">{assignmentStats.secondary.length}</p>
                                                </div>
                                                <div className="text-center p-2.5 xs:p-3 bg-purple-50 rounded-lg">
                                                    <Shield className="h-4 w-4 xs:h-5 xs:w-5 text-purple-600 mx-auto mb-0.5 xs:mb-1" />
                                                    <p className="font-medium text-purple-800">Inspectors</p>
                                                    <p className="text-purple-600">{assignmentStats.inspectors.length}</p>
                                                </div>
                                                <div className="text-center p-2.5 xs:p-3 bg-green-50 rounded-lg">
                                                    <UserCheck className="h-4 w-4 xs:h-5 xs:w-5 text-green-600 mx-auto mb-0.5 xs:mb-1" />
                                                    <p className="font-medium text-green-800">Supervisors</p>
                                                    <p className="text-green-600">{assignmentStats.supervisors.length}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-center py-6 xs:py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                            <UserPlus className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-1.5 xs:mb-2" />
                                            <p className="text-gray-500 font-medium text-xs xs:text-sm">No team members assigned</p>
                                            <p className="text-xs text-gray-400 mt-0.5 xs:mt-1">Multiple team members can be assigned with different roles</p>
                                            {canEdit && (
                                                <Button variant="outline" size="sm" className="mt-2 xs:mt-3 h-8 xs:h-9 text-xs" asChild>
                                                    <Link href={`/dashboard/punchlist/${punchlistItem.id}/edit`}>
                                                        <UserPlus className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
                                                        Assign Team Members
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Reporter Section */}
                                {reporter && (
                                    <div className="pt-4 xs:pt-5 sm:pt-6 border-t">
                                        <h4 className="font-medium text-gray-900 mb-2 xs:mb-3 text-sm xs:text-base">Reported By</h4>
                                        <div className="flex items-center gap-3 xs:gap-4 p-3 xs:p-4 bg-gray-50 rounded-lg">
                                            <div className="w-8 h-8 xs:w-10 xs:h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                                                <User className="h-4 w-4 xs:h-5 xs:w-5 text-gray-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-gray-900 text-xs xs:text-sm truncate">
                                                    {reporter.firstName} {reporter.lastName}
                                                </p>
                                                <p className="text-xs xs:text-sm text-gray-600">
                                                    {formatDateTime(punchlistItem.createdAt)}
                                                </p>
                                                {reporter.email && (
                                                    <div className="flex items-center gap-1.5 xs:gap-2 mt-0.5 xs:mt-1">
                                                        <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                                                        <a
                                                            href={`mailto:${reporter.email}`}
                                                            className="text-xs xs:text-sm text-blue-600 hover:underline truncate"
                                                        >
                                                            {reporter.email}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-4 xs:space-y-5 sm:space-y-6">
                        <Card>
                            <CardHeader className="p-4 xs:p-5 sm:p-6">
                                <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                                    <Activity className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                                    Activity Log
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                                <div className="space-y-3 xs:space-y-4">
                                    {/* Created Activity */}
                                    <div className="flex items-start gap-2.5 xs:gap-3 pb-3 xs:pb-4">
                                        <div className="w-7 h-7 xs:w-8 xs:h-8 bg-blue-100 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                                            <AlertTriangle className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
                                                <p className="font-medium text-xs xs:text-sm">Punchlist item created</p>
                                                <span className="text-xs text-gray-500">
                                                    {formatDateTime(punchlistItem.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-xs xs:text-sm text-gray-600">
                                                Issue reported by {reporter ? `${reporter.firstName} ${reporter.lastName}` : 'Unknown'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Assignment Activity */}
                                    {assignmentStats.total > 0 && (
                                        <div className="flex items-start gap-2.5 xs:gap-3 pb-3 xs:pb-4">
                                            <div className="w-7 h-7 xs:w-8 xs:h-8 bg-orange-100 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                                                <Users className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-orange-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
                                                    <p className="font-medium text-xs xs:text-sm">Team members assigned</p>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDateTime(punchlistItem.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="text-xs xs:text-sm text-gray-600 space-y-0.5 xs:space-y-1">
                                                    {assignmentStats.primary && (
                                                        <p>• Primary: {assignmentStats.primary.user?.firstName} {assignmentStats.primary.user?.lastName}</p>
                                                    )}
                                                    {assignmentStats.secondary.length > 0 && (
                                                        <p>• Secondary: {assignmentStats.secondary.length} member(s)</p>
                                                    )}
                                                    {assignmentStats.inspectors.length > 0 && (
                                                        <p>• Inspectors: {assignmentStats.inspectors.length} member(s)</p>
                                                    )}
                                                    {assignmentStats.supervisors.length > 0 && (
                                                        <p>• Supervisors: {assignmentStats.supervisors.length} member(s)</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status Changes */}
                                    {punchlistItem.status !== 'open' && (
                                        <div className="flex items-start gap-2.5 xs:gap-3 pb-3 xs:pb-4">
                                            <div className="w-7 h-7 xs:w-8 xs:h-8 bg-green-100 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                                                <CheckCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-green-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
                                                    <p className="font-medium text-xs xs:text-sm">Status updated</p>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDateTime(punchlistItem.updatedAt)}
                                                    </span>
                                                </div>
                                                <p className="text-xs xs:text-sm text-gray-600">
                                                    Status changed to {PUNCHLIST_STATUS_OPTIONS.find(s => s.value === punchlistItem.status)?.label}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Completion */}
                                    {punchlistItem.completedAt && (
                                        <div className="flex items-start gap-2.5 xs:gap-3 pb-3 xs:pb-4">
                                            <div className="w-7 h-7 xs:w-8 xs:h-8 bg-purple-100 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                                                <CheckCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-purple-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
                                                    <p className="font-medium text-xs xs:text-sm">Item completed</p>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDateTime(punchlistItem.completedAt)}
                                                    </span>
                                                </div>
                                                <p className="text-xs xs:text-sm text-gray-600">
                                                    Punchlist item marked as completed
                                                    {assignmentStats.primary && ` by ${assignmentStats.primary.user?.firstName} ${assignmentStats.primary.user?.lastName}`}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty State */}
                                    {punchlistItem.status === 'open' && !punchlistItem.completedAt && assignmentStats.total === 0 && (
                                        <div className="text-center py-6 xs:py-8 text-gray-500">
                                            <Clock className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 mx-auto mb-1.5 xs:mb-2 text-gray-400" />
                                            <p className="text-xs xs:text-sm">More activity will appear as work progresses</p>
                                            <p className="text-xs text-gray-400 mt-0.5 xs:mt-1">Assign team members to get started</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Image Modal */}
                {selectedImageIndex !== null && punchlistItem.photos && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                        <div className="relative max-w-5xl max-h-full w-full">
                            {/* Close Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 xs:top-4 right-2 xs:right-4 z-10 bg-white/20 hover:bg-white/30 text-white h-8 w-8 xs:h-10 xs:w-10"
                                onClick={() => setSelectedImageIndex(null)}
                            >
                                <X className="h-4 w-4 xs:h-5 xs:w-5" />
                            </Button>

                            {/* Navigation Buttons */}
                            {punchlistItem.photos.length > 1 && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute left-2 xs:left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white h-8 w-8 xs:h-10 xs:w-10"
                                        onClick={() => handleImageNavigation('prev')}
                                    >
                                        <ChevronLeft className="h-5 w-5 xs:h-6 xs:w-6" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 xs:right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white h-8 w-8 xs:h-10 xs:w-10"
                                        onClick={() => handleImageNavigation('next')}
                                    >
                                        <ChevronRight className="h-5 w-5 xs:h-6 xs:w-6" />
                                    </Button>
                                </>
                            )}

                            {/* Image */}
                            <div className="relative">
                                <Image
                                    src={punchlistItem.photos[selectedImageIndex]}
                                    alt={`Photo ${selectedImageIndex + 1}`}
                                    width={800}
                                    height={600}
                                    className="max-w-full max-h-[80vh] object-contain rounded-lg mx-auto"
                                />

                                {/* Image Counter */}
                                {punchlistItem.photos.length > 1 && (
                                    <div className="absolute bottom-2 xs:bottom-4 left-1/2 transform -translate-x-1/2 bg-white/20 text-white px-2.5 xs:px-3 py-1 rounded text-xs xs:text-sm">
                                        {selectedImageIndex + 1} of {punchlistItem.photos.length}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}