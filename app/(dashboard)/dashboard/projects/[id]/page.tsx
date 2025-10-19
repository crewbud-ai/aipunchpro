// ==============================================
// UPDATED: app/(dashboard)/dashboard/projects/[id]/page.tsx
// Role-Based Project Details Page (Maintains existing design)
// ==============================================

"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  MapPin,
  Building2,
  Users,
  Clock,
  FileText,
  Camera,
  Phone,
  Mail,
  Globe,
  MoreHorizontal,
  Plus,
  Download,
  Share,
  Settings,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Shield,
  Eye
} from "lucide-react"
import { useProject } from "@/hooks/projects"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { useDeleteProject } from "@/hooks/projects/use-delete-project"
import { ProjectStatusManager } from "@/components/projects/ProjectStatusManager"
import { ProjectTeamMembers } from "./components/team-member/ProjectTeamMembers"
import { ProjectTasks } from "./components/project-task/ProjectTasks"
import { ProjectFiles } from "./components/blueprints/ProjectFiles"
import { ProjectReports } from "./components/reports/ProjectReports"

// ADDED: Import permission utilities
import { hasPermission, canUseFeature, withPermission, withFeature } from "@/lib/permissions"
import { useTeamMembers } from "@/hooks/team-members"
import { AddTeamMemberDialog } from "./components/team-member/AddTeamMemberDialog"

