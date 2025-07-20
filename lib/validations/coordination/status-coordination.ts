// ==============================================
// lib/validations/coordination/status-coordination.ts - Validation Schemas for Status Coordination
// ==============================================

import { z } from 'zod'

// ==============================================
// PROJECT STATUS COORDINATION SCHEMAS
// ==============================================

export const projectStatusCoordinationSchema = z.object({
  status: z.enum([
    'not_started',
    'in_progress', 
    'on_track',
    'ahead_of_schedule',
    'behind_schedule',
    'on_hold',
    'completed',
    'cancelled'
  ], {
    errorMap: () => ({ message: 'Please select a valid project status' })
  }),
  
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
    
  actualStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
    
  actualEndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
    
  skipChildValidation: z
    .boolean()
    .default(false)
    .optional(),

  cascadeToChildren: z
    .boolean()
    .default(true)
    .optional(),

  triggeredBy: z
    .enum(['user', 'system', 'bulk_operation', 'schedule_sync'])
    .default('user')
    .optional(),
})

export const projectStatusValidationSchema = z.object({
  newStatus: z.enum([
    'not_started',
    'in_progress', 
    'on_track',
    'ahead_of_schedule',
    'behind_schedule',
    'on_hold',
    'completed',
    'cancelled'
  ]),
  
  skipChildCheck: z
    .boolean()
    .default(false)
    .optional(),
})

// ==============================================
// SCHEDULE PROJECT STATUS COORDINATION SCHEMAS
// ==============================================

export const scheduleStatusCoordinationSchema = z.object({
  status: z.enum([
    'planned',
    'in_progress', 
    'completed',
    'delayed',
    'cancelled'
  ], {
    errorMap: () => ({ message: 'Please select a valid schedule status' })
  }),
  
  progressPercentage: z
    .number()
    .min(0, 'Progress cannot be negative')
    .max(100, 'Progress cannot exceed 100%')
    .optional(),

  actualHours: z
    .number()
    .min(0, 'Actual hours cannot be negative')
    .max(999.99, 'Actual hours cannot exceed 999.99')
    .optional(),

  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),

  skipDependencyValidation: z
    .boolean()
    .default(false)
    .optional(),

  skipProjectSync: z
    .boolean()
    .default(false)
    .optional(),

  skipPunchlistCheck: z
    .boolean()
    .default(false)
    .optional(),

  triggeredBy: z
    .enum(['user', 'project_cascade', 'dependency_update', 'bulk_operation'])
    .default('user')
    .optional(),
})

export const scheduleDependencyValidationSchema = z.object({
  targetStatus: z.enum([
    'planned',
    'in_progress', 
    'completed',
    'delayed',
    'cancelled'
  ]),
  
  ignoreDependencies: z
    .array(z.string().uuid())
    .default([])
    .optional(),
    
  forceUpdate: z
    .boolean()
    .default(false)
    .optional(),
})

// ==============================================
// TEAM MEMBER COORDINATION SCHEMAS
// ==============================================

export const teamMemberDeactivationSchema = z.object({
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(500, 'Reason must be less than 500 characters'),
    
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
    
  skipAssignmentRemoval: z
    .boolean()
    .default(false)
    .optional(),

  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),

  reassignmentPlan: z
    .object({
      projects: z
        .array(z.object({
          projectId: z.string().uuid('Invalid project ID'),
          newAssigneeId: z.string().uuid('Invalid assignee ID').optional()
        }))
        .optional(),
        
      scheduleProjects: z
        .array(z.object({
          scheduleProjectId: z.string().uuid('Invalid schedule project ID'),
          newAssigneeId: z.string().uuid('Invalid assignee ID').optional()
        }))
        .optional(),
        
      punchlistItems: z
        .array(z.object({
          punchlistItemId: z.string().uuid('Invalid punchlist item ID'),
          newAssigneeId: z.string().uuid('Invalid assignee ID').optional()
        }))
        .optional()
    })
    .optional(),

  notifyTeamMember: z
    .boolean()
    .default(true)
    .optional(),

  notifyManager: z
    .boolean()
    .default(true)
    .optional(),
})

export const teamMemberReactivationSchema = z.object({
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(500, 'Reason must be less than 500 characters'),
    
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
    
  restoreAssignments: z
    .boolean()
    .default(false)
    .optional(),

  newRole: z
    .string()
    .max(50, 'Role must be less than 50 characters')
    .optional(),

  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
})

export const workReassignmentSchema = z.object({
  fromTeamMemberId: z
    .string()
    .uuid('Invalid source team member ID'),
    
  toTeamMemberId: z
    .string()
    .uuid('Invalid target team member ID'),
    
  projects: z
    .array(z.string().uuid('Invalid project ID'))
    .optional(),
    
  scheduleProjects: z
    .array(z.string().uuid('Invalid schedule project ID'))
    .optional(),
    
  punchlistItems: z
    .array(z.string().uuid('Invalid punchlist item ID'))
    .optional(),
    
  transferRole: z
    .boolean()
    .default(false)
    .optional(),
    
  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
    
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
})

// ==============================================
// BULK OPERATION SCHEMAS
// ==============================================

