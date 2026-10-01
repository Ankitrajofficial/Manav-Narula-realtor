"use server";
import { redirect } from "next/navigation";
import { requireUser, type SessionUser } from "@/lib/auth";
import { json, one, q } from "@/lib/db";
import { audit, logActivity, toE164 } from "@/lib/records";
import { LEAD_STATUSES } from "@/lib/console";

type Kind = "lead" | "prospect";
const table = (k: Kind) => (k === "lead" ? "leads" : "prospects");
const base = (u: SessionUser) => (u.role === "admin" ? "/admin" : "/employee");
const kindOf = (v: unknown): Kind => (v === "prospect" ? "prospect" : "lead");
const ids = (fd: FormData) => fd.getAll("ids").map(Number).filter((n) => Number.isInteger(n) && n > 0);
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const toastTo = (path: string, msg: string) => `${path}${path.includes("?") ? "&" : "?"}toast=${encodeURIComponent(msg)}`;
const errorTo = (path: string, msg: string) => `${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(msg)}`;

interface Rec { id: number; status: string; assigned_to: number | null; owner: number | null; name: string }
/** Loads a record the user may act on. Employees see only records assigned to them or entered by them. */
async function accessible(kind: Kind, id: number, user: SessionUser): Promise<Rec | null> {
  const ownerCol = kind === "lead" ? "created_by" : "added_by";
  const row = await one<Rec>(`SELECT id, status, assigned_to, ${ownerCol} AS owner, name FROM ${table(kind)} WHERE id = $1`, [id]);
  if (!row) return null;
  if (user.role !== "admin" && row.assigned_to !== user.id && row.owner !== user.id) return null;
  return row;
}

async function changeStatus(kind: Kind, rec: Rec, status: string, user: SessionUser) {
  if (rec.status === status) return;
  const extra = kind === "prospect" ? ", last_contacted_at = now()" : "";
  await q(`UPDATE ${table(kind)} SET status = $1, updated_at = now()${extra} WHERE id = $2`, [status, rec.id]);
  await logActivity({ [kind === "lead" ? "leadId" : "prospectId"]: rec.id, userId: user.id, type: "status", body: `Status changed to ${status}`, fromStatus: rec.status, toStatus: status });
}

export async function setStatusAction(fd: FormData) {
  const user = await requireUser();
  const kind = kindOf(fd.get("kind")); const id = Number(fd.get("id")); const status = str(fd, "status");
  const back = str(fd, "return");
  const path = back.startsWith("/") ? back : `${base(user)}/${table(kind)}/${id}`;
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) redirect(errorTo(path, "Unknown status"));
  const rec = await accessible(kind, id, user);
  if (!rec) redirect(errorTo(`${base(user)}/${table(kind)}`, "Record not found"));
  await changeStatus(kind, rec, status, user);
  redirect(toastTo(path, back ? `${rec.name}: ${status}` : `Status set to ${status}`));
}

export async function addNoteAction(fd: FormData) {
  const user = await requireUser();
  const kind = kindOf(fd.get("kind")); const id = Number(fd.get("id")); const body = str(fd, "body");
  const path = `${base(user)}/${table(kind)}/${id}`;
  if (!body) redirect(errorTo(path, "Write a note first"));
  const rec = await accessible(kind, id, user);
  if (!rec) redirect(errorTo(`${base(user)}/${table(kind)}`, "Record not found"));
  await logActivity({ [kind === "lead" ? "leadId" : "prospectId"]: id, userId: user.id, type: "note", body });
  if (kind === "prospect") await q("UPDATE prospects SET last_contacted_at = now() WHERE id = $1", [id]);
  redirect(toastTo(path, "Note added"));
}