// ADDED: Import the notification component
import { ProjectStartNotification } from "./components/notification/ProjectStartNotification"
import { formatCurrency, formatDate, formatStatus, formatToUpperCase, getStatusColor } from "@/utils/format-functions"
import { useScheduleProjects, useScheduleProjectStats } from "@/hooks/schedule-projects"
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ADDED: Import Locaiton Display Map
import { LocationDisplayMap } from "@/components/maps/LocationDisplayMap"
import { cn } from "@/lib/utils"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [activeTab, setActiveTab] = useState("overview")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  // State for Add Team Member Dialog
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false)

  // ADDED: State for start notification
  const [showStartNotification, setShowStartNotification] = useState(false)
  const [statusSuggestion, setStatusSuggestion] = useState<any>(null)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)


  // ADDED: Permission checks
  const canDeleteProject = canUseFeature('deleteProject')
  const canAddTeam = hasPermission('team', 'add')
  const canViewTasks = hasPermission('tasks', 'view')
  const canViewFiles = hasPermission('files', 'view')
  const canViewReports = hasPermission('reports', 'view')


  const availableTabs = [
    { id: 'overview', label: 'Overview', icon: Eye, show: true }, // Everyone can see overview
    { id: 'tasks', label: 'Tasks', icon: CheckCircle, show: canViewTasks },
    { id: 'team', label: 'Team', icon: Users, show: canAddTeam },
    { id: 'files', label: 'Files', icon: FileText, show: canViewFiles },
    { id: 'timeline', label: 'Timeline', icon: Calendar, show: hasPermission('schedule', 'view') },
    { id: 'reports', label: 'Reports', icon: TrendingUp, show: canViewReports }
  ].filter(tab => tab.show)

  // Ensure activeTab is valid for current user permissions
  if (!availableTabs.find(tab => tab.id === activeTab)) {
    setActiveTab('overview')
  }

  const {
    project,
    isLoading,
    hasError,
    error,
    isNotFound,
    projectLocation,
    projectClient,
    hasLocation,
    hasClient,
    isOverBudget,
    budgetUtilization,
    progressStatus,
    daysUntilDeadline,
    isOverdue,
    displayLocation,
    displayClient,
    clientContactInfo,
    refreshProject
  } = useProject(projectId)

  const {
    isLoading: isDeleting,
    isSuccess: isDeleteSuccess,
    deleteProject,
    reset: resetDelete,
  } = useDeleteProject();

  // ADDED: Hook to get team members
  const {
    teamMembers,
    isLoading: isLoadingTeamMembers,
    refreshTeamMembers
  } = useTeamMembers()

  // ADDED: Hook to get team members
  const {
    scheduleProjects,
    isLoading: isLoadingTasks
  } = useScheduleProjects()


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
  }, [availableTabs])

  // Scroll functions
  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -150, behavior: 'smooth' })
  }

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 150, behavior: 'smooth' })
  }


  // ADDED: Calculate project team members count
  const projectTeamMembersCount = useMemo(() => {
    if (!teamMembers || !projectId) return 0
    return teamMembers.filter(member =>
      member.currentProjects?.some(project => project.id === projectId)
    ).length
  }, [teamMembers, projectId]);

  const projectTasksCount = useMemo(() => {
    if (!scheduleProjects || !projectId) return 0

    return scheduleProjects.length
  }, [scheduleProjects, projectId]);

  // ADDED: Function to check if we should show the start notification
  const checkShouldShowStartNotification = () => {
    if (!project) return false
    if (project.status !== 'not_started') return false
    if (projectTeamMembersCount === 0) return false

    // Check start date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (project.startDate) {
      const startDate = new Date(project.startDate)
      startDate.setHours(0, 0, 0, 0)
      if (startDate > today) return false
    }

    return true
  }

  // ADDED: Check sessionStorage to see if already dismissed
  useEffect(() => {
    const dismissed = sessionStorage.getItem(`project-start-dismissed-${projectId}`)
    if (!dismissed && project?.status === 'not_started' && projectTeamMembersCount > 0) {
      const shouldShow = checkShouldShowStartNotification()
      setShowStartNotification(shouldShow)
    }
  }, [project, projectTeamMembersCount])


  // ADDED: Calculate active team members count
  const activeTeamMembersCount = useMemo(() => {
    if (!teamMembers || !projectId) return 0
    return teamMembers.filter(member =>
      member.isActive &&
      member.currentProjects?.some(project => project.id === projectId)
    ).length
  }, [teamMembers, projectId])

  // ADDED: Handler for when team member is added
  const handleTeamMemberAdded = (suggestion?: any) => {
    refreshTeamMembers()
    refreshProject()
    setShowAddTeamDialog(false)

    // Check if we received a status suggestion
    if (suggestion?.shouldSuggest) {
      setStatusSuggestion(suggestion)
      setShowStartNotification(true)
    } else if (project?.status === 'not_started') {
      // Even without suggestion, check if we should show notification
      setTimeout(() => {
        if (checkShouldShowStartNotification()) {
          setShowStartNotification(true)
        }
      }, 500) // Small delay to let data refresh
    }
  }

  // ADDED: Handler for when status changes from notification
  const handleNotificationStatusChange = (newStatus: string) => {
    setShowStartNotification(false)
    setStatusSuggestion(null)
    refreshProject()
    // The project data will automatically refresh and show new status
  }

  // ADDED: Handler for notification dismissal
  const handleNotificationDismiss = () => {
    setShowStartNotification(false)
    setStatusSuggestion(null)
    // Store dismissal in sessionStorage
    sessionStorage.setItem(`project-start-dismissed-${projectId}`, 'true')
  }

  // ADDED: Handler to open Add Team Dialog and switch to team tab
  const handleAddMemberClick = () => {
    if (canAddTeam) {
      // Option 1: Open dialog in overview
      setShowAddTeamDialog(true)

      // Option 2: Switch to team tab (uncomment if preferred)
      // setActiveTab('team')
    }
  }

  const handleDeleteProject = async () => {
    try {
      await deleteProject(projectId)
      if (isDeleteSuccess) {
        router.push('/dashboard/projects')
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleDeleteDialogClose = () => {
    setShowDeleteDialog(false)
    resetDelete()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (hasError || isNotFound) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isNotFound
              ? 'Project not found or you do not have access to view it.'
              : error || 'Failed to load project details.'
            }
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!project) return null


  const onStatusChange = () => {
    // Refresh project when status changes
    refreshProject()
    // Hide notification if it's showing
    setShowStartNotification(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl">

        {/* Header - Mobile Responsive */}
        <div className="flex flex-col md:flex-row  xs:items-start xs:justify-between gap-3 xs:gap-4">
          <div className="flex items-start gap-2.5 xs:gap-3 sm:gap-4 min-w-0 flex-1">
            <Link href="/dashboard/projects">
              <Button variant="outline" size="icon" className="shrink-0 h-9 w-9 xs:h-10 xs:w-10">
                <ArrowLeft className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold truncate leading-tight">
                {project.name}
              </h1>
              <div className="flex items-center gap-1.5 xs:gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className={cn(getStatusColor(project.status), "text-xs")}>
                  {formatToUpperCase(formatStatus(project.status))}
                </Badge>
                {project.priority && (
                  <Badge variant="secondary" className="text-xs">
                    {formatToUpperCase(project.priority)} PRIORITY
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons - Mobile Responsive */}
          <div className="flex items-end sm:justify-start justify-between  gap-1.5 xs:gap-2 self-end xs:self-auto md:w-auto w-full md:pt-0 pt-3">
            {withFeature('editProject', (
              <>
                <ProjectStatusManager
                  project={project}
                  onStatusChange={onStatusChange}
                />
              </>
            ))}
            <div className="flex gap-1.5 xs:gap-2">
              {withFeature('editProject', (
                <>
                  <Button variant="outline" asChild size="sm" className="h-9 xs:h-10 text-xs xs:text-sm">
                    <Link href={`/dashboard/projects/${projectId}/edit`}>
                      <Edit className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
                      <span className="hidden xs:inline">Edit</span>
                    </Link>
                  </Button>
                </>
              ))}

              {withFeature('deleteProject', (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 xs:h-10 xs:w-10">
                      <MoreHorizontal className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600 focus:text-red-600 text-sm"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </div>
          </div>
        </div>

        {/* Notification - Mobile Responsive */}
        {withPermission('projects', 'edit', (
          <>
            {showStartNotification && project?.status === 'not_started' && (
              <ProjectStartNotification
                projectId={projectId}
                projectName={project.name}
                onStatusChange={handleNotificationStatusChange}
                onDismiss={handleNotificationDismiss}
              />
            )}
          </>
        ))}

        {/* Stats Cards - Mobile Responsive */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 py-4 sm:py-6">
          {/* Budget Card */}
          {withPermission('financials', 'view', (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 xs:px-6 pt-4 xs:pt-6">
                <CardTitle className="text-xs xs:text-sm font-medium">Budget</CardTitle>
                <DollarSign className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 xs:px-6 pb-4 xs:pb-6">
                <div className="text-xl xs:text-2xl font-bold">
                  {formatCurrency(project.spent)}
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  of {formatCurrency(project.budget)} budgeted
                </p>
                {isOverBudget && (
                  <p className="text-xs text-red-600 mt-1 leading-snug">
                    Over budget by {formatCurrency((project.spent || 0) - (project.budget || 0))}
                  </p>
                )}
              </CardContent>
            </Card>
          ), (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 xs:px-6 pt-4 xs:pt-6">
                <CardTitle className="text-xs xs:text-sm font-medium">Progress</CardTitle>
                <Target className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 xs:px-6 pb-4 xs:pb-6">
                <div className="text-xl xs:text-2xl font-bold">{project.progress}%</div>
                <p className="text-xs text-muted-foreground">completed</p>
              </CardContent>
            </Card>
          ))}

          {/* Status Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 xs:px-6 pt-4 xs:pt-6">
              <CardTitle className="text-xs xs:text-sm font-medium">Status</CardTitle>
              <CheckCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 xs:px-6 pb-4 xs:pb-6">
              <div className="text-xl xs:text-2xl font-bold capitalize leading-tight">
                {project.status.replace('_', ' ')}
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                {progressStatus === 'ahead' && '🚀 Ahead of schedule'}
                {progressStatus === 'on_track' && '✅ On track'}
                {progressStatus === 'behind' && '⚠️ Behind schedule'}
                {progressStatus === 'not_started' && '⏳ Not started'}
              </p>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 xs:px-6 pt-4 xs:pt-6">
              <CardTitle className="text-xs xs:text-sm font-medium">Timeline</CardTitle>
              <Clock className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 xs:px-6 pb-4 xs:pb-6">
              <div className="text-xl xs:text-2xl font-bold leading-tight">
                {daysUntilDeadline !== null
                  ? daysUntilDeadline < 0
                    ? `${Math.abs(daysUntilDeadline)} days`
                    : `${daysUntilDeadline} days`
                  : "No deadline"
                }
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                {daysUntilDeadline !== null
                  ? daysUntilDeadline < 0
                    ? "overdue"
                    : "remaining"
                  : "End date not set"
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                Ends: {formatDate(project.endDate)}
              </p>
            </CardContent>
          </Card>

          {/* Team/Tasks Card */}
          {withPermission('team', 'assignToProjects', (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 xs:px-6 pt-4 xs:pt-6">
                <CardTitle className="text-xs xs:text-sm font-medium">Team</CardTitle>
                <Users className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 xs:px-6 pb-4 xs:pb-6">
                {isLoadingTeamMembers ? (
                  <>
                    <Skeleton className="h-7 xs:h-8 w-10 xs:w-12 mb-2" />
                    <Skeleton className="h-3 w-20 xs:w-24" />
                  </>
                ) : (
                  <>
                    <div className="text-xl xs:text-2xl font-bold">{projectTeamMembersCount}</div>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {projectTeamMembersCount === 1 ? 'member' : 'members'} assigned
                      {activeTeamMembersCount < projectTeamMembersCount &&
                        ` (${activeTeamMembersCount} active)`
                      }
                    </p>
                  </>
                )}
                {withPermission('team', 'assignToProjects', (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 xs:h-8 px-2 text-xs"
                    onClick={handleAddMemberClick}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add member
                  </Button>
                ))}
              </CardContent>
            </Card>
          ), (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 xs:px-6 pt-4 xs:pt-6">
                <CardTitle className="text-xs xs:text-sm font-medium">Tasks</CardTitle>
                <Users className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 xs:px-6 pb-4 xs:pb-6">
                {isLoadingTasks ? (
                  <>
                    <Skeleton className="h-7 xs:h-8 w-10 xs:w-12 mb-2" />
                    <Skeleton className="h-3 w-20 xs:w-24" />
                  </>
                ) : (
                  <>
                    <div className="text-xl xs:text-2xl font-bold">{projectTasksCount}</div>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {projectTasksCount === 1 ? 'task' : 'tasks'} assigned
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs - Mobile Responsive */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 xs:space-y-4">
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
              {availableTabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <>
                  {console.log(tab, 'tab')}
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
                  
                  </>
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
              availableTabs.length <= 3 && "sm:grid-cols-3",
              availableTabs.length === 4 && "sm:grid-cols-4",
              availableTabs.length === 5 && "sm:grid-cols-5",
              availableTabs.length === 6 && "sm:grid-cols-6",
              "gap-1.5 p-2 rounded-lg"
            )}
          >
            {availableTabs.map((tab) => {
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
            <div className="grid gap-4 xs:gap-5 sm:gap-6 md:grid-cols-2">
              {/* Project Information Card - Mobile Responsive */}
              <Card>
                <CardHeader className="px-4 xs:px-6 py-4 xs:py-6">
                  <CardTitle className="text-base xs:text-lg">Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 xs:space-y-4 px-4 xs:px-6 pb-4 xs:pb-6">
                  <div className="grid grid-cols-2 gap-3 xs:gap-4">
                    <div>
                      <label className="text-xs xs:text-sm font-medium text-gray-600">Project Number</label>
                      <p className="font-semibold text-sm xs:text-base mt-0.5 truncate">
                        {project.projectNumber || "Not assigned"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs xs:text-sm font-medium text-gray-600">Priority</label>
                      <p className="font-semibold text-sm xs:text-base capitalize mt-0.5">
                        {project.priority}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs xs:text-sm font-medium text-gray-600">Start Date</label>
                      <p className="font-semibold text-sm xs:text-base mt-0.5">
                        {formatDate(project.startDate)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs xs:text-sm font-medium text-gray-600">Target End Date</label>
                      <p className="font-semibold text-sm xs:text-base mt-0.5">
                        {formatDate(project.endDate)}
                      </p>
                    </div>
                  </div>

                  {project.description && (
                    <div>
                      <label className="text-xs xs:text-sm font-medium text-gray-600">Description</label>
                      <p className="mt-1 text-xs xs:text-sm text-gray-800 leading-snug">
                        {project.description}
                      </p>
                    </div>
                  )}

                  {project.tags && project.tags.length > 0 && (
                    <div>
                      <label className="text-xs xs:text-sm font-medium text-gray-600 mb-1.5 xs:mb-2 block">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-1 xs:gap-1.5">
                        {project.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location and Client Card - Mobile Responsive */}
              <Card>
                <CardHeader className="px-4 xs:px-6 py-4 xs:py-6">
                  <CardTitle className="text-base xs:text-lg">Location & Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 xs:space-y-5 sm:space-y-6 px-4 xs:px-6 pb-4 xs:pb-6">
                  {hasLocation && (
                    <div className="space-y-3 xs:space-y-4">
                      {/* Location Info */}
                      <div className="flex items-start gap-2 xs:gap-3">
                        <MapPin className="h-4 w-4 xs:h-5 xs:w-5 text-gray-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm xs:text-base">Project Location</h4>
                          <p className="text-xs xs:text-sm text-gray-600 mt-0.5 leading-snug">
                            {displayLocation}
                          </p>
                          {projectLocation?.coordinates && (
                            <p className="text-xs text-gray-500 mt-1 font-mono leading-tight">
                              {projectLocation.coordinates.lat}, {projectLocation.coordinates.lng}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Map Display */}
                      {projectLocation?.coordinates && (
                        <div className="mt-3 xs:mt-4">
                          <LocationDisplayMap
                            location={{
                              address: projectLocation.address,
                              displayName: projectLocation.displayName || displayLocation,
                              coordinates: projectLocation.coordinates,
                              placeId: projectLocation.placeId,
                            }}
                            height={200} // Reduced for mobile
                            showControls={true}
                            showAddress={false}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {hasClient && (
                    <div className="space-y-2 xs:space-y-3">
                      <div className="flex items-start gap-2 xs:gap-3">
                        <Building2 className="h-4 w-4 xs:h-5 xs:w-5 text-gray-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm xs:text-base">Client Information</h4>
                          <p className="text-xs xs:text-sm text-gray-600 mt-0.5 leading-snug">
                            {displayClient}
                          </p>

                          {clientContactInfo && (
                            <div className="mt-1.5 xs:mt-2 space-y-1">
                              {projectClient?.email && (
                                <div className="flex items-center gap-1.5 xs:gap-2 text-xs text-gray-500">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  <a
                                    href={`mailto:${projectClient.email}`}
                                    className="hover:text-blue-600 truncate"
                                  >
                                    {projectClient.email}
                                  </a>
                                </div>
                              )}
                              {projectClient?.phone && (
                                <div className="flex items-center gap-1.5 xs:gap-2 text-xs text-gray-500">
                                  <Phone className="h-3 w-3 shrink-0" />
                                  <a
                                    href={`tel:${projectClient.phone}`}
                                    className="hover:text-blue-600"
                                  >
                                    {projectClient.phone}
                                  </a>
                                </div>
                              )}
                              {projectClient?.website && (
                                <div className="flex items-center gap-1.5 xs:gap-2 text-xs text-gray-500">
                                  <Globe className="h-3 w-3 shrink-0" />
                                  <a
                                    href={projectClient.website.startsWith('http') ? projectClient.website : `https://${projectClient.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-blue-600 truncate"
                                  >
                                    Website
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!hasLocation && !hasClient && (
                    <p className="text-xs xs:text-sm text-gray-500">
                      No location or client information available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Card - Mobile Responsive */}
            <Card>
              <CardHeader className="px-4 xs:px-6 py-4 xs:py-6">
                <CardTitle className="text-base xs:text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="px-4 xs:px-6 pb-4 xs:pb-6">
                <div className="space-y-3 xs:space-y-4">
                  <div className="flex items-center gap-2 xs:gap-3 p-2.5 xs:p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 xs:h-5 xs:w-5 text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs xs:text-sm font-medium">Project created</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {formatDate(project.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-center py-6 xs:py-8 text-gray-500">
                    <Clock className="h-6 w-6 xs:h-8 xs:w-8 mx-auto mb-1.5 xs:mb-2 text-gray-400" />
                    <p className="text-xs xs:text-sm">No recent activity</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Tab Contents remain the same */}
          {canViewTasks && (
            <TabsContent value="tasks">
              <ProjectTasks
                projectId={projectId}
                projectName={project.name}
                projectStatus={project.status}
              />
            </TabsContent>
          )}

          {canAddTeam && (
            <TabsContent value="team">
              <ProjectTeamMembers
                projectId={projectId}
                projectName={project?.name || "Project"}
                projectStatus={project?.status || ""}
                onMemberAdded={handleTeamMemberAdded}
              />
            </TabsContent>
          )}

          {canViewFiles && (
            <TabsContent value="files">
              <ProjectFiles
                projectId={projectId}
                projectName={project?.name || "Project"}
                projectStatus={project?.status || ""}
              />
            </TabsContent>
          )}

          {hasPermission('schedule', 'view') && (
            <TabsContent value="timeline">
              <Card>
                <CardHeader className="px-4 xs:px-6 py-4 xs:py-6">
                  <CardTitle className="text-base xs:text-lg">Project Timeline</CardTitle>
                  <CardDescription className="text-xs xs:text-sm">
                    View project schedule and milestones
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 xs:px-6 pb-4 xs:pb-6">
                  <div className="text-center py-8 xs:py-12">
                    <Calendar className="h-10 w-10 xs:h-12 xs:w-12 mx-auto mb-3 xs:mb-4 text-gray-400" />
                    <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-1.5 xs:mb-2">
                      Timeline coming soon
                    </h3>
                    <p className="text-xs xs:text-sm text-gray-600">
                      Visual timeline and milestone tracking will be available here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canViewReports && (
            <TabsContent value="reports">
              <ProjectReports
                projectId={projectId}
                projectName={project.name}
                projectStatus={project.status}
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Dialogs remain the same */}
        {showAddTeamDialog && (
          <AddTeamMemberDialog
            open={showAddTeamDialog}
            onOpenChange={setShowAddTeamDialog}
            projectId={projectId}
            projectName={project?.name || "Project"}
            onMemberAdded={handleTeamMemberAdded}
          />
        )}

        {canDeleteProject && (
          <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogClose}>
            <AlertDialogContent className="max-w-[90vw] xs:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base xs:text-lg">Delete Project</AlertDialogTitle>
                <AlertDialogDescription className="text-xs xs:text-sm">
                  Are you sure you want to delete "{project.name}"? This action cannot be undone.
                  All associated tasks, files, and data will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col xs:flex-row gap-2 xs:gap-0">
                <AlertDialogCancel disabled={isDeleting} className="w-full xs:w-auto">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 w-full xs:w-auto"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : isDeleteSuccess ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Deleted! Redirecting...
                    </>
                  ) : (
                    'Delete Project'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}