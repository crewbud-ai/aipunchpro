import { pgTable, index, foreignKey, unique, check, uuid, varchar, text, numeric, integer, date, jsonb, timestamp, boolean, inet, time, point } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const projects = pgTable("projects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	projectNumber: varchar("project_number", { length: 100 }),
	status: varchar({ length: 50 }).default('not_started').notNull(),
	priority: varchar({ length: 50 }).default('medium').notNull(),
	budget: numeric({ precision: 15, scale:  2 }),
	spent: numeric({ precision: 15, scale:  2 }).default('0').notNull(),
	progress: integer().default(0).notNull(),
	startDate: date("start_date"),
	endDate: date("end_date"),
	actualStartDate: date("actual_start_date"),
	actualEndDate: date("actual_end_date"),
	estimatedHours: numeric("estimated_hours", { precision: 8, scale:  2 }),
	actualHours: numeric("actual_hours", { precision: 8, scale:  2 }).default('0').notNull(),
	location: jsonb(),
	client: jsonb(),
	createdBy: uuid("created_by").notNull(),
	tags: text().array().default([""]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_projects_client_gin").using("gin", table.client.asc().nullsLast().op("jsonb_ops")),
	index("idx_projects_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_projects_company_priority").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.priority.asc().nullsLast().op("text_ops")),
	index("idx_projects_company_status").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	index("idx_projects_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_projects_created_by").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
	index("idx_projects_dates").using("btree", table.startDate.asc().nullsLast().op("date_ops"), table.endDate.asc().nullsLast().op("date_ops")),
	index("idx_projects_location_gin").using("gin", table.location.asc().nullsLast().op("jsonb_ops")),
	index("idx_projects_priority").using("btree", table.priority.asc().nullsLast().op("text_ops")),
	index("idx_projects_progress").using("btree", table.progress.asc().nullsLast().op("int4_ops")),
	index("idx_projects_project_number").using("btree", table.projectNumber.asc().nullsLast().op("text_ops")),
	index("idx_projects_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_projects_status_progress").using("btree", table.status.asc().nullsLast().op("int4_ops"), table.progress.asc().nullsLast().op("int4_ops")),
	index("idx_projects_tags_gin").using("gin", table.tags.asc().nullsLast().op("array_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "projects_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "projects_created_by_users_id_fk"
		}),
	unique("company_project_number_unique").on(table.companyId, table.projectNumber),
	check("actual_hours_check", sql`actual_hours >= (0)::numeric`),
	check("budget_check", sql`(budget IS NULL) OR (budget >= (0)::numeric)`),
	check("date_logic_check", sql`(start_date IS NULL) OR (end_date IS NULL) OR (end_date >= start_date)`),
	check("hours_check", sql`(estimated_hours IS NULL) OR (estimated_hours >= (0)::numeric)`),
	check("progress_check", sql`(progress >= 0) AND (progress <= 100)`),
	check("spent_check", sql`spent >= (0)::numeric`),
]);

