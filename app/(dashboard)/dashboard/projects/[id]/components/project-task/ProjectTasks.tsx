// ==============================================
// app/(dashboard)/dashboard/projects/[id]/components/ProjectTasks.tsx
// Professional Task Management - Following Team Management Pattern
// ==============================================

"use client"

import React, { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Plus,
    Calendar,
    Clock,
    Users,
    MapPin,
    Search,
    Play,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Eye,
    Edit2,
    Briefcase,
    Timer,
    Loader2,
    AlertCircle,
    RefreshCw,
    Filter,
    MoreVertical,
    GitBranch,
    Target,
    TrendingUp,
    User,
} from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, isPast } from "date-fns"

// Import your hooks and types
import { useScheduleProjects } from "@/hooks/schedule-projects"
import { useTeamMembers } from "@/hooks/team-members"
import type { ScheduleProjectSummary, ScheduleProjectFilters } from "@/types/schedule-projects"

// Import dialogs and forms
import { TaskDetailsDialog } from "./TaskDetailsDialog"
import { TaskCreateDialog } from "./TaskCreateDialog"
import { TaskStatusUpdateDialog } from "./TaskStatusUpdateDialog"
import { hasPermission } from "@/lib/permissions"

// ==============================================
// INTERFACES
// ==============================================
interface ProjectTasksProps {
    projectId: string
    projectName: string
    projectStatus: string
}

interface TaskRowProps {
    task: ScheduleProjectSummary
    onView: (task: ScheduleProjectSummary) => void
    onEdit: (task: ScheduleProjectSummary) => void
    onStatusUpdate: (task: ScheduleProjectSummary) => void
    isUpdating: boolean
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
const getStatusConfig = (status: string) => {
    switch (status) {
        case 'planned':
            return {
                label: 'Planned',
                variant: 'secondary' as const,
                color: 'text-blue-600 bg-blue-50 border-blue-200',
                icon: Calendar,
            }
        case 'in_progress':
            return {
                label: 'In Progress',
                variant: 'default' as const,
                color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
                icon: Play,
            }
        case 'completed':
            return {
                label: 'Completed',
                variant: 'default' as const,
                color: 'text-green-600 bg-green-50 border-green-200',
                icon: CheckCircle,
            }
        case 'delayed':
            return {
                label: 'Delayed',
                variant: 'destructive' as const,
                color: 'text-red-600 bg-red-50 border-red-200',
                icon: AlertTriangle,
            }
        case 'cancelled':
            return {
                label: 'Cancelled',
                variant: 'outline' as const,
                color: 'text-gray-600 bg-gray-50 border-gray-200',
                icon: XCircle,
            }
        default:
            return {
                label: 'Unknown',
                variant: 'outline' as const,
                color: 'text-gray-600 bg-gray-50 border-gray-200',
                icon: Clock,
            }
    }
}

const getPriorityConfig = (priority: string) => {
    switch (priority) {
        case 'critical':
            return { label: 'Critical', color: 'text-red-600', dotColor: 'bg-red-500' }
        case 'high':
            return { label: 'High', color: 'text-orange-600', dotColor: 'bg-orange-500' }
        case 'medium':
            return { label: 'Medium', color: 'text-yellow-600', dotColor: 'bg-yellow-500' }
        case 'low':
            return { label: 'Low', color: 'text-green-600', dotColor: 'bg-green-500' }
        default:
            return { label: 'Medium', color: 'text-gray-600', dotColor: 'bg-gray-500' }
    }
}

const formatDateSmart = (dateString: string) => {
    const date = new Date(dateString)

    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isYesterday(date)) return 'Yesterday'

    return format(date, 'MMM d, yyyy')
}

const getTaskProgress = (task: ScheduleProjectSummary) => {
    if (task.status === 'completed') return 100
    if (task.status === 'cancelled') return 0
    return task.progressPercentage || 0
}

