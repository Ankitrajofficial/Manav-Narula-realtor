"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { json, one, q } from "@/lib/db";
import { audit } from "@/lib/records";
import { todayIST } from "@/lib/dates";
import { newCertificateCode } from "@/lib/queries/growth";

const BACK = "/admin/certificates";
const to = (msg: string, kind: "toast" | "error" = "toast", path = BACK) => `${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}`;
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function issueCertificate(fd: FormData) {
  const user = await requireUser("admin");
  const userId = Number(fd.get("user_id"));
  const intern = await one<{ name: string }>("SELECT name FROM users WHERE id = $1 AND role = 'employee' AND level = 'intern'", [userId]);
  if (!intern) redirect(to("Choose an intern", "error"));
  const title = s(fd, "title") || "Certificate of Internship";
  const picked = fd.getAll("skills").map(String);
  // Only names that are in the skills list are kept, in the list's order.
  const skills = picked.length ? (await q<{ name: string }>("SELECT name FROM skills WHERE name = ANY($1::text[]) ORDER BY name", [picked])).map((r) => r.name) : [];
  if (!skills.length) redirect(to("Tick at least one skill", "error", `${BACK}?user=${userId}`));
  const start = s(fd, "start_date"), end = s(fd, "end_date");
  const issue = isDate(s(fd, "issue_date")) ? s(fd, "issue_date") : todayIST();
  if (start && end && isDate(start) && isDate(end) && end < start) redirect(to("The end date is before the start date", "error", `${BACK}?user=${userId}`));
  const code = await newCertificateCode(issue.slice(0, 4));
  const row = await one<{ id: number }>(
    "INSERT INTO certificates (code, user_id, title, skills, start_date, end_date, issue_date, remarks, issued_by) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9) RETURNING id",
    [code, userId, title.slice(0, 120), json(skills), isDate(start) ? start : null, isDate(end) ? end : null, issue, s(fd, "remarks").slice(0, 400) || null, user.id],
  );
  await audit(user.id, "issue_certificate", "certificate", row!.id, { user_id: userId, code, skills });
  redirect(to(`Certificate ${code} issued to ${intern.name}`));
}

export async function setCertificateRevoked(id: number, revoked: boolean) {
  const user = await requireUser("admin");
  await q("UPDATE certificates SET revoked = $1 WHERE id = $2", [revoked, id]);
  await audit(user.id, revoked ? "revoke_certificate" : "restore_certificate", "certificate", id);
  redirect(to(revoked ? "Certificate revoked" : "Certificate restored"));
}

export async function addSkill(fd: FormData) {
  const user = await requireUser("admin");
  const name = s(fd, "name").replace(/\s+/g, " ").slice(0, 60);
  if (name.length < 2) redirect(to("Enter a skill name", "error"));
  const row = await one<{ id: number }>("INSERT INTO skills (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET active = true RETURNING id", [name]);
  await audit(user.id, "create", "skill", row!.id, { name });
  redirect(to(`Skill added: ${name}`));
}

export async function toggleSkill(id: number) {
  const user = await requireUser("admin");
  const row = await one<{ active: boolean; name: string }>("UPDATE skills SET active = NOT active WHERE id = $1 RETURNING active, name", [id]);
  if (row) await audit(user.id, row.active ? "activate" : "deactivate", "skill", id, { name: row.name });
  redirect(to(row ? `${row.name}: ${row.active ? "shown" : "hidden"}` : "Skill not found"));
}

/** Deletes a skill that no certificate uses; used ones can only be hidden so issued certificates stay intact. */
export async function deleteSkill(id: number) {
  const user = await requireUser("admin");
  const skill = await one<{ name: string; used: number }>("SELECT s.name, (SELECT count(*)::int FROM certificates c WHERE c.skills ? s.name) AS used FROM skills s WHERE s.id = $1", [id]);
  if (!skill) redirect(to("Skill not found", "error"));
  if (skill.used) redirect(to(`${skill.name} is on ${skill.used} certificate${skill.used === 1 ? "" : "s"}. Hide it instead`, "error"));
  await q("DELETE FROM skills WHERE id = $1", [id]);
  await audit(user.id, "delete", "skill", id, { name: skill.name });
  redirect(to(`Skill deleted: ${skill.name}`));
}
