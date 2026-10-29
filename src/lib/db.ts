import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __vellumPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __vellumDbNotice: boolean | undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function parseBoolean(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

function sslConfig(): boolean | { rejectUnauthorized: boolean } {
  const raw = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (!raw || raw === "false" || raw === "disable" || raw === "0") return false;
  return {
    rejectUnauthorized: parseBoolean(
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED ?? "true",
    ),
  };
}

/**
 * A small, reusable connection pool designed for serverless/container
 * runtimes. In serverless environments point DATABASE_URL at a pooler such as
 * Neon, Supabase, or RDS Proxy.
 */
export function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "DATABASE_URL is required in production. Configure a managed PostgreSQL connection string.",
      );
    }
    if (!globalThis.__vellumDbNotice) {
      globalThis.__vellumDbNotice = true;
      console.warn(
        "[vellum] DATABASE_URL is not set — using an in-memory demo store. Data resets when the dev server restarts.",
      );
    }
    return null;
  }

  if (!globalThis.__vellumPool) {
    globalThis.__vellumPool = new Pool({
      connectionString,
      ssl: sslConfig(),
      max: Number(process.env.DB_POOL_MAX ?? 5),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: true,
      application_name: "vellum-resume-studio",
    });

    globalThis.__vellumPool.on("error", (error) => {
      console.error("[vellum] Unexpected PostgreSQL pool error", error);
    });
  }

  return globalThis.__vellumPool;
}

export function requirePool(): Pool {
  const pool = getPool();
  if (!pool) {
    throw new Error("PostgreSQL is not configured.");
  }
  return pool;
}