export async function logCallAction(fd: FormData) {
  const user = await requireUser();
  const kind = kindOf(fd.get("kind")); const id = Number(fd.get("id")); const channel = str(fd, "channel") === "whatsapp" ? "whatsapp" : "call";
  const path = `${base(user)}/${table(kind)}/${id}`;
  const rec = await accessible(kind, id, user);
  if (!rec) redirect(errorTo(`${base(user)}/${table(kind)}`, "Record not found"));
  await logActivity({ [kind === "lead" ? "leadId" : "prospectId"]: id, userId: user.id, type: channel, body: channel === "call" ? "Called" : "Messaged on WhatsApp" });
  if (kind === "prospect") await q("UPDATE prospects SET last_contacted_at = now() WHERE id = $1", [id]);
  redirect(toastTo(path, channel === "call" ? "Call logged" : "WhatsApp logged"));
}

export async function scheduleFollowUpAction(fd: FormData) {
  const user = await requireUser();
  const kind = kindOf(fd.get("kind")); const id = Number(fd.get("id"));
  const date = str(fd, "date"); const time = str(fd, "time") || "10:00"; const note = str(fd, "note");
  const path = `${base(user)}/${table(kind)}/${id}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect(errorTo(path, "Pick a follow-up date"));
  const rec = await accessible(kind, id, user);
  if (!rec) redirect(errorTo(`${base(user)}/${table(kind)}`, "Record not found"));
  const at = new Date(`${date}T${time}:00`);
  await q(`UPDATE ${table(kind)} SET next_follow_up_at = $1, updated_at = now() WHERE id = $2`, [at.toISOString(), id]);
  if (rec.status === "New") await changeStatus(kind, rec, "Follow up", user);
  await logActivity({ [kind === "lead" ? "leadId" : "prospectId"]: id, userId: user.id, type: "follow_up", body: note ? `Follow-up scheduled: ${note}` : "Follow-up scheduled", scheduledAt: at.toISOString() });
  redirect(toastTo(path, "Follow-up scheduled"));
}

export async function assignAction(fd: FormData) {
  const user = await requireUser("admin");
  const kind = kindOf(fd.get("kind")); const id = Number(fd.get("id"));
  const to = str(fd, "assigned_to"); const toId = to ? Number(to) : null;
  const path = `/admin/${table(kind)}/${id}`;
  const rec = await accessible(kind, id, user);
  if (!rec) redirect(errorTo(`/admin/${table(kind)}`, "Record not found"));
  const emp = toId ? await one<{ name: string }>("SELECT name FROM users WHERE id = $1 AND status = 'active'", [toId]) : null;
  if (toId && !emp) redirect(errorTo(path, "Employee not found"));
  await q(`UPDATE ${table(kind)} SET assigned_to = $1, updated_at = now() WHERE id = $2`, [toId, id]);
  await logActivity({ [kind === "lead" ? "leadId" : "prospectId"]: id, userId: user.id, type: "assign", body: emp ? `Assigned to ${emp.name}` : "Unassigned" });
  await audit(user.id, "assign", kind, id, { assigned_to: toId });
  redirect(toastTo(path, emp ? `Assigned to ${emp.name}` : "Unassigned"));
}

export async function bulkAssignAction(fd: FormData) {
  const user = await requireUser("admin");
  const kind = kindOf(fd.get("kind")); const list = ids(fd); const to = str(fd, "assigned_to");
  const back = str(fd, "return") || `/admin/${table(kind)}`;
  if (!list.length) redirect(errorTo(back, "Select at least one row"));
  if (!to) redirect(errorTo(back, "Choose an employee"));
  const emp = await one<{ name: string }>("SELECT name FROM users WHERE id = $1 AND status = 'active'", [Number(to)]);
  if (!emp) redirect(errorTo(back, "Employee not found"));
  for (const id of list) {
    await q(`UPDATE ${table(kind)} SET assigned_to = $1, updated_at = now() WHERE id = $2`, [Number(to), id]);
    await logActivity({ [kind === "lead" ? "leadId" : "prospectId"]: id, userId: user.id, type: "assign", body: `Assigned to ${emp.name}` });
  }
  await audit(user.id, "bulk_assign", kind, null, { ids: list, assigned_to: Number(to) });
  redirect(toastTo(back, `${list.length} assigned to ${emp.name}`));
}

/** Admin ticks rows in the Leads or Prospects table and opens a new task with them already on the call sheet. */
export async function bulkCreateTaskAction(fd: FormData) {
  await requireUser("admin");
  const kind = kindOf(fd.get("kind")); const list = ids(fd);
  const back = str(fd, "return") || `/admin/${table(kind)}`;
  if (!list.length) redirect(errorTo(back, "Select at least one row"));
  redirect(`/admin/tasks/new?${kind === "lead" ? "leads" : "prospects"}=${list.join(",")}`);
}

export async function bulkStatusAction(fd: FormData) {
  const user = await requireUser("admin");
  const kind = kindOf(fd.get("kind")); const list = ids(fd); const status = str(fd, "status");
  const back = str(fd, "return") || `/admin/${table(kind)}`;
  if (!list.length) redirect(errorTo(back, "Select at least one row"));
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) redirect(errorTo(back, "Choose a status"));
  for (const id of list) { const rec = await accessible(kind, id, user); if (rec) await changeStatus(kind, rec, status, user); }
  await audit(user.id, "bulk_status", kind, null, { ids: list, status });
  redirect(toastTo(back, `${list.length} set to ${status}`));
}

export async function deleteRecordAction(fd: FormData) {
  const user = await requireUser("admin");
  const kind = kindOf(fd.get("kind")); const id = Number(fd.get("id"));
  const rec = await accessible(kind, id, user);
  if (!rec) redirect(errorTo(`/admin/${table(kind)}`, "Record not found"));
  await q(`DELETE FROM ${table(kind)} WHERE id = $1`, [id]);
  await audit(user.id, "delete", kind, id, { name: rec.name });
  redirect(toastTo(`/admin/${table(kind)}`, `${kind === "lead" ? "Lead" : "Prospect"} deleted`));
}

/* ---------- create / edit ---------- */
export interface RecordFormState { errors?: Record<string, string>; message?: string; values?: Record<string, string> }

function readRecord(fd: FormData) {
  const v = {
    name: str(fd, "name"), phone: str(fd, "phone"), email: str(fd, "email"), interest: str(fd, "interest"), budget: str(fd, "budget"), locality: str(fd, "locality"),
    source: str(fd, "source"), notes: str(fd, "notes"), property_id: str(fd, "property_id"), project_id: str(fd, "project_id"), assigned_to: str(fd, "assigned_to"),
    whatsapp_opt_in: fd.get("whatsapp_opt_in") === "on" || fd.get("whatsapp_opt_in") === "yes",
    tags: fd.getAll("tags").map(String).filter(Boolean),
    and_another: fd.get("and_another") === "1",
  };
  const errors: Record<string, string> = {};
  if (v.name.length < 2) errors.name = "Enter the person's name.";
  const phone = toE164(v.phone);
  if (!phone) errors.phone = "Enter a valid 10-digit Indian mobile number.";
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errors.email = "Enter a valid email or leave it blank.";
  return { v, errors, phone };
}

export async function saveLeadAction(prev: RecordFormState, fd: FormData): Promise<RecordFormState> {
  const user = await requireUser();
  const id = Number(fd.get("id")) || 0;
  const { v, errors, phone } = readRecord(fd);
  if (Object.keys(errors).length) return { errors, values: { ...v, tags: v.tags.join(",") } as unknown as Record<string, string> };
  const assigned = user.role === "admin" ? (v.assigned_to ? Number(v.assigned_to) : null) : undefined;
  if (id) {
    const rec = await accessible("lead", id, user);
    if (!rec) return { message: "Lead not found." };
    await q("UPDATE leads SET name=$1, phone=$2, email=$3, interest=$4, budget=$5, locality=$6, source=$7, notes=$8, property_id=$9, project_id=$10, whatsapp_opt_in=$11, tags=$12::jsonb, updated_at=now() WHERE id=$13",
      [v.name, phone, v.email || null, v.interest || null, v.budget || null, v.locality || null, v.source || "Walk-in", v.notes || null, v.property_id ? Number(v.property_id) : null, v.project_id ? Number(v.project_id) : null, v.whatsapp_opt_in, json(v.tags), id]);
    if (assigned !== undefined && assigned !== rec.assigned_to) {
      await q("UPDATE leads SET assigned_to = $1 WHERE id = $2", [assigned, id]);
      const emp = assigned ? await one<{ name: string }>("SELECT name FROM users WHERE id = $1", [assigned]) : null;
      await logActivity({ leadId: id, userId: user.id, type: "assign", body: emp ? `Assigned to ${emp.name}` : "Unassigned" });
    }
    await audit(user.id, "update", "lead", id);
    redirect(toastTo(`${base(user)}/leads/${id}`, "Lead saved"));
  }
  const row = await one<{ id: number }>("INSERT INTO leads (name, phone, email, interest, budget, locality, source, notes, property_id, project_id, assigned_to, created_by, whatsapp_opt_in, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb) RETURNING id",
    [v.name, phone, v.email || null, v.interest || null, v.budget || null, v.locality || null, v.source || "Walk-in", v.notes || null, v.property_id ? Number(v.property_id) : null, v.project_id ? Number(v.project_id) : null, assigned ?? user.id, user.id, v.whatsapp_opt_in, json(v.tags)]);
  const newId = row!.id;
  await logActivity({ leadId: newId, userId: user.id, type: "created", body: `Lead added manually (${v.source || "Walk-in"})`, toStatus: "New" });
  if (assigned) { const emp = await one<{ name: string }>("SELECT name FROM users WHERE id = $1", [assigned]); await logActivity({ leadId: newId, userId: user.id, type: "assign", body: `Assigned to ${emp?.name ?? "employee"}` }); }
  await audit(user.id, "create", "lead", newId);
  redirect(toastTo(`${base(user)}/leads/${newId}`, "Lead added"));
}

export async function saveProspectAction(prev: RecordFormState, fd: FormData): Promise<RecordFormState> {
  const user = await requireUser();
  const id = Number(fd.get("id")) || 0;
  const { v, errors, phone } = readRecord(fd);
  const returnTo = str(fd, "return");
  if (!Object.keys(errors).length) {
    const dupe = await one<{ id: number; name: string }>("SELECT id, name FROM prospects WHERE phone = $1 AND id <> $2", [phone, id]);
    if (dupe) errors.phone = `This number already belongs to ${dupe.name} (prospect #${dupe.id}).`;
  }
  if (Object.keys(errors).length) return { errors, values: { ...v, tags: v.tags.join(",") } as unknown as Record<string, string> };
  const assigned = user.role === "admin" ? (v.assigned_to ? Number(v.assigned_to) : null) : undefined;
  if (id) {
    const rec = await accessible("prospect", id, user);
    if (!rec) return { message: "Prospect not found." };
    await q("UPDATE prospects SET name=$1, phone=$2, email=$3, interest=$4, budget=$5, locality=$6, source=$7, notes=$8, whatsapp_opt_in=$9, tags=$10::jsonb, updated_at=now() WHERE id=$11",
      [v.name, phone, v.email || null, v.interest || null, v.budget || null, v.locality || null, v.source || "Data entry", v.notes || null, v.whatsapp_opt_in, json(v.tags), id]);
    if (assigned !== undefined && assigned !== rec.assigned_to) {
      await q("UPDATE prospects SET assigned_to = $1 WHERE id = $2", [assigned, id]);
      const emp = assigned ? await one<{ name: string }>("SELECT name FROM users WHERE id = $1", [assigned]) : null;
      await logActivity({ prospectId: id, userId: user.id, type: "assign", body: emp ? `Assigned to ${emp.name}` : "Unassigned" });
    }
    await audit(user.id, "update", "prospect", id);
    redirect(toastTo(`${base(user)}/prospects/${id}`, "Prospect saved"));
  }
  const row = await one<{ id: number }>("INSERT INTO prospects (name, phone, email, interest, budget, locality, source, notes, tags, assigned_to, added_by, whatsapp_opt_in) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12) RETURNING id",
    [v.name, phone, v.email || null, v.interest || null, v.budget || null, v.locality || null, v.source || "Data entry", v.notes || null, json(v.tags), assigned ?? user.id, user.id, v.whatsapp_opt_in]);
  const newId = row!.id;
  await logActivity({ prospectId: newId, userId: user.id, type: "created", body: `Added by ${user.name}`, toStatus: "New" });
  await audit(user.id, "create", "prospect", newId);
  if (v.and_another) redirect(toastTo(returnTo || `${base(user)}/data-entry`, `${v.name} saved`));
  redirect(toastTo(`${base(user)}/prospects/${newId}`, "Prospect added"));
}

