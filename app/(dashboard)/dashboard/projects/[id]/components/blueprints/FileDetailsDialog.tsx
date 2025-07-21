// ==============================================
// app/(dashboard)/dashboard/projects/[id]/components/FileDetailsDialog.tsx
// ==============================================

"use client"

import React, { useState } from "react"
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
  Download,
  Edit2,
  ExternalLink,
  Calendar,
  User,
  HardDrive,
  Tag,
  Eye,
  FileText,
  FileImage,
  FileType,
  FileVideo,
  FileSpreadsheet,
  Folder,
  Share2,
  Clock,
  Info,
} from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"

// ==============================================
// INTERFACES
// ==============================================
interface FileDetailsDialogProps {
  file: any // ProjectFile interface
  isOpen: boolean
  onClose: () => void
  onEdit: (file: any) => void
  onDownload: (file: any) => void
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
const getFileIcon = (fileType: string, mimeType: string) => {
  if (mimeType?.startsWith('image/')) {
    return { icon: FileImage, color: 'text-blue-600', bgColor: 'bg-blue-100' }
  } else if (mimeType === 'application/pdf') {
    return { icon: FileType, color: 'text-red-600', bgColor: 'bg-red-100' }
  } else if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
    return { icon: FileSpreadsheet, color: 'text-green-600', bgColor: 'bg-green-100' }
  } else if (mimeType?.startsWith('video/')) {
    return { icon: FileVideo, color: 'text-purple-600', bgColor: 'bg-purple-100' }
  } else {
    return { icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-100' }
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFolderConfig = (folder: string) => {
  switch (folder) {
    case 'blueprints':
      return { label: 'Blueprints', color: 'bg-blue-100 text-blue-800' }
    case 'documents':
      return { label: 'Documents', color: 'bg-gray-100 text-gray-800' }
    case 'photos':
      return { label: 'Photos', color: 'bg-green-100 text-green-800' }
    case 'contracts':
      return { label: 'Contracts', color: 'bg-purple-100 text-purple-800' }
    case 'reports':
      return { label: 'Reports', color: 'bg-orange-100 text-orange-800' }
    default:
      return { label: 'General', color: 'bg-gray-100 text-gray-800' }
  }
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export const FileDetailsDialog: React.FC<FileDetailsDialogProps> = ({
  file,
  isOpen,
  onClose,
  onEdit,
  onDownload,
}) => {
  // ==============================================
  // STATE
  // ==============================================
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const fileConfig = getFileIcon(file.fileType, file.mimeType)
  const folderConfig = getFolderConfig(file.folder)
  const FileIcon = fileConfig.icon
  
  const isImage = file.mimeType?.startsWith('image/')
  const isPdf = file.mimeType === 'application/pdf'
  const isPreviewable = isImage || isPdf

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleImageLoad = () => {
    setIsImageLoading(false)
  }

  const handleImageError = () => {
    setIsImageLoading(false)
    setImageError(true)
  }

  const handleOpenInNewTab = () => {
    window.open(file.fileUrl, '_blank')
  }

  // ==============================================
  // RENDER
  // ==============================================
  
  if (!file) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold pr-8">
                {file.name}
              </DialogTitle>
              <DialogDescription className="mt-2">
                File details and information
              </DialogDescription>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(file)}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(file)}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
              {isPreviewable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Overview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className={`p-3 rounded-lg ${fileConfig.bgColor}`}>
              <FileIcon className={`h-6 w-6 ${fileConfig.color}`} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={folderConfig.color}>
                  <Folder className="h-3 w-3 mr-1" />
                  {folderConfig.label}
                </Badge>
                
                {file.category && (
                  <Badge variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {file.category}
                  </Badge>
                )}
                
                {file.version && (
                  <Badge variant="outline" className="text-xs">
                    v{file.version}
                  </Badge>
                )}
                
                <Badge variant={file.status === 'active' ? 'default' : 'secondary'}>
                  {file.status}
                </Badge>
                
                {file.isPublic && (
                  <Badge variant="outline" className="text-xs">
                    <Share2 className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                {formatFileSize(file.fileSize)} • {file.mimeType}
              </div>
            </div>
            
            <div className="text-right text-sm text-gray-600">
              <div>Uploaded {format(new Date(file.uploadedAt), 'MMM d, yyyy')}</div>
              {file.uploader && (
                <div className="text-xs">
                  by {file.uploader.firstName} {file.uploader.lastName}
                </div>
              )}
            </div>
          </div>

          {/* File Preview */}
          {isPreviewable && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="h-4 w-4" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isImage ? (
                  <div className="relative">
                    {isImageLoading && (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="animate-pulse text-gray-400">Loading image...</div>
                      </div>
                    )}
                    {!imageError && (
                      <Image
                        src={file.fileUrl}
                        alt={file.name}
                        width={800}
                        height={600}
                        className={`rounded-lg border max-h-96 w-auto mx-auto ${
                          isImageLoading ? 'hidden' : 'block'
                        }`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                      />
                    )}
                    {imageError && (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <FileImage className="h-8 w-8 mx-auto mb-2" />
                          <div className="text-sm">Unable to load image preview</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isPdf ? (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <FileType className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <div className="text-lg font-medium mb-2">PDF Document</div>
                      <div className="text-sm text-gray-600 mb-4">
                        Click "Open" to view the PDF in a new tab
                      </div>
                      <Button onClick={handleOpenInNewTab}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open PDF
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* File Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Original Name
                  </label>
                  <p className="text-sm font-medium mt-1">{file.originalName || file.name}</p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    File Type
                  </label>
                  <p className="text-sm font-medium mt-1">{file.fileType?.toUpperCase() || 'Unknown'}</p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    MIME Type
                  </label>
                  <p className="text-sm font-medium mt-1 font-mono text-xs">{file.mimeType}</p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    File Size
                  </label>
                  <p className="text-sm font-medium mt-1">{formatFileSize(file.fileSize)}</p>
                </div>

                {file.description && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Description
                    </label>
                    <p className="text-sm mt-1">{file.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organization & Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HardDrive className="h-4 w-4" />
                  Organization & Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Folder
                  </label>
                  <p className="text-sm font-medium mt-1 capitalize">{file.folder}</p>
                </div>
                
                {file.category && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Category
                    </label>
                    <p className="text-sm font-medium mt-1 capitalize">{file.category}</p>
                  </div>
                )}
                
                {file.version && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Version
                    </label>
                    <p className="text-sm font-medium mt-1">{file.version}</p>
                  </div>
                )}

                {file.tags && file.tags.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {file.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Visibility
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    {file.isPublic ? (
                      <Badge variant="outline" className="text-xs">
                        <Share2 className="h-3 w-3 mr-1" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Private
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Status
                  </label>
                  <Badge 
                    variant={file.status === 'active' ? 'default' : 'secondary'}
                    className="mt-1"
                  >
                    {file.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload & Modification History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Uploaded
                  </label>
                  <div className="mt-1">
                    <div className="text-sm font-medium">
                      {format(new Date(file.uploadedAt), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-gray-600">
                      {format(new Date(file.uploadedAt), 'h:mm a')}
                    </div>
                    {file.uploader && (
                      <div className="text-xs text-gray-600 mt-1">
                        by {file.uploader.firstName} {file.uploader.lastName}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Created
                  </label>
                  <div className="mt-1">
                    <div className="text-sm font-medium">
                      {format(new Date(file.createdAt), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-gray-600">
                      {format(new Date(file.createdAt), 'h:mm a')}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Last Modified
                  </label>
                  <div className="mt-1">
                    <div className="text-sm font-medium">
                      {format(new Date(file.updatedAt), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-gray-600">
                      {format(new Date(file.updatedAt), 'h:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
              <CardDescription>
                Available actions for this file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="default"
                  onClick={() => onDownload(file)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onEdit(file)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Information
                </Button>

                {isPreviewable && (
                  <Button
                    variant="outline"
                    onClick={handleOpenInNewTab}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(file.fileUrl)
                    // You could show a toast notification here
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}