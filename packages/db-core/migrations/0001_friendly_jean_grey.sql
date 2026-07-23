CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(140) NOT NULL,
	`repo_full_name` text(180) NOT NULL,
	`name` text(120) NOT NULL,
	`description` text,
	`description_ar` text,
	`html_url` text NOT NULL,
	`homepage` text,
	`stars` integer DEFAULT 0 NOT NULL,
	`forks` integer DEFAULT 0 NOT NULL,
	`primary_language` text(60),
	`topics` text,
	`license` text(60),
	`is_archived` integer DEFAULT false NOT NULL,
	`owner_login` text(80) NOT NULL,
	`owner_avatar_url` text,
	`owner_type` text(20) DEFAULT 'User' NOT NULL,
	`category_id` integer,
	`status` text(10) DEFAULT 'pending' NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`source` text(12) NOT NULL,
	`submitter_email` text(254),
	`submission_notes` text(500),
	`review_notes` text(500),
	`repo_created_at` integer,
	`repo_pushed_at` integer,
	`approved_at` integer,
	`synced_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_repo_full_name_unique` ON `projects` (`repo_full_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE INDEX `projects_status_stars_idx` ON `projects` (`status`,`stars`);--> statement-breakpoint
CREATE INDEX `projects_status_language_idx` ON `projects` (`status`,`primary_language`);--> statement-breakpoint
CREATE INDEX `projects_status_category_idx` ON `projects` (`status`,`category_id`);