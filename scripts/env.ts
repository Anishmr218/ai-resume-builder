import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Loads local env files for standalone terminal scripts. Next.js loads these
 * automatically for the app itself; `tsx scripts/*` needs a small nudge.
 */
export function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    const fullPath = path.join(process.cwd(), file);
    if (!existsSync(fullPath)) continue;
    try {
      process.loadEnvFile(fullPath);
    } catch (error) {
      console.warn(
        `[vellum] Could not read ${file}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

export function databaseSsl():
  | boolean
  | { rejectUnauthorized: boolean } {
  const raw = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (!raw || raw === "false" || raw === "disable" || raw === "0") {
    return false;
  }
  return {
    rejectUnauthorized:
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
  };
}

export function requireDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local or export a managed PostgreSQL connection string.",
    );
  }
  return connectionString;
}

/** Safe display form of a connection string (password removed). */
export function describeDatabase(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    return `${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}`;
  } catch {
    return "(custom connection string)";
  }
}
