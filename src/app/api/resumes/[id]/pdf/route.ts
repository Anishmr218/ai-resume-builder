import { z } from "zod";
import {
  getSessionUser,
  readSessionToken,
  sessionCookieName,
} from "@/lib/auth";
import {
  handleRouteError,
  jsonError,
  notFound,
  unauthorized,
} from "@/lib/http";
import { getStore } from "@/lib/repository";
import { slugify } from "@/lib/resume/format";
import { generateResumePdf } from "@/lib/pdf/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const uuidSchema = z.string().uuid();

/**
 * POST /api/resumes/:id/pdf
 * Streams a text-based, ATS-friendly A4 PDF generated with headless Chromium.
 * On hosts without Chromium the client is given the print-view fallback.
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

    const fileName = `${slugify(
      resume.fullName || resume.title,
      "resume",
    )}-resume.pdf`;

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.byteLength),
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
