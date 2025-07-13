// ==============================================
// app/(dashboard)/dashboard/punchlist/[id]/page.tsx - Comprehensive Punchlist Item Details Page
// ==============================================

"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
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
    Phone,
    Mail,
    TrendingUp,
    Settings,
    ChevronLeft,
    ChevronRight,
    X,
    Wrench,
    Timer,
    Flag
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
    ISSUE_TYPE_OPTIONS,
    TRADE_CATEGORY_OPTIONS,
    getPunchlistStatusColor,
    getPunchlistPriorityColor,
    getIssueTypeLabel,
    getTradeCategoryLabel,
    type PunchlistStatus
} from "@/types/punchlist-items"
import { withPermission } from "@/lib/permissions"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

    // ==============================================
    // UTILITY FUNCTIONS
    // ==============================================
    const formatDate = (dateString: string) => {
        if (!dateString) return "Not set"
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatDateTime = (dateString: string) => {
        if (!dateString) return "Not set"
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
    }

    const formatCurrency = (amount?: number) => {
        if (!amount) return "$0"
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
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
    // COMPUTED VALUES
    // ==============================================
    const project = punchlistItem?.project || projects.find(p => p.id === punchlistItem?.projectId)
    
    // Handle both current single assignment and future multiple assignments
    const assignedMember = punchlistItem?.assignedMembers
    
    // Ensure assignedMembers is always an array
    const assignedMembers = React.useMemo(() => {
        if (punchlistItem?.assignedMembers && Array.isArray(punchlistItem.assignedMembers)) {
            return punchlistItem.assignedMembers
        } else if (assignedMember) {
            return [assignedMember]
        } else {
            return []
        }
    }, [punchlistItem?.assignedMembers, assignedMember])
    
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
                refreshPunchlistItem()
            } catch (error) {
                console.error('Failed to update status:', error)
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

    // ==============================================
    // LOADING STATE
    // ==============================================
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div className="flex-1">
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                </div>
                
                <div className="grid gap-6 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-full" />
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
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard/punchlist">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Punchlist Item Not Found</h1>
                        <p className="text-gray-600">The punchlist item you're looking for could not be found.</p>
                    </div>
                </div>
                
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error || "This punchlist item doesn't exist or you don't have permission to view it."}
                    </AlertDescription>
                </Alert>
                
                <div className="flex gap-2">
                    <Button asChild>
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/punchlist">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900 truncate">
                            {punchlistItem.title}
                        </h1>
                        <Badge className={getPunchlistStatusColor(punchlistItem.status)}>
                            {PUNCHLIST_STATUS_OPTIONS.find(s => s.value === punchlistItem.status)?.label || punchlistItem.status}
                        </Badge>
                        <Badge className={getPunchlistPriorityColor(punchlistItem.priority)}>
                            {PUNCHLIST_PRIORITY_OPTIONS.find(p => p.value === punchlistItem.priority)?.label || punchlistItem.priority}
                        </Badge>
                        {isOverdue && (
                            <Badge variant="destructive">
                                <Clock className="mr-1 h-3 w-3" />
                                Overdue
                            </Badge>
                        )}
                    </div>
                    
                    {project && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <Building className="h-4 w-4" />
                            <span>{project.name}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {statusActions.map((action, index) => (
                        <Button
                            key={index}
                            variant={action.variant as any}
                            size="sm"
                            onClick={action.action}
                            disabled={isUpdatingStatus}
                            className={action.className}
                        >
                            {isUpdatingStatus ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <action.icon className="mr-2 h-4 w-4" />
                            )}
                            {action.label}
                        </Button>
                    ))}
                    
                    <Button variant="outline" size="sm">
                        <Share className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                    
                    {canEdit && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/punchlist/${punchlistItem.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Export Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                Generate Report
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Progress</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getProgressPercentage()}%</div>
                        <Progress value={getProgressPercentage()} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {PUNCHLIST_STATUS_OPTIONS.find(s => s.value === punchlistItem.status)?.label}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Priority</CardTitle>
                        <Flag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{punchlistItem.priority}</div>
                        <p className="text-xs text-muted-foreground">
                            {getIssueTypeLabel(punchlistItem.issueType)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Time Estimate</CardTitle>
                        <Timer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {punchlistItem.estimatedHours || 0}h
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {punchlistItem.actualHours ? `${punchlistItem.actualHours}h actual` : 'Not started'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {assignedMembers.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {assignedMembers.length === 0 ? 'Unassigned' : 
                             assignedMembers.length === 1 ? 'member assigned' : 'members assigned'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="photos">Photos & Files</TabsTrigger>
                    <TabsTrigger value="team">Assignment</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        
                        {/* Main Content Area */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Issue Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        Issue Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {punchlistItem.description && (
                                        <div>
                                            <h4 className="font-medium mb-2">Description</h4>
                                            <p className="text-gray-600">{punchlistItem.description}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-medium mb-1">Issue Type</h4>
                                            <Badge variant="outline">
                                                {getIssueTypeLabel(punchlistItem.issueType)}
                                            </Badge>
                                        </div>
                                        {punchlistItem.tradeCategory && (
                                            <div>
                                                <h4 className="font-medium mb-1">Trade Category</h4>
                                                <Badge variant="outline">
                                                    {getTradeCategoryLabel(punchlistItem.tradeCategory)}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    {(punchlistItem.location || punchlistItem.roomArea) && (
                                        <div>
                                            <h4 className="font-medium mb-2">Location</h4>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <MapPin className="h-4 w-4" />
                                                <span>
                                                    {punchlistItem.location}
                                                    {punchlistItem.roomArea && ` - ${punchlistItem.roomArea}`}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {punchlistItem.resolutionNotes && (
                                        <div>
                                            <h4 className="font-medium mb-2">Resolution Notes</h4>
                                            <p className="text-gray-600 bg-gray-50 p-3 rounded">{punchlistItem.resolutionNotes}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Progress Tracking */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        Progress Tracking
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Completion</span>
                                            <span className="font-medium">{getProgressPercentage()}%</span>
                                        </div>
                                        <Progress value={getProgressPercentage()} className="h-2" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                            <div className="flex items-center gap-2">
                                                <Eye className="h-4 w-4 text-yellow-600" />
                                                <span className="text-sm font-medium text-yellow-800">
                                                    Requires Inspection
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Schedule Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        Timeline
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Created</p>
                                        <p className="font-medium">{formatDateTime(punchlistItem.createdAt)}</p>
                                    </div>

                                    {punchlistItem.dueDate && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Due Date</p>
                                            <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                                                {formatDate(punchlistItem.dueDate)}
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                                        <p className="font-medium">{formatDateTime(punchlistItem.updatedAt)}</p>
                                    </div>

                                    {punchlistItem.completedAt && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Completed</p>
                                            <p className="font-medium">{formatDateTime(punchlistItem.completedAt)}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Project Info */}
                            {project && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building className="h-5 w-5" />
                                            Project
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Link 
                                                href={`/dashboard/projects/${project.id}`}
                                                className="text-orange-600 hover:text-orange-700 font-medium"
                                            >
                                                {project.name}
                                            </Link>
                                        </div>
                                        <Badge variant="outline">
                                            {project.status}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Quick Stats */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        Quick Stats
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status</span>
                                        <Badge className={getPunchlistStatusColor(punchlistItem.status)}>
                                            {PUNCHLIST_STATUS_OPTIONS.find(s => s.value === punchlistItem.status)?.label}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Priority</span>
                                        <Badge className={getPunchlistPriorityColor(punchlistItem.priority)}>
                                            {PUNCHLIST_PRIORITY_OPTIONS.find(p => p.value === punchlistItem.priority)?.label}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Progress</span>
                                        <span className="font-medium">{getProgressPercentage()}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Photos</span>
                                        <span className="font-medium">{punchlistItem.photos?.length || 0}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="photos" className="space-y-6">
                    {/* Photos Section */}
                    {punchlistItem.photos && punchlistItem.photos.length > 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Camera className="h-5 w-5" />
                                    Photos ({punchlistItem.photos.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                                <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No photos available</h3>
                                <p className="text-gray-600">Photos will appear here when uploaded.</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Attachments Section */}
                    {punchlistItem.attachments && punchlistItem.attachments.length > 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Paperclip className="h-5 w-5" />
                                    Attachments ({punchlistItem.attachments.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {punchlistItem.attachments.map((attachmentUrl, index) => {
                                        const fileName = attachmentUrl.split('/').pop() || `Attachment ${index + 1}`
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm truncate">{fileName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                                                            <Eye className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <a href={attachmentUrl} download>
                                                            <Download className="h-4 w-4" />
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
                            <CardContent className="text-center py-12">
                                <Paperclip className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No attachments</h3>
                                <p className="text-gray-600">File attachments will appear here when uploaded.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="team" className="space-y-6">
                    {/* Assignment Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Assignment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Assigned Members */}
                            {assignedMembers.length > 0 ? (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">
                                        Assigned To ({assignedMembers.length} {assignedMembers.length === 1 ? 'member' : 'members'})
                                    </h4>
                                    <div className="space-y-3">
                                        {assignedMembers.map((member, index) => (
                                            <div key={member?.id || index} className="flex items-center gap-4 p-4 border rounded-lg">
                                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <User className="h-6 w-6 text-gray-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium">
                                                            {member?.user?.firstName} {member?.user?.lastName}
                                                        </p>
                                                        {member?.user?.tradeSpecialty && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {member.user.tradeSpecialty}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600">{member?.role || 'Team Member'}</p>
                                                    {member?.user?.email && (
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Mail className="h-3 w-3 text-gray-400" />
                                                            <a href={`mailto:${member.user.email}`} className="text-sm text-blue-600 hover:underline">
                                                                {member.user.email}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {member?.hourlyRate && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Rate: ${member.hourlyRate}/hr
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Assigned To</h4>
                                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                        <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">Not assigned to anyone</p>
                                        <p className="text-xs text-gray-400 mt-1">Multiple team members can be assigned</p>
                                    </div>
                                </div>
                            )}

                            {/* Reporter */}
                            {reporter && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Reported By</h4>
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {reporter.firstName} {reporter.lastName}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {formatDateTime(punchlistItem.createdAt)}
                                            </p>
                                            {reporter.email && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Mail className="h-3 w-3 text-gray-400" />
                                                    <a href={`mailto:${reporter.email}`} className="text-sm text-blue-600 hover:underline">
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

                <TabsContent value="activity" className="space-y-6">
                    {/* Activity Log */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Activity Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Created Activity */}
                                <div className="flex items-start gap-3 pb-4">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium text-sm">Punchlist item created</p>
                                            <span className="text-xs text-gray-500">
                                                {formatDateTime(punchlistItem.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Issue reported by {reporter ? `${reporter.firstName} ${reporter.lastName}` : 'Unknown'}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Changes */}
                                {punchlistItem.status !== 'open' && (
                                    <div className="flex items-start gap-3 pb-4">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium text-sm">Status updated</p>
                                                <span className="text-xs text-gray-500">
                                                    {formatDateTime(punchlistItem.updatedAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Status changed to {PUNCHLIST_STATUS_OPTIONS.find(s => s.value === punchlistItem.status)?.label}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Completion */}
                                {punchlistItem.completedAt && (
                                    <div className="flex items-start gap-3 pb-4">
                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                                            <CheckCircle className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium text-sm">Item completed</p>
                                                <span className="text-xs text-gray-500">
                                                    {formatDateTime(punchlistItem.completedAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Punchlist item marked as completed
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Empty State */}
                                {punchlistItem.status === 'open' && !punchlistItem.completedAt && (
                                    <div className="text-center py-8 text-gray-500">
                                        <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm">More activity will appear as work progresses</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Image Modal */}
            {selectedImageIndex !== null && punchlistItem.photos && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
                    <div className="relative max-w-4xl max-h-full p-4">
                        {/* Close Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white"
                            onClick={() => setSelectedImageIndex(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        {/* Navigation Buttons */}
                        {punchlistItem.photos.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white"
                                    onClick={() => handleImageNavigation('prev')}
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 text-white"
                                    onClick={() => handleImageNavigation('next')}
                                >
                                    <ChevronRight className="h-6 w-6" />
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
                                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                            />
                            
                            {/* Image Counter */}
                            {punchlistItem.photos.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/20 text-white px-3 py-1 rounded text-sm">
                                    {selectedImageIndex + 1} of {punchlistItem.photos.length}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}