export const bulkProjectStatusUpdateSchema = z.object({
  updates: z
    .array(z.object({
      projectId: z.string().uuid('Invalid project ID'),
      status: z.enum([
        'not_started',
        'in_progress', 
        'on_track',
        'ahead_of_schedule',
        'behind_schedule',
        'on_hold',
        'completed',
        'cancelled'
      ]),
      notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
    }))
    .min(1, 'At least one update is required')
    .max(50, 'Cannot update more than 50 projects at once'),
    
  skipValidation: z
    .boolean()
    .default(false)
    .optional(),
    
  cascadeToChildren: z
    .boolean()
    .default(true)
    .optional(),
})

export const bulkScheduleStatusUpdateSchema = z.object({
  updates: z
    .array(z.object({
      scheduleProjectId: z.string().uuid('Invalid schedule project ID'),
      status: z.enum([
        'planned',
        'in_progress', 
        'completed',
        'delayed',
        'cancelled'
      ]),
      notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
    }))
    .min(1, 'At least one update is required')
    .max(100, 'Cannot update more than 100 schedule projects at once'),
    
  skipDependencyValidation: z
    .boolean()
    .default(false)
    .optional(),
    
  skipProjectSync: z
    .boolean()
    .default(false)
    .optional(),
})

export const bulkTeamDeactivationSchema = z.object({
  deactivations: z
    .array(z.object({
      teamMemberId: z.string().uuid('Invalid team member ID'),
      reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
      notes: z.string().max(1000, 'Notes too long').optional(),
    }))
    .min(1, 'At least one deactivation is required')
    .max(20, 'Cannot deactivate more than 20 team members at once'),
    
  skipAssignmentRemoval: z
    .boolean()
    .default(false)
    .optional(),
    
  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
})

// ==============================================
// CROSS-MODULE COORDINATION SCHEMAS
// ==============================================

export const statusSyncSchema = z.object({
  sourceModule: z.enum(['projects', 'schedules', 'punchlist', 'team']),
  sourceEntityId: z.string().uuid('Invalid source entity ID'),
  targetModules: z.array(z.enum(['projects', 'schedules', 'punchlist', 'team'])),
  syncType: z.enum(['cascade', 'reverse_sync', 'bidirectional']),
  skipValidation: z.boolean().default(false).optional(),
})

export const consistencyValidationSchema = z.object({
  entityType: z.enum(['project', 'schedule_project', 'punchlist_item', 'team_member']),
  entityId: z.string().uuid('Invalid entity ID'),
  checkDepth: z.enum(['shallow', 'deep', 'full']).default('deep').optional(),
  fixInconsistencies: z.boolean().default(false).optional(),
})

export const impactAnalysisSchema = z.object({
  operation: z.enum([
    'project_status_change',
    'schedule_status_change',
    'team_member_deactivation',
    'punchlist_status_change'
  ]),
  entityId: z.string().uuid('Invalid entity ID'),
  proposedChange: z.record(z.any()),
  analysisDepth: z.enum(['immediate', 'extended', 'full_cascade']).default('extended').optional(),
})

// ==============================================
// VALIDATION HELPER FUNCTIONS
// ==============================================

export function validateProjectStatusCoordination(data: unknown) {
  return projectStatusCoordinationSchema.safeParse(data)
}

export function validateScheduleStatusCoordination(data: unknown) {
  return scheduleStatusCoordinationSchema.safeParse(data)
}

export function validateTeamMemberDeactivation(data: unknown) {
  return teamMemberDeactivationSchema.safeParse(data)
}

export function validateTeamMemberReactivation(data: unknown) {
  return teamMemberReactivationSchema.safeParse(data)
}

export function validateWorkReassignment(data: unknown) {
  return workReassignmentSchema.safeParse(data)
}

export function validateBulkProjectStatusUpdate(data: unknown) {
  return bulkProjectStatusUpdateSchema.safeParse(data)
}

export function validateBulkScheduleStatusUpdate(data: unknown) {
  return bulkScheduleStatusUpdateSchema.safeParse(data)
}

export function validateBulkTeamDeactivation(data: unknown) {
  return bulkTeamDeactivationSchema.safeParse(data)
}

export function validateStatusSync(data: unknown) {
  return statusSyncSchema.safeParse(data)
}

export function validateConsistencyValidation(data: unknown) {
  return consistencyValidationSchema.safeParse(data)
}

export function validateImpactAnalysis(data: unknown) {
  return impactAnalysisSchema.safeParse(data)
}

// ==============================================
// ERROR FORMATTER
// ==============================================

export function formatCoordinationErrors(errors: z.ZodError) {
  return errors.errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code,
  }))
}

// ==============================================
// TYPE EXPORTS
// ==============================================

export type ProjectStatusCoordinationInput = z.infer<typeof projectStatusCoordinationSchema>
export type ScheduleStatusCoordinationInput = z.infer<typeof scheduleStatusCoordinationSchema>
export type TeamMemberDeactivationInput = z.infer<typeof teamMemberDeactivationSchema>
export type TeamMemberReactivationInput = z.infer<typeof teamMemberReactivationSchema>
export type WorkReassignmentInput = z.infer<typeof workReassignmentSchema>
export type BulkProjectStatusUpdateInput = z.infer<typeof bulkProjectStatusUpdateSchema>
export type BulkScheduleStatusUpdateInput = z.infer<typeof bulkScheduleStatusUpdateSchema>
export type BulkTeamDeactivationInput = z.infer<typeof bulkTeamDeactivationSchema>
export type StatusSyncInput = z.infer<typeof statusSyncSchema>
export type ConsistencyValidationInput = z.infer<typeof consistencyValidationSchema>
export type ImpactAnalysisInput = z.infer<typeof impactAnalysisSchema>