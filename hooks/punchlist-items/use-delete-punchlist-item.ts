// ==============================================
// hooks/punchlist-items/use-delete-punchlist-item.ts - Delete Punchlist Item Hook
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { punchlistItemsApi } from '@/lib/api/punchlist-items'
import type {
  PunchlistItemWithDetails,
  DeletePunchlistItemResult,
} from '@/types/punchlist-items'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseDeletePunchlistItemState {
  isDeleting: boolean
  deleteResult: DeletePunchlistItemResult | null
  error: string | null
  
  // Confirmation dialog state
  showConfirmDialog: boolean
  punchlistItemToDelete: PunchlistItemWithDetails | null
}

interface UseDeletePunchlistItemActions {
  deletePunchlistItem: (punchlistItemId: string) => Promise<void>
  confirmDelete: (punchlistItem: PunchlistItemWithDetails) => void
  cancelDelete: () => void
  executeDelete: () => Promise<void>
  clearError: () => void
  reset: () => void
}

interface UseDeletePunchlistItemReturn extends UseDeletePunchlistItemState, UseDeletePunchlistItemActions {
  // Computed properties
  hasError: boolean
  isSuccess: boolean
  canDelete: boolean
}

// ==============================================
// MAIN HOOK
// ==============================================
export const useDeletePunchlistItem = () => {
  const router = useRouter()

  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseDeletePunchlistItemState>({
    isDeleting: false,
    deleteResult: null,
    error: null,
    showConfirmDialog: false,
    punchlistItemToDelete: null,
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const hasError = !!state.error
  const isSuccess = !!state.deleteResult?.success
  const canDelete = !state.isDeleting && !!state.punchlistItemToDelete

  // ==============================================
  // DELETE PUNCHLIST ITEM (DIRECT)
  // ==============================================
  const deletePunchlistItem = useCallback(async (punchlistItemId: string) => {
    try {
      setState(prev => ({
        ...prev,
        isDeleting: true,
        error: null,
      }))

      const response = await punchlistItemsApi.deletePunchlistItem(punchlistItemId)

      setState(prev => ({
        ...prev,
        isDeleting: false,
        deleteResult: response,
      }))

      // Navigate back to punchlist items list after successful deletion
      setTimeout(() => {
        router.push('/dashboard/punchlist')
      }, 1000)

    } catch (error) {
      console.error('Error deleting punchlist item:', error)
      
      setState(prev => ({
        ...prev,
        isDeleting: false,
        error: error instanceof Error ? error.message : 'Failed to delete punchlist item',
      }))
      
      throw error
    }
  }, [router])

  // ==============================================
  // CONFIRM DELETE (WITH DIALOG)
  // ==============================================
  const confirmDelete = useCallback((punchlistItem: PunchlistItemWithDetails) => {
    setState(prev => ({
      ...prev,
      showConfirmDialog: true,
      punchlistItemToDelete: punchlistItem,
      error: null,
    }))
  }, [])

  // ==============================================
  // CANCEL DELETE
  // ==============================================
  const cancelDelete = useCallback(() => {
    setState(prev => ({
      ...prev,
      showConfirmDialog: false,
      punchlistItemToDelete: null,
      error: null,
    }))
  }, [])

  // ==============================================
  // EXECUTE DELETE (FROM CONFIRMATION DIALOG)
  // ==============================================
  const executeDelete = useCallback(async () => {
    if (!state.punchlistItemToDelete) {
      setState(prev => ({
        ...prev,
        error: 'No punchlist item selected for deletion',
      }))
      return
    }

    try {
      setState(prev => ({
        ...prev,
        isDeleting: true,
        showConfirmDialog: false,
        error: null,
      }))

      const response = await punchlistItemsApi.deletePunchlistItem(state.punchlistItemToDelete.id)

      setState(prev => ({
        ...prev,
        isDeleting: false,
        deleteResult: response,
        punchlistItemToDelete: null,
      }))

      // Navigate back to punchlist items list after successful deletion
      setTimeout(() => {
        router.push('/dashboard/punchlist')
      }, 1000)

    } catch (error) {
      console.error('Error deleting punchlist item:', error)
      
      setState(prev => ({
        ...prev,
        isDeleting: false,
        showConfirmDialog: false,
        error: error instanceof Error ? error.message : 'Failed to delete punchlist item',
      }))
      
      throw error
    }
  }, [state.punchlistItemToDelete, router])

  // ==============================================
  // CLEAR ERROR
  // ==============================================
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // ==============================================
  // RESET
  // ==============================================
  const reset = useCallback(() => {
    setState({
      isDeleting: false,
      deleteResult: null,
      error: null,
      showConfirmDialog: false,
      punchlistItemToDelete: null,
    })
  }, [])

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    isDeleting: state.isDeleting,
    deleteResult: state.deleteResult,
    error: state.error,
    showConfirmDialog: state.showConfirmDialog,
    punchlistItemToDelete: state.punchlistItemToDelete,

    // Computed properties
    hasError,
    isSuccess,
    canDelete,

    // Actions
    deletePunchlistItem,
    confirmDelete,
    cancelDelete,
    executeDelete,
    clearError,
    reset,
  }
}

// ==============================================
// BULK DELETE HOOK
// ==============================================
interface UseBulkDeletePunchlistItemsState {
  isDeleting: boolean
  deleteResults: DeletePunchlistItemResult[]
  errors: string[]
  selectedItems: PunchlistItemWithDetails[]
}

interface UseBulkDeletePunchlistItemsActions {
  selectItem: (punchlistItem: PunchlistItemWithDetails) => void
  deselectItem: (punchlistItemId: string) => void
  selectAll: (punchlistItems: PunchlistItemWithDetails[]) => void
  deselectAll: () => void
  deleteSelected: () => Promise<void>
  clearErrors: () => void
  reset: () => void
}

interface UseBulkDeletePunchlistItemsReturn extends UseBulkDeletePunchlistItemsState, UseBulkDeletePunchlistItemsActions {
  // Computed properties
  hasSelectedItems: boolean
  selectedCount: number
  hasErrors: boolean
  isSuccess: boolean
  canDelete: boolean
}

export const useBulkDeletePunchlistItems = () => {
  const router = useRouter()

  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseBulkDeletePunchlistItemsState>({
    isDeleting: false,
    deleteResults: [],
    errors: [],
    selectedItems: [],
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const hasSelectedItems = state.selectedItems.length > 0
  const selectedCount = state.selectedItems.length
  const hasErrors = state.errors.length > 0
  const isSuccess = state.deleteResults.length > 0 && state.errors.length === 0
  const canDelete = hasSelectedItems && !state.isDeleting

  // ==============================================
  // SELECT/DESELECT ITEMS
  // ==============================================
  const selectItem = useCallback((punchlistItem: PunchlistItemWithDetails) => {
    setState(prev => {
      const isAlreadySelected = prev.selectedItems.some(item => item.id === punchlistItem.id)
      if (isAlreadySelected) return prev

      return {
        ...prev,
        selectedItems: [...prev.selectedItems, punchlistItem],
      }
    })
  }, [])

  const deselectItem = useCallback((punchlistItemId: string) => {
    setState(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter(item => item.id !== punchlistItemId),
    }))
  }, [])

  const selectAll = useCallback((punchlistItems: PunchlistItemWithDetails[]) => {
    setState(prev => ({
      ...prev,
      selectedItems: punchlistItems,
    }))
  }, [])

  const deselectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedItems: [],
    }))
  }, [])

  // ==============================================
  // DELETE SELECTED ITEMS
  // ==============================================
  const deleteSelected = useCallback(async () => {
    if (state.selectedItems.length === 0) return

    try {
      setState(prev => ({
        ...prev,
        isDeleting: true,
        errors: [],
        deleteResults: [],
      }))

      const deletePromises = state.selectedItems.map(async (item) => {
        try {
          const result = await punchlistItemsApi.deletePunchlistItem(item.id)
          return { success: true, result, itemId: item.id }
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to delete item',
            itemId: item.id 
          }
        }
      })

      const results = await Promise.all(deletePromises)
      
      const successResults = results.filter(r => r.success).map(r => r.result!)
      const errorMessages = results.filter(r => !r.success).map(r => `${r.itemId}: ${r.error}`)

      setState(prev => ({
        ...prev,
        isDeleting: false,
        deleteResults: successResults,
        errors: errorMessages,
        selectedItems: errorMessages.length > 0 ? 
          prev.selectedItems.filter(item => 
            results.some(r => !r.success && r.itemId === item.id)
          ) : [], // Keep only failed items selected
      }))

      // If all deletions were successful, navigate back
      if (errorMessages.length === 0) {
        setTimeout(() => {
          router.push('/dashboard/punchlist')
        }, 1500)
      }

    } catch (error) {
      console.error('Error in bulk delete:', error)
      setState(prev => ({
        ...prev,
        isDeleting: false,
        errors: ['An unexpected error occurred during bulk deletion'],
      }))
    }
  }, [state.selectedItems, router])

  // ==============================================
  // CLEAR ERRORS
  // ==============================================
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: [] }))
  }, [])

  // ==============================================
  // RESET
  // ==============================================
  const reset = useCallback(() => {
    setState({
      isDeleting: false,
      deleteResults: [],
      errors: [],
      selectedItems: [],
    })
  }, [])

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    isDeleting: state.isDeleting,
    deleteResults: state.deleteResults,
    errors: state.errors,
    selectedItems: state.selectedItems,

    // Computed properties
    hasSelectedItems,
    selectedCount,
    hasErrors,
    isSuccess,
    canDelete,

    // Actions
    selectItem,
    deselectItem,
    selectAll,
    deselectAll,
    deleteSelected,
    clearErrors,
    reset,
  }
}

// Export default
export default useDeletePunchlistItem