CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(64) NOT NULL,
	"email" varchar(64) NOT NULL,
	"password" varchar(128),
	"image" varchar(256),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
