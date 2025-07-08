// ==============================================
// src/lib/database/schema/project-members.ts - Team Management
// ==============================================

import { 
  pgTable, 
  uuid, 
  varchar, 
  text,
  boolean, 
  timestamp,
  decimal,
  unique,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { projects } from './projects';
import { users } from './users';
import { companies } from './companies';

// ==============================================
// PROJECT MEMBERS TABLE (TEAM ASSIGNMENTS)
// ==============================================
export const projectMembers = pgTable('project_members', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),

  // Company reference for easy filtering
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  
  // User Reference (all team members are system users now)
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Project-Specific Role (REMOVED - handled by users.role)
  // role: varchar('role', { length: 100 }).notNull().default('member'),
  
  // Project-Specific Rates (can override user's default rates)
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
  overtimeRate: decimal('overtime_rate', { precision: 8, scale: 2 }),
  
  // Assignment Details
  assignedBy: uuid('assigned_by').references(() => users.id), // Who added this person to project
  notes: text('notes'), // Project-specific notes about this team member
  
  status: varchar('status', { length: 50 }).default('active').notNull(),

  // Status & Timeline
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  leftAt: timestamp('left_at', { withTimezone: true }),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one user can only have one active role per project
  projectUserUnique: unique('project_user_unique').on(table.projectId, table.userId),
  
  // Performance Indexes
  companyIdIdx: index('idx_project_members_company_id').on(table.companyId),
  projectIdIdx: index('idx_project_members_project_id').on(table.projectId),
  userIdIdx: index('idx_project_members_user_id').on(table.userId),
  statusIdx: index('idx_project_members_status').on(table.status),
  assignedByIdx: index('idx_project_members_assigned_by').on(table.assignedBy),
  joinedAtIdx: index('idx_project_members_joined_at').on(table.joinedAt),
  
  // Composite indexes for common queries
  projectStatusIdx: index('idx_project_members_project_status').on(table.projectId, table.status),
  userStatusIdx: index('idx_project_members_user_status').on(table.userId, table.status),
  companyStatusIdx: index('idx_project_members_company_status').on(table.companyId, table.status),
}));

// ==============================================
// INFER TYPES FROM SCHEMA
// ==============================================
export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;

// ==============================================
// PROJECT ASSIGNMENT STATUS CONSTANTS
// ==============================================
export const PROJECT_ASSIGNMENT_STATUS = [
  'active',    // Currently assigned and working on project
  'inactive',  // Temporarily removed from project or suspended
] as const;

export type ProjectAssignmentStatus = typeof PROJECT_ASSIGNMENT_STATUS[number];

// ==============================================
// TEAM MEMBER CALCULATED STATUS (APPLICATION LEVEL)
// ==============================================
export const TEAM_MEMBER_STATUS = [
  'not_assigned',  // User exists but not assigned to any project
  'assigned',      // User assigned to at least one active project
  'inactive'       // User account is disabled (users.isActive = false)
] as const;

export type TeamMemberStatus = typeof TEAM_MEMBER_STATUS[number];

// Helper function to calculate team member status
export const calculateTeamMemberStatus = (
  userIsActive: boolean, 
  activeProjectCount: number
): TeamMemberStatus => {
  if (!userIsActive) return 'inactive';
  if (activeProjectCount === 0) return 'not_assigned';
  return 'assigned';
};

