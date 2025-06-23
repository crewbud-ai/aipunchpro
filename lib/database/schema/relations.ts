// ==============================================
// src/lib/database/schema/relations.ts
// ==============================================

import { relations } from 'drizzle-orm';

// Import all tables
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

// ==============================================
// COMPANIES RELATIONS
// ==============================================
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  projects: many(projects),
  tasks: many(tasks),
  timeEntries: many(timeEntries),
  scheduleEvents: many(scheduleEvents),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}));

// ==============================================
// USERS RELATIONS
// ==============================================
export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  sessions: many(userSessions),
  managedProjects: many(projects, { relationName: 'projectManager' }),
  foremanProjects: many(projects, { relationName: 'foreman' }),
  createdProjects: many(projects, { relationName: 'creator' }),
  projectMemberships: many(projectMembers),
  assignedTasks: many(tasks, { relationName: 'assignee' }),
  createdTasks: many(tasks, { relationName: 'taskCreator' }),
  inspectedTasks: many(tasks, { relationName: 'inspector' }),
  timeEntries: many(timeEntries, { relationName: 'timeEntryUser' }),
  approvedTimeEntries: many(timeEntries, { relationName: 'timeEntryApprover' }),
  scheduleAttendees: many(scheduleAttendees),
  notifications: many(notifications),
  uploadedFiles: many(projectFiles, { relationName: 'uploader' }),
  uploadedAttachments: many(taskAttachments, { relationName: 'uploader' }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

// ==============================================
// PROJECTS RELATIONS
// ==============================================
export const projectsRelations = relations(projects, ({ one, many }) => ({
  company: one(companies, {
    fields: [projects.companyId],
    references: [companies.id],
  }),
  projectManager: one(users, {
    fields: [projects.projectManagerId],
    references: [users.id],
    relationName: 'projectManager',
  }),
  foreman: one(users, {
    fields: [projects.foremanId],
    references: [users.id],
    relationName: 'foreman',
  }),
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
    relationName: 'creator',
  }),
  members: many(projectMembers),
  tasks: many(tasks),
  timeEntries: many(timeEntries),
  scheduleEvents: many(scheduleEvents),
  files: many(projectFiles),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

// ==============================================
// TASKS RELATIONS
// ==============================================
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  company: one(companies, {
    fields: [tasks.companyId],
    references: [companies.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: 'assignee',
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: 'taskCreator',
  }),
  inspector: one(users, {
    fields: [tasks.inspectedBy],
    references: [users.id],
    relationName: 'inspector',
  }),
  // Self-reference handled here (safe from circular dependency)
  blockedByTask: one(tasks, {
    fields: [tasks.blockedBy],
    references: [tasks.id],
    relationName: 'dependency',
  }),
  dependentTasks: many(tasks, { relationName: 'dependency' }),
  attachments: many(taskAttachments),
  timeEntries: many(timeEntries),
}));

export const taskAttachmentsRelations = relations(taskAttachments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAttachments.taskId],
    references: [tasks.id],
  }),
  uploader: one(users, {
    fields: [taskAttachments.uploadedBy],
    references: [users.id],
    relationName: 'uploader',
  }),
}));

// ==============================================
// TIME ENTRIES RELATIONS
// ==============================================
export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  company: one(companies, {
    fields: [timeEntries.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
    relationName: 'timeEntryUser',
  }),
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [timeEntries.taskId],
    references: [tasks.id],
  }),
  approver: one(users, {
    fields: [timeEntries.approvedBy],
    references: [users.id],
    relationName: 'timeEntryApprover',
  }),
}));

// ==============================================
// PROJECT FILES RELATIONS
// ==============================================
export const projectFilesRelations = relations(projectFiles, ({ one }) => ({
  project: one(projects, {
    fields: [projectFiles.projectId],
    references: [projects.id],
  }),
  uploader: one(users, {
    fields: [projectFiles.uploadedBy],
    references: [users.id],
    relationName: 'uploader',
  }),
}));

// ==============================================
// SCHEDULING RELATIONS
// ==============================================
export const scheduleEventsRelations = relations(scheduleEvents, ({ one, many }) => ({
  company: one(companies, {
    fields: [scheduleEvents.companyId],
    references: [companies.id],
  }),
  project: one(projects, {
    fields: [scheduleEvents.projectId],
    references: [projects.id],
  }),
  creator: one(users, {
    fields: [scheduleEvents.createdBy],
    references: [users.id],
  }),
  attendees: many(scheduleAttendees),
}));

export const scheduleAttendeesRelations = relations(scheduleAttendees, ({ one }) => ({
  event: one(scheduleEvents, {
    fields: [scheduleAttendees.eventId],
    references: [scheduleEvents.id],
  }),
  user: one(users, {
    fields: [scheduleAttendees.userId],
    references: [users.id],
  }),
}));

// ==============================================
// SYSTEM RELATIONS
// ==============================================
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  company: one(companies, {
    fields: [auditLogs.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  company: one(companies, {
    fields: [notifications.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));