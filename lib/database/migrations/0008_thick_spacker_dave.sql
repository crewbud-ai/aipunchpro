CREATE TABLE "schedule_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"assigned_project_member_ids" text[] NOT NULL,
	"trade_required" varchar(100),
	"status" varchar(50) DEFAULT 'planned' NOT NULL,
	"priority" varchar(50) DEFAULT 'medium' NOT NULL,
	"progress_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
	"estimated_hours" numeric(6, 2),
	"actual_hours" numeric(6, 2) DEFAULT '0',
	"depends_on" text[],
	"location" text,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "punchlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"related_schedule_project_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"issue_type" varchar(50) DEFAULT 'defect' NOT NULL,
	"location" text,
	"room_area" varchar(100),
	"assigned_project_member_id" uuid,
	"trade_category" varchar(100),
	"reported_by" uuid NOT NULL,
	"priority" varchar(50) DEFAULT 'medium' NOT NULL,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"photos" text[],
	"attachments" text[],
	"due_date" date,
	"estimated_hours" numeric(6, 2),
	"actual_hours" numeric(6, 2) DEFAULT '0',
	"resolution_notes" text,
	"rejection_reason" text,
	"requires_inspection" boolean DEFAULT false,
	"inspected_by" uuid,
	"inspected_at" timestamp with time zone,
	"inspection_passed" boolean,
	"inspection_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"assigned_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "schedule_projects" ADD CONSTRAINT "schedule_projects_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_projects" ADD CONSTRAINT "schedule_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_projects" ADD CONSTRAINT "schedule_projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_items" ADD CONSTRAINT "punchlist_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_items" ADD CONSTRAINT "punchlist_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_items" ADD CONSTRAINT "punchlist_items_related_schedule_project_id_schedule_projects_id_fk" FOREIGN KEY ("related_schedule_project_id") REFERENCES "public"."schedule_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_items" ADD CONSTRAINT "punchlist_items_assigned_project_member_id_project_members_id_fk" FOREIGN KEY ("assigned_project_member_id") REFERENCES "public"."project_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_items" ADD CONSTRAINT "punchlist_items_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_items" ADD CONSTRAINT "punchlist_items_inspected_by_users_id_fk" FOREIGN KEY ("inspected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_schedule_projects_company_id" ON "schedule_projects" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_schedule_projects_project_id" ON "schedule_projects" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_schedule_projects_status" ON "schedule_projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_schedule_projects_priority" ON "schedule_projects" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_schedule_projects_start_date" ON "schedule_projects" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_schedule_projects_end_date" ON "schedule_projects" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "idx_schedule_projects_trade_required" ON "schedule_projects" USING btree ("trade_required");--> statement-breakpoint
CREATE INDEX "idx_schedule_projects_created_by" ON "schedule_projects" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_schedule_projects_created_at" ON "schedule_projects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_schedule_projects_project_status" ON "schedule_projects" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "idx_schedule_projects_company_status" ON "schedule_projects" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "idx_schedule_projects_date_range" ON "schedule_projects" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_company_id" ON "punchlist_items" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_project_id" ON "punchlist_items" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_related_schedule_project_id" ON "punchlist_items" USING btree ("related_schedule_project_id");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_assigned_project_member_id" ON "punchlist_items" USING btree ("assigned_project_member_id");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_status" ON "punchlist_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_priority" ON "punchlist_items" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_issue_type" ON "punchlist_items" USING btree ("issue_type");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_trade_category" ON "punchlist_items" USING btree ("trade_category");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_reported_by" ON "punchlist_items" USING btree ("reported_by");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_due_date" ON "punchlist_items" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_created_at" ON "punchlist_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_requires_inspection" ON "punchlist_items" USING btree ("requires_inspection");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_inspected_by" ON "punchlist_items" USING btree ("inspected_by");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_project_status" ON "punchlist_items" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_company_status" ON "punchlist_items" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_assigned_member_status" ON "punchlist_items" USING btree ("assigned_project_member_id","status");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_priority_status" ON "punchlist_items" USING btree ("priority","status");--> statement-breakpoint
CREATE INDEX "idx_punchlist_items_due_date_status" ON "punchlist_items" USING btree ("due_date","status");