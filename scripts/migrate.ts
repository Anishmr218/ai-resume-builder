import { readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";
import {
  databaseSsl,
  describeDatabase,
  loadEnvFiles,
  requireDatabaseUrl,
} from "./env";

async function main() {
  loadEnvFiles();
  const connectionString = requireDatabaseUrl();
  const schemaPath = path.join(process.cwd(), "schema.sql");
  const schema = await readFile(schemaPath, "utf8");

  const client = new Client({
    connectionString,
    ssl: databaseSsl(),
    application_name: "vellum-migrate",
  });

  console.log(`→ Connecting to ${describeDatabase(connectionString)}`);
  await client.connect();

  try {
    console.log("→ Applying schema.sql (idempotent)…");
    await client.query(schema);

    const { rows } = await client.query<{ table_name: string }>(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name`,
    );

    console.log("✓ Migration complete.");
    console.log(`  Tables: ${rows.map((row) => row.table_name).join(", ")}`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    "✗ Migration failed:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
