// ==============================================
// app/(dashboard)/dashboard/punchlist/components/forms/PhotosReviewStep.tsx
// ==============================================

"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
    Camera,
    X,
    AlertCircle,
    CheckCircle,
    Upload,
    ImageIcon,
    Loader2,
    Paperclip,
    FileText,
    Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

// Import types
import {
    type CreatePunchlistItemFormData,
    type UpdatePunchlistItemFormData
} from "@/types/punchlist-items"

// ==============================================
// COMPONENT PROPS
// ==============================================
interface PhotosReviewStepProps {
    mode?: 'create' | 'edit'
    formData: CreatePunchlistItemFormData | UpdatePunchlistItemFormData
    errors: any
    updateFormData: (field: string, value: any) => void
    clearFieldError: (field: string) => void

    // ✅ File upload props from your updated hook
    isUploadingFiles?: boolean
    hasPendingFiles?: boolean
    pendingFiles?: File[]
    uploadProgress?: number
    uploadError?: string | null
    addPendingFiles?: (files: File[]) => void
    removePendingFile?: (index: number) => void
    uploadPhotos?: (files?: File[]) => Promise<string[]>
    uploadAttachments?: (files?: File[]) => Promise<string[]>
    removePhoto?: (photoUrl: string) => Promise<void>
    removeAttachment?: (attachmentUrl: string) => Promise<void>
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export const PhotosReviewStep = React.memo<PhotosReviewStepProps>(({
    mode = 'create',
    formData,
    errors,
    updateFormData,
    clearFieldError,

    // File upload props
    isUploadingFiles = false,
    hasPendingFiles = false,
    pendingFiles = [],
    uploadProgress = 0,
    uploadError = null,
    addPendingFiles,
    removePendingFile,
    uploadPhotos,
    uploadAttachments,
    removePhoto,
    removeAttachment,
}: PhotosReviewStepProps) => {

    // ==============================================
    // LOCAL STATE
    // ==============================================
    const [dragActive, setDragActive] = useState(false)
    const [uploadType, setUploadType] = useState<'photos' | 'attachments'>('photos')
    const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set())

    // ==============================================
    // FILE HANDLING
    // ==============================================
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (isUploadingFiles) return

        const files = Array.from(e.dataTransfer.files)

        if (uploadType === 'photos') {
            const imageFiles = files.filter(file => file.type.startsWith('image/'))
            if (imageFiles.length > 0 && addPendingFiles) {
                addPendingFiles(imageFiles)
            }
        } else {
            // For attachments, accept all file types
            if (files.length > 0 && addPendingFiles) {
                addPendingFiles(files)
            }
        }
    }, [uploadType, addPendingFiles, isUploadingFiles])

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])

        if (uploadType === 'photos') {
            const imageFiles = files.filter(file => file.type.startsWith('image/'))
            if (imageFiles.length > 0 && addPendingFiles) {
                addPendingFiles(imageFiles)
            }
        } else {
            if (files.length > 0 && addPendingFiles) {
                addPendingFiles(files)
            }
        }

        // Reset input
        e.target.value = ''
    }, [uploadType, addPendingFiles])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
    }, [])

    // ==============================================
    // UPLOAD HANDLERS
    // ==============================================
    const handleUploadPendingFiles = useCallback(async () => {
        if (!hasPendingFiles || isUploadingFiles) return

        try {
            if (uploadType === 'photos' && uploadPhotos) {
                const photoFiles = pendingFiles.filter(file => file.type.startsWith('image/'))
                if (photoFiles.length > 0) {
                    await uploadPhotos(photoFiles)
                }
            } else if (uploadType === 'attachments' && uploadAttachments) {
                const attachmentFiles = pendingFiles.filter(file => !file.type.startsWith('image/'))
                if (attachmentFiles.length > 0) {
                    await uploadAttachments(attachmentFiles)
                }
            }
        } catch (error) {
            console.error('Upload error:', error)
        }
    }, [uploadType, hasPendingFiles, isUploadingFiles, pendingFiles, uploadPhotos, uploadAttachments])

    const handleRemoveUploadedPhoto = useCallback(async (photoUrl: string) => {
        if (!removePhoto) return

        try {
            setDeletingFiles(prev => new Set(prev).add(photoUrl))
            await removePhoto(photoUrl)
        } catch (error) {
            console.error('Error removing photo:', error)
        } finally {
            setDeletingFiles(prev => {
                const next = new Set(prev)
                next.delete(photoUrl)
                return next
            })
        }
    }, [removePhoto])


    const handleRemoveUploadedAttachment = useCallback(async (attachmentUrl: string) => {
        if (!removeAttachment) return

        try {
            setDeletingFiles(prev => new Set(prev).add(attachmentUrl))
            await removeAttachment(attachmentUrl)
        } catch (error) {
            console.error('Error removing attachment:', error)
        } finally {
            setDeletingFiles(prev => {
                const next = new Set(prev)
                next.delete(attachmentUrl)
                return next
            })
        }
    }, [removeAttachment])

    const handleRemovePendingFile = useCallback((index: number) => {
        if (removePendingFile) {
            removePendingFile(index)
        }
    }, [removePendingFile])

    // ==============================================
    // RENDER FORM SUMMARY
    // ==============================================
    const renderFormSummary = () => (
        <div className="space-y-3 xs:space-y-4">
            <Label className="text-base xs:text-lg font-semibold">Review Your Punchlist Item</Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4 p-3 xs:p-4 bg-gray-50 rounded-lg">
                <div>
                    <Label className="text-xs xs:text-sm font-medium text-gray-600">Title</Label>
                    <p className="text-xs xs:text-sm mt-0.5 xs:mt-1">{formData.title || 'Not specified'}</p>
                </div>

                <div>
                    <Label className="text-xs xs:text-sm font-medium text-gray-600">Issue Type</Label>
                    <p className="text-xs xs:text-sm mt-0.5 xs:mt-1">{formData.issueType || 'Not specified'}</p>
                </div>

                <div>
                    <Label className="text-xs xs:text-sm font-medium text-gray-600">Priority</Label>
                    <p className="text-xs xs:text-sm mt-0.5 xs:mt-1">{formData.priority || 'Not specified'}</p>
                </div>

                <div>
                    <Label className="text-xs xs:text-sm font-medium text-gray-600">Location</Label>
                    <p className="text-xs xs:text-sm mt-0.5 xs:mt-1">{formData.location || 'Not specified'}</p>
                </div>

                {formData.roomArea && (
                    <div>
                        <Label className="text-xs xs:text-sm font-medium text-gray-600">Room/Area</Label>
                        <p className="text-xs xs:text-sm mt-0.5 xs:mt-1">{formData.roomArea}</p>
                    </div>
                )}

                {formData.dueDate && (
                    <div>
                        <Label className="text-xs xs:text-sm font-medium text-gray-600">Due Date</Label>
                        <p className="text-xs xs:text-sm mt-0.5 xs:mt-1">{formData.dueDate}</p>
                    </div>
                )}
            </div>

            {formData.resolutionNotes && (
                <div>
                    <Label className="text-xs xs:text-sm font-medium text-gray-600">Resolution Notes</Label>
                    <p className="text-xs xs:text-sm p-2 xs:p-3 bg-gray-50 rounded border mt-1 xs:mt-1.5">
                        {formData.resolutionNotes}
                    </p>
                </div>
            )}
        </div>
    )

    // ==============================================
    // RENDER DROP ZONE
    // ==============================================
    const renderDropZone = () => (
        <div className="space-y-3 xs:space-y-4">
            {/* Upload Type Selector - Mobile Responsive */}
            <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
                <Label className="text-sm xs:text-base font-medium">Upload Type:</Label>
                <div className="flex gap-1.5 xs:gap-2">
                    <Button
                        type="button"
                        variant={uploadType === 'photos' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUploadType('photos')}
                        disabled={isUploadingFiles}
                        className="flex-1 xs:flex-none h-9 xs:h-10 text-xs xs:text-sm"
                    >
                        <Camera className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                        Photos
                    </Button>
                    <Button
                        type="button"
                        variant={uploadType === 'attachments' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUploadType('attachments')}
                        disabled={isUploadingFiles}
                        className="flex-1 xs:flex-none h-9 xs:h-10 text-xs xs:text-sm"
                    >
                        <Paperclip className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                        Attachments
                    </Button>
                </div>
            </div>

            {/* Universal Drop Zone - Mobile Responsive */}
            <div
                className={cn(
                    "border-2 border-dashed rounded-lg p-4 xs:p-6 sm:p-8 text-center transition-all",
                    dragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400",
                    isUploadingFiles && "opacity-50 cursor-not-allowed"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                {uploadType === 'photos' ? (
                    <>
                        <Camera className="mx-auto h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 text-gray-400 mb-2 xs:mb-3 sm:mb-4" />
                        <h3 className="text-sm xs:text-base sm:text-lg font-medium text-gray-900 mb-1 xs:mb-1.5 sm:mb-2">
                            Add Photos to Document the Issue
                        </h3>
                        <p className="text-xs xs:text-sm text-gray-600 mb-2 xs:mb-3 sm:mb-4 px-2">
                            Drag and drop image files here, or click to select
                        </p>
                    </>
                ) : (
                    <>
                        <FileText className="mx-auto h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 text-gray-400 mb-2 xs:mb-3 sm:mb-4" />
                        <h3 className="text-sm xs:text-base sm:text-lg font-medium text-gray-900 mb-1 xs:mb-1.5 sm:mb-2">
                            Add Supporting Documents
                        </h3>
                        <p className="text-xs xs:text-sm text-gray-600 mb-2 xs:mb-3 sm:mb-4 px-2">
                            Drag and drop any files here, or click to select
                        </p>
                    </>
                )}

                <input
                    type="file"
                    multiple
                    accept={uploadType === 'photos' ? 'image/*' : '*'}
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploadingFiles}
                />
                <label
                    htmlFor="file-upload"
                    className={cn(
                        "inline-flex items-center px-3 xs:px-4 py-1.5 xs:py-2 border border-gray-300 rounded-md shadow-sm text-xs xs:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer",
                        isUploadingFiles && "cursor-not-allowed opacity-50"
                    )}
                >
                    <Upload className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                    Select {uploadType === 'photos' ? 'Photos' : 'Files'}
                </label>
                <p className="text-xs text-gray-500 mt-1.5 xs:mt-2 px-2">
                    {uploadType === 'photos'
                        ? 'Supports: JPG, PNG, GIF, WebP (Max 10MB per file)'
                        : 'Supports: All file types (Max 10MB per file)'
                    }
                </p>
            </div>
        </div>
    )

    // ==============================================
    // RENDER PENDING FILES
    // ==============================================
    const renderPendingFiles = () => {
        if (pendingFiles.length === 0) return null

        const relevantFiles = uploadType === 'photos'
            ? pendingFiles.filter(file => file.type.startsWith('image/'))
            : pendingFiles.filter(file => !file.type.startsWith('image/'))

        if (relevantFiles.length === 0) return null

        return (
            <div className="space-y-2 xs:space-y-3">
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-4">
                    <Label className="text-sm xs:text-base font-medium">
                        {uploadType === 'photos' ? 'Photos' : 'Files'} Ready to Upload ({relevantFiles.length})
                    </Label>
                    <Button
                        type="button"
                        onClick={handleUploadPendingFiles}
                        disabled={isUploadingFiles}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 w-full xs:w-auto h-9 xs:h-10 text-xs xs:text-sm"
                    >
                        {isUploadingFiles ? (
                            <>
                                <Loader2 className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin shrink-0" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                                Upload All
                            </>
                        )}
                    </Button>
                </div>

                {isUploadingFiles && (
                    <div className="space-y-1.5 xs:space-y-2">
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-xs xs:text-sm text-gray-600">Uploading files... {uploadProgress}%</p>
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
                    {relevantFiles.map((file, index) => {
                        const globalIndex = pendingFiles.indexOf(file)
                        return (
                            <div key={globalIndex} className="relative group">
                                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                                    {file.type.startsWith('image/') ? (
                                        <Image
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            width={200}
                                            height={200}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-center p-2 xs:p-3 sm:p-4">
                                            <FileText className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-1 xs:mb-1.5 sm:mb-2" />
                                            <p className="text-xs text-gray-600 truncate px-1">{file.name}</p>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute  top-1 xs:top-1.5 sm:top-2 right-1 xs:right-1.5 sm:right-2 !h-5 !w-5 xs:!h-6 xs:!w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemovePendingFile(globalIndex)}
                                    disabled={isUploadingFiles}
                                >
                                    <X className="h-2.5 w-2.5 xs:h-3 xs:w-3" />
                                </Button>
                                {!file.type.startsWith('image/') && (
                                    <div className="absolute bottom-0.5 xs:bottom-1 left-0.5 xs:left-1 right-0.5 xs:right-1">
                                        <p className="text-xs text-white bg-black bg-opacity-60 px-1 py-0.5 rounded truncate">
                                            {file.name}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // ==============================================
    // RENDER UPLOADED PHOTOS
    // ==============================================
    const renderUploadedPhotos = () => {
        if (!formData.photos || formData.photos.length === 0) return null

        return (
            <div className="space-y-2 xs:space-y-3">
                <Label className="text-sm xs:text-base font-medium">
                    Uploaded Photos ({formData.photos.length})
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
                    {formData.photos.map((photoUrl, index) => {
                        const isDeleting = deletingFiles.has(photoUrl)

                        return (
                            <div key={index} className={cn(
                                "relative group",
                                isDeleting && "opacity-50"
                            )}>
                                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                                    <Image
                                        src={photoUrl}
                                        alt={`Photo ${index + 1}`}
                                        width={200}
                                        height={200}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute  top-1 xs:top-1.5 sm:top-2 right-1 xs:right-1.5 sm:right-2 !h-5 !w-5 xs:!h-6 xs:!w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemoveUploadedPhoto(photoUrl)}
                                    disabled={isUploadingFiles || isDeleting}
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-2.5 w-2.5 xs:h-3 xs:w-3 animate-spin" />
                                    ) : (
                                        <X className="h-2.5 w-2.5 xs:h-3 xs:w-3" />
                                    )}
                                </Button>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // ==============================================
    // RENDER UPLOADED ATTACHMENTS
    // ==============================================
    const renderUploadedAttachments = () => {
        if (!formData.attachments || formData.attachments.length === 0) return null

        return (
            <div className="space-y-2 xs:space-y-3">
                <Label className="text-sm xs:text-base font-medium">
                    Uploaded Attachments ({formData.attachments.length})
                </Label>
                <div className="space-y-1.5 xs:space-y-2">
                    {formData.attachments.map((attachmentUrl, index) => {
                        const fileName = attachmentUrl.split('/').pop() || `Attachment ${index + 1}`
                        const isDeleting = deletingFiles.has(attachmentUrl)

                        return (
                            <div key={index} className={cn(
                                "flex items-center justify-between p-2 xs:p-3 border rounded-lg",
                                isDeleting && "opacity-50"
                            )}>
                                <div className="flex items-center gap-1.5 xs:gap-2 min-w-0 flex-1">
                                    <Paperclip className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                                    <span className="text-xs xs:text-sm truncate">{fileName}</span>
                                    {isDeleting && (
                                        <span className="text-xs text-gray-500 shrink-0">(Deleting...)</span>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="!h-7 !w-7 xs:!h-8 xs:!w-8 p-0  shrink-0"
                                    onClick={() => handleRemoveUploadedAttachment(attachmentUrl)}
                                    disabled={isUploadingFiles || isDeleting}
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin" />
                                    ) : (
                                        <X className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                                    )}
                                </Button>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // ==============================================
    // MAIN RENDER
    // ==============================================
    return (
        <div className="space-y-6 xs:space-y-7 sm:space-y-8">
            {/* Form Summary */}
            {renderFormSummary()}

            <Separator />

            {/* File Upload Section */}
            <div className="space-y-4 xs:space-y-5 sm:space-y-6">
                <div>
                    <Label className="text-base xs:text-lg font-semibold">Files & Documentation</Label>
                    <p className="text-xs xs:text-sm text-gray-600 mt-0.5 xs:mt-1">
                        Add photos and supporting documents to help resolve this issue effectively.
                    </p>
                </div>

                {/* Universal Upload Zone */}
                {renderDropZone()}

                {/* Error Display */}
                {(errors.photos || errors.attachments || uploadError) && (
                    <Alert variant="destructive" className="py-2 xs:py-3">
                        <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                        <AlertDescription className="text-xs xs:text-sm">
                            {errors.photos || errors.attachments || uploadError}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Upload Status */}
                {isUploadingFiles && (
                    <Alert className="py-2 xs:py-3">
                        <AlertDescription className="text-xs xs:text-sm flex gap-2 items-center">
                            <Loader2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 animate-spin shrink-0" />
                            <span>
                                Uploading files... Please don't close this page.
                            </span>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Pending Files */}
                {renderPendingFiles()}

                {/* Uploaded Content */}
                {renderUploadedPhotos()}
                {renderUploadedAttachments()}

                {/* Success Message */}
                {((formData.photos && formData.photos.length > 0) || (formData.attachments && formData.attachments.length > 0)) && (
                    <Alert className="py-2 xs:py-3">
                        <AlertDescription className="text-xs xs:text-sm flex gap-2 items-center">
                            <CheckCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                            <span>
                                {(formData.photos?.length || 0) + (formData.attachments?.length || 0)} file(s) uploaded successfully.
                            </span>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Guidelines */}
                <Alert className="py-2 xs:py-3">
                    <Camera className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
                    <AlertDescription className="text-xs xs:text-sm">
                        <strong>Tip:</strong> Clear photos and relevant documents help resolve issues faster.
                        Include multiple angles and any supporting documentation like specifications or invoices.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    )
})

PhotosReviewStep.displayName = "PhotosReviewStep"

export default PhotosReviewStep