// ==============================================
// TASK TABLE ROW COMPONENT
// ==============================================
const TaskRow: React.FC<TaskRowProps> = ({
    task,
    onView,
    onEdit,
    onStatusUpdate,
    isUpdating
}) => {
    const statusConfig = getStatusConfig(task.status)
    const priorityConfig = getPriorityConfig(task.priority)
    const progress = getTaskProgress(task)
    const isOverdue = isPast(new Date(task.endDate)) && !['completed', 'cancelled'].includes(task.status)

    // permissions
    const conEditTask = hasPermission('tasks', 'edit')


    return (
        <TableRow className={`${isOverdue ? 'bg-red-50/30' : ''} hover:bg-gray-50/50`}>
            {/* Title & Description */}
            <TableCell className="max-w-xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onView(task)}
                            className="font-medium text-gray-900 hover:text-blue-600 text-left truncate"
                        >
                            {task.title}
                        </button>
                        {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                                Overdue
                            </Badge>
                        )}
                    </div>
                    {task.description && (
                        <p className="text-xs text-gray-600 truncate">
                            {task.description}
                        </p>
                    )}
                </div>
            </TableCell>

            {/* Status */}
            <TableCell>
                <button
                    onClick={() => onStatusUpdate(task)}
                    disabled={isUpdating}
                    className="inline-flex items-center gap-1"
                >
                    <Badge
                        variant={statusConfig.variant}
                        className={`${statusConfig.color} cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                        <statusConfig.icon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                    </Badge>
                </button>
            </TableCell>

            {/* Priority */}
            <TableCell>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${priorityConfig.dotColor}`} />
                    <span className={`text-sm font-medium ${priorityConfig.color}`}>
                        {priorityConfig.label}
                    </span>
                </div>
            </TableCell>

            {/* Progress */}
            <TableCell>
                <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${task.status === 'completed' ? 'bg-green-500' :
                                task.status === 'delayed' ? 'bg-red-500' :
                                    'bg-blue-500'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-xs text-gray-600 font-medium min-w-[2rem]">
                        {progress}%
                    </span>
                </div>
            </TableCell>

            {/* Dates */}
            <TableCell>
                <div className="space-y-1">
                    <div className="text-sm font-medium">
                        {formatDateSmart(task.startDate)}
                    </div>
                    <div className="text-xs text-gray-500">
                        to {formatDateSmart(task.endDate)}
                    </div>
                </div>
            </TableCell>

            {/* Team */}
            <TableCell>
                <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-600">
                        {task.assignedMembers?.length || 0}
                    </span>
                </div>
            </TableCell>

            {/* Trade */}
            <TableCell>
                {task.tradeRequired ? (
                    <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600 capitalize">
                            {task.tradeRequired}
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-gray-400">—</span>
                )}
            </TableCell>

            {/* Hours */}
            <TableCell>
                <div className="text-right space-y-1">
                    {task.estimatedHours && (
                        <div className="text-xs text-gray-600">
                            Est: {task.estimatedHours}h
                        </div>
                    )}
                    {task.actualHours > 0 && (
                        <div className="text-xs font-medium">
                            Act: {task.actualHours}h
                        </div>
                    )}
                </div>
            </TableCell>

            {/* Actions */}
            <TableCell>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(task)}
                        className="h-8 w-8 p-0"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {conEditTask && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(task)}
                            className="h-8 w-8 p-0"
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </TableCell>
        </TableRow>
    )
}

