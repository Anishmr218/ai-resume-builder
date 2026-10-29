import { isDatabaseConfigured, requirePool } from "@/lib/db";
import { createMemoryStore } from "./memory";
import { createPostgresStore } from "./postgres";
import type { WorkspaceStore } from "./types";

let memoryStore: WorkspaceStore | null = null;
let postgresStore: WorkspaceStore | null = null;

/**
 * Serverless-friendly data access. In production a managed PostgreSQL
 * connection is mandatory; the in-memory store exists only to make local
 * previewing zero-config and never survives a restart.
 */
export function getStore(): WorkspaceStore {
  if (isDatabaseConfigured()) {
    postgresStore ??= createPostgresStore(requirePool());
    return postgresStore;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL is required in production. See README.md for managed PostgreSQL setup.",
    );
  }

  memoryStore ??= createMemoryStore();
  return memoryStore;
}
