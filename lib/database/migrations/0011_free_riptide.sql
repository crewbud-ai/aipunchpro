ALTER TABLE "time_entries" DROP CONSTRAINT "time_entries_task_id_tasks_id_fk";
--> statement-breakpoint
DROP INDEX "idx_time_entries_task_id";--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "status" SET DEFAULT 'clocked_out';--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "schedule_project_id" uuid;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_schedule_project_id_schedule_projects_id_fk" FOREIGN KEY ("schedule_project_id") REFERENCES "public"."schedule_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_time_entries_schedule_project_id" ON "time_entries" USING btree ("schedule_project_id");--> statement-breakpoint
ALTER TABLE "time_entries" DROP COLUMN "task_id";