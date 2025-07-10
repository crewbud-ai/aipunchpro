// ==============================================
// src/hooks/team-members/use-team-member.ts - Single Team Member Hook
// ==============================================

import { useState, useCallback, useEffect } from 'react'
import { teamMembersApi } from '@/lib/api/team-members'
import type {
    TeamMember,
    TeamMemberState,
    GetTeamMemberResult,
    UpdateTeamMemberData,
    UpdateTeamMemberStatusData,
} from '@/types/team-members'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseTeamMemberState {
    teamMember: TeamMember | null
    state: TeamMemberState
    error: string | null

    // Enhanced state for optimistic updates
    isUpdating: boolean
    lastUpdateField: string | null
}

interface UseTeamMemberActions {
    loadTeamMember: (id: string) => Promise<void>
    refreshTeamMember: () => Promise<void>
    clearError: () => void
    reset: () => void

    // Update actions (using the single updateTeamMember method)
    updateTeamMemberField: (field: keyof TeamMember, value: any, notes?: string) => Promise<void>
    updateTeamMemberRole: (role: TeamMember['role']) => Promise<void>
    updateTeamMemberStatus: (isActive: boolean, reason?: string, notes?: string) => Promise<void>
    updateTeamMemberRates: (hourlyRate?: number, overtimeRate?: number) => Promise<void>
    updateTeamMemberContact: (phone?: string, emergencyContactName?: string, emergencyContactPhone?: string) => Promise<void>

    // Optimistic update helpers
    optimisticUpdate: (field: keyof TeamMember, value: any) => void
    revertOptimisticUpdate: () => void
}

interface UseTeamMemberReturn extends UseTeamMemberState, UseTeamMemberActions {
    // Computed properties
    hasTeamMember: boolean
    isLoading: boolean
    isLoaded: boolean
    hasError: boolean
    isNotFound: boolean

    // Enhanced computed properties
    fullName: string
    displayRole: string
    displayTrade: string
    isActive: boolean
    hasHourlyRate: boolean
    hasOvertimeRate: boolean
    hasPhone: boolean
    hasEmergencyContact: boolean
    activeProjectCount: number
    assignmentStatus: 'not_assigned' | 'assigned' | 'inactive'

    // Display helpers
    displayName: string
    displayContactInfo: string
    displayRates: string
    displayStatus: string
    statusColor: 'green' | 'yellow' | 'red' | 'gray'
}

