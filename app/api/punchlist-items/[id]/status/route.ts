// ==============================================
// src/app/api/punchlist-items/[id]/status/route.ts - Punchlist Item Status Update API (COMPLETE FIXED)
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateQuickUpdatePunchlistStatus,
  formatPunchlistItemErrors,
} from '@/lib/validations/punchlist/punchlist-items'
import { PunchlistItemDatabaseService } from '@/lib/database/services/punchlist-items'

// ==============================================
// HELPER FUNCTION - Status Transformation
// ==============================================
function transformStatusForDatabase(frontendStatus?: string): 'open' | 'assigned' | 'in_progress' | 'completed' | 'rejected' {
  switch (frontendStatus) {
    case 'pending_review':
      return 'in_progress' // Map pending_review to in_progress for database
    case 'on_hold':
      return 'assigned' // Map on_hold to assigned for database
    case 'open':
    case 'assigned':
    case 'in_progress':
    case 'completed':
    case 'rejected':
      return frontendStatus as any
    default:
      return 'open'
  }
}

// ==============================================
// PATCH /api/punchlist-items/[id]/status - Update Punchlist Item Status (FIXED)
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

    // ✅ FIXED: Build status update data with proper type transformation
    const statusUpdateData = {
      status: transformStatusForDatabase(status), // Transform status for database
      actualHours,
      resolutionNotes,
      rejectionReason,
      inspectionPassed,
      inspectionNotes,
      inspectedBy: (inspectionPassed !== undefined || inspectionNotes) ? userId : undefined,
      inspectedAt: (inspectionPassed !== undefined || inspectionNotes) ? new Date().toISOString() : undefined,
    }

    // Update punchlist item status
    const updatedPunchlistItem = await punchlistService.quickUpdatePunchlistStatus(
      punchlistItemId,
      companyId,
      statusUpdateData
    )

    // Get updated punchlist item with full details
    const punchlistItemWithDetails = await punchlistService.getPunchlistItemById(punchlistItemId, companyId)

    return NextResponse.json(
      {
        success: true,
        data: punchlistItemWithDetails,
        message: 'Punchlist item status updated successfully.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/punchlist-items/[id]/status:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid status transition')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid status transition',
            message: error.message,
          },
          { status: 400 }
        )
      }
      
      if (error.message.includes('Required fields missing')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required fields',
            message: error.message,
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