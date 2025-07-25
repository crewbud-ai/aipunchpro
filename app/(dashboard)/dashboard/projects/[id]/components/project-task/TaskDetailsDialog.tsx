// ==============================================
// app/(dashboard)/dashboard/projects/[id]/components/TaskDetailsDialog.tsx
// Task Details Dialog - Following Team Management Pattern
// ==============================================

"use client"

import React, { useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Briefcase,
  Timer,
  Target,
  FileText,
  Edit2,
  ExternalLink,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Play,
  XCircle,
  User,
} from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow, isPast } from "date-fns"

import type { ScheduleProjectSummary } from "@/types/schedule-projects"

// ==============================================
// INTERFACES
// ==============================================
interface TaskDetailsDialogProps {
  task: ScheduleProjectSummary | null
  isOpen: boolean
  onClose: () => void
  onEdit: (task: ScheduleProjectSummary) => void
  onStatusUpdate: (task: ScheduleProjectSummary) => void
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'planned':
      return {
        label: 'Planned',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Calendar,
      }
    case 'in_progress':
      return {
        label: 'In Progress',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Play,
      }
    case 'completed':
      return {
        label: 'Completed',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
      }
    case 'delayed':
      return {
        label: 'Delayed',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle,
      }
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle,
      }
    default:
      return {
        label: 'Unknown',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Clock,
      }
  }
}

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'critical':
      return { label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-100' }
    case 'high':
      return { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100' }
    case 'medium':
      return { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    case 'low':
      return { label: 'Low', color: 'text-green-600', bgColor: 'bg-green-100' }
    default:
      return { label: 'Medium', color: 'text-gray-600', bgColor: 'bg-gray-100' }
  }
}

const formatDateSmart = (dateString: string) => {
  const date = new Date(dateString)
  return format(date, 'MMM d, yyyy')
}

const getTaskProgress = (task: ScheduleProjectSummary) => {
  if (task.status === 'completed') return 100
  if (task.status === 'cancelled') return 0
  return task.progressPercentage || 0
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onStatusUpdate,
}) => {
  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const statusConfig = useMemo(() => task ? getStatusConfig(task.status) : null, [task])
  const priorityConfig = useMemo(() => task ? getPriorityConfig(task.priority) : null, [task])
  const progress = useMemo(() => task ? getTaskProgress(task) : 0, [task])
  const isOverdue = useMemo(() => 
    task ? isPast(new Date(task.endDate)) && !['completed', 'cancelled'].includes(task.status) : false, 
    [task]
  )

  const timeInfo = useMemo(() => {
    if (!task) return null
    
    const now = new Date()
    const startDate = new Date(task.startDate)
    const endDate = new Date(task.endDate)
    
    let timeStatus = ''
    let timeColor = 'text-gray-600'
    
    if (task.status === 'completed') {
      timeStatus = 'Completed'
      timeColor = 'text-green-600'
    } else if (task.status === 'cancelled') {
      timeStatus = 'Cancelled'
      timeColor = 'text-gray-600'
    } else if (isOverdue) {
      timeStatus = `Overdue by ${formatDistanceToNow(endDate)}`
      timeColor = 'text-red-600'
    } else if (now < startDate) {
      timeStatus = `Starts in ${formatDistanceToNow(startDate)}`
      timeColor = 'text-blue-600'
    } else if (now >= startDate && now <= endDate) {
      timeStatus = `Ends in ${formatDistanceToNow(endDate)}`
      timeColor = 'text-yellow-600'
    }
    
    return { timeStatus, timeColor }
  }, [task, isOverdue])

  // ==============================================
  // RENDER
  // ==============================================
  
  if (!task || !statusConfig || !priorityConfig || !timeInfo) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold pr-8">
                {task.title}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Task details and information
              </DialogDescription>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusUpdate(task)}
              >
                <Timer className="h-4 w-4 mr-1" />
                Update Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(task)}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={`/dashboard/schedule/${task.id}`}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Full View
                </Link>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Overview */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusConfig.color}>
                <statusConfig.icon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded text-xs font-medium bg-white border">
                <Target className="h-3 w-3 inline mr-1" />
                {priorityConfig.label} Priority
              </div>
            </div>
            
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
            
            <div className={`text-sm font-medium ${timeInfo.timeColor}`}>
              {timeInfo.timeStatus}
            </div>
          </div>

          {/* Progress */}
          {progress > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'delayed' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Schedule Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Start Date
                  </label>
                  <p className="text-sm font-medium mt-1">
                    {formatDateSmart(task.startDate)}
                    {task.startTime && (
                      <span className="text-gray-600 ml-2">at {task.startTime}</span>
                    )}
                  </p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    End Date
                  </label>
                  <p className="text-sm font-medium mt-1">
                    {formatDateSmart(task.endDate)}
                    {task.endTime && (
                      <span className="text-gray-600 ml-2">at {task.endTime}</span>
                    )}
                  </p>
                </div>
                
                {task.estimatedHours && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Estimated Hours
                    </label>
                    <p className="text-sm font-medium mt-1">{task.estimatedHours}h</p>
                  </div>
                )}
                
                {task.actualHours > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Actual Hours
                    </label>
                    <p className="text-sm font-medium mt-1">{task.actualHours}h</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Work Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="h-4 w-4" />
                  Work Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.tradeRequired && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Trade Required
                    </label>
                    <p className="text-sm font-medium mt-1 capitalize">{task.tradeRequired}</p>
                  </div>
                )}
                
                {task.location && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Location
                    </label>
                    <p className="text-sm font-medium mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {task.location}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Created
                  </label>
                  <p className="text-sm mt-1">
                    {formatDateSmart(task.createdAt)}
                    {task.creator && (
                      <span className="text-gray-600">
                        {' '}by {task.creator.firstName} {task.creator.lastName}
                      </span>
                    )}
                  </p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Last Updated
                  </label>
                  <p className="text-sm mt-1">{formatDateSmart(task.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {task.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Assigned Team */}
          {task.assignedMembers && task.assignedMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Assigned Team ({task.assignedMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {task.assignedMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {member.user.firstName} {member.user.lastName}
                        </div>
                        {member.user.tradeSpecialty && (
                          <div className="text-xs text-gray-600 flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {member.user.tradeSpecialty}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dependencies (if they exist) */}
          {/* Note: This would need to be implemented when dependencies are loaded */}
        </div>
      </DialogContent>
    </Dialog>
  )
}