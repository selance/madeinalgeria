CREATE INDEX `projects_status_owner_idx` ON `projects` (`status`,`owner_login`);--> statement-breakpoint
CREATE INDEX `projects_status_approved_idx` ON `projects` (`status`,`approved_at`);