// ==============================================
// src/app/api/punchlist-items/[id]/status/route.ts - Punchlist Item Status Update API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateQuickUpdatePunchlistStatus,
  formatPunchlistItemErrors,
} from '@/lib/validations/punchlist/punchlist-items'
import { PunchlistItemDatabaseService } from '@/lib/database/services/punchlist-items'

// ==============================================
// PATCH /api/punchlist-items/[id]/status - Update Punchlist Item Status
// ==============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user info from middleware
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')
    
    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to update punchlist item status.',
        },
        { status: 401 }
      )
    }

    const punchlistItemId = params.id

    if (!punchlistItemId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Punchlist item ID is required.',
        },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Add ID to validation data
    const validationData = { ...body, id: punchlistItemId }

    // Validate input data
    const validation = validateQuickUpdatePunchlistStatus(validationData)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formatPunchlistItemErrors(validation.error),
        },
        { status: 400 }
      )
    }

    const { status, actualHours, resolutionNotes, rejectionReason, inspectionPassed, inspectionNotes } = validation.data

    // Create service instance
    const punchlistService = new PunchlistItemDatabaseService(true, false)

    // Check if punchlist item exists and belongs to company
    const punchlistItemExists = await punchlistService.checkPunchlistItemExists(punchlistItemId, companyId)
    if (!punchlistItemExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Punchlist item not found',
          message: 'The requested punchlist item does not exist or you do not have access to update it.',
        },
        { status: 404 }
      )
    }

    // Get current punchlist item data for comparison
    const currentPunchlistItem = await punchlistService.getPunchlistItemById(punchlistItemId, companyId)
    if (!currentPunchlistItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Punchlist item not found',
          message: 'The requested punchlist item could not be found.',
        },
        { status: 404 }
      )
    }

    // Business logic validation for status changes
    if (status === 'completed' && currentPunchlistItem.requiresInspection && inspectionPassed === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Inspection required',
          message: 'This item requires inspection before it can be marked as completed. Please provide inspection results.',
        },
        { status: 400 }
      )
    }

    // Prepare status update data
    const statusUpdateData = {
      status,
      actualHours,
      resolutionNotes,
      rejectionReason,
      inspectionPassed,
      inspectionNotes,
      inspectedBy: (inspectionPassed !== undefined || inspectionNotes !== undefined) ? userId : undefined,
    }

    // Update punchlist item status
    const updatedPunchlistItem = await punchlistService.quickUpdatePunchlistStatus(
      punchlistItemId,
      companyId,
      statusUpdateData
    )

    // Get updated punchlist item with full details
    const punchlistItemWithDetails = await punchlistService.getPunchlistItemById(punchlistItemId, companyId)

    // Determine what changed for response message
    let changeDescription = `Status updated to "${status}"`
    
    if (actualHours !== undefined && actualHours !== Number(currentPunchlistItem.actualHours || 0)) {
      changeDescription += ` with ${actualHours} actual hours logged`
    }
    
    if (inspectionPassed !== undefined) {
      changeDescription += ` and inspection ${inspectionPassed ? 'passed' : 'failed'}`
    }

    if (status === 'completed' && resolutionNotes) {
      changeDescription += ` with resolution notes`
    }

    if (status === 'rejected' && rejectionReason) {
      changeDescription += ` with rejection reason`
    }

    // Prepare response data with previous values for frontend notifications
    const responseData = {
      punchlistItem: punchlistItemWithDetails,
      changes: {
        previousStatus: currentPunchlistItem.status,
        newStatus: status,
        previousActualHours: Number(currentPunchlistItem.actualHours || 0),
        newActualHours: actualHours || Number(currentPunchlistItem.actualHours || 0),
        inspectionProvided: inspectionPassed !== undefined,
        inspectionResult: inspectionPassed,
        resolutionProvided: !!resolutionNotes,
        rejectionProvided: !!rejectionReason,
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: `Punchlist item ${changeDescription}.`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/punchlist-items/[id]/status:', error)

    // Handle specific validation errors
    if (error instanceof Error) {
      if (error.message.includes('inspection')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid inspection',
            message: 'Inspection requirements not met for this status change.',
          },
          { status: 400 }
        )
      }
      
      if (error.message.includes('hours')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid hours',
            message: 'Actual hours must be a positive number.',
          },
          { status: 400 }
        )
      }

      if (error.message.includes('rejection')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing rejection reason',
            message: 'Rejection reason is required when rejecting an item.',
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while updating the punchlist item status.',
      },
      { status: 500 }
    )
  }
}