export const punchlistItems = pgTable("punchlist_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	projectId: uuid("project_id").notNull(),
	relatedScheduleProjectId: uuid("related_schedule_project_id"),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	issueType: varchar("issue_type", { length: 50 }).default('defect').notNull(),
	location: text(),
	roomArea: varchar("room_area", { length: 100 }),
	tradeCategory: varchar("trade_category", { length: 100 }),
	reportedBy: uuid("reported_by").notNull(),
	priority: varchar({ length: 50 }).default('medium').notNull(),
	status: varchar({ length: 50 }).default('open').notNull(),
	photos: text().array().default([""]),
	attachments: text().array().default([""]),
	dueDate: date("due_date"),
	estimatedHours: numeric("estimated_hours", { precision: 6, scale:  2 }),
	actualHours: numeric("actual_hours", { precision: 6, scale:  2 }).default('0'),
	resolutionNotes: text("resolution_notes"),
	rejectionReason: text("rejection_reason"),
	requiresInspection: boolean("requires_inspection").default(false),
	inspectedBy: uuid("inspected_by"),
	inspectedAt: timestamp("inspected_at", { withTimezone: true, mode: 'string' }),
	inspectionPassed: boolean("inspection_passed"),
	inspectionNotes: text("inspection_notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_punchlist_items_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_punchlist_items_company_status").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_punchlist_items_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_punchlist_items_due_date").using("btree", table.dueDate.asc().nullsLast().op("date_ops")),
	index("idx_punchlist_items_due_date_status").using("btree", table.dueDate.asc().nullsLast().op("date_ops"), table.status.asc().nullsLast().op("date_ops")),
	index("idx_punchlist_items_inspected_by").using("btree", table.inspectedBy.asc().nullsLast().op("uuid_ops")),
	index("idx_punchlist_items_issue_type").using("btree", table.issueType.asc().nullsLast().op("text_ops")),
	index("idx_punchlist_items_priority").using("btree", table.priority.asc().nullsLast().op("text_ops")),
	index("idx_punchlist_items_priority_status").using("btree", table.priority.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_punchlist_items_project_id").using("btree", table.projectId.asc().nullsLast().op("uuid_ops")),
	index("idx_punchlist_items_project_status").using("btree", table.projectId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_punchlist_items_related_schedule_project_id").using("btree", table.relatedScheduleProjectId.asc().nullsLast().op("uuid_ops")),
	index("idx_punchlist_items_reported_by").using("btree", table.reportedBy.asc().nullsLast().op("uuid_ops")),
	index("idx_punchlist_items_requires_inspection").using("btree", table.requiresInspection.asc().nullsLast().op("bool_ops")),
	index("idx_punchlist_items_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_punchlist_items_trade_category").using("btree", table.tradeCategory.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "punchlist_items_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.inspectedBy],
			foreignColumns: [users.id],
			name: "punchlist_items_inspected_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "punchlist_items_project_id_projects_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.relatedScheduleProjectId],
			foreignColumns: [scheduleProjects.id],
			name: "punchlist_items_related_schedule_project_id_schedule_projects_i"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.reportedBy],
			foreignColumns: [users.id],
			name: "punchlist_items_reported_by_users_id_fk"
		}),
]);

export const projectMembers = pgTable("project_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: uuid("project_id").notNull(),
	userId: uuid("user_id").notNull(),
	hourlyRate: numeric("hourly_rate", { precision: 8, scale:  2 }),
	overtimeRate: numeric("overtime_rate", { precision: 8, scale:  2 }),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	leftAt: timestamp("left_at", { withTimezone: true, mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	assignedBy: uuid("assigned_by"),
	companyId: uuid("company_id").notNull(),
	status: varchar({ length: 50 }).default('active').notNull(),
}, (table) => [
	index("idx_project_members_assigned_by").using("btree", table.assignedBy.asc().nullsLast().op("uuid_ops")),
	index("idx_project_members_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_project_members_company_status").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_project_members_joined_at").using("btree", table.joinedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_project_members_project_id").using("btree", table.projectId.asc().nullsLast().op("uuid_ops")),
	index("idx_project_members_project_status").using("btree", table.projectId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	index("idx_project_members_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_project_members_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_project_members_user_status").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [users.id],
			name: "project_members_assigned_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "project_members_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_members_project_id_projects_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "project_members_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("project_user_unique").on(table.projectId, table.userId),
]);

export const companies = pgTable("companies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	industry: varchar({ length: 100 }),
	size: varchar({ length: 50 }),
	address: text(),
	phone: varchar({ length: 50 }),
	website: varchar({ length: 255 }),
	logoUrl: text("logo_url"),
	subscriptionPlan: varchar("subscription_plan", { length: 50 }).default('trial'),
	subscriptionStatus: varchar("subscription_status", { length: 50 }).default('active'),
	trialEndsAt: timestamp("trial_ends_at", { withTimezone: true, mode: 'string' }).default(sql`(now() + '14 days'::interval)`),
	maxUsers: integer("max_users").default(10),
	maxProjects: integer("max_projects").default(5),
	maxStorageGb: integer("max_storage_gb").default(1),
	isActive: boolean("is_active").default(true),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_companies_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_companies_subscription_status").using("btree", table.subscriptionStatus.asc().nullsLast().op("text_ops")),
	unique("companies_slug_unique").on(table.slug),
	check("companies_slug_check", sql`(slug)::text ~ '^[a-z0-9\-]+$'::text`),
]);

