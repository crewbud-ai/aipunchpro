// ==============================================
// hooks/punchlist-items/use-punchlist-item.ts - Individual Punchlist Item Hook
// ==============================================

import { useState, useCallback, useEffect } from 'react'
import { punchlistItemsApi } from '@/lib/api/punchlist-items'
import {
  type PunchlistItemWithDetails,
  type PunchlistItemState,
  type GetPunchlistItemResult,
  type QuickUpdatePunchlistStatusData,
} from '@/types/punchlist-items'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UsePunchlistItemState {
  punchlistItem: PunchlistItemWithDetails | null
  state: PunchlistItemState
  error: string | null
}

interface UsePunchlistItemActions {
  loadPunchlistItem: (id: string) => Promise<void>
  refreshPunchlistItem: () => Promise<void>
  clearError: () => void
  reset: () => void

  // Quick status update
  updateStatus: (data: QuickUpdatePunchlistStatusData) => Promise<void>
}

interface UsePunchlistItemReturn extends UsePunchlistItemState, UsePunchlistItemActions {
  // Computed properties
  isLoading: boolean
  isLoaded: boolean
  isError: boolean
  isNotFound: boolean
  hasPunchlistItem: boolean
  
  // Item properties for easy access
  isOverdue: boolean
  isHighPriority: boolean
  requiresInspection: boolean
  isCompleted: boolean
  canBeUpdated: boolean
  hasPhotos: boolean
  hasAttachments: boolean
}

// ==============================================
// MAIN HOOK
// ==============================================
export function usePunchlistItem(initialId?: string) {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UsePunchlistItemState>({
    punchlistItem: null,
    state: initialId ? 'loading' : 'not_found',
    error: null,
  })

  const [currentId, setCurrentId] = useState<string | null>(initialId || null)

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const isLoading = state.state === 'loading'
  const isLoaded = state.state === 'loaded'
  const isError = state.state === 'error'
  const isNotFound = state.state === 'not_found'
  const hasPunchlistItem = !!state.punchlistItem

  // Item specific computed properties
  const isOverdue = (() => {
    if (!state.punchlistItem?.dueDate || state.punchlistItem.status === 'completed') return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(state.punchlistItem.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate < today
  })()

  const isHighPriority = state.punchlistItem?.priority === 'high' || state.punchlistItem?.priority === 'critical'
  
  const requiresInspection = state.punchlistItem?.requiresInspection || false
  
  const isCompleted = state.punchlistItem?.status === 'completed'
  
  const canBeUpdated = state.punchlistItem?.status !== 'completed' && state.punchlistItem?.status !== 'rejected'
  
  const hasPhotos = (state.punchlistItem?.photos?.length || 0) > 0
  
  const hasAttachments = (state.punchlistItem?.attachments?.length || 0) > 0

  // ==============================================
  // LOAD PUNCHLIST ITEM
  // ==============================================
  const loadPunchlistItem = useCallback(async (id: string) => {
    try {
      setState(prev => ({
        ...prev,
        state: 'loading',
        error: null,
      }))

      setCurrentId(id)

      const response = await punchlistItemsApi.getPunchlistItem(id)

      if (response.success) {
        setState(prev => ({
          ...prev,
          punchlistItem: response.data.punchlistItem,
          state: 'loaded',
        }))
      } else {
        setState(prev => ({
          ...prev,
          state: 'not_found',
          error: 'Punchlist item not found',
        }))
      }
    } catch (error) {
      console.error('Error loading punchlist item:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load punchlist item'
      
      // Check if it's a 404 error
      const isNotFoundError = errorMessage.includes('not found') || errorMessage.includes('404')
      
      setState(prev => ({
        ...prev,
        state: isNotFoundError ? 'not_found' : 'error',
        error: errorMessage,
      }))
    }
  }, [])

  // ==============================================
  // REFRESH PUNCHLIST ITEM
  // ==============================================
  const refreshPunchlistItem = useCallback(async () => {
    if (currentId) {
      await loadPunchlistItem(currentId)
    }
  }, [currentId, loadPunchlistItem])

  // ==============================================
  // QUICK STATUS UPDATE
  // ==============================================
  const updateStatus = useCallback(async (data: QuickUpdatePunchlistStatusData) => {
    try {
      setState(prev => ({
        ...prev,
        error: null,
      }))

      const response = await punchlistItemsApi.updatePunchlistStatus(data)

      if (response.success) {
        setState(prev => ({
          ...prev,
          punchlistItem: response.data.punchlistItem,
        }))
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating punchlist item status:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status'
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }))

      // Re-throw so the calling component can handle it if needed
      throw error
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Reset state
  const reset = useCallback(() => {
    setState({
      punchlistItem: null,
      state: 'not_found',
      error: null,
    })
    setCurrentId(null)
  }, [])

  // ==============================================
  // EFFECTS
  // ==============================================

  // Load initial data if ID provided
  useEffect(() => {
    if (initialId) {
      loadPunchlistItem(initialId)
    }
  }, [initialId, loadPunchlistItem])

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    punchlistItem: state.punchlistItem,
    state: state.state,
    error: state.error,

    // Computed values
    isLoading,
    isLoaded,
    isError,
    isNotFound,
    hasPunchlistItem,
    
    // Item properties
    isOverdue,
    isHighPriority,
    requiresInspection,
    isCompleted,
    canBeUpdated,
    hasPhotos,
    hasAttachments,

    // Actions
    loadPunchlistItem,
    refreshPunchlistItem,
    updateStatus,
    clearError,
    reset,
  }
}

// Export default
export default usePunchlistItem