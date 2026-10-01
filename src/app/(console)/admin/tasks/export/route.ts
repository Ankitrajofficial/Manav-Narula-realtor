import { requireUser } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { listTasks, type TaskRow } from "@/lib/queries/tasks";
import { formatShortDate } from "@/lib/format";

export async function GET(req: Request) {
  await requireUser("admin");
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const { rows } = await listTasks(sp, { all: true });
  const csv = toCsv<TaskRow & Record<string, unknown>>(rows as (TaskRow & Record<string, unknown>)[], [
    { key: "id", label: "ID" },
    { key: "title", label: "Title" },
    { key: "description", label: "Description" },
    { key: "linked", label: "Linked to", value: (t) => t.linked_name ? `${t.linked_name} (${t.linked_kind})` : "" },
    { key: "assignee_name", label: "Assignee" },
    { key: "due_date", label: "Due date", value: (t) => t.due_date ? formatShortDate(t.due_date) : "" },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status" },
    { key: "overdue", label: "Overdue", value: (t) => (t.overdue ? "Yes" : "No") },
    { key: "created_at", label: "Created", value: (t) => formatShortDate(t.created_at) },
  ]);
  return csvResponse(csv, `tasks-${new Date().toISOString().slice(0, 10)}.csv`);
}