export const passwordResets = pgTable("password_resets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	tokenHash: varchar("token_hash", { length: 255 }).notNull(),
	isUsed: boolean("is_used").default(false),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_password_resets_expires_at").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_password_resets_token_hash").using("btree", table.tokenHash.asc().nullsLast().op("text_ops")),
	index("idx_password_resets_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_resets_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("password_resets_token_hash_unique").on(table.tokenHash),
]);

export const emailVerifications = pgTable("email_verifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	tokenHash: varchar("token_hash", { length: 255 }).notNull(),
	isUsed: boolean("is_used").default(false),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_email_verifications_expires_at").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_email_verifications_token_hash").using("btree", table.tokenHash.asc().nullsLast().op("text_ops")),
	index("idx_email_verifications_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "email_verifications_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("email_verifications_token_hash_unique").on(table.tokenHash),
]);

export const userSessions = pgTable("user_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	tokenHash: varchar("token_hash", { length: 255 }).notNull(),
	refreshTokenHash: varchar("refresh_token_hash", { length: 255 }),
	deviceInfo: jsonb("device_info").default({}),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_sessions_expires_at").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_sessions_token_hash").using("btree", table.tokenHash.asc().nullsLast().op("text_ops")),
	index("idx_sessions_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_sessions_token_hash_unique").on(table.tokenHash),
]);

export const taskAttachments = pgTable("task_attachments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskId: uuid("task_id"),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	fileUrl: text("file_url").notNull(),
	fileType: varchar("file_type", { length: 50 }),
	fileSize: integer("file_size"),
	mimeType: varchar("mime_type", { length: 100 }),
	attachmentType: varchar("attachment_type", { length: 50 }),
	description: text(),
	uploadedBy: uuid("uploaded_by"),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	originalName: varchar("original_name", { length: 255 }),
	stage: varchar({ length: 50 }),
	latitude: varchar({ length: 20 }),
	longitude: varchar({ length: 20 }),
	deviceInfo: text("device_info"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_task_attachments_file_type").using("btree", table.fileType.asc().nullsLast().op("text_ops")),
	index("idx_task_attachments_stage").using("btree", table.stage.asc().nullsLast().op("text_ops")),
	index("idx_task_attachments_task_id").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
	index("idx_task_attachments_type").using("btree", table.attachmentType.asc().nullsLast().op("text_ops")),
	index("idx_task_attachments_uploaded_at").using("btree", table.uploadedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_task_attachments_uploaded_by").using("btree", table.uploadedBy.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_attachments_task_id_tasks_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "task_attachments_uploaded_by_users_id_fk"
		}),
]);

