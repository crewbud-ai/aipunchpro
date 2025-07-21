export interface StatusCoordinationResult {
    success: boolean
    data?: {
        project: any
        updatedCount: number
        skippedCount: number
        scheduleProjects: Array<{
            id: string
            title: string
            status: string
        }>
    }
    message: string
    error?: string
}


export interface StatusValidationResult {
    canChange: boolean
    warnings?: string[]
    blockers?: string[]
    childEntityCounts?: {
        scheduleProjects?: Record<string, number>
        punchlistItems?: Record<string, number>
        activeTeamMembers?: number
    }
}

export interface ProjectStatusManagerProps {
    project: {
        id: string
        status: string
        name: string
    }
    onStatusChange?: (newStatus: string) => void
    className?: string
    disabled?: boolean
}

export interface StatusCoordinationResult {
    success: boolean
    data?: {
        project: any
        updatedCount: number
        skippedCount: number
        scheduleProjects: Array<{
            id: string
            title: string
            status: string
        }>
    }
    message: string
    error?: string
}

export interface CoordinatedProjectStatusResult {
    success: boolean
    data?: {
        project: any
        cascadeResults: {
            scheduleProjectsUpdated: number
            scheduleProjectsSkipped: number
            updatedScheduleProjects: Array<{
                id: string
                title: string
                newStatus: string
            }>
        }
    }
    message: string
    error?: string
}



export interface CoordinatedProjectStatusUpdate {
    projectId: string
    status: string
    notes?: string
    actualStartDate?: string
    actualEndDate?: string
    skipChildValidation?: boolean
}




export function isValidStatusValidationResult(obj: any): obj is StatusValidationResult {
    return (
        obj &&
        typeof obj === 'object' &&
        typeof obj.canChange === 'boolean'
    )
}

export function safeArrayLength(arr: any[] | undefined | null): number {
    return Array.isArray(arr) ? arr.length : 0
}

