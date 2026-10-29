import { NextResponse } from "next/server";
import { matchJob } from "@/lib/ai";
import { matchJobRequestSchema } from "@/lib/ai/schemas";
import { getSessionUser } from "@/lib/auth";
import {
  handleRouteError,
  noStoreHeaders,
  readJson,
  unauthorized,
  validationError,
} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await readJson(request);
    const parsed = matchJobRequestSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const data = await matchJob(parsed.data);
    return NextResponse.json(data, { headers: noStoreHeaders() });
  } catch (error) {
    return handleRouteError(error);
  }
}