export const timeEntries = pgTable("time_entries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id"),
	userId: uuid("user_id"),
	projectId: uuid("project_id"),
	date: date().notNull(),
	startTime: time("start_time"),
	endTime: time("end_time"),
	breakMinutes: integer("break_minutes").default(0),
	regularHours: numeric("regular_hours", { precision: 4, scale:  2 }).default('0'),
	overtimeHours: numeric("overtime_hours", { precision: 4, scale:  2 }).default('0'),
	totalHours: numeric("total_hours", { precision: 4, scale:  2 }).notNull(),
	overtimeRate: numeric("overtime_rate", { precision: 8, scale:  2 }),
	totalPay: numeric("total_pay", { precision: 10, scale:  2 }),
	description: text(),
	workType: varchar("work_type", { length: 100 }),
	status: varchar({ length: 50 }).default('clocked_out'),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	clockInLocation: point("clock_in_location"),
	clockOutLocation: point("clock_out_location"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	workerName: varchar("worker_name", { length: 255 }),
	isSystemUser: boolean("is_system_user").default(false),
	doubleTimeHours: numeric("double_time_hours", { precision: 4, scale:  2 }).default('0'),
	regularRate: numeric("regular_rate", { precision: 8, scale:  2 }),
	doubleTimeRate: numeric("double_time_rate", { precision: 8, scale:  2 }),
	trade: varchar({ length: 100 }),
	workLocation: text("work_location"),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }),
	equipmentUsed: text("equipment_used").array(),
	materialsUsed: text("materials_used").array(),
	weatherConditions: varchar("weather_conditions", { length: 100 }),
	temperatureF: integer("temperature_f"),
	workConditions: text("work_conditions"),
	safetyIncidents: text("safety_incidents"),
	ppe: text().array(),
	workCompleted: text("work_completed"),
	issuesEncountered: text("issues_encountered"),
	nextSteps: text("next_steps"),
	qualityRating: integer("quality_rating"),
	createdBy: uuid("created_by"),
	lastModifiedBy: uuid("last_modified_by"),
	scheduleProjectId: uuid("schedule_project_id"),
}, (table) => [
	index("idx_time_entries_approved_by").using("btree", table.approvedBy.asc().nullsLast().op("uuid_ops")),
	index("idx_time_entries_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_time_entries_date").using("btree", table.date.asc().nullsLast().op("date_ops")),
	index("idx_time_entries_is_system_user").using("btree", table.isSystemUser.asc().nullsLast().op("bool_ops")),
	index("idx_time_entries_project_id").using("btree", table.projectId.asc().nullsLast().op("uuid_ops")),
	index("idx_time_entries_schedule_project_id").using("btree", table.scheduleProjectId.asc().nullsLast().op("uuid_ops")),
	index("idx_time_entries_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_time_entries_submitted_at").using("btree", table.submittedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_time_entries_trade").using("btree", table.trade.asc().nullsLast().op("text_ops")),
	index("idx_time_entries_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_time_entries_work_type").using("btree", table.workType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "time_entries_approved_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "time_entries_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "time_entries_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.lastModifiedBy],
			foreignColumns: [users.id],
			name: "time_entries_last_modified_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "time_entries_project_id_projects_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.scheduleProjectId],
			foreignColumns: [scheduleProjects.id],
			name: "time_entries_schedule_project_id_schedule_projects_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "time_entries_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const scheduleEvents = pgTable("schedule_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id"),
	projectId: uuid("project_id"),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	eventType: varchar("event_type", { length: 50 }),
	startDatetime: timestamp("start_datetime", { withTimezone: true, mode: 'string' }).notNull(),
	endDatetime: timestamp("end_datetime", { withTimezone: true, mode: 'string' }).notNull(),
	isAllDay: boolean("is_all_day").default(false),
	timezone: varchar({ length: 50 }).default('UTC'),
	location: text(),
	address: text(),
	isRecurring: boolean("is_recurring").default(false),
	recurrencePattern: jsonb("recurrence_pattern"),
	status: varchar({ length: 50 }).default('scheduled'),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	trade: varchar({ length: 100 }),
	crew: varchar({ length: 255 }),
	estimatedWorkers: varchar("estimated_workers", { length: 50 }),
	recurrenceEndDate: timestamp("recurrence_end_date", { withTimezone: true, mode: 'string' }),
	parentEventId: uuid("parent_event_id"),
	priority: varchar({ length: 50 }).default('medium'),
	weatherDependent: boolean("weather_dependent").default(false),
	indoorWork: boolean("indoor_work").default(true),
	dependsOn: text("depends_on").array(),
	blocks: text().array(),
	reminderMinutes: varchar("reminder_minutes", { length: 20 }).default('60'),
	notifyChanges: boolean("notify_changes").default(true),
	lastModifiedBy: uuid("last_modified_by"),
	notes: text(),
}, (table) => [
	index("idx_schedule_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_schedule_created_by").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
	index("idx_schedule_datetime").using("btree", table.startDatetime.asc().nullsLast().op("timestamptz_ops"), table.endDatetime.asc().nullsLast().op("timestamptz_ops")),
	index("idx_schedule_event_type").using("btree", table.eventType.asc().nullsLast().op("text_ops")),
	index("idx_schedule_is_recurring").using("btree", table.isRecurring.asc().nullsLast().op("bool_ops")),
	index("idx_schedule_parent_event").using("btree", table.parentEventId.asc().nullsLast().op("uuid_ops")),
	index("idx_schedule_priority").using("btree", table.priority.asc().nullsLast().op("text_ops")),
	index("idx_schedule_project_id").using("btree", table.projectId.asc().nullsLast().op("uuid_ops")),
	index("idx_schedule_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_schedule_trade").using("btree", table.trade.asc().nullsLast().op("text_ops")),
	index("idx_schedule_weather_dependent").using("btree", table.weatherDependent.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "schedule_events_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "schedule_events_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.lastModifiedBy],
			foreignColumns: [users.id],
			name: "schedule_events_last_modified_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "schedule_events_project_id_projects_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id"),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }),
	emailVerified: boolean("email_verified").default(false),
	phone: varchar({ length: 50 }),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	avatarUrl: text("avatar_url"),
	role: varchar({ length: 50 }).default('member').notNull(),
	permissions: jsonb().default({}).notNull(),
	jobTitle: varchar("job_title", { length: 100 }),
	hourlyRate: numeric("hourly_rate", { precision: 8, scale:  2 }),
	overtimeRate: numeric("overtime_rate", { precision: 8, scale:  2 }),
	startDate: date("start_date"),
	isActive: boolean("is_active").default(true),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	timezone: varchar({ length: 50 }).default('UTC'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	tradeSpecialty: varchar("trade_specialty", { length: 100 }),
	certifications: text(),
	emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
	emergencyContactPhone: varchar("emergency_contact_phone", { length: 50 }),
	requiresPasswordChange: boolean("requires_password_change").default(false),
}, (table) => [
	index("idx_users_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_users_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_users_requires_password_change").using("btree", table.requiresPasswordChange.asc().nullsLast().op("bool_ops")),
	index("idx_users_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	index("idx_users_trade_specialty").using("btree", table.tradeSpecialty.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "users_company_id_companies_id_fk"
		}).onDelete("cascade"),
	unique("users_email_unique").on(table.email),
]);

