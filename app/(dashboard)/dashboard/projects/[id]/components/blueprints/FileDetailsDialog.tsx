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
import { formatFileSize, getFileIcon, getFolderConfig } from "@/utils/format-functions"

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
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-full sm:max-w-5xl">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
            <div className="flex-1 w-full sm:w-auto min-w-0">
              <DialogTitle className="text-base sm:text-xl font-semibold pr-0 sm:pr-8 truncate">
                {file.name}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm">
                File details and information
              </DialogDescription>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(file)}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Download</span>
                <span className="sm:hidden">Down</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(file)}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Edit
              </Button>
              {isPreviewable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Open
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* File Overview */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className={`p-2 sm:p-3 rounded-lg ${fileConfig.bgColor} flex-shrink-0`}>
              <FileIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${fileConfig.color}`} />
            </div>

            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                <Badge variant="outline" className={`${folderConfig.color} text-xs`}>
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

                <Badge variant={file.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {file.status}
                </Badge>

                {file.isPublic && (
                  <Badge variant="outline" className="text-xs">
                    <Share2 className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                )}
              </div>

              <div className="text-xs sm:text-sm text-gray-600 truncate">
                {formatFileSize(file.fileSize)} • {file.mimeType}
              </div>
            </div>

            <div className="text-left sm:text-right text-xs sm:text-sm text-gray-600 w-full sm:w-auto">
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
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Eye className="h-4 w-4" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {isImage ? (
                  <div className="relative">
                    {isImageLoading && (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="animate-pulse text-gray-400 text-sm">Loading image...</div>
                      </div>
                    )}
                    {!imageError && (
                      <Image
                        src={file.fileUrl}
                        alt={file.name}
                        width={800}
                        height={600}
                        className={`rounded-lg border max-h-64 sm:max-h-96 w-auto mx-auto ${isImageLoading ? 'hidden' : 'block'
                          }`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                      />
                    )}
                    {imageError && (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <FileImage className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
                          <div className="text-xs sm:text-sm">Unable to load image preview</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isPdf ? (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center p-4">
                    <div className="text-center">
                      <FileType className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
                      <div className="text-base sm:text-lg font-medium mb-2">PDF Document</div>
                      <div className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                        Click "Open" to view the PDF in a new tab
                      </div>
                      <Button onClick={handleOpenInNewTab} size="sm" className="text-sm">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Info className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Original Name
                  </label>
                  <p className="text-xs sm:text-sm font-medium mt-1 truncate">{file.originalName || file.name}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    File Type
                  </label>
                  <p className="text-xs sm:text-sm font-medium mt-1">{file.fileType?.toUpperCase() || 'Unknown'}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    MIME Type
                  </label>
                  <p className="text-xs font-medium mt-1 font-mono break-all">{file.mimeType}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    File Size
                  </label>
                  <p className="text-xs sm:text-sm font-medium mt-1">{formatFileSize(file.fileSize)}</p>
                </div>

                {file.description && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Description
                    </label>
                    <p className="text-xs sm:text-sm mt-1">{file.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organization & Metadata */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <HardDrive className="h-4 w-4" />
                  Organization & Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Folder
                  </label>
                  <p className="text-xs sm:text-sm font-medium mt-1 capitalize">{file.folder}</p>
                </div>

                {file.category && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Category
                    </label>
                    <p className="text-xs sm:text-sm font-medium mt-1 capitalize">{file.category}</p>
                  </div>
                )}

                {file.version && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Version
                    </label>
                    <p className="text-xs sm:text-sm font-medium mt-1">{file.version}</p>
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
                    className="mt-1 text-xs"
                  >
                    {file.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload & Modification History */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Clock className="h-4 w-4" />
                History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Uploaded
                  </label>
                  <div className="mt-1">
                    <div className="text-xs sm:text-sm font-medium">
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
                    <div className="text-xs sm:text-sm font-medium">
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
                    <div className="text-xs sm:text-sm font-medium">
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
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-base">Actions</CardTitle>
              <CardDescription className="text-sm">
                Available actions for this file
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                <Button
                  variant="default"
                  onClick={() => onDownload(file)}
                  className="text-xs sm:text-sm"
                  size="sm"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Download File</span>
                  <span className="sm:hidden">Download</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onEdit(file)}
                  className="text-xs sm:text-sm"
                  size="sm"
                >
                  <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Edit Information</span>
                  <span className="sm:hidden">Edit</span>
                </Button>

                {isPreviewable && (
                  <Button
                    variant="outline"
                    onClick={handleOpenInNewTab}
                    className="text-xs sm:text-sm"
                    size="sm"
                  >
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Open in New Tab</span>
                    <span className="sm:hidden">Open</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(file.fileUrl)
                    // You could show a toast notification here
                  }}
                  className="text-xs sm:text-sm"
                  size="sm"
                >
                  <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Copy Link</span>
                  <span className="sm:hidden">Copy</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}