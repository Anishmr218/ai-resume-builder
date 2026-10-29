import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getSessionUser,
  readSessionToken,
  sessionCookieName,
} from "@/lib/auth";
import {
  handleRouteError,
  jsonError,
  noStoreHeaders,
  notFound,
  unauthorized,
} from "@/lib/http";
import { getStore } from "@/lib/repository";
import { generateResumePdf } from "@/lib/pdf/render";
import { getStorage } from "@/lib/storage";
import { slugify } from "@/lib/resume/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const uuidSchema = z.string().uuid();

/**
 * POST /api/resumes/:id/export
 * Generates a PDF, archives it to S3-compatible storage, records the export,
 * and returns a short-lived signed URL.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request);
    if (!user) return unauthorized();

    const { id } = await params;
    if (!uuidSchema.safeParse(id).success) return notFound();

    const resume = await getStore().getResume(id, user.id);
    if (!resume) return notFound();

    const baseUrl =
      process.env.PDF_BASE_URL?.trim() ||
      process.env.APP_URL?.trim() ||
      new URL(request.url).origin;
    const sessionToken = await readSessionToken(request);

    let pdf: Buffer;
    try {
      pdf = await generateResumePdf({
        resumeId: resume.id,
        baseUrl,
        sessionCookie: sessionToken
          ? { name: sessionCookieName(), value: sessionToken }
          : null,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "PdfRendererUnavailableError"
      ) {
        return jsonError(
          503,
          "PDF_RENDERER_UNAVAILABLE",
          error.message,
          { fallbackUrl: `/print/${id}?auto=1` },
        );
      }
      throw error;
    }

    const key = `exports/${user.id}/${resume.id}/${Date.now()}-${randomUUID().slice(0, 8)}.pdf`;
    const storage = getStorage();

    try {
      await storage.putObject({
        key,
        body: pdf,
        contentType: "application/pdf",
        cacheControl: "private, max-age=3600",
      });
    } catch (error) {
      console.error("[vellum] Cloud storage upload failed", error);
      return jsonError(
        503,
        "STORAGE_UNAVAILABLE",
        "Your PDF was generated, but it could not be archived. Download it directly or try again.",
      );
    }

    try {
      await getStore().recordExport({
        resumeId: resume.id,
        storageKey: key,
        byteSize: pdf.byteLength,
        contentType: "application/pdf",
      });
    } catch (error) {
      // The file exists, but the audit record failed. Surface success while
      // logging so the user can still access the signed URL.
      console.error("[vellum] Could not record export", error);
    }

    const url = await storage.getSignedDownloadUrl(key, 900);
    const fileName = `${slugify(
      resume.fullName || resume.title,
      "resume",
    )}-resume.pdf`;

    return NextResponse.json(
      {
        url,
        key,
        fileName,
        bytes: pdf.byteLength,
        expiresIn: 900,
        storage: storage.kind,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
