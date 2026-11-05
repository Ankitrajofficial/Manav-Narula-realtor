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
/** Throws the same user-facing errors as saveUpload without saving anything. */
export function checkUpload(file: File): string {
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error(`${file.name}: only JPG, PNG, WebP images, PDF files and MP4 videos are allowed.`);
  if (file.size > MAX) throw new Error(`${file.name} is larger than 16 MB.`);
  return ext;
}

const text = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.slice(from, to));
const SIGNATURES: Record<string, (b: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b[0] === 0x89 && text(b, 1, 4) === "PNG",
  "image/webp": (b) => text(b, 0, 4) === "RIFF" && text(b, 8, 12) === "WEBP",
  "application/pdf": (b) => text(b, 0, 5) === "%PDF-",
  "video/mp4": (b) => text(b, 4, 8) === "ftyp",
  "video/3gpp": (b) => text(b, 4, 8) === "ftyp",
};

/** The browser only reports what a file claims to be; this checks its first bytes really are that type. */
export async function checkUploadContent(file: File): Promise<void> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!SIGNATURES[file.type]?.(head)) throw new Error(`${file.name} does not look like a real ${file.type.split("/")[1].toUpperCase()} file.`);
}

export async function saveUpload(file: File | null | undefined, folder: string): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  const ext = checkUpload(file);
  await checkUploadContent(file);
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
