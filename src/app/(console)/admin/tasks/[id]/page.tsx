import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import Pill from "@/components/console/Pill";
import ConfirmButton from "@/components/console/ConfirmButton";
import TaskForm from "@/components/console/TaskForm";
import { Textarea } from "@/components/console/Form";
import { requireUser } from "@/lib/auth";
import { TASK_STATUSES, priorityLabel } from "@/lib/console";
import { listEmployees } from "@/lib/queries/common";
import TaskSheet from "@/components/console/TaskSheet";
import { getTask, leadPickerOptions, listTaskComments, listTaskRecords, prospectPickerOptions } from "@/lib/queries/tasks";
import { formatDateTime, formatShortDate } from "@/lib/format";
import { addTaskComment, deleteTask, setTaskStatus, updateTask } from "../actions";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  const task = id ? await getTask(id) : null;
  if (!task) notFound();
  const [employees, leads, prospects, comments, records] = await Promise.all([listEmployees(false), leadPickerOptions(), prospectPickerOptions(), listTaskComments(id), listTaskRecords(id)]);
  const update = updateTask.bind(null, id);
  const due = task.due_date ? (typeof task.due_date === "string" ? task.due_date.slice(0, 10) : task.due_date.toISOString().slice(0, 10)) : "";
  return (
    <>
      <PageHeader title={task.title} description={`Created by ${task.creator_name ?? "admin"} · ${formatDateTime(task.created_at)}`} actions={
        <form action={deleteTask}><input type="hidden" name="id" value={task.id} /><ConfirmButton label="Delete task" confirmLabel="Delete" /></form>
      } />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <TaskForm action={update} employees={employees} leads={leads} prospects={prospects} values={{ ...task, due_date: due, lead_ids: records.filter((r) => r.kind === "lead").map((r) => r.id), prospect_ids: records.filter((r) => r.kind === "prospect").map((r) => r.id) }} />
        </div>
        <div className="space-y-4 lg:col-span-5">
          <section className="rounded-brand border border-line bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Pill value={task.status} /><Pill value={priorityLabel(task.priority)} />{task.overdue && <Pill value="Overdue" />}
              {task.due_date && <span className="text-xs tabular text-muted">Due {formatShortDate(task.due_date)}</span>}
            </div>
            <form action={setTaskStatus} className="mt-3 flex flex-wrap gap-1.5">
              <input type="hidden" name="id" value={task.id} />
              <input type="hidden" name="back" value={`/admin/tasks/${task.id}`} />
              {TASK_STATUSES.map((s) => <button key={s} type="submit" name="status" value={s} disabled={s === task.status} className={`rounded-brand border px-3 py-1.5 text-xs ${s === task.status ? "border-accent bg-accent text-white" : "border-line hover:border-ink"}`}>{s}</button>)}
            </form>
          </section>
          <TaskSheet records={records} base="/admin" returnTo={`/admin/tasks/${task.id}`} />
          <section className="rounded-brand border border-line bg-white p-4">
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
            <form action={addTaskComment} className="mt-4 space-y-2">
              <input type="hidden" name="id" value={task.id} />
              <Textarea name="body" rows={2} placeholder="Add a comment" required aria-label="Comment" />
              <button type="submit" className="rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink">Add comment</button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
