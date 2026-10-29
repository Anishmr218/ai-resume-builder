import { Client } from "pg";
import {
  databaseSsl,
  describeDatabase,
  loadEnvFiles,
  requireDatabaseUrl,
} from "./env";

const TABLES = [
  "users",
  "resumes",
  "experience_entries",
  "education_entries",
  "resume_skills",
  "project_entries",
  "sessions",
  "exports",
] as const;

async function main() {
  loadEnvFiles();
  const connectionString = requireDatabaseUrl();

  const client = new Client({
    connectionString,
    ssl: databaseSsl(),
    application_name: "vellum-check",
    connectionTimeoutMillis: 8_000,
  });

  console.log(`→ Checking ${describeDatabase(connectionString)}`);
  await client.connect();

  try {
    const versionResult = await client.query<{ server_version: string }>(
      "SHOW server_version",
    );
    console.log(`✓ Connected to PostgreSQL ${versionResult.rows[0]?.server_version ?? "unknown"}`);

    const presence = await client.query<{ name: string; present: boolean }>(
      `SELECT name, to_regclass('public.' || name) IS NOT NULL AS present
         FROM unnest($1::text[]) AS name`,
      [TABLES],
    );

    const missing = presence.rows.filter((row) => !row.present);
    if (missing.length > 0) {
      console.error(
        `✗ Missing tables: ${missing.map((row) => row.name).join(", ")}`,
      );
      console.error("  Run `npm run db:migrate` first.");
      process.exitCode = 1;
      return;
    }

    console.log("✓ All expected tables are present.");

    const counts = await client.query<{
      users: number;
      resumes: number;
      experience_entries: number;
      education_entries: number;
      resume_skills: number;
      project_entries: number;
      exports: number;
    }>(
      `SELECT
         (SELECT count(*)::int FROM users) AS users,
         (SELECT count(*)::int FROM resumes) AS resumes,
         (SELECT count(*)::int FROM experience_entries) AS experience_entries,
         (SELECT count(*)::int FROM education_entries) AS education_entries,
         (SELECT count(*)::int FROM resume_skills) AS resume_skills,
         (SELECT count(*)::int FROM project_entries) AS project_entries,
         (SELECT count(*)::int FROM exports) AS exports`,
    );

    const row = counts.rows[0];
    if (row) {
      console.table(row);
    }

    const expires = await client.query<{ expired: number }>(
      "SELECT count(*)::int AS expired FROM sessions WHERE expires_at <= now()",
    );
    console.log(
      `✓ Schema ready. ${expires.rows[0]?.expired ?? 0} expired session(s) can be pruned.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    "✗ Database check failed:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
