// ==============================================
// src/lib/database/schema/relations.ts - Database Relations
// ==============================================

import { relations } from 'drizzle-orm';
import { companies } from './companies';
import { users, userSessions } from './users';
import { projects } from './projects';
import { projectMembers } from './project-members';
import { tasks } from './tasks';
import { projectFiles, taskAttachments } from './files';
import { scheduleEvents, scheduleAttendees } from './scheduling';
import { timeEntries } from './time-tracking';
import { auditLogs, notifications } from './system';

// ==============================================
// COMPANIES RELATIONS
// ==============================================
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  projects: many(projects),
  tasks: many(tasks),
  scheduleEvents: many(scheduleEvents),
  timeEntries: many(timeEntries),
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
  
  // Projects relations
  createdProjects: many(projects, { relationName: 'creator' }),
  managedProjects: many(projects, { relationName: 'projectManager' }),
  foremanProjects: many(projects, { relationName: 'foreman' }),
  projectMemberships: many(projectMembers),
  
  // Tasks relations
  createdTasks: many(tasks, { relationName: 'creator' }),
  assignedTasks: many(tasks, { relationName: 'assignee' }),
  inspectedTasks: many(tasks, { relationName: 'inspector' }),
  
  // Files relations
  uploadedProjectFiles: many(projectFiles, { relationName: 'uploader' }),
  approvedProjectFiles: many(projectFiles, { relationName: 'approver' }),
  uploadedTaskAttachments: many(taskAttachments, { relationName: 'uploader' }),
  
  // Scheduling relations
  createdEvents: many(scheduleEvents, { relationName: 'creator' }),
  modifiedEvents: many(scheduleEvents, { relationName: 'modifier' }),
  eventAttendances: many(scheduleAttendees),
  
  // Time tracking relations
  timeEntries: many(timeEntries, { relationName: 'worker' }),
  createdTimeEntries: many(timeEntries, { relationName: 'creator' }),
  approvedTimeEntries: many(timeEntries, { relationName: 'approver' }),
  modifiedTimeEntries: many(timeEntries, { relationName: 'modifier' }),
  
  // System relations
  auditLogs: many(auditLogs),
  notifications: many(notifications),
  createdNotifications: many(notifications, { relationName: 'creator' }),
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
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
    relationName: 'creator',
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
  
  // Related entities
  members: many(projectMembers),
  tasks: many(tasks),
  files: many(projectFiles),
  scheduleEvents: many(scheduleEvents),
  timeEntries: many(timeEntries),
}));

// ==============================================
// PROJECT MEMBERS RELATIONS
// ==============================================
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
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: 'creator',
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: 'assignee',
  }),
  inspector: one(users, {
    fields: [tasks.inspectedBy],
    references: [users.id],
    relationName: 'inspector',
  }),
  
  // Self-reference for dependencies
  blockedByTask: one(tasks, {
    fields: [tasks.blockedBy],
    references: [tasks.id],
    relationName: 'blocker',
  }),
  blockedTasks: many(tasks, { relationName: 'blocker' }),
  
  // Related entities
  attachments: many(taskAttachments),
  timeEntries: many(timeEntries),
}));

// ==============================================
// FILES RELATIONS
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
  approver: one(users, {
    fields: [projectFiles.approvedBy],
    references: [users.id],
    relationName: 'approver',
  }),
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
    relationName: 'creator',
  }),
  modifier: one(users, {
    fields: [scheduleEvents.lastModifiedBy],
    references: [users.id],
    relationName: 'modifier',
  }),
  
  // Self-reference for recurring events
  parentEvent: one(scheduleEvents, {
    fields: [scheduleEvents.parentEventId],
    references: [scheduleEvents.id],
    relationName: 'parent',
  }),
  childEvents: many(scheduleEvents, { relationName: 'parent' }),
  
  // Related entities
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
// TIME TRACKING RELATIONS
// ==============================================
export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  company: one(companies, {
    fields: [timeEntries.companyId],
    references: [companies.id],
  }),
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [timeEntries.taskId],
    references: [tasks.id],
  }),
  worker: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
    relationName: 'worker',
  }),
  creator: one(users, {
    fields: [timeEntries.createdBy],
    references: [users.id],
    relationName: 'creator',
  }),
  approver: one(users, {
    fields: [timeEntries.approvedBy],
    references: [users.id],
    relationName: 'approver',
  }),
  modifier: one(users, {
    fields: [timeEntries.lastModifiedBy],
    references: [users.id],
    relationName: 'modifier',
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
  creator: one(users, {
    fields: [notifications.createdBy],
    references: [users.id],
    relationName: 'creator',
  }),
}));