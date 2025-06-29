ALTER TABLE "audit_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "audit_logs" CASCADE;--> statement-breakpoint
DROP TABLE "notifications" CASCADE;--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assigned_to_users_id_fk";
--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "original_name" varchar(255);--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "category" varchar(100);--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "requires_approval" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "is_approved" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "status" varchar(50) DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "name" varchar(255);--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "is_system_user" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "emergency_contact" text;--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "task_attachments" ADD COLUMN "original_name" varchar(255);--> statement-breakpoint
ALTER TABLE "task_attachments" ADD COLUMN "stage" varchar(50);--> statement-breakpoint
ALTER TABLE "task_attachments" ADD COLUMN "latitude" varchar(20);--> statement-breakpoint
ALTER TABLE "task_attachments" ADD COLUMN "longitude" varchar(20);--> statement-breakpoint
ALTER TABLE "task_attachments" ADD COLUMN "device_info" text;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "assigned_to_name" varchar(255);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "inspection_passed" boolean;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "dependency_notes" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "progress_notes" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "contractor_notes" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "worker_notes" text;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "worker_name" varchar(255);--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "is_system_user" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "double_time_hours" numeric(4, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "regular_rate" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "double_time_rate" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "trade" varchar(100);--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "work_location" text;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "equipment_used" text[];--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "materials_used" text[];--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "weather_conditions" varchar(100);--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "temperature_f" integer;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "work_conditions" text;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "safety_incidents" text;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "ppe" text[];--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "work_completed" text;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "issues_encountered" text;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "next_steps" text;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "quality_rating" integer;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "last_modified_by" uuid;--> statement-breakpoint
ALTER TABLE "schedule_attendees" ADD COLUMN "member_name" varchar(255);--> statement-breakpoint
ALTER TABLE "schedule_attendees" ADD COLUMN "member_email" varchar(255);--> statement-breakpoint
ALTER TABLE "schedule_attendees" ADD COLUMN "member_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "schedule_attendees" ADD COLUMN "is_system_user" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "schedule_attendees" ADD COLUMN "responsibility" text;--> statement-breakpoint
ALTER TABLE "schedule_attendees" ADD COLUMN "checked_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "schedule_attendees" ADD COLUMN "checked_out_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "schedule_attendees" ADD COLUMN "hours_worked" varchar(20);--> statement-breakpoint
ALTER TABLE "schedule_attendees" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "schedule_attendees" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "schedule_attendees" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "trade" varchar(100);--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "crew" varchar(255);--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "estimated_workers" varchar(50);--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "recurrence_end_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "parent_event_id" uuid;--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "priority" varchar(50) DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "weather_dependent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "indoor_work" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "depends_on" text[];--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "blocks" text[];--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "reminder_minutes" varchar(20) DEFAULT '60';--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "notify_changes" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "last_modified_by" uuid;--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_project_files_project_id" ON "project_files" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_files_uploaded_by" ON "project_files" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_project_files_folder" ON "project_files" USING btree ("folder");--> statement-breakpoint
CREATE INDEX "idx_project_files_category" ON "project_files" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_project_files_file_type" ON "project_files" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX "idx_project_files_status" ON "project_files" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_project_files_uploaded_at" ON "project_files" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX "idx_project_files_is_public" ON "project_files" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_project_members_project_id" ON "project_members" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_members_user_id" ON "project_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_project_members_role" ON "project_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_project_members_is_active" ON "project_members" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_project_members_is_system_user" ON "project_members" USING btree ("is_system_user");--> statement-breakpoint
CREATE INDEX "idx_project_members_joined_at" ON "project_members" USING btree ("joined_at");--> statement-breakpoint
CREATE INDEX "idx_projects_priority" ON "projects" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_projects_foreman" ON "projects" USING btree ("foreman_id");--> statement-breakpoint
CREATE INDEX "idx_projects_created_by" ON "projects" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_projects_created_at" ON "projects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_projects_progress" ON "projects" USING btree ("progress");--> statement-breakpoint
CREATE INDEX "idx_task_attachments_task_id" ON "task_attachments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_attachments_uploaded_by" ON "task_attachments" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_task_attachments_type" ON "task_attachments" USING btree ("attachment_type");--> statement-breakpoint
CREATE INDEX "idx_task_attachments_file_type" ON "task_attachments" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX "idx_task_attachments_uploaded_at" ON "task_attachments" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX "idx_task_attachments_stage" ON "task_attachments" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_tasks_priority" ON "tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_tasks_trade" ON "tasks" USING btree ("trade");--> statement-breakpoint
CREATE INDEX "idx_tasks_created_by" ON "tasks" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_tasks_created_at" ON "tasks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_tasks_requires_inspection" ON "tasks" USING btree ("requires_inspection");--> statement-breakpoint
CREATE INDEX "idx_time_entries_task_id" ON "time_entries" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_time_entries_work_type" ON "time_entries" USING btree ("work_type");--> statement-breakpoint
CREATE INDEX "idx_time_entries_trade" ON "time_entries" USING btree ("trade");--> statement-breakpoint
CREATE INDEX "idx_time_entries_approved_by" ON "time_entries" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "idx_time_entries_submitted_at" ON "time_entries" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "idx_time_entries_is_system_user" ON "time_entries" USING btree ("is_system_user");--> statement-breakpoint
CREATE INDEX "idx_schedule_attendees_event_id" ON "schedule_attendees" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_schedule_attendees_user_id" ON "schedule_attendees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_schedule_attendees_status" ON "schedule_attendees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_schedule_attendees_role" ON "schedule_attendees" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_schedule_attendees_attendance" ON "schedule_attendees" USING btree ("attendance");--> statement-breakpoint
CREATE INDEX "idx_schedule_attendees_is_system_user" ON "schedule_attendees" USING btree ("is_system_user");--> statement-breakpoint
CREATE INDEX "idx_schedule_status" ON "schedule_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_schedule_event_type" ON "schedule_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_schedule_trade" ON "schedule_events" USING btree ("trade");--> statement-breakpoint
CREATE INDEX "idx_schedule_priority" ON "schedule_events" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_schedule_created_by" ON "schedule_events" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_schedule_weather_dependent" ON "schedule_events" USING btree ("weather_dependent");--> statement-breakpoint
CREATE INDEX "idx_schedule_is_recurring" ON "schedule_events" USING btree ("is_recurring");--> statement-breakpoint
CREATE INDEX "idx_schedule_parent_event" ON "schedule_events" USING btree ("parent_event_id");--> statement-breakpoint
ALTER TABLE "time_entries" DROP COLUMN "hourly_rate";