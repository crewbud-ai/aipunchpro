// ==============================================
// src/lib/database/schema/index.ts - Main Schema Export
// ==============================================

// Export all tables
export * from './companies';
export * from './users';
export * from './projects';
export * from './scheduling';
export * from './system';

// Export all relations
export * from './relations';

// Re-export for convenience
import { companies } from './companies';
import { users, userSessions } from './users';
import { 
  projects, 
  projectMembers, 
  tasks, 
  taskAttachments, 
  timeEntries, 
  projectFiles 
} from './projects';
import { scheduleEvents, scheduleAttendees } from './scheduling';
import { auditLogs, notifications } from './system';

// Schema object for Drizzle operations
export const schema = {
  // Companies
  companies,
  
  // Users & Auth
  users,
  userSessions,
  
  // Projects & Tasks
  projects,
  projectMembers,
  tasks,
  taskAttachments,
  timeEntries,
  projectFiles,
  
  // Scheduling
  scheduleEvents,
  scheduleAttendees,
  
  // System
  auditLogs,
  notifications,
};

// Type exports for use in applications
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type NewTaskAttachment = typeof taskAttachments.$inferInsert;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;

export type ProjectFile = typeof projectFiles.$inferSelect;
export type NewProjectFile = typeof projectFiles.$inferInsert;

export type ScheduleEvent = typeof scheduleEvents.$inferSelect;
export type NewScheduleEvent = typeof scheduleEvents.$inferInsert;

export type ScheduleAttendee = typeof scheduleAttendees.$inferSelect;
export type NewScheduleAttendee = typeof scheduleAttendees.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;