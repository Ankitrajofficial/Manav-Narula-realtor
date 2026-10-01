"use server";
import { redirect } from "next/navigation";
import { q } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/records";
import { saveSaleRecord } from "@/lib/queries/sales";

export interface SaleFormState { errors?: Record<string, string>; error?: string }

export async function createSale(_prev: SaleFormState, fd: FormData): Promise<SaleFormState> {
  const user = await requireUser("admin");
  const r = await saveSaleRecord(user, fd);
  if (!("id" in r)) return r;
  redirect(`/admin/sales/${r.id}?toast=${encodeURIComponent("Sale recorded")}`);
}

export async function updateSale(id: number, _prev: SaleFormState, fd: FormData): Promise<SaleFormState> {
  const user = await requireUser("admin");
  const r = await saveSaleRecord(user, fd, id);
  if (!("id" in r)) return r;
  redirect(`/admin/sales/${id}?toast=${encodeURIComponent("Sale saved")}`);
}

export async function approveSale(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  const back = String(fd.get("back") ?? "/admin/sales");
  if (id) { await q("UPDATE sales SET status='Approved' WHERE id=$1", [id]); await audit(user.id, "approve", "sale", id); }
  redirect(`${back}${back.includes("?") ? "&" : "?"}toast=${encodeURIComponent("Sale approved")}`);
}

export async function deleteSale(fd: FormData) {
  const user = await requireUser("admin");
  const id = Number(fd.get("id"));
  if (id) { await q("DELETE FROM sales WHERE id=$1", [id]); await audit(user.id, "delete", "sale", id); }
  redirect(`/admin/sales?toast=${encodeURIComponent("Sale deleted")}`);
}
