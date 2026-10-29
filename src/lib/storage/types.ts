export interface StorageAdapter {
  readonly kind: "s3" | "local";
  putObject(input: {
    key: string;
    body: Buffer;
    contentType: string;
    cacheControl?: string;
  }): Promise<void>;
  deleteObject(key: string): Promise<void>;
  getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

export function assertStorageKey(key: string): void {
  if (
    !key ||
    key.length > 512 ||
    key.startsWith("/") ||
    key.includes("..") ||
    key.includes("\\") ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(key)
  ) {
    throw new Error("Invalid storage key.");
  }
}
