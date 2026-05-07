-- Better Auth Core Tables - Optimized for PostgreSQL + Drizzle

--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL DEFAULT now(),
	CONSTRAINT "account_provider_account_unique" UNIQUE("provider_id", "account_id")
);

--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL DEFAULT now(),
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);

--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);

--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

--> statement-breakpoint
-- Foreign Keys (with CASCADE for clean user deletion)
ALTER TABLE "account" 
ADD CONSTRAINT "account_user_id_fk" 
FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

--> statement-breakpoint
ALTER TABLE "session" 
ADD CONSTRAINT "session_user_id_fk" 
FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

--> statement-breakpoint
-- Performance Indexes (very important for production)
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "account_provider_account_idx" ON "account" USING btree ("provider_id", "account_id");

CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "session_token_idx" ON "session" USING btree ("token");

CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" USING btree ("identifier");
CREATE INDEX IF NOT EXISTS "user_email_idx" ON "user" USING btree ("email");