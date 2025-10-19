"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  Building2,
  AlertCircle,
  Edit2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  User,
  Phone,
  Mail,
  Briefcase,
  Target,
  FileText,
  Activity,
  TrendingUp,
  Loader2
} from "lucide-react"

// Import real hooks following the existing pattern
import { useScheduleProject } from "@/hooks/schedule-projects"
import { cn } from "@/lib/utils"
import { formatDate, formatDateTime, formatTime12Hour, getPriorityConfig, getStatusConfig } from "@/utils/format-functions"

export default function ScheduleProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const scheduleId = params.id as string

  // ==============================================
  // HOOKS FOR REAL DATA
  // ==============================================

  const {
    scheduleProject,
    dependentSchedules,
    isLoading,
    isError,
    error,
    isNotFound,
    hasScheduleProject,
    hasDependentSchedules,
    loadScheduleProject,
    refreshScheduleProject,
    updateStatus,
  } = useScheduleProject(scheduleId)

  // ==============================================
  // LOCAL STATE
  // ==============================================

  const [activeTab, setActiveTab] = useState("overview")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // ==============================================
  // COMPUTED VALUES
  // ==============================================

  const statusActions = useMemo(() => {
    if (!scheduleProject) return []

    const actions = []

    switch (scheduleProject.status) {
      case 'planned':
        actions.push({
          label: 'Start Task',
          icon: Play,
          action: () => handleStatusUpdate('in_progress'),
          variant: 'default',
          className: 'bg-green-600 hover:bg-green-700'
        })
        break
      case 'in_progress':
        actions.push({
          label: 'Complete Task',
          icon: CheckCircle,
          action: () => handleStatusUpdate('completed'),
          variant: 'default',
          className: 'bg-green-600 hover:bg-green-700'
        })
        actions.push({
          label: 'Mark as Delayed',
          icon: Pause,
          action: () => handleStatusUpdate('delayed'),
          variant: 'outline'
        })
        break
      case 'delayed':
        actions.push({
          label: 'Resume Task',
          icon: Play,
          action: () => handleStatusUpdate('in_progress'),
          variant: 'default',
          className: 'bg-orange-600 hover:bg-orange-700'
        })
        actions.push({
          label: 'Complete Task',
          icon: CheckCircle,
          action: () => handleStatusUpdate('completed'),
          variant: 'default',
          className: 'bg-green-600 hover:bg-green-700'
        })
        break
      case 'completed':
        actions.push({
          label: 'Reopen Task',
          icon: Play,
          action: () => handleStatusUpdate('in_progress'),
          variant: 'outline'
        })
        break
    }

    return actions
  }, [scheduleProject])

  // ==============================================
  // EVENT HANDLERS
  // ==============================================

  const handleStatusUpdate = async (newStatus: string) => {
    if (!scheduleProject) return

    try {
      setIsUpdatingStatus(true)
      await updateStatus({
        id: scheduleProject.id,
        status: newStatus as any,
        progressPercentage: newStatus === 'completed' ? 100 : undefined
      })
      await refreshScheduleProject()
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // ==============================================
  // LOADING STATES
  // ==============================================

  if (isLoading) {
    return (
      <div className="space-y-4 xs:space-y-5 sm:space-y-6">
        <div className="flex flex-col xs:flex-row xs:items-center gap-3 xs:gap-4">
          <Skeleton className="h-9 w-9 xs:h-10 xs:w-10 shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-7 xs:h-8 w-48 xs:w-64 mb-1.5 xs:mb-2" />
            <Skeleton className="h-4 xs:h-5 w-64 xs:w-96" />
          </div>
          <Skeleton className="h-9 xs:h-10 w-20 xs:w-24" />
        </div>

        <div className="grid gap-4 xs:gap-5 sm:gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4 xs:space-y-5 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 xs:p-5 sm:p-6">
                <Skeleton className="h-5 xs:h-6 w-28 xs:w-32" />
              </CardHeader>
              <CardContent className="space-y-3 xs:space-y-4 p-4 xs:p-5 sm:p-6 pt-0">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4 xs:space-y-5 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 xs:p-5 sm:p-6">
                <Skeleton className="h-5 xs:h-6 w-20 xs:w-24" />
              </CardHeader>
              <CardContent className="space-y-3 xs:space-y-4 p-4 xs:p-5 sm:p-6 pt-0">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ==============================================
  // ERROR STATES
  // ==============================================

  if (isError || isNotFound) {
    return (
      <div className="space-y-4 xs:space-y-5 sm:space-y-6">
        <div className="flex flex-col xs:flex-row xs:items-center gap-3 xs:gap-4">
          <Button variant="outline" size="icon" className="shrink-0 self-start xs:self-auto" asChild>
            <Link href="/dashboard/schedule">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900">Schedule Not Found</h1>
            <p className="text-sm xs:text-base text-gray-600 mt-0.5">The schedule you're looking for could not be found.</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
          <AlertDescription className="text-xs xs:text-sm leading-snug">
            {error || "This schedule project doesn't exist or you don't have permission to view it."}
          </AlertDescription>
        </Alert>

        <div className="flex flex-col xs:flex-row gap-2">
          <Button className="w-full xs:w-auto" asChild>
            <Link href="/dashboard/schedule">
              Back to Schedule
            </Link>
          </Button>
          <Button variant="outline" className="w-full xs:w-auto" onClick={() => loadScheduleProject(scheduleId)}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!hasScheduleProject || !scheduleProject) {
    return null
  }

  // ==============================================
  // MAIN RENDER
  // ==============================================

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between  xs:items-start gap-3 xs:gap-4">
        <div className="flex xs:items-center gap-3 xs:gap-4 w-full">
          <Button variant="outline" size="icon" className="shrink-0 self-start" asChild>
            <Link href="/dashboard/schedule">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex flex-col items-center gap-1.5 xs:gap-2 sm:gap-3 mb-1.5 xs:mb-2">
            <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 break-words">
              {scheduleProject.title}
            </h1>
            <div className="flex gap-2">
              {scheduleProject.project && (
                <div className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base text-gray-600">
                  <Building2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                  <span className="truncate">{scheduleProject.project.name}</span>
                </div>
              )}
              <Badge className={getStatusConfig(scheduleProject.status).color}>
                {getStatusConfig(scheduleProject.status).label}
              </Badge>
              <Badge className={`${getPriorityConfig(scheduleProject.priority).color} ${getPriorityConfig(scheduleProject.priority).bgColor}`}>
                {getPriorityConfig(scheduleProject.priority).label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-row flex-wrap md:flex-nowrap items-center gap-2 w-full xs:w-auto">
          {statusActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant as any}
              size="sm"
              onClick={action.action}
              disabled={isUpdatingStatus}
              className={cn("flex-1 xs:flex-none text-xs xs:text-sm w-full sm:w-2/4 py-2", action.className)}
            >
              {isUpdatingStatus ? (
                <Loader2 className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin" />
              ) : (
                <action.icon className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
              )}
              {action.label}
            </Button>
          ))}

          <Button variant="outline" size="sm" className="flex-1 w-full sm:w-2/4 xs:flex-none text-xs xs:text-sm py-2" asChild>
            <Link href={`/dashboard/schedule/${scheduleProject.id}/edit`}>
              <Edit2 className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 xs:gap-5 sm:gap-6 md:grid-cols-3">

        {/* Main Content Area */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="text-xs xs:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="team" className="text-xs xs:text-sm">Team</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs xs:text-sm">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 xs:space-y-5 sm:space-y-6">
              {/* Task Details */}
              <Card>
                <CardHeader className="p-4 xs:p-5 sm:p-6">
                  <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                    <FileText className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                    Task Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 xs:space-y-4 p-4 xs:p-5 sm:p-6 pt-0">
                  {scheduleProject.description && (
                    <div>
                      <h4 className="font-medium mb-1.5 xs:mb-2 text-sm xs:text-base">Description</h4>
                      <p className="text-sm xs:text-base text-gray-600 leading-snug">{scheduleProject.description}</p>
                    </div>
                  )}

                  {scheduleProject.location && (
                    <div>
                      <h4 className="font-medium mb-1.5 xs:mb-2 text-sm xs:text-base">Location</h4>
                      <div className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base text-gray-600">
                        <MapPin className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                        <span className="break-words">{scheduleProject.location}</span>
                      </div>
                    </div>
                  )}

                  {scheduleProject.tradeRequired && (
                    <div>
                      <h4 className="font-medium mb-1.5 xs:mb-2 text-sm xs:text-base">Trade Required</h4>
                      <Badge variant="outline" className="text-xs xs:text-sm">
                        {scheduleProject.tradeRequired.charAt(0).toUpperCase() + scheduleProject.tradeRequired.slice(1)}
                      </Badge>
                    </div>
                  )}

                  {scheduleProject.notes && (
                    <div>
                      <h4 className="font-medium mb-1.5 xs:mb-2 text-sm xs:text-base">Notes</h4>
                      <p className="text-sm xs:text-base text-gray-600 bg-gray-50 p-2.5 xs:p-3 rounded leading-snug">{scheduleProject.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Progress */}
              <Card>
                <CardHeader className="p-4 xs:p-5 sm:p-6">
                  <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                    <TrendingUp className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                    Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 xs:space-y-4 p-4 xs:p-5 sm:p-6 pt-0">
                  <div>
                    <div className="flex justify-between text-xs xs:text-sm mb-1.5 xs:mb-2">
                      <span>Completion</span>
                      <span className="font-medium">{scheduleProject.progressPercentage}%</span>
                    </div>
                    <Progress value={scheduleProject.progressPercentage} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 xs:gap-4 text-xs xs:text-sm">
                    {scheduleProject.estimatedHours && (
                      <div>
                        <p className="text-gray-600 leading-snug">Estimated Hours</p>
                        <p className="font-medium">{scheduleProject.estimatedHours} hrs</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600 leading-snug">Actual Hours</p>
                      <p className="font-medium">{scheduleProject.actualHours} hrs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dependencies */}
              {hasDependentSchedules && (
                <Card>
                  <CardHeader className="p-4 xs:p-5 sm:p-6">
                    <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                      <Target className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                      Dependencies
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                    <div className="space-y-2 xs:space-y-3">
                      {dependentSchedules.map((dep) => (
                        <div
                          key={dep.id}
                          className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 p-2.5 xs:p-3 bg-gray-50 rounded"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm xs:text-base truncate">{dep.title}</p>
                            <p className="text-xs xs:text-sm text-gray-600 truncate">{dep.project.name}</p>
                          </div>
                          <Badge className={cn("self-start xs:self-auto shrink-0", getStatusConfig(dep.status).color)}>
                            {getStatusConfig(dep.status).label}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="team" className="space-y-4 xs:space-y-5 sm:space-y-6">
              {/* Assigned Team Members */}
              <Card>
                <CardHeader className="p-4 xs:p-5 sm:p-6">
                  <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                    <Users className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                    Assigned Team Members
                  </CardTitle>
                  <CardDescription className="text-xs xs:text-sm">
                    {scheduleProject.assignedMembers?.length || 0} team members assigned to this task
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                  {scheduleProject.assignedMembers && scheduleProject.assignedMembers.length > 0 ? (
                    <div className="space-y-3 xs:space-y-4">
                      {scheduleProject.assignedMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 xs:gap-4 p-3 xs:p-4 border rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 mb-0.5 xs:mb-1">
                              <h4 className="font-medium text-sm xs:text-base truncate">
                                {member.user.firstName} {member.user.lastName}
                              </h4>
                              {member.user.tradeSpecialty && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {member.user.tradeSpecialty}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 xs:py-8">
                      <Users className="h-10 w-10 xs:h-12 xs:w-12 text-gray-400 mx-auto mb-3 xs:mb-4" />
                      <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-1.5 xs:mb-2">No team members assigned</h3>
                      <p className="text-sm xs:text-base text-gray-600 mb-3 xs:mb-4">This task hasn't been assigned to any team members yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 xs:space-y-5 sm:space-y-6">
              {/* Activity Log */}
              <Card>
                <CardHeader className="p-4 xs:p-5 sm:p-6">
                  <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                    <Activity className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                    Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                  <div className="text-center py-6 xs:py-8">
                    <Activity className="h-10 w-10 xs:h-12 xs:w-12 text-gray-400 mx-auto mb-3 xs:mb-4" />
                    <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-1.5 xs:mb-2">No activity yet</h3>
                    <p className="text-sm xs:text-base text-gray-600">Activity will appear here as the task progresses.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">

          {/* Schedule Info */}
          <Card>
            <CardHeader className="p-4 xs:p-5 sm:p-6">
              <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                <Calendar className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 xs:space-y-4 p-4 xs:p-5 sm:p-6 pt-0">
              <div>
                <p className="text-xs xs:text-sm text-gray-600 mb-0.5 xs:mb-1">Date</p>
                <p className="font-medium text-sm xs:text-base">{formatDate(scheduleProject.startDate)}</p>
              </div>

              {(scheduleProject.startTime || scheduleProject.endTime) && (
                <div>
                  <p className="text-xs xs:text-sm text-gray-600 mb-0.5 xs:mb-1">Time</p>
                  <div className="flex items-center gap-1.5 xs:gap-2">
                    <Clock className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                    <span className="font-medium text-sm xs:text-base">
                      {scheduleProject.startTime && formatTime12Hour(scheduleProject.startTime)}
                      {scheduleProject.startTime && scheduleProject.endTime && " - "}
                      {scheduleProject.endTime && formatTime12Hour(scheduleProject.endTime)}
                    </span>
                  </div>
                </div>
              )}

              {scheduleProject.startDate !== scheduleProject.endDate && (
                <div>
                  <p className="text-xs xs:text-sm text-gray-600 mb-0.5 xs:mb-1">End Date</p>
                  <p className="font-medium text-sm xs:text-base">{formatDate(scheduleProject.endDate)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Creator Info */}
          {scheduleProject.creator && (
            <Card>
              <CardHeader className="p-4 xs:p-5 sm:p-6">
                <CardTitle className="flex items-center gap-1.5 xs:gap-2 text-base xs:text-lg">
                  <User className="h-4 w-4 xs:h-5 xs:w-5 shrink-0" />
                  Created By
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                <div className="flex items-center gap-2.5 xs:gap-3">
                  <div className="w-8 h-8 xs:w-10 xs:h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 xs:h-5 xs:w-5 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm xs:text-base truncate">
                      {scheduleProject.creator.firstName} {scheduleProject.creator.lastName}
                    </p>
                    <p className="text-xs xs:text-sm text-gray-600 truncate">
                      {formatDateTime(scheduleProject.createdAt)}
                    </p>
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
              <div className="flex justify-between items-center text-xs xs:text-sm">
                <span className="text-gray-600">Status</span>
                <Badge className={getStatusConfig(scheduleProject.status).color}>
                  {getStatusConfig(scheduleProject.status).label}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs xs:text-sm">
                <span className="text-gray-600">Priority</span>
                <Badge className={`${getPriorityConfig(scheduleProject.priority).color} ${getPriorityConfig(scheduleProject.priority).bgColor}`}>
                  {getPriorityConfig(scheduleProject.priority).label}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs xs:text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{scheduleProject.progressPercentage}%</span>
              </div>
              <div className="flex justify-between items-center text-xs xs:text-sm">
                <span className="text-gray-600">Team Size</span>
                <span className="font-medium">{scheduleProject.assignedMembers?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}