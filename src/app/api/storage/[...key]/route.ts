import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getStorageKind } from "@/lib/storage";
import {
  contentTypeForKey,
  readLocalObject,
  verifyLocalStorageSignature,
} from "@/lib/storage/local";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/storage/[...key]
 * Development-only signed object endpoint. In cloud deployments this route is
 * unused; clients receive S3 pre-signed URLs directly.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (getStorageKind() !== "local") {
    return jsonError(404, "NOT_FOUND", "Object not found.");
  }

  try {
    const { key: segments } = await params;
    const key = segments.join("/");
    const url = new URL(request.url);
    const expires = Number(url.searchParams.get("expires"));
    const signature = url.searchParams.get("signature") ?? "";

    if (!verifyLocalStorageSignature(key, expires, signature)) {
      return jsonError(
        403,
        "INVALID_SIGNATURE",
        "This download link is invalid or has expired.",
      );
    }

    let buffer: Buffer;
    try {
      buffer = await readLocalObject(key);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return jsonError(404, "NOT_FOUND", "Object not found.");
      }
      throw error;
    }

    const contentType = contentTypeForKey(key);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `inline; filename="export"`,
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[vellum] Local storage read failed", error);
    return jsonError(
      500,
      "STORAGE_READ_FAILED",
      "The requested file could not be read.",
    );
  }
}