// ==============================================
// MAIN HOOK
// ==============================================
export const useTeamMember = (initialTeamMemberId?: string) => {
    // ==============================================
    // STATE
    // ==============================================
    const [state, setState] = useState<UseTeamMemberState>({
        teamMember: null,
        state: initialTeamMemberId ? 'loading' : 'loaded',
        error: null,
        isUpdating: false,
        lastUpdateField: null,
    })

    const [currentTeamMemberId, setCurrentTeamMemberId] = useState<string | null>(
        initialTeamMemberId || null
    )

    const [originalTeamMember, setOriginalTeamMember] = useState<TeamMember | null>(null)

    // ==============================================
    // COMPUTED PROPERTIES
    // ==============================================
    const hasTeamMember = state.teamMember !== null
    const isLoading = state.state === 'loading'
    const isLoaded = state.state === 'loaded'
    const hasError = state.state === 'error'
    const isNotFound = state.state === 'not_found'

    // Enhanced computed properties
    const fullName = state.teamMember ? `${state.teamMember.firstName} ${state.teamMember.lastName}` : ''
    const displayRole = state.teamMember?.role ?
        state.teamMember.role.charAt(0).toUpperCase() + state.teamMember.role.slice(1).replace('_', ' ') : ''
    const displayTrade = state.teamMember?.tradeSpecialty ?
        state.teamMember.tradeSpecialty.charAt(0).toUpperCase() + state.teamMember.tradeSpecialty.slice(1) : 'No Specialty'
    const isActive = state.teamMember?.isActive ?? false
    const hasHourlyRate = !!(state.teamMember?.hourlyRate)
    const hasOvertimeRate = !!(state.teamMember?.overtimeRate)
    const hasPhone = !!(state.teamMember?.phone)
    const hasEmergencyContact = !!(state.teamMember?.emergencyContactName && state.teamMember?.emergencyContactPhone)
    const activeProjectCount = state.teamMember?.activeProjectCount ?? 0
    const assignmentStatus = state.teamMember?.assignmentStatus ?? 'not_assigned'

    // Display helpers
    const displayName = fullName
    const displayContactInfo = state.teamMember ?
        [state.teamMember.email, state.teamMember.phone].filter(Boolean).join(' • ') : ''
    const displayRates = state.teamMember ?
        [
            state.teamMember.hourlyRate ? `$${state.teamMember.hourlyRate}/hr` : null,
            state.teamMember.overtimeRate ? `$${state.teamMember.overtimeRate}/hr OT` : null
        ].filter(Boolean).join(' • ') : ''

    const displayStatus = isActive ? 'Active' : 'Inactive'
    const statusColor: 'green' | 'yellow' | 'red' | 'gray' =
        !isActive ? 'gray' :
            assignmentStatus === 'assigned' ? 'green' :
                assignmentStatus === 'not_assigned' ? 'yellow' : 'red'

    // ==============================================
    // CLEAR ERROR
    // ==============================================
    const clearError = useCallback(() => {
        setState(prev => ({
            ...prev,
            error: null,
            state: prev.state === 'error' ? 'loaded' : prev.state,
        }))
    }, [])

    // ==============================================
    // RESET STATE
    // ==============================================
    const reset = useCallback(() => {
        setState({
            teamMember: null,
            state: 'loaded',
            error: null,
            isUpdating: false,
            lastUpdateField: null,
        })
        setCurrentTeamMemberId(null)
        setOriginalTeamMember(null)
    }, [])

    // ==============================================
    // LOAD TEAM MEMBER
    // ==============================================
    const loadTeamMember = useCallback(async (id: string) => {
        if (!id) {
            setState(prev => ({
                ...prev,
                state: 'error',
                error: 'Team member ID is required',
            }))
            return
        }

        try {
            setState(prev => ({
                ...prev,
                state: 'loading',
                error: null,
                isUpdating: false,
                lastUpdateField: null,
            }))

            setCurrentTeamMemberId(id)

            const response = await teamMembersApi.getTeamMember(id)

            if (response.success) {
                const teamMember = response.data.teamMember
                setState(prev => ({
                    ...prev,
                    teamMember,
                    state: 'loaded',
                    error: null,
                    isUpdating: false,
                    lastUpdateField: null,
                }))
                setOriginalTeamMember(teamMember)
            } else {
                setState(prev => ({
                    ...prev,
                    teamMember: null,
                    state: 'error',
                    error: response.message || 'Failed to load team member',
                    isUpdating: false,
                    lastUpdateField: null,
                }))
            }
        } catch (error: any) {
            console.error('Error loading team member:', error)

            // Handle specific error cases
            if (error.status === 404) {
                setState(prev => ({
                    ...prev,
                    teamMember: null,
                    state: 'not_found',
                    error: 'Team member not found',
                    isUpdating: false,
                    lastUpdateField: null,
                }))
            } else {
                setState(prev => ({
                    ...prev,
                    teamMember: null,
                    state: 'error',
                    error: error.message || 'Failed to load team member',
                    isUpdating: false,
                    lastUpdateField: null,
                }))
            }
        }
    }, [])

    // ==============================================
    // REFRESH TEAM MEMBER
    // ==============================================
    const refreshTeamMember = useCallback(async () => {
        if (currentTeamMemberId) {
            await loadTeamMember(currentTeamMemberId)
        }
    }, [currentTeamMemberId, loadTeamMember])

    // ==============================================
    // FIXED updateTeamMemberField function
    // ==============================================
    const updateTeamMemberField = useCallback(async (
        field: keyof TeamMember,
        value: any,
        notes?: string
    ) => {
        if (!state.teamMember || !currentTeamMemberId) {
            throw new Error('No team member loaded')
        }

        try {
            setState(prev => ({
                ...prev,
                isUpdating: true,
                lastUpdateField: field,
                error: null,
            }))

            // Optimistic update
            setState(prev => ({
                ...prev,
                teamMember: prev.teamMember ? { ...prev.teamMember, [field]: value } : null,
            }))

            // Create update data with required id field
            const updateData: UpdateTeamMemberData = {
                id: currentTeamMemberId, // Add the required id field
                [field]: value
            }

            const response = await teamMembersApi.updateTeamMember(currentTeamMemberId, updateData)

            if (response.success) {
                setState(prev => ({
                    ...prev,
                    teamMember: response.data.teamMember,
                    isUpdating: false,
                    lastUpdateField: null,
                    error: null,
                }))
            } else {
                // Revert optimistic update on failure
                setState(prev => ({
                    ...prev,
                    teamMember: originalTeamMember,
                    isUpdating: false,
                    lastUpdateField: null,
                    error: response.message || 'Failed to update team member',
                }))
            }
        } catch (error: any) {
            console.error('Error updating team member field:', error)

            // Revert optimistic update on error
            setState(prev => ({
                ...prev,
                teamMember: originalTeamMember,
                isUpdating: false,
                lastUpdateField: null,
                error: error.message || 'Failed to update team member',
            }))
        }
    }, [state.teamMember, currentTeamMemberId, originalTeamMember])

    const updateTeamMemberRole = useCallback(async (role: TeamMember['role']) => {
        await updateTeamMemberField('role', role)
    }, [updateTeamMemberField])

    const updateTeamMemberStatus = useCallback(async (
        isActive: boolean,
        reason?: string,
        notes?: string
    ) => {
        if (!currentTeamMemberId) {
            throw new Error('No team member loaded')
        }

        try {
            setState(prev => ({
                ...prev,
                isUpdating: true,
                lastUpdateField: 'isActive',
                error: null,
            }))

            // Use the status update endpoint
            const statusData: UpdateTeamMemberStatusData = {
                id: currentTeamMemberId,
                isActive,
                reason,
                notes,
            }

            const response = await teamMembersApi.updateTeamMemberStatus(statusData)

            if (response.success) {
                // Refresh the team member to get updated data
                await refreshTeamMember()
            } else {
                setState(prev => ({
                    ...prev,
                    isUpdating: false,
                    lastUpdateField: null,
                    error: response.message || 'Failed to update team member status',
                }))
            }
        } catch (error: any) {
            console.error('Error updating team member status:', error)
            setState(prev => ({
                ...prev,
                isUpdating: false,
                lastUpdateField: null,
                error: error.message || 'Failed to update team member status',
            }))
        }
    }, [currentTeamMemberId, refreshTeamMember])

    const updateTeamMemberRates = useCallback(async (
        hourlyRate?: number,
        overtimeRate?: number
    ) => {
        if (!currentTeamMemberId) {
            throw new Error('No team member loaded')
        }

        // Create update data with required id field
        const updateData: UpdateTeamMemberData = {
            id: currentTeamMemberId, // Add the required id field
        }

        if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate
        if (overtimeRate !== undefined) updateData.overtimeRate = overtimeRate

        try {
            setState(prev => ({
                ...prev,
                isUpdating: true,
                lastUpdateField: 'rates',
                error: null,
            }))

            const response = await teamMembersApi.updateTeamMember(currentTeamMemberId, updateData)

            if (response.success) {
                setState(prev => ({
                    ...prev,
                    teamMember: response.data.teamMember,
                    isUpdating: false,
                    lastUpdateField: null,
                    error: null,
                }))
            } else {
                setState(prev => ({
                    ...prev,
                    isUpdating: false,
                    lastUpdateField: null,
                    error: response.message || 'Failed to update team member rates',
                }))
            }
        } catch (error: any) {
            console.error('Error updating team member rates:', error)
            setState(prev => ({
                ...prev,
                isUpdating: false,
                lastUpdateField: null,
                error: error.message || 'Failed to update team member rates',
            }))
        }
    }, [currentTeamMemberId])

    const updateTeamMemberContact = useCallback(async (
        phone?: string,
        emergencyContactName?: string,
        emergencyContactPhone?: string
    ) => {
        if (!currentTeamMemberId) {
            throw new Error('No team member loaded')
        }

        // Create update data with required id field
        const updateData: UpdateTeamMemberData = {
            id: currentTeamMemberId, // Add the required id field
        }

        if (phone !== undefined) updateData.phone = phone
        if (emergencyContactName !== undefined) updateData.emergencyContactName = emergencyContactName
        if (emergencyContactPhone !== undefined) updateData.emergencyContactPhone = emergencyContactPhone

        try {
            setState(prev => ({
                ...prev,
                isUpdating: true,
                lastUpdateField: 'contact',
                error: null,
            }))

            const response = await teamMembersApi.updateTeamMember(currentTeamMemberId, updateData)

            if (response.success) {
                setState(prev => ({
                    ...prev,
                    teamMember: response.data.teamMember,
                    isUpdating: false,
                    lastUpdateField: null,
                    error: null,
                }))
            } else {
                setState(prev => ({
                    ...prev,
                    isUpdating: false,
                    lastUpdateField: null,
                    error: response.message || 'Failed to update team member contact information',
                }))
            }
        } catch (error: any) {
            console.error('Error updating team member contact:', error)
            setState(prev => ({
                ...prev,
                isUpdating: false,
                lastUpdateField: null,
                error: error.message || 'Failed to update team member contact information',
            }))
        }
    }, [currentTeamMemberId])

    // ==============================================
    // OPTIMISTIC UPDATE HELPERS
    // ==============================================
    const optimisticUpdate = useCallback((field: keyof TeamMember, value: any) => {
        setState(prev => ({
            ...prev,
            teamMember: prev.teamMember ? { ...prev.teamMember, [field]: value } : null,
        }))
    }, [])

    const revertOptimisticUpdate = useCallback(() => {
        setState(prev => ({
            ...prev,
            teamMember: originalTeamMember,
        }))
    }, [originalTeamMember])

    // ==============================================
    // INITIAL LOAD
    // ==============================================
    useEffect(() => {
        if (initialTeamMemberId) {
            loadTeamMember(initialTeamMemberId)
        }
    }, [initialTeamMemberId, loadTeamMember])

    // ==============================================
    // RETURN HOOK INTERFACE
    // ==============================================
    return {
        // State
        teamMember: state.teamMember,
        state: state.state,
        error: state.error,
        isUpdating: state.isUpdating,
        lastUpdateField: state.lastUpdateField,

        // Computed properties
        hasTeamMember,
        isLoading,
        isLoaded,
        hasError,
        isNotFound,
        fullName,
        displayRole,
        displayTrade,
        isActive,
        hasHourlyRate,
        hasOvertimeRate,
        hasPhone,
        hasEmergencyContact,
        activeProjectCount,
        assignmentStatus,
        displayName,
        displayContactInfo,
        displayRates,
        displayStatus,
        statusColor,

        // Actions
        loadTeamMember,
        refreshTeamMember,
        clearError,
        reset,
        updateTeamMemberField,
        updateTeamMemberRole,
        updateTeamMemberStatus,
        updateTeamMemberRates,
        updateTeamMemberContact,
        optimisticUpdate,
        revertOptimisticUpdate,
    } satisfies UseTeamMemberReturn
}