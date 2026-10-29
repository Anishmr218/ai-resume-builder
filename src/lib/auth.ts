import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getStore } from "@/lib/repository";
import { getStorage } from "@/lib/storage";
import type { PublicUser, User } from "@/lib/resume/types";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function sessionCookieName(): string {
  return process.env.SESSION_COOKIE_NAME?.trim() || "vellum_session";
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function readSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(sessionCookieName())?.value ?? null;
}

export async function getSessionUser(): Promise<User | null> {
  const token = await readSessionToken();
  if (!token) return null;

  try {
    return await getStore().getUserBySession(hashSessionToken(token));
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
