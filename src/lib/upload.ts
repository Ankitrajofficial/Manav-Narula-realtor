import "server-only";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const ALLOWED: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "application/pdf": ".pdf", "video/mp4": ".mp4", "video/3gpp": ".3gp" };
const MAX = 16 * 1024 * 1024;

/**
 * Saves an uploaded File under public/uploads/<folder>/ and returns its public URL (/uploads/...).
 * Returns null when no file was chosen. Throws an Error with a user-facing message for bad files.
 * Production note: on Vercel the filesystem is read-only, so swap the body of this function for blob storage.
 */
export async function saveUpload(file: File | null | undefined, folder: string): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("Only JPG, PNG, WebP images, PDF files and MP4 videos are allowed.");
  if (file.size > MAX) throw new Error("File is larger than 16 MB.");
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "");
  const dir = path.join(process.cwd(), "public", "uploads", safeFolder);
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${safeFolder}/${name}`;
}

export async function saveUploads(files: File[], folder: string): Promise<string[]> {
  const out: string[] = [];
  for (const f of files) { const u = await saveUpload(f, folder); if (u) out.push(u); }
  return out;
}
