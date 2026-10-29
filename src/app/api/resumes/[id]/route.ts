import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import {
  handleRouteError,
  noStoreHeaders,
  notFound,
  readJson,
  unauthorized,
  validationError,
} from "@/lib/http";
import { getStore } from "@/lib/repository";
import { resumeUpdateSchema } from "@/lib/resume/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuidSchema = z.string().uuid();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    if (!uuidSchema.safeParse(id).success) return notFound();

    const resume = await getStore().getResume(id, user.id);
    if (!resume) return notFound();

    return NextResponse.json({ resume }, { headers: noStoreHeaders() });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    if (!uuidSchema.safeParse(id).success) return notFound();

    const body = await readJson(request);
    const parsed = resumeUpdateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const resume = await getStore().updateResume(id, user.id, parsed.data);
    if (!resume) return notFound();

    return NextResponse.json({ resume }, { headers: noStoreHeaders() });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    if (!uuidSchema.safeParse(id).success) return notFound();

    const deleted = await getStore().deleteResume(id, user.id);
    if (!deleted) return notFound();

    return new NextResponse(null, {
      status: 204,
      headers: noStoreHeaders(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
