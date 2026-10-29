import { NextResponse } from "next/server";
import { generateSummary } from "@/lib/ai";
import { generateSummaryRequestSchema } from "@/lib/ai/schemas";
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
    const parsed = generateSummaryRequestSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const data = await generateSummary(parsed.data);
    return NextResponse.json(data, { headers: noStoreHeaders() });
  } catch (error) {
    return handleRouteError(error);
  }
}
