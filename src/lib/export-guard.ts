import "server-only";
import { getSession, type SessionUser } from "./auth";
import { audit } from "./records";

/**
 * Every CSV/PDF export and download route starts with this. Only role "admin" may export:
 * signed-out requests get 401, anyone else gets 403 and the attempt is written to the audit log.
 * Usage: const user = await requireExporter(req); if (user instanceof Response) return user;
 */
export async function requireExporter(req: Request): Promise<SessionUser | Response> {
  const user = await getSession();
  if (!user) return new Response("Sign in to export.", { status: 401 });
  if (user.must_reset) return new Response("Change your temporary password first.", { status: 403 });
  if (user.role !== "admin") {
    const url = new URL(req.url);
    await audit(user.id, "export_blocked", "export", null, { path: url.pathname, query: url.search || null, role: user.role });
    return new Response("Exports are available to admins only.", { status: 403 });
  }
  return user;
}

/** Route handler for export URLs that employees used to have; always refuses and logs. */
export async function blockedExport(req: Request): Promise<Response> {
  const res = await requireExporter(req);
  return res instanceof Response ? res : new Response("This export has moved to the admin console.", { status: 404 });
}
