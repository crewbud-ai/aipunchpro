// ==============================================
// app/(dashboard)/dashboard/punchlist/[id]/edit/page.tsx - Punchlist Item Edit Page (COMPLETE)
// ==============================================

"use client"

import React, { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ArrowLeft,
    Save,
    AlertCircle,
    Loader2,
    Eye
} from "lucide-react"
import Link from "next/link"

// Import hooks and types
import { usePunchlistItem } from "@/hooks/punchlist-items"
import { useUpdatePunchlistItem } from "@/hooks/punchlist-items"
import { useProjects } from "@/hooks/projects"
import { useTeamMembers } from "@/hooks/team-members"
import { withPermission } from "@/lib/permissions"

// Import form components (reuse from create flow)
import { 
    IssueDetailsStep, 
    ProjectLocationStep, 
    AssignmentStep, 
    PhotosReviewStep 
} from "../../components/forms"

export default function EditPunchlistItemPage() {
    const params = useParams()
    const router = useRouter()
    const punchlistItemId = params.id as string

    // ==============================================
    // HOOKS
    // ==============================================
    const {
        punchlistItem,
        isLoading: isLoadingItem,
        isError,
        isNotFound,
        error,
        loadPunchlistItem,
    } = usePunchlistItem(punchlistItemId)

    const {
        formData,
        errors,
        isLoading: isUpdating,
        isSuccess,
        canSubmit,
        hasChanges,
        isInitialized,
        updateFormData,
        clearFieldError,
        updatePunchlistItem,
        initializeForm,
        resetForm,
        
        // File upload functionality
        isUploadingFiles,
        hasPendingFiles,
        pendingFiles,
        uploadProgress,
        uploadError,
        addPendingFiles,
        removePendingFile,
        uploadPhotos,
        uploadAttachments,
        removePhoto,
        removeAttachment,
    } = useUpdatePunchlistItem(punchlistItemId)

    const { projects, isLoading: isProjectsLoading } = useProjects()
    const { teamMembers, isLoading: isTeamMembersLoading } = useTeamMembers()

    // ==============================================
    // PERMISSIONS
    // ==============================================
    const canEdit = withPermission('punchlist', 'edit', false)

    // ==============================================
    // EFFECTS
    // ==============================================
    useEffect(() => {
        if (punchlistItemId && !punchlistItem) {
            loadPunchlistItem(punchlistItemId)
        }
    }, [punchlistItemId, punchlistItem, loadPunchlistItem])

    useEffect(() => {
        if (punchlistItem && !isInitialized) {
            initializeForm(punchlistItem)
        }
    }, [punchlistItem, isInitialized, initializeForm])

    // Redirect if no permission
    useEffect(() => {
        if (!canEdit) {
            router.push(`/dashboard/punchlist/${punchlistItemId}`)
        }
    }, [canEdit, router, punchlistItemId])

    // ==============================================
    // COMPUTED VALUES
    // ==============================================
    const activeProjects = projects.filter(project =>
        project.status === 'in_progress' ||
        project.status === 'not_started' ||
        project.status === 'on_track'
    )

    const availableTeamMembers = teamMembers.filter(member => {
        if (!formData.projectId) return []
        
        const isAssignedToProject = member.currentProjects?.some(project =>
            project.id === formData.projectId
        )

        return member.isActive &&
            member.assignmentStatus === 'assigned' &&
            isAssignedToProject
    })

    const selectedProject = projects.find(p => p.id === formData.projectId)

    // ==============================================
    // EVENT HANDLERS
    // ==============================================
    const handleSubmit = async () => {
        if (!canSubmit || !hasChanges) return
        
        try {
            await updatePunchlistItem()
            // Redirect to view page after successful update
            router.push(`/dashboard/punchlist/${punchlistItemId}`)
        } catch (error) {
            console.error('Failed to update punchlist item:', error)
        }
    }

    const handleCancel = () => {
        if (hasChanges) {
            const confirmLeave = window.confirm(
                'You have unsaved changes. Are you sure you want to leave?'
            )
            if (!confirmLeave) return
        }
        router.push(`/dashboard/punchlist/${punchlistItemId}`)
    }

    const handleProjectChange = (projectId: string) => {
        updateFormData('projectId', projectId)
        // Reset team member selection when project changes
        updateFormData('assignedProjectMemberId', '')
    }

    // ==============================================
    // LOADING STATE
    // ==============================================
    if (isLoadingItem || isProjectsLoading || isTeamMembersLoading || !isInitialized) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-64" />
                                <Skeleton className="h-4 w-96" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    // ==============================================
    // ERROR STATE
    // ==============================================
    if (isError || isNotFound || !canEdit) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Link href={`/dashboard/punchlist/${punchlistItemId}`}>
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Punchlist Item</h1>
                        </div>
                    </div>

                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {isNotFound 
                                ? "Punchlist item not found. It may have been deleted or you don't have permission to view it."
                                : !canEdit
                                ? "You don't have permission to edit this punchlist item."
                                : error || "Failed to load punchlist item. Please try again."
                            }
                        </AlertDescription>
                    </Alert>

                    <div className="mt-6">
                        <Button onClick={() => router.back()} variant="outline">
                            Go Back
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // ==============================================
    // MAIN RENDER
    // ==============================================
    if (!punchlistItem || !isInitialized) return null

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/punchlist/${punchlistItemId}`}>
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Punchlist Item</h1>
                            <p className="text-gray-600">
                                {punchlistItem.title}
                                {selectedProject && ` • ${selectedProject.name}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href={`/dashboard/punchlist/${punchlistItemId}`}>
                            <Button variant="outline">
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Update Punchlist Item</CardTitle>
                        <CardDescription>
                            Make changes to the punchlist item details below.
                            {hasChanges && (
                                <span className="text-orange-600 font-medium ml-2">
                                    • You have unsaved changes
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Issue Details Step */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-sm font-semibold">
                                    1
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Issue Information</h3>
                            </div>

                            <IssueDetailsStep
                                mode="edit"
                                formData={formData}
                                errors={errors}
                                updateFormData={updateFormData}
                                clearFieldError={clearFieldError}
                                projects={activeProjects}
                                isProjectsLoading={isProjectsLoading}
                                selectedProject={selectedProject}
                                onProjectChange={handleProjectChange}
                            />
                        </div>

                        <div className="border-t border-gray-200 pt-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-sm font-semibold">
                                    2
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Location & Assignment</h3>
                            </div>

                            <ProjectLocationStep
                                mode="edit"
                                formData={formData}
                                errors={errors}
                                updateFormData={updateFormData}
                                clearFieldError={clearFieldError}
                                selectedProject={selectedProject}
                            />
                        </div>

                        <div className="border-t border-gray-200 pt-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-sm font-semibold">
                                    3
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Assignment & Timeline</h3>
                            </div>

                            <AssignmentStep
                                mode="edit"
                                formData={formData}
                                errors={errors}
                                updateFormData={updateFormData}
                                clearFieldError={clearFieldError}
                                selectedProject={selectedProject}
                                isTeamMembersLoading={isTeamMembersLoading}
                                hasTeamMembersError={false}
                                availableTeamMembers={availableTeamMembers}
                                refreshTeamMembers={async () => {}}
                            />
                        </div>

                        <div className="border-t border-gray-200 pt-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-sm font-semibold">
                                    4
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Photos & Documentation</h3>
                            </div>

                            <PhotosReviewStep
                                mode="edit"
                                formData={formData}
                                errors={errors}
                                updateFormData={updateFormData}
                                clearFieldError={clearFieldError}
                                
                                // File upload props
                                isUploadingFiles={isUploadingFiles}
                                hasPendingFiles={hasPendingFiles}
                                pendingFiles={pendingFiles}
                                uploadProgress={uploadProgress}
                                uploadError={uploadError}
                                addPendingFiles={addPendingFiles}
                                removePendingFile={removePendingFile}
                                uploadPhotos={uploadPhotos}
                                uploadAttachments={uploadAttachments}
                                removePhoto={removePhoto}
                                removeAttachment={removeAttachment}
                            />
                        </div>

                        {/* General Error Display */}
                        {errors.general && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errors.general}</AlertDescription>
                            </Alert>
                        )}

                        {errors.submit && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errors.submit}</AlertDescription>
                            </Alert>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleCancel}
                                disabled={isUpdating}
                            >
                                Cancel
                            </Button>

                            <div className="flex items-center gap-3">
                                {hasChanges && (
                                    <span className="text-sm text-gray-600">
                                        You have unsaved changes
                                    </span>
                                )}
                                
                                <Button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || !hasChanges || isUpdating}
                                    className="min-w-[120px]"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Update Item
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Upload Progress */}
                {(isUploadingFiles || hasPendingFiles) && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Uploading Files
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                                    <div key={fileName} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="truncate">{fileName}</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-orange-600 h-2 rounded-full transition-all"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}