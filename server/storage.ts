// Local-filesystem storage helpers (Railway Volume / local disk).
//
// Uploaded files are written under UPLOAD_DIR and served by the app itself at
// /uploads/<key> (see server/_core/index.ts). storagePut returns an absolute
// URL when PUBLIC_BASE_URL is set — needed so the server-side PDF generator
// (Puppeteer) and same-origin canvas export can load the image — and falls
// back to a relative /uploads/<key> path otherwise.
//
// Env: UPLOAD_DIR (default ./uploads), PUBLIC_BASE_URL (e.g. https://app.example)

import { promises as fs } from "fs";
import path from "path";
import { ENV } from "./_core/env";

export function uploadRoot(): string {
  return path.resolve(ENV.uploadDir || "./uploads");
}

function normalizeKey(relKey: string): string {
  // Strip leading slashes and any parent-dir segments to prevent path escapes.
  return relKey
    .replace(/^\/+/, "")
    .split("/")
    .filter(part => part && part !== "." && part !== "..")
    .join("/");
}

function resolveUrl(key: string): string {
  if (ENV.publicBaseUrl) {
    return `${ENV.publicBaseUrl.replace(/\/+$/, "")}/uploads/${key}`;
  }
  return `/uploads/${key}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const filePath = path.join(uploadRoot(), key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const body =
    typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);
  await fs.writeFile(filePath, body);
  return { key, url: resolveUrl(key) };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: resolveUrl(key) };
}
