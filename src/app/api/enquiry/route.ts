import { NextResponse } from "next/server";
import { one, q } from "@/lib/db";
import { toE164 } from "@/lib/records";

/**
 * Every enquiry on the website becomes a lead in the shared database (source: Website),
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
  const parts = [body.subject && `Regarding: ${body.subject}`, body.visitDate && `Preferred visit date: ${body.visitDate}`, body.message && String(body.message).trim()].filter(Boolean);
  const notes = parts.join("\n") || null;
  const locality = body.locality ? String(body.locality) : propertyId ? (await one<{ locality: string }>("SELECT locality FROM properties WHERE id = $1", [propertyId]))?.locality ?? null : null;

  try {
    const lead = await one<{ id: number }>(
      "INSERT INTO leads (name, phone, email, interest, budget, locality, property_id, project_id, source, status, notes, whatsapp_opt_in) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Website','New',$9,true) RETURNING id",
      [name, phone, body.email ? String(body.email) : null, interest, body.budget ? String(body.budget) : null, locality, propertyId, projectId, notes],
    );
    await q("INSERT INTO lead_activities (lead_id, type, body, to_status) VALUES ($1, 'created', $2, 'New')", [lead!.id, `Enquiry from website${body.page ? ` (${body.page})` : ""}`]);
    console.log("[lead]", lead!.id, name, phone);
    const webhook = process.env.CRM_WEBHOOK_URL;
    if (webhook) {
      fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lead!.id, name, phone, interest, locality, notes, source: "Website", receivedAt: new Date().toISOString() }) }).catch((e) => console.error("[lead] webhook failed", e));
    }
    return NextResponse.json({ ok: true, id: lead!.id });
  } catch (err) {
    console.error("[lead] insert failed", err);
    return NextResponse.json({ ok: false, error: "Could not save the enquiry" }, { status: 500 });
  }
}
