import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

/** "+ New > Task" and "Create task from selected" open the quick-add bar on the Tasks page, with any selected records linked. */
export default async function NewTaskPage({ searchParams }: { searchParams: Promise<{ lead?: string; prospect?: string; leads?: string; prospects?: string }> }) {
  await requireUser("admin");
  const sp = await searchParams;
  const ids = (...v: (string | undefined)[]) => v.flatMap((x) => (x ?? "").split(",")).map(Number).filter((n) => n > 0).join(",");
  const q = new URLSearchParams({ quick: "1" });
  const leads = ids(sp.lead, sp.leads), prospects = ids(sp.prospect, sp.prospects);
  if (leads) q.set("leads", leads);
  if (prospects) q.set("prospects", prospects);
  redirect(`/admin/tasks?${q}`);
}
