CREATE TABLE "punchlist_item_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"punchlist_item_id" uuid NOT NULL,
	"project_member_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'primary' NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"removed_at" timestamp with time zone,
	"removed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_active_member_per_punchlist_item" UNIQUE("punchlist_item_id","project_member_id","is_active")
);
--> statement-breakpoint
ALTER TABLE "punchlist_items" DROP CONSTRAINT "punchlist_items_assigned_project_member_id_project_members_id_fk";
--> statement-breakpoint
DROP INDEX "idx_punchlist_items_assigned_project_member_id";--> statement-breakpoint
DROP INDEX "idx_punchlist_items_assigned_member_status";--> statement-breakpoint
ALTER TABLE "punchlist_items" ALTER COLUMN "photos" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "punchlist_items" ALTER COLUMN "attachments" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "punchlist_item_assignments" ADD CONSTRAINT "punchlist_item_assignments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_item_assignments" ADD CONSTRAINT "punchlist_item_assignments_punchlist_item_id_punchlist_items_id_fk" FOREIGN KEY ("punchlist_item_id") REFERENCES "public"."punchlist_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_item_assignments" ADD CONSTRAINT "punchlist_item_assignments_project_member_id_project_members_id_fk" FOREIGN KEY ("project_member_id") REFERENCES "public"."project_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_item_assignments" ADD CONSTRAINT "punchlist_item_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_item_assignments" ADD CONSTRAINT "punchlist_item_assignments_removed_by_users_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_punchlist_assignments_company_id" ON "punchlist_item_assignments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_punchlist_assignments_punchlist_item_id" ON "punchlist_item_assignments" USING btree ("punchlist_item_id");--> statement-breakpoint
CREATE INDEX "idx_punchlist_assignments_project_member_id" ON "punchlist_item_assignments" USING btree ("project_member_id");--> statement-breakpoint
CREATE INDEX "idx_punchlist_assignments_role" ON "punchlist_item_assignments" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_punchlist_assignments_assigned_by" ON "punchlist_item_assignments" USING btree ("assigned_by");--> statement-breakpoint
CREATE INDEX "idx_punchlist_assignments_is_active" ON "punchlist_item_assignments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_punchlist_assignments_assigned_at" ON "punchlist_item_assignments" USING btree ("assigned_at");--> statement-breakpoint
CREATE INDEX "idx_punchlist_assignments_punchlist_active" ON "punchlist_item_assignments" USING btree ("punchlist_item_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_punchlist_assignments_member_active" ON "punchlist_item_assignments" USING btree ("project_member_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_punchlist_assignments_company_active" ON "punchlist_item_assignments" USING btree ("company_id","is_active");--> statement-breakpoint
ALTER TABLE "punchlist_items" DROP COLUMN "assigned_project_member_id";--> statement-breakpoint
ALTER TABLE "punchlist_items" DROP COLUMN "assigned_at";