import { relations } from "drizzle-orm/relations";
import { users, userSessions, projectFiles, projects, companies, tasks, timeEntries, notifications, auditLogs, scheduleEvents, projectMembers, emailVerifications, passwordResets, taskAttachments, scheduleAttendees, scheduleProjects, punchlistItems } from "./schema";

export const userSessionsRelations = relations(userSessions, ({one}) => ({
	user: one(users, {
		fields: [userSessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	userSessions: many(userSessions),
	projectFiles_approvedBy: many(projectFiles, {
		relationName: "projectFiles_approvedBy_users_id"
	}),
	projectFiles_uploadedBy: many(projectFiles, {
		relationName: "projectFiles_uploadedBy_users_id"
	}),
	tasks_createdBy: many(tasks, {
		relationName: "tasks_createdBy_users_id"
	}),
	tasks_inspectedBy: many(tasks, {
		relationName: "tasks_inspectedBy_users_id"
	}),
	timeEntries_approvedBy: many(timeEntries, {
		relationName: "timeEntries_approvedBy_users_id"
	}),
	timeEntries_createdBy: many(timeEntries, {
		relationName: "timeEntries_createdBy_users_id"
	}),
	timeEntries_lastModifiedBy: many(timeEntries, {
		relationName: "timeEntries_lastModifiedBy_users_id"
	}),
	timeEntries_userId: many(timeEntries, {
		relationName: "timeEntries_userId_users_id"
	}),
	company: one(companies, {
		fields: [users.companyId],
		references: [companies.id]
	}),
	notifications_createdBy: many(notifications, {
		relationName: "notifications_createdBy_users_id"
	}),
	notifications_userId: many(notifications, {
		relationName: "notifications_userId_users_id"
	}),
	auditLogs: many(auditLogs),
	scheduleEvents_createdBy: many(scheduleEvents, {
		relationName: "scheduleEvents_createdBy_users_id"
	}),
	scheduleEvents_lastModifiedBy: many(scheduleEvents, {
		relationName: "scheduleEvents_lastModifiedBy_users_id"
	}),
	projectMembers_assignedBy: many(projectMembers, {
		relationName: "projectMembers_assignedBy_users_id"
	}),
	projectMembers_userId: many(projectMembers, {
		relationName: "projectMembers_userId_users_id"
	}),
	emailVerifications: many(emailVerifications),
	passwordResets: many(passwordResets),
	taskAttachments: many(taskAttachments),
	scheduleAttendees: many(scheduleAttendees),
	projects: many(projects),
	scheduleProjects: many(scheduleProjects),
	punchlistItems_inspectedBy: many(punchlistItems, {
		relationName: "punchlistItems_inspectedBy_users_id"
	}),
	punchlistItems_reportedBy: many(punchlistItems, {
		relationName: "punchlistItems_reportedBy_users_id"
	}),
}));

export const projectFilesRelations = relations(projectFiles, ({one}) => ({
	user_approvedBy: one(users, {
		fields: [projectFiles.approvedBy],
		references: [users.id],
		relationName: "projectFiles_approvedBy_users_id"
	}),
	project: one(projects, {
		fields: [projectFiles.projectId],
		references: [projects.id]
	}),
	user_uploadedBy: one(users, {
		fields: [projectFiles.uploadedBy],
		references: [users.id],
		relationName: "projectFiles_uploadedBy_users_id"
	}),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	projectFiles: many(projectFiles),
	tasks: many(tasks),
	timeEntries: many(timeEntries),
	scheduleEvents: many(scheduleEvents),
	projectMembers: many(projectMembers),
	company: one(companies, {
		fields: [projects.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [projects.createdBy],
		references: [users.id]
	}),
	scheduleProjects: many(scheduleProjects),
	punchlistItems: many(punchlistItems),
}));

export const tasksRelations = relations(tasks, ({one, many}) => ({
	company: one(companies, {
		fields: [tasks.companyId],
		references: [companies.id]
	}),
	user_createdBy: one(users, {
		fields: [tasks.createdBy],
		references: [users.id],
		relationName: "tasks_createdBy_users_id"
	}),
	user_inspectedBy: one(users, {
		fields: [tasks.inspectedBy],
		references: [users.id],
		relationName: "tasks_inspectedBy_users_id"
	}),
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id]
	}),
	timeEntries: many(timeEntries),
	taskAttachments: many(taskAttachments),
}));

export const companiesRelations = relations(companies, ({many}) => ({
	tasks: many(tasks),
	timeEntries: many(timeEntries),
	users: many(users),
	notifications: many(notifications),
	auditLogs: many(auditLogs),
	scheduleEvents: many(scheduleEvents),
	projectMembers: many(projectMembers),
	projects: many(projects),
	scheduleProjects: many(scheduleProjects),
	punchlistItems: many(punchlistItems),
}));

export const timeEntriesRelations = relations(timeEntries, ({one}) => ({
	user_approvedBy: one(users, {
		fields: [timeEntries.approvedBy],
		references: [users.id],
		relationName: "timeEntries_approvedBy_users_id"
	}),
	company: one(companies, {
		fields: [timeEntries.companyId],
		references: [companies.id]
	}),
	user_createdBy: one(users, {
		fields: [timeEntries.createdBy],
		references: [users.id],
		relationName: "timeEntries_createdBy_users_id"
	}),
	user_lastModifiedBy: one(users, {
		fields: [timeEntries.lastModifiedBy],
		references: [users.id],
		relationName: "timeEntries_lastModifiedBy_users_id"
	}),
	project: one(projects, {
		fields: [timeEntries.projectId],
		references: [projects.id]
	}),
	task: one(tasks, {
		fields: [timeEntries.taskId],
		references: [tasks.id]
	}),
	user_userId: one(users, {
		fields: [timeEntries.userId],
		references: [users.id],
		relationName: "timeEntries_userId_users_id"
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	company: one(companies, {
		fields: [notifications.companyId],
		references: [companies.id]
	}),
	user_createdBy: one(users, {
		fields: [notifications.createdBy],
		references: [users.id],
		relationName: "notifications_createdBy_users_id"
	}),
	user_userId: one(users, {
		fields: [notifications.userId],
		references: [users.id],
		relationName: "notifications_userId_users_id"
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	company: one(companies, {
		fields: [auditLogs.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	}),
}));

export const scheduleEventsRelations = relations(scheduleEvents, ({one, many}) => ({
	company: one(companies, {
		fields: [scheduleEvents.companyId],
		references: [companies.id]
	}),
	user_createdBy: one(users, {
		fields: [scheduleEvents.createdBy],
		references: [users.id],
		relationName: "scheduleEvents_createdBy_users_id"
	}),
	user_lastModifiedBy: one(users, {
		fields: [scheduleEvents.lastModifiedBy],
		references: [users.id],
		relationName: "scheduleEvents_lastModifiedBy_users_id"
	}),
	project: one(projects, {
		fields: [scheduleEvents.projectId],
		references: [projects.id]
	}),
	scheduleAttendees: many(scheduleAttendees),
}));

export const projectMembersRelations = relations(projectMembers, ({one, many}) => ({
	user_assignedBy: one(users, {
		fields: [projectMembers.assignedBy],
		references: [users.id],
		relationName: "projectMembers_assignedBy_users_id"
	}),
	company: one(companies, {
		fields: [projectMembers.companyId],
		references: [companies.id]
	}),
	project: one(projects, {
		fields: [projectMembers.projectId],
		references: [projects.id]
	}),
	user_userId: one(users, {
		fields: [projectMembers.userId],
		references: [users.id],
		relationName: "projectMembers_userId_users_id"
	}),
	punchlistItems: many(punchlistItems),
}));

export const emailVerificationsRelations = relations(emailVerifications, ({one}) => ({
	user: one(users, {
		fields: [emailVerifications.userId],
		references: [users.id]
	}),
}));

export const passwordResetsRelations = relations(passwordResets, ({one}) => ({
	user: one(users, {
		fields: [passwordResets.userId],
		references: [users.id]
	}),
}));

export const taskAttachmentsRelations = relations(taskAttachments, ({one}) => ({
	task: one(tasks, {
		fields: [taskAttachments.taskId],
		references: [tasks.id]
	}),
	user: one(users, {
		fields: [taskAttachments.uploadedBy],
		references: [users.id]
	}),
}));

export const scheduleAttendeesRelations = relations(scheduleAttendees, ({one}) => ({
	scheduleEvent: one(scheduleEvents, {
		fields: [scheduleAttendees.eventId],
		references: [scheduleEvents.id]
	}),
	user: one(users, {
		fields: [scheduleAttendees.userId],
		references: [users.id]
	}),
}));

export const scheduleProjectsRelations = relations(scheduleProjects, ({one, many}) => ({
	company: one(companies, {
		fields: [scheduleProjects.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [scheduleProjects.createdBy],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [scheduleProjects.projectId],
		references: [projects.id]
	}),
	punchlistItems: many(punchlistItems),
}));

export const punchlistItemsRelations = relations(punchlistItems, ({one}) => ({
	projectMember: one(projectMembers, {
		fields: [punchlistItems.assignedProjectMemberId],
		references: [projectMembers.id]
	}),
	company: one(companies, {
		fields: [punchlistItems.companyId],
		references: [companies.id]
	}),
	user_inspectedBy: one(users, {
		fields: [punchlistItems.inspectedBy],
		references: [users.id],
		relationName: "punchlistItems_inspectedBy_users_id"
	}),
	project: one(projects, {
		fields: [punchlistItems.projectId],
		references: [projects.id]
	}),
	scheduleProject: one(scheduleProjects, {
		fields: [punchlistItems.relatedScheduleProjectId],
		references: [scheduleProjects.id]
	}),
	user_reportedBy: one(users, {
		fields: [punchlistItems.reportedBy],
		references: [users.id],
		relationName: "punchlistItems_reportedBy_users_id"
	}),
}));