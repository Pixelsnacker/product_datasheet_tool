import { int, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table - SIEPE-style product datasheet
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Header info
  productName: varchar("productName", { length: 255 }).notNull(),
  productSubtitle: varchar("productSubtitle", { length: 255 }),
  
  // Industry categories (stored as JSON array)
  // e.g. ["INDUSTRY", "FOOD"]
  industryCategories: json("industryCategories").$type<string[]>(),
  
  // Product image
  imageUrl: text("imageUrl"),
  imageScale: int("imageScale").default(100), // Scale percentage (10-200)
  
  // Description sections (flexible, stored as JSON)
  // e.g. [{ title: "MATERIAL", items: ["Polyethylen mit hoher Dichte (HDPE)"] }]
  descriptionSections: json("descriptionSections").$type<Array<{ title: string; items: string[] }>>(),
  
  // Technical data table with multiple columns for product variants
  // e.g. { columns: ["30 L", "35 L", "40 L"], rows: [{ label: "Nennvolumen [l]", values: ["30", "35", "40"] }] }
  technicalDataColumns: json("technicalDataColumns").$type<string[]>(),
  columnWidths: json("columnWidths").$type<number[]>(), // Column widths in percentage, e.g. [20, 20, 20, 20, 20]
  technicalDataRows: json("technicalDataRows").$type<Array<{ label: string; values: string[] }>>(),
  
  // Product category for grouping on dashboard
  // e.g. "Deckelbehälter/-fässer", "Kanister", etc.
  category: varchar("category", { length: 100 }),
  
  // Sort order within category
  sortOrder: int("sortOrder").default(0),
  
  // Language for PDF output: 'de' = German, 'en' = English
  language: varchar("language", { length: 5 }).default("de").notNull(),
  
  // Footer info - only document number is editable, rest is fixed
  documentNumber: varchar("documentNumber", { length: 100 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Templates for reusable product configurations
 * System templates (userId = null) are predefined for common categories
 * User templates (userId = number) are custom templates created by users
 */
export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null for system templates, user ID for custom templates
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }), // e.g. "Fässer", "Behälter", "Sonstiges"
  isSystemTemplate: boolean("isSystemTemplate").default(false).notNull(),
  
  // Template data (same structure as product fields)
  descriptionSections: json("descriptionSections").$type<Array<{ title: string; items: string[] }>>(),
  technicalDataColumns: json("technicalDataColumns").$type<string[]>(),
  columnWidths: json("columnWidths").$type<number[]>(),
  technicalDataRows: json("technicalDataRows").$type<Array<{ label: string; values: string[] }>>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/**
 * PDF Settings - User-configurable layout settings for PDF export
 */
export const pdfSettings = mysqlTable("pdfSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // One settings per user
  
  // Page margins (in mm)
  marginTop: int("marginTop").default(10),
  marginBottom: int("marginBottom").default(10),
  marginLeft: int("marginLeft").default(10),
  marginRight: int("marginRight").default(10),
  
  // Font sizes (in px)
  fontSizeTitle: int("fontSizeTitle").default(18),
  fontSizeSubtitle: int("fontSizeSubtitle").default(14),
  fontSizeHeading: int("fontSizeHeading").default(9),
  fontSizeText: int("fontSizeText").default(8),
  fontSizeTable: int("fontSizeTable").default(7),
  fontSizeFooter: int("fontSizeFooter").default(6),
  
  // Spacing (in px)
  sectionSpacing: int("sectionSpacing").default(8),
  lineHeight: int("lineHeight").default(130), // percentage
  
  // Image settings
  maxImageHeight: int("maxImageHeight").default(180), // in px
  logoHeight: int("logoHeight").default(32), // in px
  
  // Table settings
  tableRowPadding: int("tableRowPadding").default(4), // in px
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PdfSettings = typeof pdfSettings.$inferSelect;
export type InsertPdfSettings = typeof pdfSettings.$inferInsert;
