import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Clock,
    PlayCircle,
    CheckCircle,
    AlertCircle,
    XCircle,
    Circle,
    Users,
    Briefcase,
    Eye,
    Edit2,
    Loader2,
} from "lucide-react"
import { formatDate } from "@/utils/format-functions" // adjust path based on your project
import React from "react"



type TaskStatus = "planned" | "in_progress" | "completed" | "delayed" | "cancelled"
type TaskPriority = "critical" | "high" | "medium" | "low"

interface Task {
    status: TaskStatus | string
    priority: TaskPriority | string
}

interface StatusConfig {
    label: string
    color: string
    icon: React.ElementType
}

interface PriorityConfig {
    label: string
    color: string
    dotColor: string
}

// Example task object
const task: Task = {
    status: "in_progress",
    priority: "high",
}

interface MobileTaskCardProps {
    task: any
    onView: (task: any) => void
    onEdit: (task: any) => void
    onStatusUpdate: (task: any) => void
    isUpdating: boolean
    canEditTask?: boolean
}

export function MobileTaskCard({
    task,
    onView,
    onEdit,
    onStatusUpdate,
    isUpdating,
    canEditTask = true,
}: MobileTaskCardProps) {
    const isOverdue = new Date(task.endDate) < new Date() && task.status !== "completed"
    const progress = task.progress || 0

    const statusMap: Record<TaskStatus, StatusConfig> = {
        planned: { label: "Planned", color: "bg-blue-100 text-blue-700", icon: Clock },
        in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700", icon: PlayCircle },
        completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
        delayed: { label: "Delayed", color: "bg-red-100 text-red-700", icon: AlertCircle },
        cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-700", icon: XCircle },
    }

    const priorityMap: Record<TaskPriority, PriorityConfig> = {
        critical: { label: "Critical", color: "text-red-700", dotColor: "bg-red-500" },
        high: { label: "High", color: "text-orange-700", dotColor: "bg-orange-500" },
        medium: { label: "Medium", color: "text-yellow-700", dotColor: "bg-yellow-500" },
        low: { label: "Low", color: "text-green-700", dotColor: "bg-green-500" },
    }

    const statusConfig = statusMap[task.status as TaskStatus] || {
        label: task.status,
        color: "bg-gray-100 text-gray-700",
        icon: Circle,
    }

    const priorityConfig = priorityMap[task.priority as TaskPriority] || {
        label: task.priority,
        color: "text-gray-700",
        dotColor: "bg-gray-500",
    }

    const StatusIcon = statusConfig.icon

    return (
        <Card className={isOverdue ? "border-red-200 bg-red-50/30" : ""}>
            <CardContent className="p-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <button onClick={() => onView(task)} className="flex-1 min-w-0 text-left">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2 leading-snug">
                            {task.title}
                        </h4>
                        {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                {task.description}
                            </p>
                        )}
                    </button>
                    {isOverdue && (
                        <Badge variant="destructive" className="text-xs shrink-0">
                            Overdue
                        </Badge>
                    )}
                </div>

                {/* Status & Priority */}
                <div className="flex items-center gap-2 mb-3">
                    <button
                        onClick={() => onStatusUpdate(task)}
                        disabled={isUpdating}
                        className="inline-flex"
                    >
                        <Badge
                            className={`${statusConfig.color} text-xs cursor-pointer hover:opacity-80`}
                        >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                        </Badge>
                    </button>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${priorityConfig.dotColor}`} />
                        <span className={`text-xs font-medium ${priorityConfig.color}`}>
                            {priorityConfig.label}
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Progress</span>
                        <span className="text-xs font-medium text-gray-900">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${task.status === "completed"
                                    ? "bg-green-500"
                                    : task.status === "delayed"
                                        ? "bg-red-500"
                                        : "bg-blue-500"
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                        <span className="text-gray-500">Schedule:</span>
                        <div className="font-medium text-gray-900 mt-0.5">
                            {formatDate(task.startDate)}
                        </div>
                        <div className="text-gray-600">
                            to {formatDate(task.endDate)}
                        </div>
                    </div>
                    <div>
                        <span className="text-gray-500">Team & Trade:</span>
                        <div className="flex items-center gap-1 mt-0.5">
                            <Users className="h-3 w-3 text-gray-400" />
                            <span className="font-medium">
                                {task.assignedMembers?.length || 0}
                            </span>
                        </div>
                        {task.tradeRequired && (
                            <div className="flex items-center gap-1 text-gray-600">
                                <Briefcase className="h-3 w-3" />
                                <span className="capitalize">{task.tradeRequired}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hours & Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs">
                        {task.estimatedHours && (
                            <span className="text-gray-600">
                                Est: {task.estimatedHours}h
                            </span>
                        )}
                        {task.actualHours > 0 && (
                            <span className="font-medium text-gray-900 ml-2">
                                Act: {task.actualHours}h
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(task)}
                            className="h-7 w-7 p-0"
                        >
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {canEditTask && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(task)}
                                className="h-7 w-7 p-0"
                            >
                                <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
