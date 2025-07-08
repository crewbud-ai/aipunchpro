ALTER TABLE "projects" DROP CONSTRAINT "projects_project_manager_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_foreman_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "idx_projects_manager";--> statement-breakpoint
DROP INDEX "idx_projects_foreman";--> statement-breakpoint
DROP INDEX "idx_project_members_role";--> statement-breakpoint
DROP INDEX "idx_project_members_is_active";--> statement-breakpoint
DROP INDEX "idx_project_members_project_role";--> statement-breakpoint
DROP INDEX "idx_project_members_project_active";--> statement-breakpoint
DROP INDEX "idx_project_members_user_active";--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "company_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "status" varchar(50) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_project_members_company_id" ON "project_members" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_project_members_status" ON "project_members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_project_members_project_status" ON "project_members" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "idx_project_members_user_status" ON "project_members" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_project_members_company_status" ON "project_members" USING btree ("company_id","status");--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "project_manager_id";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "foreman_id";--> statement-breakpoint
ALTER TABLE "project_members" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "project_members" DROP COLUMN "is_active";