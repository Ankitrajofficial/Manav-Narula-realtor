import Link from "next/link";
import { Suspense } from "react";
import PageHeader from "@/components/console/PageHeader";
import DataTable, { queryString, type Column } from "@/components/console/DataTable";
import FilterBar from "@/components/console/FilterBar";
import Pill from "@/components/console/Pill";
import { requireUser } from "@/lib/auth";
import { PRIORITIES, TASK_STATUSES } from "@/lib/console";
import { linkedSummary, listTasks, type TaskRow } from "@/lib/queries/tasks";
import { formatShortDate } from "@/lib/format";
import { employeeSetTaskStatus } from "./actions";

export default async function MyTasksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("employee");
  const sp = await searchParams;
  const data = await listTasks(sp, { assignedTo: user.id });
  const back = `/employee/tasks${queryString(sp) ? `?${queryString(sp)}` : ""}`;
  const columns: Column<TaskRow>[] = [
    { key: "title", label: "Title", sortable: true, render: (t: TaskRow) => <Link href={`/employee/tasks/${t.id}`} className="hover:text-accent-ink">{t.title}</Link> },
    { key: "linked", label: "Call sheet", render: (t: TaskRow) => t.lead_count + t.prospect_count === 1 && t.linked_kind ? <Link href={`/employee/${t.linked_kind === "lead" ? "leads" : "prospects"}/${t.linked_id}`} className="text-accent-ink hover:underline">{t.linked_name}</Link> : linkedSummary(t) ? <Link href={`/employee/tasks/${t.id}`} className="tabular text-accent-ink hover:underline">{linkedSummary(t)}</Link> : <span className="text-muted">—</span> },
    { key: "due_date", label: "Due", sortable: true, render: (t: TaskRow) => <span className="inline-flex items-center gap-2 tabular">{t.due_date ? formatShortDate(t.due_date) : <span className="text-muted">—</span>}{t.overdue && <Pill value="Overdue" />}</span> },
    { key: "priority", label: "Priority", sortable: true, render: (t: TaskRow) => <Pill value={t.priority} /> },
    { key: "status", label: "Status", sortable: true, render: (t: TaskRow) => <Pill value={t.status} /> },
    { key: "actions", label: "", render: (t: TaskRow) => t.status === "Done" ? null : (
      <form action={employeeSetTaskStatus} className="flex gap-1">
        <input type="hidden" name="id" value={t.id} /><input type="hidden" name="back" value={back} />
        {t.status === "Open" && <button type="submit" name="status" value="In progress" className="rounded-brand border border-line px-2 py-1 text-xs hover:border-ink">Start</button>}
        <button type="submit" name="status" value="Done" className="rounded-brand border border-line px-2 py-1 text-xs hover:border-ink">Done</button>
      </form>
    ) },
  ];
  return (
    <>
      <PageHeader title="My Tasks" description="Tasks assigned to you by the admin." />
      <Suspense>
        <FilterBar searchPlaceholder="Search title" filters={[
          { key: "status", label: "Status", options: TASK_STATUSES.map((s) => ({ value: s, label: s })) },
          { key: "priority", label: "Priority", options: PRIORITIES.map((p) => ({ value: p, label: p })) },
        ]} />
      </Suspense>
      <DataTable columns={columns} rows={data.rows} total={data.total} page={data.page} pageSize={data.size} sp={sp} basePath="/employee/tasks" sortKey={data.sortKey} sortDir={data.sortDir} rowId={(t) => t.id}
        exportHref={`/employee/tasks/export?${queryString(sp)}`} empty={{ text: "No tasks assigned to you." }} />
    </>
  );
}
