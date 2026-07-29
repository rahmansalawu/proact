CREATE TABLE `record_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`organisation_id` text NOT NULL,
	`record_id` text NOT NULL,
	`description` text NOT NULL,
	`owner` text NOT NULL,
	`due_date` text,
	`status` text DEFAULT 'Open' NOT NULL,
	`priority` text DEFAULT 'Medium' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`record_id`) REFERENCES `module_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `record_actions_record_idx` ON `record_actions` (`organisation_id`,`record_id`);--> statement-breakpoint
CREATE INDEX `record_actions_due_idx` ON `record_actions` (`organisation_id`,`status`,`due_date`);