// ==============================================
// MAIN PROJECT TASKS COMPONENT
// ==============================================
export const ProjectTasks: React.FC<ProjectTasksProps> = ({
    projectId,
    projectName,
    projectStatus,
}) => {
    // ==============================================
    // STATE
    // ==============================================
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [priorityFilter, setPriorityFilter] = useState<string>("all")

    // Dialog states
    const [selectedTask, setSelectedTask] = useState<ScheduleProjectSummary | null>(null)
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)

    // ==============================================
    // HOOKS
    // ==============================================
    const {
        scheduleProjects,
        isLoading,
        isError,
        error,
        isEmpty,
        hasScheduleProjects,
        totalPages,
        currentPage,
        hasNextPage,
        hasPrevPage,
        filters,
        refreshScheduleProjects,
        setPage,
    } = useScheduleProjects()

    const { teamMembers } = useTeamMembers()

    // ==============================================
    // COMPUTED VALUES
    // ==============================================
    const filteredTasks = useMemo(() => {
        if (!hasScheduleProjects) return []

        return scheduleProjects.filter(task => {
            // Project filter (always applied)
            if (task.projectId !== projectId) return false

            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase()
                if (!task.title.toLowerCase().includes(searchLower) &&
                    !(task.description?.toLowerCase().includes(searchLower))) {
                    return false
                }
            }

            // Status filter
            if (statusFilter !== "all" && task.status !== statusFilter) {
                return false
            }

            // Priority filter
            if (priorityFilter !== "all" && task.priority !== priorityFilter) {
                return false
            }

            return true
        })
    }, [scheduleProjects, hasScheduleProjects, projectId, searchTerm, statusFilter, priorityFilter])

    const taskStats = useMemo(() => {
        if (!filteredTasks.length) {
            return {
                total: 0,
                planned: 0,
                inProgress: 0,
                completed: 0,
                delayed: 0,
                overdue: 0,
            }
        }

        return {
            total: filteredTasks.length,
            planned: filteredTasks.filter(t => t.status === 'planned').length,
            inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
            completed: filteredTasks.filter(t => t.status === 'completed').length,
            delayed: filteredTasks.filter(t => t.status === 'delayed').length,
            overdue: filteredTasks.filter(t =>
                isPast(new Date(t.endDate)) && !['completed', 'cancelled'].includes(t.status)
            ).length,
        }
    }, [filteredTasks])

    // ==============================================
    // EVENT HANDLERS
    // ==============================================
    const handleViewTask = useCallback((task: ScheduleProjectSummary) => {
        setSelectedTask(task)
        setIsDetailsDialogOpen(true)
    }, [])

    const handleEditTask = useCallback((task: ScheduleProjectSummary) => {
        // Navigate to edit page
        window.location.href = `/dashboard/schedule/${task.id}/edit`
    }, [])

    const handleStatusUpdate = useCallback((task: ScheduleProjectSummary) => {
        setSelectedTask(task)
        setIsStatusDialogOpen(true)
    }, [])

    const handleCreateTask = useCallback(() => {
        setIsCreateDialogOpen(true)
    }, [])

    const handleDialogClose = useCallback(() => {
        setIsDetailsDialogOpen(false)
        setIsCreateDialogOpen(false)
        setIsStatusDialogOpen(false)
        setSelectedTask(null)
        setUpdatingTaskId(null)
    }, [])

    const handleDialogSuccess = useCallback(async () => {
        await refreshScheduleProjects()
        handleDialogClose()
    }, [refreshScheduleProjects, handleDialogClose])

    const handleRefresh = useCallback(async () => {
        await refreshScheduleProjects()
    }, [refreshScheduleProjects])

    // ==============================================
    // RENDER
    // ==============================================
    if (isError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Error loading project tasks: {error}
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Project Tasks
                    </h2>
                    <p className="text-sm text-gray-600">
                        Manage scheduled work items for {projectName}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>

                    <Button onClick={handleCreateTask}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Task
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
                        <div className="text-xs text-gray-600">Total</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-700">{taskStats.planned}</div>
                        <div className="text-xs text-gray-600">Planned</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-700">{taskStats.inProgress}</div>
                        <div className="text-xs text-gray-600">Active</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-700">{taskStats.completed}</div>
                        <div className="text-xs text-gray-600">Done</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-700">{taskStats.delayed}</div>
                        <div className="text-xs text-gray-600">Delayed</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-900">{taskStats.overdue}</div>
                        <div className="text-xs text-gray-600">Overdue</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Search */}
                        <div className="relative min-w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search tasks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border rounded-md text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="planned">Planned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="delayed">Delayed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-3 py-2 border rounded-md text-sm"
                        >
                            <option value="all">All Priority</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        {/* Clear Filters */}
                        {(searchTerm || statusFilter !== "all" || priorityFilter !== "all") && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm("")
                                    setStatusFilter("all")
                                    setPriorityFilter("all")
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tasks Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Schedule Tasks ({filteredTasks.length})
                    </CardTitle>
                    <CardDescription>
                        All scheduled work items for this project
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No tasks found
                            </h3>
                            <p className="text-gray-600 mb-4">
                                {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                                    ? "No tasks match your current filters."
                                    : "This project doesn't have any scheduled tasks yet."
                                }
                            </p>
                            <Button onClick={handleCreateTask}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Task
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Task</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead>Schedule</TableHead>
                                        <TableHead>Team</TableHead>
                                        <TableHead>Trade</TableHead>
                                        <TableHead className="text-right">Hours</TableHead>
                                        <TableHead className="w-20">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTasks.map((task) => (
                                        <TaskRow
                                            key={task.id}
                                            task={task}
                                            onView={handleViewTask}
                                            onEdit={handleEditTask}
                                            onStatusUpdate={handleStatusUpdate}
                                            isUpdating={updatingTaskId === task.id}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            {selectedTask && (
                <TaskDetailsDialog
                    task={selectedTask}
                    isOpen={isDetailsDialogOpen}
                    onClose={handleDialogClose}
                    onEdit={handleEditTask}
                    onStatusUpdate={handleStatusUpdate}
                />
            )}

            <TaskCreateDialog
                projectId={projectId}
                projectName={projectName}
                isOpen={isCreateDialogOpen}
                onClose={handleDialogClose}
                onSuccess={handleDialogSuccess}
            />

            {selectedTask && (
                <TaskStatusUpdateDialog
                    task={selectedTask}
                    isOpen={isStatusDialogOpen}
                    onClose={handleDialogClose}
                    onSuccess={handleDialogSuccess}
                />
            )}
        </div>
    )
}