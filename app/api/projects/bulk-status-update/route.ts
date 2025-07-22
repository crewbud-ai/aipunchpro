// import { NextRequest, NextResponse } from 'next/server'
// import { StatusCoordinatorService } from '@/lib/database/services/status-coordinator'
// import { z } from 'zod'

// // Validation schema for bulk update
// const bulkUpdateSchema = z.object({
//   updates: z.array(z.object({
//     projectId: z.string().uuid('Invalid project ID'),
//     status: z.enum([
//       'not_started',
//       'in_progress', 
//       'on_track',
//       'ahead_of_schedule',
//       'behind_schedule',
//       'on_hold',
//       'completed',
//       'cancelled'
//     ]),
//     notes: z.string().optional()
//   })).min(1, 'At least one update is required').max(50, 'Cannot update more than 50 projects at once')
// })

// export async function POST(request: NextRequest) {
//   try {
//     // Get user info from middleware
//     const userId = request.headers.get('x-user-id')
//     const companyId = request.headers.get('x-company-id')

//     if (!userId || !companyId) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'Authentication required',
//           message: 'You must be logged in to perform bulk updates.',
//         },
//         { status: 401 }
//       )
//     }

//     // Parse and validate request body
//     const body = await request.json()
//     const validation = bulkUpdateSchema.safeParse(body)
    
//     if (!validation.success) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'Validation failed',
//           message: 'Invalid request data',
//           details: validation.error.errors
//         },
//         { status: 400 }
//       )
//     }

//     const { updates } = validation.data

//     // Create coordinator service
//     const coordinator = new StatusCoordinatorService(true, false)
    
//     // Process updates
//     const results = {
//       successful: [] as string[],
//       failed: [] as Array<{ projectId: string; error: string }>,
//       totalProcessed: updates.length,
//       totalCascadeUpdates: 0,
//       summary: {
//         scheduleProjectsUpdated: 0,
//         scheduleProjectsSkipped: 0
//       }
//     }

//     // Process each update sequentially to maintain data integrity
//     for (const update of updates) {
//       try {
//         const result = await coordinator.updateProjectStatusWithCascade(
//           update.projectId,
//           companyId,
//           update.status,
//           update.notes,
//           userId
//         )

//         if (result.success) {
//           results.successful.push(update.projectId)
          
//           // Aggregate cascade results
//           if (result.data?.cascadeResults) {
//             results.totalCascadeUpdates += result.data.cascadeResults.scheduleProjectsUpdated
//             results.summary.scheduleProjectsUpdated += result.data.cascadeResults.scheduleProjectsUpdated
//             results.summary.scheduleProjectsSkipped += result.data.cascadeResults.scheduleProjectsSkipped
//           }
//         } else {
//           results.failed.push({
//             projectId: update.projectId,
//             error: result.error || 'Status update failed'
//           })
//         }
//       } catch (error) {
//         results.failed.push({
//           projectId: update.projectId,
//           error: error instanceof Error ? error.message : 'Unknown error occurred'
//         })
//       }
//     }

//     return NextResponse.json({
//       success: true,
//       data: results,
//       message: `Bulk update completed. ${results.successful.length} successful, ${results.failed.length} failed.`
//     })

//   } catch (error) {
//     console.error('Error in POST /api/projects/bulk-status-update:', error)
    
//     return NextResponse.json(
//       {
//         success: false,
//         error: 'Internal server error',
//         message: 'An unexpected error occurred during bulk update.',
//       },
//       { status: 500 }
//     )
//   }
// }