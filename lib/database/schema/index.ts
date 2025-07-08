// ==============================================
// src/lib/database/schema/index.ts - Main Schema Export
// ==============================================

// Export all table schemas
export * from './companies';
export * from './users';
export * from './projects';
export * from './project-members';
export * from './tasks';
export * from './files';
export * from './scheduling';
export * from './time-tracking';
export * from './system';

// Export all relations
export * from './relations';

// Import all tables for schema object
import { companies } from './companies';
import { users, userSessions } from './users';
import { projects } from './projects';
import { projectMembers } from './project-members';
import { tasks } from './tasks';
import { projectFiles, taskAttachments } from './files';
import { scheduleEvents, scheduleAttendees } from './scheduling';
import { timeEntries } from './time-tracking';
import { auditLogs, notifications } from './system';

// Schema object for Drizzle operations
export const schema = {
  // Core entities
  companies,
  users,
  userSessions,
  
  // Project management
  projects,
  projectMembers,
  tasks,
  
  // File management
  projectFiles,
  taskAttachments,
  
  // Scheduling
  scheduleEvents,
  scheduleAttendees,
  
  // Time tracking
  timeEntries,
  
  // System tables
  auditLogs,
  notifications,
};

// ==============================================
// TYPE EXPORTS FOR APPLICATION USE
// ==============================================

// Core entities
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

// Project management
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

// File management
export type ProjectFile = typeof projectFiles.$inferSelect;
export type NewProjectFile = typeof projectFiles.$inferInsert;

export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type NewTaskAttachment = typeof taskAttachments.$inferInsert;

// Scheduling
export type ScheduleEvent = typeof scheduleEvents.$inferSelect;
export type NewScheduleEvent = typeof scheduleEvents.$inferInsert;

export type ScheduleAttendee = typeof scheduleAttendees.$inferSelect;
export type NewScheduleAttendee = typeof scheduleAttendees.$inferInsert;

// Time tracking
export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;

// System tables
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// ==============================================
// TEAM MANAGEMENT SPECIFIC TYPES
// ==============================================

// Team member with project assignment details (for /dashboard/teams listing)
export type TeamMemberWithProjects = User & {
  activeProjectCount: number;
  assignmentStatus: 'not_assigned' | 'assigned' | 'inactive';
  currentProjects: Array<{
    id: string;
    name: string;
    status: 'active' | 'inactive';
    joinedAt: Date;
    hourlyRate?: number;
    notes?: string;
  }>;
};

// Project with team member count (for project listings)
export type ProjectWithTeam = Project & {
  members?: ProjectMemberWithUser[];
  memberCount: number;
};

// ==============================================
// UTILITY TYPES FOR COMPLEX QUERIES
// ==============================================

// Project with related data
export type ProjectWithDetails = Project & {
  members?: ProjectMember[];
  tasks?: Task[];
  files?: ProjectFile[];
  scheduleEvents?: ScheduleEvent[];
  creator?: User;
  projectManager?: User;
  foreman?: User;
};

// Task with related data
export type TaskWithDetails = Task & {
  project?: Project;
  assignee?: User;
  creator?: User;
  inspector?: User;
  attachments?: TaskAttachment[];
  blockedByTask?: Task;
};

// Schedule event with attendees
export type ScheduleEventWithAttendees = ScheduleEvent & {
  attendees?: (ScheduleAttendee & { user?: User })[];
  project?: Project;
  creator?: User;
};

// Time entry with related data
export type TimeEntryWithDetails = TimeEntry & {
  project?: Project;
  task?: Task;
  worker?: User;
  approver?: User;
};

// Project member with user details
export type ProjectMemberWithUser = ProjectMember & {
  user?: User;
  project?: Project;
};