import { requireUser } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { listTasks, type TaskRow } from "@/lib/queries/tasks";
import { formatShortDate } from "@/lib/format";

export async function GET(req: Request) {
  const user = await requireUser("employee");
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const { rows } = await listTasks(sp, { all: true, assignedTo: user.id });
  const csv = toCsv<TaskRow & Record<string, unknown>>(rows as (TaskRow & Record<string, unknown>)[], [
    { key: "title", label: "Title" },
    { key: "description", label: "Description" },
    { key: "linked", label: "Linked to", value: (t) => t.linked_name ?? "" },
    { key: "due_date", label: "Due date", value: (t) => t.due_date ? formatShortDate(t.due_date) : "" },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status" },
  ]);
  return csvResponse(csv, `my-tasks-${new Date().toISOString().slice(0, 10)}.csv`);
}
