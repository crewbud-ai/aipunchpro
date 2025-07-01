ALTER TABLE "projects" ALTER COLUMN "company_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'not_started';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "priority" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "budget" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "spent" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "spent" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "spent" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "progress" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "estimated_hours" SET DATA TYPE numeric(8, 2);--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "actual_hours" SET DATA TYPE numeric(8, 2);--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "actual_hours" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "actual_hours" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "location" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "tags" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "actual_start_date" date;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "actual_end_date" date;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "client" jsonb;--> statement-breakpoint
CREATE INDEX "idx_projects_project_number" ON "projects" USING btree ("project_number");--> statement-breakpoint
CREATE INDEX "idx_projects_location_gin" ON "projects" USING gin ("location");--> statement-breakpoint
CREATE INDEX "idx_projects_client_gin" ON "projects" USING gin ("client");--> statement-breakpoint
CREATE INDEX "idx_projects_tags_gin" ON "projects" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "idx_projects_company_status" ON "projects" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "idx_projects_company_priority" ON "projects" USING btree ("company_id","priority");--> statement-breakpoint
CREATE INDEX "idx_projects_status_progress" ON "projects" USING btree ("status","progress");--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "address";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "client_name";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "client_contact";--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_number_unique" UNIQUE("project_number");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "budget_check" CHECK ("projects"."budget" IS NULL OR "projects"."budget" >= 0);--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "spent_check" CHECK ("projects"."spent" >= 0);--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "hours_check" CHECK ("projects"."estimated_hours" IS NULL OR "projects"."estimated_hours" >= 0);--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "actual_hours_check" CHECK ("projects"."actual_hours" >= 0);--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "date_logic_check" CHECK ("projects"."start_date" IS NULL OR "projects"."end_date" IS NULL OR "projects"."end_date" >= "projects"."start_date");