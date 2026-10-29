import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getStore } from "@/lib/repository";
import { getStorage } from "@/lib/storage";
import type { PublicUser, User } from "@/lib/resume/types";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

/**
 * Header fallback for environments where the session cookie cannot persist,
 * such as a proxy that strips cookies or a plain-HTTP deployment. The cookie
 * remains the primary mechanism; this header only carries the same opaque
 * session token so authenticated API calls keep working.
 */
export const SESSION_TOKEN_HEADER = "x-vellum-session";

export function sessionCookieName(): string {
  return process.env.SESSION_COOKIE_NAME?.trim() || "vellum_session";
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * A production deployment is not necessarily served over HTTPS end to end.
 * Behind a load balancer or CDN the app usually receives plain HTTP with an
 * `X-Forwarded-Proto` header, and a direct EC2/Docker deployment may be plain
 * HTTP. Marking the cookie `Secure` in either case makes the browser discard
 * it, which surfaces later as `401 UNAUTHORIZED` on every API call.
 */
export function isSecureRequest(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  const proto = forwarded?.split(",")[0]?.trim().toLowerCase();
  if (proto === "https") return true;
  if (proto === "http") return false;

  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function readSessionToken(
  request?: Request,
): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(sessionCookieName())?.value;
  if (cookieToken) return cookieToken;

  const headerToken = request?.headers.get(SESSION_TOKEN_HEADER)?.trim();
  return headerToken || null;
}

export async function getSessionUser(request?: Request): Promise<User | null> {
  const token = await readSessionToken(request);
  if (!token) {
    console.warn(
      "[vellum] Unauthorized request: no session cookie or session header present",
    );
    return null;
  }

  try {
    const user = await getStore().getUserBySession(hashSessionToken(token));
    if (!user) {
      console.warn("[vellum] Unauthorized request: session token not found or expired");
    }
    return user;
  } catch (error) {
    console.error("[vellum] Failed to resolve session", error);
    return null;
  }
}

export async function getPublicUser(user: User): Promise<PublicUser> {
  let avatarUrl: string | null = null;

  if (user.avatarKey) {
    try {
      avatarUrl = await getStorage().getSignedDownloadUrl(user.avatarKey, 3600);
    } catch (error) {
      console.warn("[vellum] Could not sign avatar URL", error);
    }
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarKey: user.avatarKey,
    avatarUrl,
  };
}
