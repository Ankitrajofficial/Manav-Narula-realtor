import "server-only";
import { randomBytes } from "node:crypto";
import { q } from "./db";

const ALLOWED: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "application/pdf": ".pdf", "video/mp4": ".mp4", "video/3gpp": ".3gp" };
const MAX = 16 * 1024 * 1024;

/**
 * Saves an uploaded File in the database (media table) and returns its public URL (/media/<name>, served by
 * app/media/[name]/route.ts). Returns null when no file was chosen. Throws an Error with a user-facing message for bad files.
 * Files are kept in the database, not public/uploads: Next.js only serves files that were in public/ at build time,
 * and redeploys replace the app folder.
 */
export async function saveUpload(file: File | null | undefined, folder: string): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("Only JPG, PNG, WebP images, PDF files and MP4 videos are allowed.");
  if (file.size > MAX) throw new Error("File is larger than 16 MB.");
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "file";
  const name = `${safeFolder}-${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  await q("INSERT INTO media (name, content_type, size, data) VALUES ($1, $2, $3, $4)", [name, file.type, file.size, Buffer.from(await file.arrayBuffer())]);
  return `/media/${name}`;
}

export async function saveUploads(files: File[], folder: string): Promise<string[]> {
  const out: string[] = [];
  for (const f of files) { const u = await saveUpload(f, folder); if (u) out.push(u); }
  return out;
}
