// S3 / Cloudflare R2 storage helpers.
//
// Uploads objects to an S3-compatible bucket and returns a URL that can be
// rendered directly in <img src>. When S3_PUBLIC_URL_BASE is configured the
// returned URL is the stable public object URL; otherwise a long-lived
// presigned GET URL is generated as a fallback.
//
// Required env: S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
// Optional env: S3_REGION, S3_ENDPOINT (R2/MinIO), S3_PUBLIC_URL_BASE,
//               S3_FORCE_PATH_STYLE

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

const PRESIGN_EXPIRES_SECONDS = 60 * 60 * 24 * 7; // 7 days (max allowed)

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!ENV.s3Bucket) {
    throw new Error("Storage is not configured: set S3_BUCKET");
  }
  if (!ENV.s3AccessKeyId || !ENV.s3SecretAccessKey) {
    throw new Error(
      "Storage credentials missing: set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY"
    );
  }

  if (!_client) {
    _client = new S3Client({
      region: ENV.s3Region || "auto",
      ...(ENV.s3Endpoint ? { endpoint: ENV.s3Endpoint } : {}),
      forcePathStyle: ENV.s3ForcePathStyle,
      credentials: {
        accessKeyId: ENV.s3AccessKeyId,
        secretAccessKey: ENV.s3SecretAccessKey,
      },
    });
  }
  return _client;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

async function resolveUrl(key: string): Promise<string> {
  // Prefer a stable public URL when a public base is configured.
  if (ENV.s3PublicUrlBase) {
    const base = ENV.s3PublicUrlBase.replace(/\/+$/, "");
    return `${base}/${key}`;
  }
  // Fallback: presigned GET URL (expires after PRESIGN_EXPIRES_SECONDS).
  const command = new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key });
  return getSignedUrl(getClient(), command, {
    expiresIn: PRESIGN_EXPIRES_SECONDS,
  });
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const client = getClient();
  const key = normalizeKey(relKey);
  const body =
    typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);

  await client.send(
    new PutObjectCommand({
      Bucket: ENV.s3Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return { key, url: await resolveUrl(key) };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: await resolveUrl(key) };
}
