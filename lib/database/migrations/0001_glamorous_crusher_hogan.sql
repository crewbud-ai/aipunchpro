CREATE TABLE "email_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"token_hash" varchar(255) NOT NULL,
	"is_used" boolean DEFAULT false,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "email_verifications_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_email_verifications_user_id" ON "email_verifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_email_verifications_token_hash" ON "email_verifications" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_email_verifications_expires_at" ON "email_verifications" USING btree ("expires_at");