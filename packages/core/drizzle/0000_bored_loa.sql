CREATE TABLE `chats` (
	`id` blob PRIMARY KEY NOT NULL,
	`is_group` integer NOT NULL,
	`name` text,
	`image` blob,
	CONSTRAINT "name_required_on_group" CHECK("chats"."is_group" = 0 OR "chats"."name" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY NOT NULL,
	`chat_id` blob NOT NULL,
	`sender_id` blob NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` blob PRIMARY KEY NOT NULL,
	`name` text,
	`avatar` blob
);
