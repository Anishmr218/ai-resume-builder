import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getPublicUser, getSessionUser } from "@/lib/auth";
import {
  handleRouteError,
  jsonError,
  unauthorized,
} from "@/lib/http";
import { getStore } from "@/lib/repository";
import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function detectImage(buffer: Buffer): { mime: string; ext: string } | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
}

/**
 * POST /api/users/me/avatar
 * Uploads a small profile image to cloud storage. Resume documents never
 * embed photos — this is only used for the workspace UI.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return unauthorized();

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return jsonError(400, "INVALID_FORM", "Upload a multipart form with a file field.");
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return jsonError(400, "FILE_REQUIRED", "Choose an image to upload.");
    }
    if (file.size === 0) {
      return jsonError(400, "EMPTY_FILE", "The selected file is empty.");
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return jsonError(413, "FILE_TOO_LARGE", "Profile photos must be 2 MB or smaller.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const image = detectImage(buffer);
    if (!image) {
      return jsonError(
        415,
        "UNSUPPORTED_IMAGE",
        "Please upload a PNG, JPEG, or WebP image.",
      );
    }

    const key = `avatars/${user.id}/${randomUUID()}.${image.ext}`;
    const storage = getStorage();

    try {
      await storage.putObject({
        key,
        body: buffer,
        contentType: image.mime,
        cacheControl: "private, max-age=3600",
      });
    } catch (error) {
      console.error("[vellum] Avatar upload failed", error);
      return jsonError(
        503,
        "STORAGE_UNAVAILABLE",
        "Profile photo storage is not available right now.",
      );
    }

    const updated = await getStore().updateUserAvatar(user.id, key);
    if (!updated) {
      await storage.deleteObject(key).catch(() => undefined);
      return jsonError(404, "USER_NOT_FOUND", "Workspace not found.");
    }

    if (user.avatarKey && user.avatarKey.startsWith(`avatars/${user.id}/`)) {
      await storage.deleteObject(user.avatarKey).catch((error) => {
        console.warn("[vellum] Could not remove previous avatar", error);
      });
    }

    return NextResponse.json(
      { user: await getPublicUser(updated) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/users/me/avatar — removes the workspace avatar. */
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return unauthorized();

    if (user.avatarKey) {
      try {
        await getStorage().deleteObject(user.avatarKey);
      } catch (error) {
        console.warn("[vellum] Could not delete avatar object", error);
      }
    }

    const updated = await getStore().updateUserAvatar(user.id, null);
    if (!updated) return jsonError(404, "USER_NOT_FOUND", "Workspace not found.");

    return NextResponse.json(
      { user: await getPublicUser(updated) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
