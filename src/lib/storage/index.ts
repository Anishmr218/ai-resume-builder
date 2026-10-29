import { isS3Configured, createS3Storage } from "./s3";
import { createLocalStorage } from "./local";
import type { StorageAdapter } from "./types";

let cached: StorageAdapter | null = null;

/**
 * Selects cloud storage when configured. Development can run without cloud
 * credentials thanks to a local signed-URL adapter; production must configure
 * an S3-compatible bucket.
 */
export function getStorage(): StorageAdapter {
  if (cached) return cached;

  if (isS3Configured()) {
    cached = createS3Storage();
    return cached;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Cloud storage is required in production. Set S3_BUCKET (and credentials or an IAM role).",
    );
  }

  cached = createLocalStorage();
  return cached;
}

export function getStorageKind(): "s3" | "local" {
  if (isS3Configured()) return "s3";
  return "local";
}
