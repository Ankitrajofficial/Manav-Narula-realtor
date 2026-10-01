import { requireExporter } from "@/lib/export-guard";
import { csvResponse, toCsv } from "@/lib/csv";
import { listTasks, type TaskRow } from "@/lib/queries/tasks";
import { formatShortDate } from "@/lib/format";
import { priorityLabel } from "@/lib/console";

export async function GET(req: Request) {
  const auth = await requireExporter(req); if (auth instanceof Response) return auth;
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const { rows } = await listTasks(sp, { all: true });
  const csv = toCsv<TaskRow & Record<string, unknown>>(rows as (TaskRow & Record<string, unknown>)[], [
    { key: "id", label: "ID" },
    { key: "title", label: "Title" },
    { key: "linked", label: "Linked to", value: (t) => t.linked_name ? `${t.linked_name} (${t.linked_kind})` : "" },
    { key: "assignee_name", label: "Assignee" },
    { key: "due_date", label: "Due date", value: (t) => t.due_date ? formatShortDate(t.due_date) : "" },
    { key: "priority", label: "Priority", value: (t) => priorityLabel(String(t.priority)) },
    { key: "status", label: "Status" },
    { key: "overdue", label: "Overdue", value: (t) => (t.overdue ? "Yes" : "No") },
    { key: "created_at", label: "Created", value: (t) => formatShortDate(t.created_at) },
  ]);
  return csvResponse(csv, `tasks-${new Date().toISOString().slice(0, 10)}.csv`);
}
