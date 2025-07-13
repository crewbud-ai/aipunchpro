export interface PhotoUploadResult {
    success: boolean
    data?: {
        url: string
        fileName: string
        fileSize: number
    }
    error?: string
}

export interface BulkPhotoUploadResult {
    success: boolean
    data?: {
        uploadedPhotos: Array<{
            url: string
            fileName: string
            fileSize: number
        }>
        failedPhotos: Array<{
            fileName: string
            error: string
        }>
    }
    error?: string
}