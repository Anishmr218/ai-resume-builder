import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSessionToken,
  getPublicUser,
  hashSessionToken,
  isSecureRequest,
  sessionCookieName,
  sessionCookieOptions,
  SESSION_TOKEN_HEADER,
  SESSION_TTL_SECONDS,
} from "@/lib/auth";
import { handleRouteError, noStoreHeaders } from "@/lib/http";
import { getStore } from "@/lib/repository";
import { createSampleResume } from "@/lib/resume/sample";
import type { BootstrapPayload } from "@/lib/resume/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/session
 * Bootstraps an anonymous, cookie-bound workspace. A fresh workspace receives
 * a polished sample resume so the editor is immediately useful.
 */
export async function POST(request: Request) {
  try {
    const store = getStore();
    const cookieStore = await cookies();
    const existingToken = cookieStore.get(sessionCookieName())?.value;

    if (existingToken) {
      const user = await store.getUserBySession(
        hashSessionToken(existingToken),
      );
      if (user) {
        let resume = await store.getLatestResume(user.id);
        let isSample = false;
        if (!resume) {
          resume = await store.createResume(user.id, createSampleResume());
          isSample = true;
        }
        const payload: BootstrapPayload = {
          user: await getPublicUser(user),
          resume,
          isSample,
        };
        return NextResponse.json(payload, {
          headers: {
            ...noStoreHeaders(),
            [SESSION_TOKEN_HEADER]: existingToken,
          },
        });
      }
    }

    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
    const { user, resume } = await store.createWorkspace({
      tokenHash,
      expiresAt,
      sample: createSampleResume(),
    });

    const payload: BootstrapPayload = {
      user: await getPublicUser(user),
      resume,
      isSample: true,
    };

    const response = NextResponse.json(payload, {
      headers: {
        ...noStoreHeaders(),
        [SESSION_TOKEN_HEADER]: token,
      },
    });
    response.cookies.set(
      sessionCookieName(),
      token,
      sessionCookieOptions(isSecureRequest(request)),
    );
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
