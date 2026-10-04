import { one } from "@/lib/db";

/** Serves files uploaded from the console (stored in the media table by lib/upload.ts). Names never change, so they cache for a year. */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-z0-9-]+\.(jpg|png|webp|pdf|mp4|3gp)$/i.test(name)) return new Response("Not found", { status: 404 });
  const row = await one<{ content_type: string; data: Uint8Array }>("SELECT content_type, data FROM media WHERE name = $1", [name]);
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: { "Content-Type": row.content_type, "Content-Length": String(row.data.byteLength), "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
