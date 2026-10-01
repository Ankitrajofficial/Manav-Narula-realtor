import "server-only";
import { one, q } from "@/lib/db";
import { dateRange, pageOf, sortOf } from "@/lib/console";
import type { SessionUser } from "@/lib/auth";
import { audit, logActivity } from "@/lib/records";
import { saveUpload } from "@/lib/upload";

export interface SaleFormState { errors?: Record<string, string>; error?: string }

export interface SaleRow {
  [key: string]: unknown;
  id: number; sale_date: Date | string; lead_id: number | null; prospect_id: number | null; property_id: number | null;
  property_title: string | null; client_name: string | null; deal_value: number | string; commission: number | string;
  employee_id: number | null; notes: string | null; document_url: string | null; status: string; created_at: Date;
  employee_name: string | null; lead_name: string | null; prospect_name: string | null; property_name: string | null;
}

const SELECT = `SELECT s.*, u.name AS employee_name, l.name AS lead_name, p.name AS prospect_name, pr.title AS property_name
  FROM sales s LEFT JOIN users u ON u.id = s.employee_id LEFT JOIN leads l ON l.id = s.lead_id
  LEFT JOIN prospects p ON p.id = s.prospect_id LEFT JOIN properties pr ON pr.id = s.property_id`;
const SORTS: Record<string, string> = { sale_date: "s.sale_date", client: "COALESCE(s.client_name, l.name, p.name)", property: "COALESCE(s.property_title, pr.title)", deal_value: "s.deal_value", commission: "s.commission", employee: "u.name", status: "s.status" };

function where(sp: Record<string, string | undefined>, employeeId?: number) {
  const conds: string[] = [];
  const params: unknown[] = [];
  const { from, to } = dateRange(sp);
  if (sp.q?.trim()) { params.push(`%${sp.q.trim()}%`); conds.push(`(COALESCE(s.client_name, l.name, p.name) ILIKE $${params.length} OR COALESCE(s.property_title, pr.title) ILIKE $${params.length})`); }
  if (sp.employee) { params.push(Number(sp.employee)); conds.push(`s.employee_id = $${params.length}`); }
  if (sp.status) { params.push(sp.status); conds.push(`s.status = $${params.length}`); }
  if (employeeId) { params.push(employeeId); conds.push(`s.employee_id = $${params.length}`); }
  if (from) { params.push(from); conds.push(`s.sale_date >= $${params.length}::date`); }
  if (to) { params.push(to); conds.push(`s.sale_date <= $${params.length}::date`); }
  return { sql: conds.length ? `WHERE ${conds.join(" AND ")}` : "", params, from, to };
}

export async function listSales(sp: Record<string, string | undefined>, opts: { employeeId?: number; all?: boolean } = {}) {
  const w = where(sp, opts.employeeId);
  const sort = sortOf(sp, SORTS, "sale_date");
  const { page, size, offset } = pageOf(sp, 20);
  const joins = "FROM sales s LEFT JOIN users u ON u.id = s.employee_id LEFT JOIN leads l ON l.id = s.lead_id LEFT JOIN prospects p ON p.id = s.prospect_id LEFT JOIN properties pr ON pr.id = s.property_id";
  const totals = await one<{ n: number; value: string | number; commission: string | number }>(`SELECT count(*)::int AS n, COALESCE(sum(s.deal_value),0) AS value, COALESCE(sum(s.commission),0) AS commission ${joins} ${w.sql}`, w.params);
  const rows = opts.all
    ? await q<SaleRow>(`${SELECT} ${w.sql} ORDER BY ${sort.sql}, s.id DESC`, w.params)
    : await q<SaleRow>(`${SELECT} ${w.sql} ORDER BY ${sort.sql}, s.id DESC LIMIT ${size} OFFSET ${offset}`, w.params);
  const months = await q<{ month: string; n: number; value: string | number; commission: string | number }>(`SELECT to_char(date_trunc('month', s.sale_date), 'Mon YYYY') AS month, count(*)::int AS n, COALESCE(sum(s.deal_value),0) AS value, COALESCE(sum(s.commission),0) AS commission ${joins} ${w.sql} GROUP BY date_trunc('month', s.sale_date) ORDER BY date_trunc('month', s.sale_date) DESC LIMIT 12`, w.params);
  return { rows, total: Number(totals?.n ?? 0), totalValue: Number(totals?.value ?? 0), totalCommission: Number(totals?.commission ?? 0), months, page, size, sortKey: sort.key, sortDir: sort.dir, from: w.from, to: w.to };
}

