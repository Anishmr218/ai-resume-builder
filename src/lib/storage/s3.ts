import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageAdapter } from "./types";
import { assertStorageKey } from "./types";

let privateClient: S3Client | null = null;
let signingClient: S3Client | null = null;

export function isS3Configured(): boolean {
  return Boolean(process.env.S3_BUCKET?.trim());
}

function createClient(endpoint: string | undefined): S3Client {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();

  return new S3Client({
    region: process.env.S3_REGION?.trim() || "us-east-1",
    ...(endpoint ? { endpoint } : {}),
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey } }
      : {}),
    forcePathStyle:
      process.env.S3_FORCE_PATH_STYLE === "true" ||
      process.env.S3_FORCE_PATH_STYLE === "1",
  });
}

function getClient(): S3Client {
  privateClient ??= createClient(process.env.S3_ENDPOINT?.trim());
  return privateClient;
}

/**
 * Download URLs are signed with the browser-facing endpoint when one is
 * configured. This keeps MinIO working inside Docker (S3_ENDPOINT=minio:9000)
 * while the browser receives a URL it can actually resolve
 * (S3_PUBLIC_ENDPOINT=localhost:9000).
 */
function getSigningClient(): S3Client {
  const publicEndpoint = process.env.S3_PUBLIC_ENDPOINT?.trim();
  if (!publicEndpoint) return getClient();
  signingClient ??= createClient(publicEndpoint);
  return signingClient;
}

function bucket(): string {
  const value = process.env.S3_BUCKET?.trim();
  if (!value) throw new Error("S3_BUCKET is not configured.");
  return value;
}

/**
 * Production storage adapter for any S3-compatible provider: AWS S3,
 * Cloudflare R2, MinIO, Backblaze B2, or GCS through its S3 interoperability
 * endpoint. Credentials are optional so IAM roles / workload identity work.
 */
export function createS3Storage(): StorageAdapter {
  return {
    kind: "s3",

    async putObject({ key, body, contentType, cacheControl }) {
      assertStorageKey(key);
      await getClient().send(
        new PutObjectCommand({
          Bucket: bucket(),
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: cacheControl ?? "private, max-age=3600",
          ServerSideEncryption:
            process.env.S3_SERVER_SIDE_ENCRYPTION === "AES256"
              ? "AES256"
              : undefined,
        }),
      );
    },

    async deleteObject(key) {
      assertStorageKey(key);
      await getClient().send(
        new DeleteObjectCommand({ Bucket: bucket(), Key: key }),
      );
    },

    async getSignedDownloadUrl(key, expiresInSeconds = 900) {
      assertStorageKey(key);
      const expiresIn = Math.min(
        Math.max(expiresInSeconds, 60),
        7 * 24 * 60 * 60,
      );
      return getSignedUrl(
        getSigningClient(),
        new GetObjectCommand({ Bucket: bucket(), Key: key }),
        { expiresIn },
      );
    },
  };
}
