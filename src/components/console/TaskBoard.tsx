import Link from "next/link";
import Pill from "./Pill";
import { TASK_STATUSES, priorityLabel } from "@/lib/console";
import { formatShortDate } from "@/lib/format";
import type { TaskRow } from "@/lib/queries/tasks";

/** Kanban view: three status columns with per-card move buttons (a server action taking id + status + back). */
export default function TaskBoard({ tasks, basePath, moveAction, back }: { tasks: TaskRow[]; basePath: string; moveAction: (fd: FormData) => Promise<void>; back: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {TASK_STATUSES.map((status) => {
        const col = tasks.filter((t) => t.status === status);
        return (
          <section key={status} className="rounded-brand border border-line bg-white">
            <header className="flex items-center justify-between border-b border-line px-3 py-2">
              <Pill value={status} />
              <span className="text-xs tabular text-muted">{col.length}</span>
            </header>
            <div className="space-y-2 p-2">
              {col.length === 0 && <p className="px-1 py-3 text-xs text-muted">No tasks</p>}
              {col.map((t) => (
                <article key={t.id} className="rounded-brand border border-line p-3">
                  <Link href={`${basePath}/${t.id}`} className="block text-sm hover:text-accent-ink">{t.title}</Link>
                  <p className="mt-1 text-xs text-muted">{t.assignee_name ?? "Unassigned"}{t.due_date ? ` · due ${formatShortDate(t.due_date)}` : ""}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Pill value={priorityLabel(t.priority)} />
                    {t.overdue && <Pill value="Overdue" />}
                  </div>
                  <form action={moveAction} className="mt-2 flex flex-wrap gap-1">
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="back" value={back} />
                    {TASK_STATUSES.filter((s) => s !== status).map((s) => (
                      <button key={s} type="submit" name="status" value={s} className="rounded-brand border border-line px-2 py-1 text-xs hover:border-ink">Move to {s}</button>
                    ))}
                  </form>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
