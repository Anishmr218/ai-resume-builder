import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageAdapter } from "./types";
import { assertStorageKey } from "./types";

const LOCAL_ROOT = path.join(process.cwd(), ".data", "storage");

function signingSecret(): string {
  return (
    process.env.STORAGE_SIGNING_SECRET?.trim() ||
    "vellum-local-development-signing-secret"
  );
}

function sign(key: string, expires: number): string {
  return createHmac("sha256", signingSecret())
    .update(`${key}\n${expires}`)
    .digest("hex");
}

export function verifyLocalStorageSignature(
  key: string,
  expires: number,
  signature: string,
): boolean {
  if (!Number.isFinite(expires) || expires * 1000 < Date.now()) return false;

  try {
    const expected = Buffer.from(sign(key, expires), "utf8");
    const received = Buffer.from(signature, "utf8");
    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

export function resolveLocalStoragePath(key: string): string {
  assertStorageKey(key);
  const resolved = path.resolve(LOCAL_ROOT, key);
  if (!resolved.startsWith(`${path.resolve(LOCAL_ROOT)}${path.sep}`)) {
    throw new Error("Invalid storage path.");
  }
  return resolved;
}

export async function readLocalObject(key: string): Promise<Buffer> {
  return readFile(resolveLocalStoragePath(key));
}

export function contentTypeForKey(key: string): string {
  const extension = path.extname(key).toLowerCase();
  switch (extension) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

/**
 * Development-only storage adapter. Objects live in `.data/storage` and are
 * served through HMAC-signed URLs that mimic S3 pre-signed URLs. Never used in
 * production — the storage factory refuses this fallback when NODE_ENV is
 * production.
 */
export function createLocalStorage(): StorageAdapter {
  return {
    kind: "local",

    async putObject({ key, body }) {
      const target = resolveLocalStoragePath(key);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, body);
    },

    async deleteObject(key) {
      try {
        await unlink(resolveLocalStoragePath(key));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    },

    async getSignedDownloadUrl(key, expiresInSeconds = 900) {
      assertStorageKey(key);
      const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
      const signature = sign(key, expires);
      const encodedKey = key
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
      return `/api/storage/${encodedKey}?expires=${expires}&signature=${signature}`;
    },
  };
}

export { LOCAL_ROOT };
