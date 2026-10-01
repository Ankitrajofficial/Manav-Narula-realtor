import Link from "next/link";
import { Suspense } from "react";
import PageHeader from "@/components/console/PageHeader";
import DataTable, { queryString, type Column } from "@/components/console/DataTable";
import FilterBar from "@/components/console/FilterBar";
import Pill from "@/components/console/Pill";
import TaskBoard from "@/components/console/TaskBoard";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { PRIORITIES, TASK_STATUSES } from "@/lib/console";
import { listEmployees } from "@/lib/queries/common";
import { linkedSummary, listTasks, type TaskRow } from "@/lib/queries/tasks";
import { formatShortDate } from "@/lib/format";
import { setTaskStatus } from "./actions";

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const sp = await searchParams;
  const board = sp.view === "board";
  const employees = await listEmployees(false);
  const data = await listTasks(sp, { all: board });
  const qs = queryString(sp);
  const back = `/admin/tasks${qs ? `?${qs}` : ""}`;

  const columns: Column<TaskRow>[] = [
    { key: "title", label: "Title", sortable: true, render: (t: TaskRow) => <Link href={`/admin/tasks/${t.id}`} className="hover:text-accent-ink">{t.title}</Link> },
    { key: "linked", label: "Call sheet", render: (t: TaskRow) => t.lead_count + t.prospect_count === 1 && t.linked_kind ? <Link href={`/admin/${t.linked_kind === "lead" ? "leads" : "prospects"}/${t.linked_id}`} className="text-accent-ink hover:underline">{t.linked_name}</Link> : linkedSummary(t) ? <Link href={`/admin/tasks/${t.id}`} className="tabular text-accent-ink hover:underline">{linkedSummary(t)}</Link> : <span className="text-muted">—</span> },
    { key: "assignee", label: "Assignee", sortable: true, render: (t: TaskRow) => t.assignee_name ?? <span className="text-muted">Unassigned</span> },
    { key: "due_date", label: "Due", sortable: true, render: (t: TaskRow) => <span className="inline-flex items-center gap-2 tabular">{t.due_date ? formatShortDate(t.due_date) : <span className="text-muted">—</span>}{t.overdue && <Pill value="Overdue" />}</span> },
    { key: "priority", label: "Priority", sortable: true, render: (t: TaskRow) => <Pill value={t.priority} /> },
    { key: "status", label: "Status", sortable: true, render: (t: TaskRow) => <Pill value={t.status} /> },
  ];

  return (
    <>
      <PageHeader title="Tasks" description="Work assigned to employees, with due dates and priorities." actions={
        <>
          <Link href={`/admin/tasks?${queryString(sp, { view: board ? undefined : "board", page: undefined })}`} className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name={board ? "list" : "kanban"} size={14} />{board ? "List view" : "Kanban view"}</Link>
          <Link href="/admin/tasks/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={14} />Add task</Link>
        </>
      } />
      <Suspense>
        <FilterBar searchPlaceholder="Search title or linked name" filters={[
          { key: "status", label: "Status", options: TASK_STATUSES.map((s) => ({ value: s, label: s })) },
          { key: "assignee", label: "Assignee", options: employees.map((u) => ({ value: String(u.id), label: u.name })) },
          { key: "priority", label: "Priority", options: PRIORITIES.map((p) => ({ value: p, label: p })) },
        ]} />
      </Suspense>
      {board ? (
        <TaskBoard tasks={data.rows} basePath="/admin/tasks" moveAction={setTaskStatus} back={back} />
      ) : (
        <DataTable columns={columns} rows={data.rows} total={data.total} page={data.page} pageSize={data.size} sp={sp} basePath="/admin/tasks" sortKey={data.sortKey} sortDir={data.sortDir} rowId={(t) => t.id}
          exportHref={`/admin/tasks/export?${qs}`} empty={{ text: "No tasks match.", action: { label: "Add task", href: "/admin/tasks/new" } }} />
      )}
    </>
  );
}
