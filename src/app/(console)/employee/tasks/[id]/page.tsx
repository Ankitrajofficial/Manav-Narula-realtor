import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import { priorityLabel } from "@/lib/console";
import Pill from "@/components/console/Pill";
import { Textarea } from "@/components/console/Form";
import { requireUser } from "@/lib/auth";
import TaskSheet from "@/components/console/TaskSheet";
import { getTask, listTaskComments, listTaskRecords } from "@/lib/queries/tasks";
import { formatDateTime, formatShortDate } from "@/lib/format";
import { employeeAddComment, employeeSetTaskStatus } from "../actions";

export default async function MyTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("employee");
  const id = Number((await params).id);
  const task = id ? await getTask(id) : null;
  if (!task || task.assigned_to !== user.id) notFound();
  const [comments, records] = await Promise.all([listTaskComments(id), listTaskRecords(id)]);
  return (
    <div className="max-w-3xl">
      <PageHeader title={task.title} description={`From ${task.creator_name ?? "admin"} · ${formatDateTime(task.created_at)}`} />
      <section className="rounded-brand border border-line bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Pill value={task.status} /><Pill value={priorityLabel(task.priority)} />{task.overdue && <Pill value="Overdue" />}
          {task.due_date && <span className="text-xs tabular text-muted">Due {formatShortDate(task.due_date)}</span>}
        </div>
        {task.status !== "Done" && (
          <form action={employeeSetTaskStatus} className="mt-4 flex gap-2">
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="back" value={`/employee/tasks/${task.id}`} />
            {task.status === "Open" && <button type="submit" name="status" value="In progress" className="rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink">Mark In progress</button>}
            <button type="submit" name="status" value="Done" className="rounded-brand bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink">Mark Done</button>
          </form>
        )}
      </section>
      <div className="mt-4"><TaskSheet records={records} base="/employee" returnTo={`/employee/tasks/${task.id}`} /></div>
      <section className="mt-4 rounded-brand border border-line bg-white p-5">
        <h2 className="text-sm font-medium">Comments</h2>
        <ul className="mt-3 space-y-3">
          {comments.length === 0 && <li className="text-xs text-muted">No comments yet.</li>}
          {comments.map((c) => (
            <li key={c.id} className="border-l-2 border-line pl-3">
              <p className="text-sm">{c.body}</p>
              <p className="mt-0.5 text-xs text-muted">{c.user_name ?? "Unknown"} · {formatDateTime(c.created_at)}</p>
            </li>
          ))}
        </ul>
        <form action={employeeAddComment} className="mt-4 space-y-2">
          <input type="hidden" name="id" value={task.id} />
          <Textarea name="body" rows={2} placeholder="Add a comment" required aria-label="Comment" />
          <button type="submit" className="rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink">Add comment</button>
        </form>
      </section>
    </div>
  );
}
