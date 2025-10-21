import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Rocket, Clock, X } from 'lucide-react'
import { useCoordinatedProjectStatus } from '@/hooks/projects/use-coordinated-project-status'
import { toast } from '@/hooks/use-toast'

interface ProjectStartNotificationProps {
    projectId: string
    projectName: string
    onStatusChange?: (newStatus: string) => void
    onDismiss?: () => void
}

export const ProjectStartNotification: React.FC<ProjectStartNotificationProps> = ({
    projectId,
    projectName,
    onStatusChange,
    onDismiss
}) => {
    const [isVisible, setIsVisible] = React.useState(true)
    const [isUpdating, setIsUpdating] = React.useState(false)

    const {
        updateProjectStatusCoordinated
    } = useCoordinatedProjectStatus()

    const handleStartProject = async () => {
        setIsUpdating(true)

        try {
            const result = await updateProjectStatusCoordinated({
                projectId: projectId,
                status: 'in_progress',
                notes: 'Project started after team assignment'
            })

            if (result.success) {
                toast({
                    title: "Project Started",
                    description: `${projectName} is now in progress`,
                    duration: 3000,
                })

                onStatusChange?.('in_progress')
                setIsVisible(false)
            } else {
                toast({
                    title: "Failed to Start Project",
                    description: result.message || "Please try again",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error('Failed to start project:', error)
            toast({
                title: "Error",
                description: "Failed to update project status",
                variant: "destructive",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const handleNotYet = () => {
        setIsVisible(false)
        onDismiss?.()

        // Store dismissal in sessionStorage to not show again this session
        sessionStorage.setItem(`project-start-dismissed-${projectId}`, 'true')
    }

    if (!isVisible) return null

    return (
        <Alert className="bg-blue-50 border-blue-200 relative mt-4">
            <Rocket className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Ready to Start?</AlertTitle>
            <AlertDescription className="text-blue-800">
                Your project now has team members assigned. Would you like to start the project?
            </AlertDescription>

            <div className="flex gap-2 mt-3">
                <Button
                    size="sm"
                    onClick={handleStartProject}
                    disabled={isUpdating}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {isUpdating ? (
                        <>
                            <Clock className="mr-2 h-3 w-3 animate-spin" />
                            Starting...
                        </>
                    ) : (
                        <>
                            <Rocket className="mr-2 h-3 w-3" />
                            Start Project
                        </>
                    )}
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNotYet}
                    disabled={isUpdating}
                >
                    Not Yet
                </Button>
            </div>

            <button
                onClick={handleNotYet}
                className="absolute top-2 right-2 p-1 rounded-md hover:bg-blue-100 transition-colors"
                aria-label="Dismiss"
            >
                <X className="h-4 w-4 text-blue-600" />
            </button>
        </Alert>
    )
}