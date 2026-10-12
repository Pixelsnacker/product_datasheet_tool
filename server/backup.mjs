// Logical backup of all datasheet data to a restorable .sql file.
// Usage: DATABASE_URL="mysql://..." node server/backup.mjs [outfile]
// Tables are dumped as INSERT statements (structure is recreated from the
// schema via `drizzle-kit push`). Run anytime; safe (read-only).

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const TABLES = ["users", "products", "templates", "pdfSettings"];

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir =
  process.env.BACKUP_DIR ||
  path.join(process.env.HOME || ".", "product_datasheet_backups");
fs.mkdirSync(outDir, { recursive: true });
const outFile = process.argv[2] || path.join(outDir, `backup_${stamp}.sql`);

const conn = await mysql.createConnection(DATABASE_URL);
const lines = [
  `-- Product Datasheet Tool backup`,
  `-- created: ${new Date().toISOString()}`,
  `SET FOREIGN_KEY_CHECKS=0;`,
  ``,
];

let total = 0;
for (const table of TABLES) {
  const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
  lines.push(`-- ${table}: ${rows.length} rows`);
  lines.push(`DELETE FROM \`${table}\`;`);
  for (const row of rows) {
    const cols = Object.keys(row);
    const vals = cols.map(c => {
      const v = row[c];
      if (v === null) return "NULL";
      if (v instanceof Date) return conn.escape(v);
      if (typeof v === "object") return conn.escape(JSON.stringify(v));
      return conn.escape(v);
    });
    lines.push(
      `INSERT INTO \`${table}\` (${cols.map(c => "`" + c + "`").join(", ")}) VALUES (${vals.join(", ")});`
    );
  }
  lines.push("");
  total += rows.length;
}
lines.push(`SET FOREIGN_KEY_CHECKS=1;`);

fs.writeFileSync(outFile, lines.join("\n"), "utf8");
await conn.end();
console.log(`Backup geschrieben: ${outFile}`);
console.log(`Datensätze gesamt: ${total}`);
