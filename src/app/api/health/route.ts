import { NextResponse } from "next/server";
import { getStore } from "@/lib/repository";
import { getStorageKind } from "@/lib/storage";
import { getPdfRendererStatus } from "@/lib/pdf/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Readiness probe for containers, load balancers, and uptime checks.
 */
export async function GET() {
  const startedAt = Date.now();
  let database: "ok" | "error" = "ok";
  let databaseMode: "postgres" | "memory" = "memory";
  let storeKind: string = "unknown";

  try {
    const store = getStore();
    storeKind = store.kind;
    databaseMode = store.kind === "postgres" ? "postgres" : "memory";
    await store.ping();
  } catch (error) {
    database = "error";
    console.error("[vellum] Health check: database unavailable", error);
  }

  const storageKind = getStorageKind();
  const storageMisconfigured =
    process.env.NODE_ENV === "production" && storageKind === "local";
  const pdf = await getPdfRendererStatus();

  const healthy = database === "ok" && !storageMisconfigured;
  const status = healthy ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      version: "1.0.0",
      uptimeMs: Math.round(process.uptime() * 1000),
      latencyMs: Date.now() - startedAt,
      services: {
        database: {
          status: database,
          engine: databaseMode,
          driver: storeKind,
        },
        storage: {
          status: storageMisconfigured ? "misconfigured" : "ok",
          provider: storageKind,
        },
        pdf: {
          status: pdf.available ? "ok" : "unavailable",
          mode: pdf.mode,
          ...(pdf.reason ? { reason: pdf.reason } : {}),
        },
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
