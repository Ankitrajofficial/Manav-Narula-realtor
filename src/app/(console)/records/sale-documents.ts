"use server";
import { redirect } from "next/navigation";
import { requireUser, type SessionUser } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { audit } from "@/lib/records";
import { checkUpload } from "@/lib/upload";
import { addSaleDocuments, syncFirstDocument, uploadedFiles } from "@/lib/queries/sales";

const page = (u: SessionUser, saleId: number) => `${u.role === "admin" ? "/admin" : "/employee"}/sales/${saleId}`;
const to = (path: string, msg: string, kind: "toast" | "error" = "toast") => `${path}?${kind}=${encodeURIComponent(msg)}`;

/** Admins may change any sale; an employee only their own. */
async function ownSale(u: SessionUser, saleId: number) {
  const sale = await one<{ id: number; employee_id: number | null; status: string }>("SELECT id, employee_id, status FROM sales WHERE id = $1", [saleId]);
  if (!sale || (u.role !== "admin" && sale.employee_id !== u.id)) redirect(`${u.role === "admin" ? "/admin" : "/employee"}/sales?error=Sale+not+found`);
  return sale;
}

export async function addSaleDocumentsAction(saleId: number, fd: FormData) {
  const user = await requireUser();
  await ownSale(user, saleId);
  const files = uploadedFiles(fd);
  if (!files.length) redirect(to(page(user, saleId), "Choose at least one file", "error"));
  let problem = "";
  try { files.forEach(checkUpload); } catch (e) { problem = (e as Error).message; }
  if (!problem && files.reduce((n, f) => n + f.size, 0) > 16 * 1024 * 1024) problem = "The files add up to more than 16 MB. Add fewer at once.";
  if (problem) redirect(to(page(user, saleId), problem, "error"));
  await addSaleDocuments(saleId, files, user.id);
  await audit(user.id, "add_documents", "sale", saleId, { count: files.length });
  redirect(to(page(user, saleId), `${files.length} ${files.length === 1 ? "document" : "documents"} added`));
}

/** Admins remove any document. Employees remove only files they uploaded, while the sale still awaits approval. */
export async function removeSaleDocumentAction(docId: number) {
  const user = await requireUser();
  const doc = await one<{ sale_id: number; uploaded_by: number | null; name: string }>("SELECT sale_id, uploaded_by, name FROM sale_documents WHERE id = $1", [docId]);
  if (!doc) redirect(`${user.role === "admin" ? "/admin" : "/employee"}/sales?error=Document+not+found`);
  const sale = await ownSale(user, doc.sale_id);
  if (user.role !== "admin" && (doc.uploaded_by !== user.id || sale.status !== "Pending approval")) redirect(to(page(user, doc.sale_id), "Only the admin can remove documents from an approved sale", "error"));
  await q("DELETE FROM sale_documents WHERE id = $1", [docId]);
  await syncFirstDocument(doc.sale_id);
  await audit(user.id, "remove_document", "sale", doc.sale_id, { name: doc.name });
  redirect(to(page(user, doc.sale_id), `Removed ${doc.name}`));
}
