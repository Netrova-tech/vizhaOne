const fs = require("node:fs");
const path = require("node:path");
require("../src/config/env");
const { query, getPool } = require("../src/db/pool");

const preferredOrder = [
  "users", "vendors", "categories", "services", "halls", "hall_services",
  "event_packages", "bookings", "invitations", "rsvps", "referral_wallets",
  "referral_transactions", "planner_events", "planner_tasks", "guests", "reels",
  "saved_services", "notifications", "inquiries", "admin_pins", "signups",
];

const quoteIdent = (value) => `"${String(value).replaceAll('"', '""')}"`;

async function main() {
  const root = path.resolve(__dirname, "../..");
  const outputDir = path.join(root, "backups");
  fs.mkdirSync(outputDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sqlPath = path.join(outputDir, `vizhaone-supabase-${stamp}.sql`);
  const jsonPath = path.join(outputDir, `vizhaone-supabase-${stamp}.json`);
  const schema = fs.readFileSync(path.join(root, "backend/src/db/schema.sql"), "utf8");
  const tableRows = (await query(`SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`)).rows;
  const available = tableRows.map((row) => row.table_name);
  const appTables = preferredOrder.filter((name) => available.includes(name));
  const snapshot = { exportedAt: new Date().toISOString(), source: "Supabase PostgreSQL", tables: {} };
  const sql = [
    "-- VizhaOne Supabase PostgreSQL migration backup",
    `-- Exported: ${snapshot.exportedAt}`,
    "-- Import into an empty PostgreSQL database.",
    "BEGIN;",
    schema,
  ];

  for (const table of available) {
    const rows = (await query(`SELECT * FROM ${quoteIdent(table)}`)).rows;
    snapshot.tables[table] = rows;
  }

  for (const table of appTables) {
    const rows = snapshot.tables[table];
    if (rows.length) {
      const encoded = Buffer.from(JSON.stringify(rows), "utf8").toString("base64");
      sql.push(
        `-- ${table}: ${rows.length} rows`,
        `INSERT INTO ${quoteIdent(table)} SELECT * FROM json_populate_recordset(NULL::${quoteIdent(table)}, convert_from(decode('${encoded}','base64'),'UTF8')::json);`,
      );
    } else {
      sql.push(`-- ${table}: 0 rows`);
    }
  }

  sql.push("COMMIT;", "");
  fs.writeFileSync(sqlPath, sql.join("\n"), { encoding: "utf8", mode: 0o600 });
  fs.writeFileSync(jsonPath, JSON.stringify(snapshot, null, 2), { encoding: "utf8", mode: 0o600 });
  const counts = Object.fromEntries(Object.entries(snapshot.tables).map(([name, rows]) => [name, rows.length]));
  console.log(JSON.stringify({ sqlPath, jsonPath, counts }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(() => getPool().end());