/* ---------- CSV import ---------- */
export interface ImportRow { name?: string; phone?: string; email?: string; interest?: string; budget?: string; locality?: string; source?: string; tags?: string; notes?: string; whatsapp_opt_in?: string }

export async function importRecordsAction(kind: Kind, rows: ImportRow[]): Promise<{ imported: number; skipped: number; reasons: string[]; redirect: string }> {
  const user = await requireUser();
  let imported = 0, skipped = 0;
  const reasons: string[] = [];
  const seen = new Set<string>();
  for (const [i, r] of rows.slice(0, 5000).entries()) {
    const name = String(r.name ?? "").trim();
    const phone = toE164(String(r.phone ?? ""));
    if (name.length < 2 || !phone) { skipped++; if (reasons.length < 20) reasons.push(`Row ${i + 1}: missing name or invalid phone`); continue; }
    if (seen.has(phone)) { skipped++; if (reasons.length < 20) reasons.push(`Row ${i + 1}: duplicate of an earlier row (${phone})`); continue; }
    seen.add(phone);
    const dupe = await one<{ id: number }>(`SELECT id FROM ${table(kind)} WHERE phone = $1`, [phone]);
    if (dupe) { skipped++; if (reasons.length < 20) reasons.push(`Row ${i + 1}: ${phone} already exists (#${dupe.id})`); continue; }
    const tags = String(r.tags ?? "").split(/[;,|]/).map((t) => t.trim()).filter(Boolean);
    const opt = /^(yes|y|true|1)$/i.test(String(r.whatsapp_opt_in ?? "").trim());
    const interest = ["Buy", "Sell", "Rent"].find((x) => x.toLowerCase() === String(r.interest ?? "").trim().toLowerCase()) ?? null;
    const common = [name, phone, r.email?.trim() || null, interest, r.budget?.trim() || null, r.locality?.trim() || null, r.source?.trim() || "Import", r.notes?.trim() || null, json(tags), opt, user.id];
    let newId: number;
    if (kind === "lead") {
      const row = await one<{ id: number }>("INSERT INTO leads (name, phone, email, interest, budget, locality, source, notes, tags, whatsapp_opt_in, created_by, assigned_to) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12) RETURNING id", [...common, user.role === "admin" ? null : user.id]);
      newId = row!.id;
      await logActivity({ leadId: newId, userId: user.id, type: "created", body: "Imported from CSV", toStatus: "New" });
    } else {
      const row = await one<{ id: number }>("INSERT INTO prospects (name, phone, email, interest, budget, locality, source, notes, tags, whatsapp_opt_in, added_by, assigned_to) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12) RETURNING id", [...common, user.role === "admin" ? null : user.id]);
      newId = row!.id;
      await logActivity({ prospectId: newId, userId: user.id, type: "created", body: "Imported from CSV", toStatus: "New" });
    }
    imported++;
  }
  await audit(user.id, "import", kind, null, { imported, skipped });
  const dest = user.role === "admin" ? `/admin/${table(kind)}` : `/employee/${table(kind)}`;
  return { imported, skipped, reasons, redirect: toastTo(dest, `Imported ${imported}, skipped ${skipped}`) };
}
