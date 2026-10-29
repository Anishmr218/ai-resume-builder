import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  handleRouteError,
  noStoreHeaders,
  readJson,
  unauthorized,
  validationError,
} from "@/lib/http";
import { getStore } from "@/lib/repository";
import { createEmptyResume } from "@/lib/resume/defaults";
import type { ResumeContent } from "@/lib/resume/types";
import { resumeUpdateSchema } from "@/lib/resume/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return unauthorized();

    const resumes = await getStore().listResumes(user.id);
    return NextResponse.json({ resumes }, { headers: noStoreHeaders() });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return unauthorized();

    const body = await readJson(request);
    const parsed = resumeUpdateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const input: ResumeContent = {
      ...createEmptyResume(),
      ...parsed.data,
      experience: parsed.data.experience ?? [],
      education: parsed.data.education ?? [],
      skills: parsed.data.skills ?? [],
      projects: parsed.data.projects ?? [],
    };

    const resume = await getStore().createResume(user.id, input);
    return NextResponse.json(
      { resume },
      { status: 201, headers: noStoreHeaders() },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
