// ==============================================
// app/(dashboard)/dashboard/punchlist/components/forms/PhotosReviewStep.tsx
// ==============================================

"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
    Camera, 
    X, 
    AlertCircle, 
    CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

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
    formData: {
        title: string
        issueType: string
        priority: string
        location: string
        roomArea: string
        assignedProjectMemberId: string
        dueDate: string
        resolutionNotes: string
        photos: string[]
        status?: string // Only in edit mode
        projectId?: string // Only in create mode
    }
    errors: any
    updateFormData: (field: string, value: any) => void
    clearFieldError: (field: string) => void
}

// ==============================================
// PHOTO UPLOAD COMPONENT
// ==============================================
interface PhotoUploadProps {
    photos: string[]
    onPhotosChange: (photos: string[]) => void
    maxPhotos?: number
    disabled?: boolean
}

const PhotoUpload = React.memo<PhotoUploadProps>(({ 
    photos, 
    onPhotosChange, 
    maxPhotos = 5,
    disabled = false 
}) => {
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        
        if (disabled) return

        const files = Array.from(e.dataTransfer.files)
        const imageFiles = files.filter(file => file.type.startsWith('image/'))
        
        // For demo purposes - in real implementation this would upload files
        // and return URLs to add to the photos array
        console.log('Files dropped:', imageFiles)
        // TODO: Upload files and get URLs, then add to photos array
    }, [disabled])

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return
        
        const files = Array.from(e.target.files || [])
        const imageFiles = files.filter(file => file.type.startsWith('image/'))
        
        // For demo purposes - in real implementation this would upload files
        // and return URLs to add to the photos array
        console.log('Files selected:', imageFiles)
        // TODO: Upload files and get URLs, then add to photos array
    }, [disabled])

    const removePhoto = useCallback((index: number) => {
        if (disabled) return
        const newPhotos = photos.filter((_, i) => i !== index)
        onPhotosChange(newPhotos)
    }, [photos, onPhotosChange, disabled])

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    dragActive && "border-blue-500 bg-blue-50",
                    !dragActive && "border-gray-300 hover:border-gray-400",
                    disabled && "opacity-50 cursor-not-allowed",
                    photos.length >= maxPhotos && "opacity-50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    disabled={disabled || photos.length >= maxPhotos}
                    className="hidden"
                    id="photo-upload"
                />
                
                <div className="space-y-2">
                    <div className="flex justify-center">
                        <div className="p-2 bg-gray-100 rounded-full">
                            <Camera className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    
                    <div>
                        <Label htmlFor="photo-upload" className="cursor-pointer">
                            <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                Click to upload photos
                            </span>
                        </Label>
                        <p className="text-xs text-gray-500">or drag and drop images here</p>
                    </div>
                    
                    <p className="text-xs text-gray-400">
                        PNG, JPG, JPEG up to 10MB each • Max {maxPhotos} photos
                    </p>
                    
                    {photos.length > 0 && (
                        <p className="text-xs text-gray-600">
                            {photos.length} of {maxPhotos} photos uploaded
                        </p>
                    )}
                </div>
            </div>

            {/* Photo Preview Grid */}
            {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photoUrl, index) => (
                        <div key={index} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                    src={photoUrl}
                                    alt={`Photo ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            {!disabled && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removePhoto(index)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                            
                            <div className="absolute bottom-2 left-2">
                                <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                                    {index + 1}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
})

// ==============================================
// MAIN COMPONENT
// ==============================================
export const PhotosReviewStep = React.memo<PhotosReviewStepProps>(({
    mode = 'create',
    formData,
    errors,
    updateFormData,
    clearFieldError,
}: PhotosReviewStepProps) => {
    
    // ==============================================
    // EVENT HANDLERS
    // ==============================================
    
    const handlePhotosChange = (photos: string[]) => {
        updateFormData('photos', photos)
        if (errors.photos) clearFieldError('photos')
    }

    // ==============================================
    // FORM SUMMARY DATA
    // ==============================================
    const getSummaryData = () => {
        return {
            title: formData.title || 'Untitled Issue',
            issueType: formData.issueType || 'Not specified',
            priority: formData.priority || 'Not specified',
            location: formData.location || 'Not specified',
            roomArea: formData.roomArea || 'Not specified',
            assignedProjectMemberId: formData.assignedProjectMemberId || 'Unassigned',
            dueDate: formData.dueDate || 'Not set',
            resolutionNotes: formData.resolutionNotes || 'No additional notes',
            photos: formData.photos || [],
            status: formData.status || 'open'
        }
    }

    const summary = getSummaryData()

    // ==============================================
    // RENDER
    // ==============================================
    return (
        <div className="space-y-6">
            {/* Photo Upload Section */}
            <div className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    {mode === 'edit' ? 'Update Photos' : 'Issue Photos'}
                    <span className="text-xs text-gray-500 ml-auto">
                        Optional but recommended
                    </span>
                </Label>

                <PhotoUpload
                    photos={summary.photos}
                    onPhotosChange={handlePhotosChange}
                    maxPhotos={5}
                    disabled={false}
                />

                {errors.photos && (
                    <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            {errors.photos}
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            <Separator />

            {/* Review Summary */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <Label className="text-base font-medium">
                        {mode === 'edit' ? 'Review Changes' : 'Review Details'}
                    </Label>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <Label className="text-xs font-medium text-gray-700">Issue Title</Label>
                        <p className="text-sm text-gray-900 mt-1">{summary.title}</p>
                    </div>
                    <div>
                        <Label className="text-xs font-medium text-gray-700">Type & Priority</Label>
                        <p className="text-sm text-gray-900 mt-1">
                            {summary.issueType} • {summary.priority}
                        </p>
                    </div>
                    <div>
                        <Label className="text-xs font-medium text-gray-700">Location</Label>
                        <p className="text-sm text-gray-900 mt-1">
                            {summary.location}
                            {summary.roomArea && ` • ${summary.roomArea}`}
                        </p>
                    </div>
                    <div>
                        <Label className="text-xs font-medium text-gray-700">Due Date</Label>
                        <p className="text-sm text-gray-900 mt-1">{summary.dueDate}</p>
                    </div>
                    {mode === 'edit' && (
                        <div>
                            <Label className="text-xs font-medium text-gray-700">Status</Label>
                            <p className="text-sm text-gray-900 mt-1">{summary.status}</p>
                        </div>
                    )}
                    <div>
                        <Label className="text-xs font-medium text-gray-700">Photos</Label>
                        <p className="text-sm text-gray-900 mt-1">
                            {summary.photos.length > 0 
                                ? `${summary.photos.length} photo${summary.photos.length > 1 ? 's' : ''} attached`
                                : 'No photos attached'
                            }
                        </p>
                    </div>
                </div>

                {/* Notes */}
                {summary.resolutionNotes && summary.resolutionNotes !== 'No additional notes' && (
                    <div>
                        <Label className="text-xs font-medium text-gray-700">Notes</Label>
                        <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{summary.resolutionNotes}</p>
                    </div>
                )}
            </div>

            {/* Validation Errors */}
            {Object.keys(errors).length > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Please fix the following errors before {mode === 'edit' ? 'updating' : 'creating'}:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            {Object.entries(errors).map(([field, error]) => (
                                <li key={field} className="text-xs">
                                    {field}: {String(error)}
                                </li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
})