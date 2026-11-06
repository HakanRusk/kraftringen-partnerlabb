CREATE TABLE `approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`payload` text NOT NULL,
	`expires_at` integer NOT NULL,
	`order_signed` text,
	`poa_signed` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `approvals_token_unique` ON `approvals` (`token`);