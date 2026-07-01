CREATE TABLE `pdfSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`marginTop` int DEFAULT 10,
	`marginBottom` int DEFAULT 10,
	`marginLeft` int DEFAULT 10,
	`marginRight` int DEFAULT 10,
	`fontSizeTitle` int DEFAULT 18,
	`fontSizeSubtitle` int DEFAULT 14,
	`fontSizeHeading` int DEFAULT 9,
	`fontSizeText` int DEFAULT 8,
	`fontSizeTable` int DEFAULT 7,
	`fontSizeFooter` int DEFAULT 6,
	`sectionSpacing` int DEFAULT 8,
	`lineHeight` int DEFAULT 130,
	`maxImageHeight` int DEFAULT 180,
	`logoHeight` int DEFAULT 32,
	`tableRowPadding` int DEFAULT 4,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdfSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `pdfSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `technicalDataColumns` json;--> statement-breakpoint
ALTER TABLE `products` ADD `technicalDataRows` json;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `technicalData`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `companyName`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `companyWebsite`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `companyEmail`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `locations`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `logoUrl`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `footerNote`;