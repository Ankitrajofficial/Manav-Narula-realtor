"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { saveSaleRecord, type SaleFormState } from "@/lib/queries/sales";

export async function employeeCreateSale(_prev: SaleFormState, fd: FormData): Promise<SaleFormState> {
  const user = await requireUser("employee");
  const r = await saveSaleRecord(user, fd);
  if (!("id" in r)) return r;
  redirect(`/employee/sales?toast=${encodeURIComponent("Sale recorded, pending admin approval")}`);
}