export const getSale = (id: number) => one<SaleRow>(`${SELECT} WHERE s.id = $1`, [id]);
export const salePropertyOptions = () => q<{ id: number; title: string; locality: string | null }>("SELECT id, title, locality FROM properties ORDER BY title");

function parseSale(fd: FormData, user: SessionUser) {
  const sale_date = String(fd.get("sale_date") ?? "").trim();
  const lead_id = fd.get("lead_id") ? Number(fd.get("lead_id")) : null;
  const prospect_id = fd.get("prospect_id") ? Number(fd.get("prospect_id")) : null;
  const property_id = fd.get("property_id") ? Number(fd.get("property_id")) : null;
  const property_title = String(fd.get("property_title") ?? "").trim() || null;
  const client_name = String(fd.get("client_name") ?? "").trim() || null;
  const deal_value = Math.round(Number(String(fd.get("deal_value") ?? "").replace(/[^\d.]/g, "")));
  const commission = Math.round(Number(String(fd.get("commission") ?? "0").replace(/[^\d.]/g, "")) || 0);
  const employee_id = user.role === "admin" ? (fd.get("employee_id") ? Number(fd.get("employee_id")) : null) : user.id;
  const notes = String(fd.get("notes") ?? "").trim() || null;
  const errors: Record<string, string> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sale_date)) errors.sale_date = "Enter the sale date.";
  if (lead_id && prospect_id) errors.lead_id = "Choose either a lead or a prospect, not both.";
  if (!lead_id && !prospect_id && !client_name) errors.client_name = "Pick a lead or prospect, or type the client name.";
  if (!property_id && !property_title) errors.property_title = "Pick a listed property or type the property.";
  if (!Number.isFinite(deal_value) || deal_value <= 0) errors.deal_value = "Enter the deal value in rupees.";
  if (commission < 0) errors.commission = "Commission cannot be negative.";
  if (!employee_id) errors.employee_id = "Choose the employee who closed it.";
  return { sale_date, lead_id, prospect_id, property_id, property_title, client_name, deal_value, commission, employee_id, notes, errors };
}

export async function saveSaleRecord(user: SessionUser, fd: FormData, existingId?: number): Promise<{ id: number } | SaleFormState> {
  const s = parseSale(fd, user);
  if (Object.keys(s.errors).length) return { errors: s.errors };
  let document_url: string | null = null;
  try { document_url = await saveUpload(fd.get("document") as File | null, "agreements"); } catch (e) { return { errors: { document: (e as Error).message } }; }
  if (!s.client_name) {
    const src = s.lead_id ? await one<{ name: string }>("SELECT name FROM leads WHERE id=$1", [s.lead_id]) : await one<{ name: string }>("SELECT name FROM prospects WHERE id=$1", [s.prospect_id]);
    s.client_name = src?.name ?? null;
  }
  if (!s.property_title && s.property_id) {
    const pr = await one<{ title: string }>("SELECT title FROM properties WHERE id=$1", [s.property_id]);
    s.property_title = pr?.title ?? null;
  }
  if (existingId) {
    await q("UPDATE sales SET sale_date=$1, lead_id=$2, prospect_id=$3, property_id=$4, property_title=$5, client_name=$6, deal_value=$7, commission=$8, employee_id=$9, notes=$10, document_url=COALESCE($11, document_url) WHERE id=$12",
      [s.sale_date, s.lead_id, s.prospect_id, s.property_id, s.property_title, s.client_name, s.deal_value, s.commission, s.employee_id, s.notes, document_url, existingId]);
    await audit(user.id, "update", "sale", existingId, { deal_value: s.deal_value });
    return { id: existingId };
  }
  const status = user.role === "admin" ? "Approved" : "Pending approval";
  const row = await one<{ id: number }>("INSERT INTO sales (sale_date, lead_id, prospect_id, property_id, property_title, client_name, deal_value, commission, employee_id, notes, document_url, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id",
    [s.sale_date, s.lead_id, s.prospect_id, s.property_id, s.property_title, s.client_name, s.deal_value, s.commission, s.employee_id, s.notes, document_url, status]);
  const body = `Sale recorded: ${s.property_title ?? "property"} for ₹${s.deal_value.toLocaleString("en-IN")}`;
  if (s.lead_id || s.prospect_id) await logActivity({ leadId: s.lead_id, prospectId: s.prospect_id, userId: user.id, type: "sale", body });
  await audit(user.id, "create", "sale", row?.id, { deal_value: s.deal_value, status });
  return { id: row!.id };
}