export const scheduleProjects = pgTable("schedule_projects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	projectId: uuid("project_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	startTime: time("start_time"),
	endTime: time("end_time"),
	assignedProjectMemberIds: text("assigned_project_member_ids").array().notNull(),
	tradeRequired: varchar("trade_required", { length: 100 }),
	status: varchar({ length: 50 }).default('planned').notNull(),
	priority: varchar({ length: 50 }).default('medium').notNull(),
	progressPercentage: numeric("progress_percentage", { precision: 5, scale:  2 }).default('0').notNull(),
	estimatedHours: numeric("estimated_hours", { precision: 6, scale:  2 }),
	actualHours: numeric("actual_hours", { precision: 6, scale:  2 }).default('0'),
	dependsOn: text("depends_on").array(),
	location: text(),
	notes: text(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_schedule_projects_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_schedule_projects_company_status").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_schedule_projects_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_schedule_projects_created_by").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
	index("idx_schedule_projects_date_range").using("btree", table.startDate.asc().nullsLast().op("date_ops"), table.endDate.asc().nullsLast().op("date_ops")),
	index("idx_schedule_projects_end_date").using("btree", table.endDate.asc().nullsLast().op("date_ops")),
	index("idx_schedule_projects_priority").using("btree", table.priority.asc().nullsLast().op("text_ops")),
	index("idx_schedule_projects_project_id").using("btree", table.projectId.asc().nullsLast().op("uuid_ops")),
	index("idx_schedule_projects_project_status").using("btree", table.projectId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_schedule_projects_start_date").using("btree", table.startDate.asc().nullsLast().op("date_ops")),
	index("idx_schedule_projects_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_schedule_projects_trade_required").using("btree", table.tradeRequired.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "schedule_projects_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "schedule_projects_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "schedule_projects_project_id_projects_id_fk"
		}).onDelete("cascade"),
]);

