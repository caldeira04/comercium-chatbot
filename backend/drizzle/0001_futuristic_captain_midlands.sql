CREATE TABLE `knowledge_chunk` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`embedding` text NOT NULL,
	`source_file` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
ALTER TABLE `message` ADD `created_at` text DEFAULT (CURRENT_TIMESTAMP);