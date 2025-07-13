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
        <div className="space-y-4">
            <Label className="text-lg font-semibold">Review Your Punchlist Item</Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                    <Label className="text-sm font-medium text-gray-600">Title</Label>
                    <p className="text-sm">{formData.title || 'Not specified'}</p>
                </div>

                <div>
                    <Label className="text-sm font-medium text-gray-600">Issue Type</Label>
                    <p className="text-sm">{formData.issueType || 'Not specified'}</p>
                </div>

                <div>
                    <Label className="text-sm font-medium text-gray-600">Priority</Label>
                    <p className="text-sm">{formData.priority || 'Not specified'}</p>
                </div>

                <div>
                    <Label className="text-sm font-medium text-gray-600">Location</Label>
                    <p className="text-sm">{formData.location || 'Not specified'}</p>
                </div>

                {formData.roomArea && (
                    <div>
                        <Label className="text-sm font-medium text-gray-600">Room/Area</Label>
                        <p className="text-sm">{formData.roomArea}</p>
                    </div>
                )}

                {formData.dueDate && (
                    <div>
                        <Label className="text-sm font-medium text-gray-600">Due Date</Label>
                        <p className="text-sm">{formData.dueDate}</p>
                    </div>
                )}
            </div>

            {formData.resolutionNotes && (
                <div>
                    <Label className="text-sm font-medium text-gray-600">Resolution Notes</Label>
                    <p className="text-sm p-3 bg-gray-50 rounded border">
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
        <div className="space-y-4">
            {/* Upload Type Selector */}
            <div className="flex items-center gap-4">
                <Label className="text-sm font-medium">Upload Type:</Label>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant={uploadType === 'photos' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUploadType('photos')}
                        disabled={isUploadingFiles}
                    >
                        <Camera className="mr-2 h-4 w-4" />
                        Photos
                    </Button>
                    <Button
                        type="button"
                        variant={uploadType === 'attachments' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUploadType('attachments')}
                        disabled={isUploadingFiles}
                    >
                        <Paperclip className="mr-2 h-4 w-4" />
                        Attachments
                    </Button>
                </div>
            </div>

            {/* Universal Drop Zone */}
            <div
                className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-all",
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
                        <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Add Photos to Document the Issue
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Drag and drop image files here, or click to select
                        </p>
                    </>
                ) : (
                    <>
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Add Supporting Documents
                        </h3>
                        <p className="text-gray-600 mb-4">
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
                        "inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer",
                        isUploadingFiles && "cursor-not-allowed opacity-50"
                    )}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Select {uploadType === 'photos' ? 'Photos' : 'Files'}
                </label>
                <p className="text-xs text-gray-500 mt-2">
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
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                        {uploadType === 'photos' ? 'Photos' : 'Files'} Ready to Upload ({relevantFiles.length})
                    </Label>
                    <Button
                        type="button"
                        onClick={handleUploadPendingFiles}
                        disabled={isUploadingFiles}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {isUploadingFiles ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload All
                            </>
                        )}
                    </Button>
                </div>

                {isUploadingFiles && (
                    <div className="space-y-2">
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-sm text-gray-600">Uploading files... {uploadProgress}%</p>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                                        <div className="text-center p-4">
                                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-xs text-gray-600 truncate">{file.name}</p>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    // ✅ FIXED: Use handleRemovePendingFile instead of handleRemoveUploadedAttachment
                                    onClick={() => handleRemovePendingFile(globalIndex)}
                                    disabled={isUploadingFiles}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                                {!file.type.startsWith('image/') && (
                                    <div className="absolute bottom-1 left-1 right-1">
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
            <div className="space-y-3">
                <Label className="text-sm font-medium">Uploaded Photos ({formData.photos.length})</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemoveUploadedPhoto(photoUrl)}
                                    disabled={isUploadingFiles || isDeleting}
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <X className="h-3 w-3" />
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
            <div className="space-y-3">
                <Label className="text-sm font-medium">Uploaded Attachments ({formData.attachments.length})</Label>
                <div className="space-y-2">
                    {formData.attachments.map((attachmentUrl, index) => {
                        const fileName = attachmentUrl.split('/').pop() || `Attachment ${index + 1}`
                        const isDeleting = deletingFiles.has(attachmentUrl)

                        return (
                            <div key={index} className={cn(
                                "flex items-center justify-between p-3 border rounded-lg",
                                isDeleting && "opacity-50"
                            )}>
                                <div className="flex items-center gap-2">
                                    <Paperclip className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">{fileName}</span>
                                    {isDeleting && (
                                        <span className="text-xs text-gray-500">(Deleting...)</span>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveUploadedAttachment(attachmentUrl)}
                                    disabled={isUploadingFiles || isDeleting} // ✅ ADD: || isDeleting
                                >
                                    {isDeleting ? ( // ✅ ADD THIS CONDITIONAL
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <X className="h-4 w-4" />
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
        <div className="space-y-8">
            {/* Form Summary */}
            {renderFormSummary()}

            <Separator />

            {/* File Upload Section */}
            <div className="space-y-6">
                <div>
                    <Label className="text-lg font-semibold">Files & Documentation</Label>
                    <p className="text-sm text-gray-600 mt-1">
                        Add photos and supporting documents to help resolve this issue effectively.
                    </p>
                </div>

                {/* Universal Upload Zone */}
                {renderDropZone()}

                {/* Error Display */}
                {(errors.photos || errors.attachments || uploadError) && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {errors.photos || errors.attachments || uploadError}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Upload Status */}
                {isUploadingFiles && (
                    <Alert>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription>
                            Uploading files... Please don't close this page.
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
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                            {(formData.photos?.length || 0) + (formData.attachments?.length || 0)} file(s) uploaded successfully.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Guidelines */}
                <Alert>
                    <Camera className="h-4 w-4" />
                    <AlertDescription>
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