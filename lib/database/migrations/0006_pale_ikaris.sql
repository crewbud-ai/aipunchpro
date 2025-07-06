DROP INDEX "idx_project_members_is_system_user";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "permissions" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "permissions" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "project_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role" SET DEFAULT 'member';--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "joined_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trade_specialty" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "certifications" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emergency_contact_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emergency_contact_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "assigned_by" uuid;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_trade_specialty" ON "users" USING btree ("trade_specialty");--> statement-breakpoint
CREATE INDEX "idx_project_members_assigned_by" ON "project_members" USING btree ("assigned_by");--> statement-breakpoint
CREATE INDEX "idx_project_members_project_role" ON "project_members" USING btree ("project_id","role");--> statement-breakpoint
CREATE INDEX "idx_project_members_project_active" ON "project_members" USING btree ("project_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_project_members_user_active" ON "project_members" USING btree ("user_id","is_active");--> statement-breakpoint
ALTER TABLE "project_members" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "project_members" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "project_members" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "project_members" DROP COLUMN "is_system_user";--> statement-breakpoint
ALTER TABLE "project_members" DROP COLUMN "can_edit";--> statement-breakpoint
ALTER TABLE "project_members" DROP COLUMN "can_manage_tasks";--> statement-breakpoint
ALTER TABLE "project_members" DROP COLUMN "can_view_financials";--> statement-breakpoint
ALTER TABLE "project_members" DROP COLUMN "emergency_contact";