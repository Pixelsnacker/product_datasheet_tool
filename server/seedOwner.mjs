import { drizzle } from "drizzle-orm/mysql2";
import { mysqlTable, int, varchar, text, timestamp } from "drizzle-orm/mysql-core";
import { eq } from "drizzle-orm";

// Define users table inline to avoid TypeScript import issues
const users = mysqlTable("users", {
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

const DATABASE_URL = process.env.DATABASE_URL;
const OWNER_OPEN_ID = process.env.OWNER_OPEN_ID || "owner";

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

const existing = await db
  .select()
  .from(users)
  .where(eq(users.openId, OWNER_OPEN_ID));

if (existing.length > 0) {
  console.log(`Owner user "${OWNER_OPEN_ID}" already exists (id=${existing[0].id}). Nothing to do.`);
  process.exit(0);
}

await db.insert(users).values({
  openId: OWNER_OPEN_ID,
  name: "Owner",
  loginMethod: "team",
  role: "admin",
});

console.log(`Seeded owner user with openId "${OWNER_OPEN_ID}" (role=admin).`);
process.exit(0);