export const tasks = pgTable("tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id"),
	projectId: uuid("project_id"),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	taskNumber: varchar("task_number", { length: 100 }),
	status: varchar({ length: 50 }).default('open'),
	priority: varchar({ length: 50 }).default('medium'),
	category: varchar({ length: 100 }),
	trade: varchar({ length: 100 }),
	assignedTo: uuid("assigned_to"),
	estimatedHours: numeric("estimated_hours", { precision: 4, scale:  2 }),
	actualHours: numeric("actual_hours", { precision: 4, scale:  2 }).default('0'),
	dueDate: date("due_date"),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	location: text(),
	floor: varchar({ length: 50 }),
	room: varchar({ length: 100 }),
	coordinates: point(),
	requiresInspection: boolean("requires_inspection").default(false),
	inspectedBy: uuid("inspected_by"),
	inspectedAt: timestamp("inspected_at", { withTimezone: true, mode: 'string' }),
	inspectionNotes: text("inspection_notes"),
	blockedBy: uuid("blocked_by"),
	blocksTasks: boolean("blocks_tasks").default(false),
	createdBy: uuid("created_by"),
	tags: text().array(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	assignedToName: varchar("assigned_to_name", { length: 255 }),
	inspectionPassed: boolean("inspection_passed"),
	dependencyNotes: text("dependency_notes"),
	progressNotes: text("progress_notes"),
	contractorNotes: text("contractor_notes"),
	workerNotes: text("worker_notes"),
}, (table) => [
	index("idx_tasks_assigned_to").using("btree", table.assignedTo.asc().nullsLast().op("uuid_ops")),
	index("idx_tasks_blocked_by").using("btree", table.blockedBy.asc().nullsLast().op("uuid_ops")),
	index("idx_tasks_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_tasks_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_tasks_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_tasks_created_by").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
	index("idx_tasks_due_date").using("btree", table.dueDate.asc().nullsLast().op("date_ops")),
	index("idx_tasks_priority").using("btree", table.priority.asc().nullsLast().op("text_ops")),
	index("idx_tasks_project_id").using("btree", table.projectId.asc().nullsLast().op("uuid_ops")),
	index("idx_tasks_requires_inspection").using("btree", table.requiresInspection.asc().nullsLast().op("bool_ops")),
	index("idx_tasks_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_tasks_trade").using("btree", table.trade.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "tasks_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "tasks_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.inspectedBy],
			foreignColumns: [users.id],
			name: "tasks_inspected_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "tasks_project_id_projects_id_fk"
		}).onDelete("cascade"),
]);

export const punchlistItemAssignments = pgTable("punchlist_item_assignments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	punchlistItemId: uuid("punchlist_item_id").notNull(),
	projectMemberId: uuid("project_member_id").notNull(),
	role: varchar({ length: 50 }).default('primary').notNull(),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	assignedBy: uuid("assigned_by").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	removedAt: timestamp("removed_at", { withTimezone: true, mode: 'string' }),
	removedBy: uuid("removed_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_punchlist_assignments_assigned_at").using("btree", table.assignedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_punchlist_assignments_assigned_by").using("btree", table.assignedBy.asc().nullsLast().op("uuid_ops")),
	index("idx_punchlist_assignments_company_active").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.isActive.asc().nullsLast().op("uuid_ops")),
	index("idx_punchlist_assignments_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_punchlist_assignments_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_punchlist_assignments_member_active").using("btree", table.projectMemberId.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_punchlist_assignments_project_member_id").using("btree", table.projectMemberId.asc().nullsLast().op("uuid_ops")),
	index("idx_punchlist_assignments_punchlist_active").using("btree", table.punchlistItemId.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_punchlist_assignments_punchlist_item_id").using("btree", table.punchlistItemId.asc().nullsLast().op("uuid_ops")),
	index("idx_punchlist_assignments_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [users.id],
			name: "punchlist_item_assignments_assigned_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "punchlist_item_assignments_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectMemberId],
			foreignColumns: [projectMembers.id],
			name: "punchlist_item_assignments_project_member_id_project_members_id"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.punchlistItemId],
			foreignColumns: [punchlistItems.id],
			name: "punchlist_item_assignments_punchlist_item_id_punchlist_items_id"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.removedBy],
			foreignColumns: [users.id],
			name: "punchlist_item_assignments_removed_by_users_id_fk"
		}),
	unique("unique_active_member_per_punchlist_item").on(table.punchlistItemId, table.projectMemberId, table.isActive),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id"),
	action: varchar({ length: 100 }).notNull(),
	resourceType: varchar("resource_type", { length: 50 }).notNull(),
	resourceId: uuid("resource_id"),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	changes: jsonb(),
	userId: uuid("user_id"),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_audit_action").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("idx_audit_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_audit_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_audit_resource").using("btree", table.resourceType.asc().nullsLast().op("text_ops"), table.resourceId.asc().nullsLast().op("text_ops")),
	index("idx_audit_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "audit_logs_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "audit_logs_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id"),
	userId: uuid("user_id"),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	type: varchar({ length: 50 }).default('info'),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	priority: varchar({ length: 20 }).default('normal'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	category: varchar({ length: 50 }),
	data: jsonb(),
	actionUrl: text("action_url"),
	isRead: boolean("is_read").default(false),
	isArchived: boolean("is_archived").default(false),
	deliveryMethod: varchar("delivery_method", { length: 50 }).default('in_app'),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	createdBy: uuid("created_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_notifications_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_notifications_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_notifications_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_notifications_expires_at").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_notifications_is_archived").using("btree", table.isArchived.asc().nullsLast().op("bool_ops")),
	index("idx_notifications_is_read").using("btree", table.isRead.asc().nullsLast().op("bool_ops")),
	index("idx_notifications_priority").using("btree", table.priority.asc().nullsLast().op("text_ops")),
	index("idx_notifications_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("idx_notifications_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "notifications_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "notifications_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const projectFiles = pgTable("project_files", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	projectId: uuid("project_id"),
	name: varchar({ length: 255 }).notNull(),
	fileUrl: text("file_url").notNull(),
	fileType: varchar("file_type", { length: 50 }),
	fileSize: integer("file_size"),
	mimeType: varchar("mime_type", { length: 100 }),
	folder: varchar({ length: 255 }).default('general'),
	version: varchar({ length: 50 }),
	description: text(),
	tags: text().array(),
	isPublic: boolean("is_public").default(false),
	uploadedBy: uuid("uploaded_by"),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	originalName: varchar("original_name", { length: 255 }),
	category: varchar({ length: 100 }),
	requiresApproval: boolean("requires_approval").default(false),
	isApproved: boolean("is_approved").default(true),
	status: varchar({ length: 50 }).default('active'),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_project_files_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_project_files_file_type").using("btree", table.fileType.asc().nullsLast().op("text_ops")),
	index("idx_project_files_folder").using("btree", table.folder.asc().nullsLast().op("text_ops")),
	index("idx_project_files_is_public").using("btree", table.isPublic.asc().nullsLast().op("bool_ops")),
	index("idx_project_files_project_id").using("btree", table.projectId.asc().nullsLast().op("uuid_ops")),
	index("idx_project_files_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_project_files_uploaded_at").using("btree", table.uploadedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_project_files_uploaded_by").using("btree", table.uploadedBy.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "project_files_approved_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_files_project_id_projects_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "project_files_uploaded_by_users_id_fk"
		}),
]);

