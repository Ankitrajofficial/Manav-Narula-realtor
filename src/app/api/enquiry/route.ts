import { NextResponse } from "next/server";
import { one, q } from "@/lib/db";
import { toE164 } from "@/lib/records";
import { suggestProperties } from "@/lib/site-data";
import { forwardLeads } from "@/lib/lead-webhook";
import { runAutoAssign } from "@/lib/auto-assign";

const SOURCES = ["home_loan", "popup_consultation"];

/**
 * Every enquiry on the website becomes a lead in the shared database (source: Website, or home_loan /
 * popup_consultation for the home loans form and the consultation pop-up),
 * with a "created" activity row. If CRM_WEBHOOK_URL is set the lead is also forwarded as JSON.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const name = String(body.name ?? "").trim();
  const phone = toE164(String(body.phone ?? ""));
  if (name.length < 2 || !phone) {
    return NextResponse.json({ ok: false, error: "Name and a 10-digit Indian mobile number are required" }, { status: 422 });
  }
  const propertyId = Number(body.propertyId) || null;
  const projectId = Number(body.projectId) || null;
  const interest = ["Buy", "Sell", "Rent"].includes(String(body.interest)) ? String(body.interest) : propertyId || projectId ? "Buy" : null;
  const source = SOURCES.includes(String(body.source)) ? String(body.source) : "Website";
  // Extra labelled answers (loan amount, employment type...) are kept on the lead as note lines.
  const extra = body.details && typeof body.details === "object" ? Object.entries(body.details as Record<string, unknown>).filter(([k, v]) => k.length <= 40 && v != null && String(v).trim()).slice(0, 10).map(([k, v]) => `${k}: ${String(v).trim().slice(0, 200)}`) : [];
  const parts = [body.subject && `Regarding: ${body.subject}`, ...extra, body.visitDate && `Preferred visit date: ${body.visitDate}`, body.message && String(body.message).trim()].filter(Boolean);
  const notes = parts.join("\n") || null;
  const locality = body.locality ? String(body.locality) : propertyId ? (await one<{ locality: string }>("SELECT locality FROM properties WHERE id = $1", [propertyId]))?.locality ?? null : null;

  try {
    const lead = await one<{ id: number }>(
      "INSERT INTO leads (name, phone, email, interest, budget, locality, property_id, project_id, source, status, notes, whatsapp_opt_in) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'New',$10,true) RETURNING id",
      [name, phone, body.email ? String(body.email) : null, interest, body.budget ? String(body.budget) : null, locality, propertyId, projectId, source, notes],
    );
    await q("INSERT INTO lead_activities (lead_id, type, body, to_status) VALUES ($1, 'created', $2, 'New')", [lead!.id, `${source === "home_loan" ? "Home loan enquiry" : source === "popup_consultation" ? "Free consultation pop-up" : "Enquiry from website"}${body.page ? ` (${body.page})` : ""}`]);
    console.log("[lead]", lead!.id, name, phone);
    void forwardLeads([lead!.id]);
    await runAutoAssign();
    const suggestions = source === "popup_consultation" ? await suggestProperties({ interest, budget: body.budget ? String(body.budget) : null, locality }).catch(() => []) : undefined;
    return NextResponse.json({ ok: true, id: lead!.id, suggestions });
  } catch (err) {
    console.error("[lead] insert failed", err);
    return NextResponse.json({ ok: false, error: "Could not save the enquiry" }, { status: 500 });
  }
}
