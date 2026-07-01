ALTER TABLE `products` ADD `version` varchar(20) DEFAULT '1.0';--> statement-breakpoint
ALTER TABLE `products` ADD `validFrom` timestamp;