export const scheduleAttendees = pgTable("schedule_attendees", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id"),
	userId: uuid("user_id"),
	status: varchar({ length: 50 }).default('invited'),
	responseAt: timestamp("response_at", { withTimezone: true, mode: 'string' }),
	attendance: varchar({ length: 50 }),
	role: varchar({ length: 50 }).default('attendee'),
	memberName: varchar("member_name", { length: 255 }),
	memberEmail: varchar("member_email", { length: 255 }),
	memberPhone: varchar("member_phone", { length: 50 }),
	isSystemUser: boolean("is_system_user").default(false),
	responsibility: text(),
	checkedInAt: timestamp("checked_in_at", { withTimezone: true, mode: 'string' }),
	checkedOutAt: timestamp("checked_out_at", { withTimezone: true, mode: 'string' }),
	hoursWorked: varchar("hours_worked", { length: 20 }),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_schedule_attendees_attendance").using("btree", table.attendance.asc().nullsLast().op("text_ops")),
	index("idx_schedule_attendees_event_id").using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
	index("idx_schedule_attendees_is_system_user").using("btree", table.isSystemUser.asc().nullsLast().op("bool_ops")),
	index("idx_schedule_attendees_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	index("idx_schedule_attendees_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_schedule_attendees_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [scheduleEvents.id],
			name: "schedule_attendees_event_id_schedule_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "schedule_attendees_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("event_user_unique").on(table.eventId, table.userId),
]);

export const aiConversations = pgTable("ai_conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	userId: uuid("user_id").notNull(),
	title: varchar({ length: 255 }).default('New Conversation').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ai_conversations_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_ai_conversations_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_ai_conversations_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "ai_conversations_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "ai_conversations_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const aiMessages = pgTable("ai_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conversationId: uuid("conversation_id").notNull(),
	role: varchar({ length: 20 }).notNull(),
	content: text().notNull(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ai_messages_conversation_id").using("btree", table.conversationId.asc().nullsLast().op("uuid_ops")),
	index("idx_ai_messages_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [aiConversations.id],
			name: "ai_messages_conversation_id_ai_conversations_id_fk"
		}).onDelete("cascade"),
]);
