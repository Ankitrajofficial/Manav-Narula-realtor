import { getSession, needsNewPin } from "@/lib/auth";
import { one } from "@/lib/db";

const notFound = () => new Response("Not found", { status: 404 });

/** Who may open a sale's document: admins, whoever uploaded it, and the employee on the sale. */
async function maySeeSaleDocument(name: string) {
  const user = await getSession();
  if (!user || needsNewPin(user)) return false;
  if (user.role === "admin") return true;
  const url = `/media/${name}`;
  return !!(await one(
    `SELECT 1 AS ok FROM sales s LEFT JOIN sale_documents d ON d.sale_id = s.id AND d.url = $1
     WHERE (d.id IS NOT NULL AND (d.uploaded_by = $2 OR s.employee_id = $2)) OR (s.document_url = $1 AND s.employee_id = $2) LIMIT 1`,
    [url, user.id],
  ));
}

/** Serves files uploaded from the console (stored in the media table by lib/upload.ts). Website images cache for a year, as their names never change. */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-z0-9-]+\.(jpg|png|webp|pdf|mp4|3gp)$/i.test(name)) return notFound();
  const isPrivate = name.startsWith("sales-");
  // The same answer as a missing file, so nobody can test which names exist.
  if (isPrivate && !(await maySeeSaleDocument(name))) return notFound();
  const row = await one<{ content_type: string; data: Uint8Array }>("SELECT content_type, data FROM media WHERE name = $1", [name]);
  if (!row) return notFound();
  return new Response(new Uint8Array(row.data), {
    headers: { "Content-Type": row.content_type, "Content-Length": String(row.data.byteLength), "Cache-Control": isPrivate ? "private, no-store" : "public, max-age=31536000, immutable" },
  });
}
