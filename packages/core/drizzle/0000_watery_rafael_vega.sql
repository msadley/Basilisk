CREATE TABLE `chat_participants` (
	`chat_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`chat_id`, `user_id`),
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`is_group` integer NOT NULL,
	`name` text,
	`image` blob,
	CONSTRAINT "name_required_on_group" CHECK("chats"."is_group" = 0 OR "chats"."name" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE `identity` (
	`id` integer PRIMARY KEY NOT NULL,
	`seed` blob NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`content_type` text NOT NULL,
	`content` blob NOT NULL,
	`timestamp` integer NOT NULL,
	`received` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`avatar` blob
);
