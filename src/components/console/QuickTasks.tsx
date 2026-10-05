"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import Icon from "@/components/Icon";
import type { LinkedOwner } from "@/lib/queries/tasks";

type Result = { ok: true; id: number; message?: string } | { ok: false; error: string };
type Opt = { id: number; name: string };

const chipCls = (on: boolean) =>
  `inline-flex min-h-10 items-center rounded-brand border px-3 text-sm transition-colors md:min-h-9 ${on ? "border-accent bg-accent text-white" : "border-line bg-white text-ink hover:border-ink"}`;

function Chip({ on, onClick, children, label }: { on: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return <button type="button" aria-pressed={on} aria-label={label} onClick={onClick} className={chipCls(on)}>{children}</button>;
}

const DUE_CHIPS = [{ key: "today", label: "Today" }, { key: "tomorrow", label: "Tomorrow" }, { key: "week", label: "This week" }, { key: "date", label: "Pick date" }];

/** Small bottom toast with an optional action (Undo). */
function useToast() {
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "error"; action?: { label: string; run: () => void } } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = (t: NonNullable<typeof toast>, ms = 5000) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(t);
    timer.current = setTimeout(() => setToast(null), ms);
  };
  const node = toast && (
    <div role="status" className={`fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-brand border bg-white px-4 py-3 text-sm md:bottom-5 md:left-auto md:right-5 md:w-auto ${toast.kind === "ok" ? "border-accent" : "border-red-600 text-red-700"}`}>
      <span className="flex items-center gap-2"><Icon name={toast.kind === "ok" ? "check" : "info"} size={16} className={toast.kind === "ok" ? "text-accent" : "text-red-600"} />{toast.text}</span>
      {toast.action && <button type="button" onClick={() => { toast.action!.run(); setToast(null); }} className="font-medium text-accent-ink hover:underline">{toast.action.label}</button>}
    </div>
  );
  return { show, node };
}

/** One-line task entry: title, tap an employee, tap a due shortcut, Enter. */
export function QuickTaskBar({ employees, action, linked, linkedInfo = [], autoFocus }: { employees: Opt[]; action: (fd: FormData) => Promise<Result>; linked?: { leadIds: number[]; prospectIds: number[] }; linkedInfo?: LinkedOwner[]; autoFocus?: boolean }) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState<number | null>(employees.length === 1 ? employees[0].id : null);
  const [due, setDue] = useState("today");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState<"normal" | "high">("normal");
  const [links, setLinks] = useState(linked ?? { leadIds: [], prospectIds: [] });
  const [error, setError] = useState<string | null>(null);
  // What to do with linked records that already belong to another employee: move them, or not decided yet.
  const [moveFor, setMoveFor] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const linkedNow = linkedInfo.filter((o) => (o.kind === "lead" ? links.leadIds : links.prospectIds).includes(o.id));
  const conflicts = assignee ? linkedNow.filter((o) => o.assigned_to != null && o.assigned_to !== assignee) : [];
  const unassignedLinked = linkedNow.filter((o) => o.assigned_to == null);
  const moving = conflicts.length > 0 && moveFor === assignee;
  const assigneeName = employees.find((x) => x.id === assignee)?.name.split(" ")[0] ?? "this employee";
  const removeConflicts = () => setLinks((l) => ({
    leadIds: l.leadIds.filter((i) => !conflicts.some((c) => c.kind === "lead" && c.id === i)),
    prospectIds: l.prospectIds.filter((i) => !conflicts.some((c) => c.kind === "prospect" && c.id === i)),
  }));
  const toast = useToast();
  useEffect(() => { if (autoFocus) input.current?.focus(); }, [autoFocus]);

  const linkedParts = [links.leadIds.length && `${links.leadIds.length} ${links.leadIds.length === 1 ? "lead" : "leads"}`, links.prospectIds.length && `${links.prospectIds.length} ${links.prospectIds.length === 1 ? "prospect" : "prospects"}`].filter(Boolean);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) { setError("Type what needs to be done."); input.current?.focus(); return; }
    if (!assignee) { setError("Tap the employee this task is for."); return; }
    if (due === "date" && !date) { setError("Pick a due date."); return; }
    if (conflicts.length && !moving) { setError(`Some linked records already belong to another employee. Move them to ${assigneeName} or remove them from this task.`); return; }
    setError(null);
    const fd = new FormData();
    fd.set("title", title); fd.set("assigned_to", String(assignee)); fd.set("due", due); fd.set("due_date", date); fd.set("priority", priority);
    fd.set("lead_ids", links.leadIds.join(",")); fd.set("prospect_ids", links.prospectIds.join(","));
    if (moving) fd.set("conflicts", "move");
    start(async () => {
      const r = await action(fd);
      if (!r.ok) { setError(r.error); return; }
      const who = employees.find((x) => x.id === assignee)?.name ?? "employee";
      toast.show({ text: `Task added for ${who}${r.message ? `. ${r.message}` : ""}`, kind: "ok" }, 4000);
      setTitle(""); setLinks({ leadIds: [], prospectIds: [] });
      if (linked && (linked.leadIds.length || linked.prospectIds.length)) window.history.replaceState(null, "", window.location.pathname);
      input.current?.focus();
    });
  }

  return (
    <form onSubmit={submit} onKeyDown={(e) => {
      // Enter submits from anywhere in the bar, including right after tapping a chip.
      const el = e.target as HTMLElement;
      if (e.key === "Enter" && !(el instanceof HTMLInputElement && el.type === "date") && !(el instanceof HTMLButtonElement && el.type === "submit")) { e.preventDefault(); e.currentTarget.requestSubmit(); }
    }} className="mb-6 rounded-brand border border-line bg-white p-3 md:p-4" aria-label="Quick add task">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input ref={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task, e.g. Call Harpreet about the site visit" aria-label="Task title" enterKeyHint="done" maxLength={200}
          className="min-w-0 flex-1 rounded-brand border border-line bg-white px-3 py-2.5 text-base text-ink placeholder:text-muted focus:border-ink md:text-sm" />
        <button type="submit" disabled={pending} className="hidden min-h-10 items-center justify-center gap-1.5 rounded-brand bg-accent px-5 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-60 md:inline-flex">
          <Icon name="plus" size={16} />{pending ? "Adding…" : "Add"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Assign to">
          <span className="mr-1 text-xs text-muted">For</span>
          {employees.map((u) => <Chip key={u.id} on={assignee === u.id} onClick={() => setAssignee(u.id)}>{u.name.split(" ")[0]}</Chip>)}
          {employees.length === 0 && <span className="text-xs text-muted">No active employees</span>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Due">
          <span className="mr-1 text-xs text-muted">Due</span>
          {DUE_CHIPS.map((d) => <Chip key={d.key} on={due === d.key} onClick={() => setDue(d.key)}>{d.key === "date" && date && due === "date" ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : d.label}</Chip>)}
          {due === "date" && <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Due date" className="min-h-10 rounded-brand border border-line bg-white px-2 text-sm md:min-h-9" />}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Priority">
          <span className="mr-1 text-xs text-muted">Priority</span>
          <Chip on={priority === "normal"} onClick={() => setPriority("normal")}>Normal</Chip>
          <Chip on={priority === "high"} onClick={() => setPriority("high")}>High</Chip>
        </div>
        {linkedParts.length > 0 && (
          <span className="inline-flex min-h-9 items-center gap-1 rounded-brand border border-accent bg-accent/10 pl-3 text-sm text-accent-ink">
            Linked: {linkedParts.join(" · ")}
            <button type="button" onClick={() => setLinks({ leadIds: [], prospectIds: [] })} aria-label="Remove linked records" className="flex h-9 w-9 items-center justify-center hover:text-ink"><Icon name="x" size={14} /></button>
          </span>
        )}
      </div>
      {assignee != null && conflicts.length > 0 && (
        <div className={`mt-3 rounded-brand border px-3 py-2.5 text-sm ${moving ? "border-accent bg-accent/5" : "border-[#b7791f] bg-[#b7791f]/5"}`} role="status">
          <p className="font-medium">{moving ? `These will move to ${assigneeName} with the task:` : `Already assigned to another employee. One lead can have only one owner:`}</p>
          <ul className="mt-1.5 space-y-1">
            {conflicts.map((c) => (
              <li key={`${c.kind}-${c.id}`} className="flex flex-wrap items-center gap-x-2">
                <span>{c.name}</span><span className="text-xs text-muted">{c.kind}</span>
                <span className="text-xs">{moving ? <>from {c.assignee_name} <Icon name="arrowRight" size={11} className="inline" /> {assigneeName}</> : <>with <strong>{c.assignee_name ?? "another employee"}</strong></>}</span>
              </li>
            ))}
          </ul>
          {!moving ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setMoveFor(assignee)} className="rounded-brand border border-ink bg-white px-3 py-1.5 text-xs hover:bg-ink hover:text-white">Move {conflicts.length === 1 ? "it" : `all ${conflicts.length}`} to {assigneeName}</button>
              <button type="button" onClick={removeConflicts} className="rounded-brand border border-line bg-white px-3 py-1.5 text-xs hover:border-ink">Remove from this task</button>
            </div>
          ) : (
            <button type="button" onClick={() => setMoveFor(null)} className="mt-2 text-xs text-muted underline hover:text-ink">Undo, keep them with their current owner</button>
          )}
        </div>
      )}
      {assignee != null && unassignedLinked.length > 0 && <p className="mt-2 text-xs text-muted">{unassignedLinked.length} unassigned linked {unassignedLinked.length === 1 ? "record" : "records"} will be assigned to {assigneeName}.</p>}
      {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
      {/* Phones: full-width Add that stays in reach while the chips scroll. */}
      <button type="submit" disabled={pending} className="sticky bottom-3 z-10 mt-3 flex min-h-12 w-full items-center justify-center gap-1.5 rounded-brand bg-accent text-sm font-medium text-white disabled:opacity-60 md:hidden">
        <Icon name="plus" size={16} />{pending ? "Adding…" : "Add task"}
      </button>
      {toast.node}
    </form>
  );
}

export interface TaskItem { id: number; title: string; assigned_to: number | null; assignee_name: string | null; due: string | null; priority: string; status: string; linked: string | null; href: string }
type Editor = { id: number; field: "title" | "assignee" | "due" } | null;

const fmtDue = (d: string, today: string) => {
  if (d === today) return "Today";
  const t = new Date(`${today}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + 1);
  if (d === t.toISOString().slice(0, 10)) return "Tomorrow";
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

/**
 * Task list with a large tick box per row. Admins can also rename, reassign and re-date inline.
 * Groups: Overdue, Today, Upcoming (including no date), Done (collapsed).
 */
export function TaskList({ tasks, today, employees = [], toggle, update, showAssignee }: {
  tasks: TaskItem[]; today: string; employees?: Opt[];
  toggle: (id: number, done: boolean) => Promise<Result>;
  update?: (id: number, patch: { title?: string; assigned_to?: number; due?: string; due_date?: string | null }) => Promise<Result>;
  showAssignee?: boolean;
}) {
  const [optimistic, setOptimistic] = useState<Record<number, string>>({});
  const [editor, setEditor] = useState<Editor>(null);
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [, start] = useTransition();
  const toast = useToast();
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const statusOf = (t: TaskItem) => optimistic[t.id] ?? t.status;
  const commitToggle = (id: number, done: boolean) => start(async () => {
    const r = await toggle(id, done);
    if (!r.ok) { toast.show({ text: r.error, kind: "error" }); }
    setOptimistic((o) => { const n = { ...o }; delete n[id]; return n; });
  });
  function tick(t: TaskItem) {
    const done = statusOf(t) !== "Done";
    setOptimistic((o) => ({ ...o, [t.id]: done ? "Done" : "Open" }));
    if (timers.current[t.id]) clearTimeout(timers.current[t.id]);
    // A short pause so the strike-through is seen before the row moves to Done.
    timers.current[t.id] = setTimeout(() => commitToggle(t.id, done), done ? 700 : 0);
    toast.show({ text: done ? `Done: ${t.title}` : `Reopened: ${t.title}`, kind: "ok", action: { label: "Undo", run: () => {
      if (timers.current[t.id]) clearTimeout(timers.current[t.id]);
      setOptimistic((o) => ({ ...o, [t.id]: done ? "Open" : "Done" }));
      commitToggle(t.id, !done);
    } } });
  }
  function save(id: number, patch: Parameters<NonNullable<typeof update>>[1]) {
    if (!update) return;
    setEditor(null);
    // Every inline change confirms itself; a server note (records moved with the task) is added on.
    const who = patch.assigned_to != null ? employees.find((u) => u.id === patch.assigned_to)?.name.split(" ")[0] : null;
    const did = patch.title !== undefined ? "Task renamed" : who ? `Task reassigned to ${who}` : patch.due === "none" ? "Due date removed" : patch.due ? "Due date changed" : "Task saved";
    start(async () => { const r = await update(id, patch); if (!r.ok) toast.show({ text: r.error, kind: "error" }); else toast.show({ text: r.message ? `${did}. ${r.message}` : did, kind: "ok" }); });
  }

  // Group by the server status so a ticked row stays put (struck through) until the save lands.
  const open = tasks.filter((t) => t.status !== "Done");
  const groups = [
    { key: "overdue", label: "Overdue", items: open.filter((t) => t.due && t.due < today) },
    { key: "today", label: "Today", items: open.filter((t) => t.due === today) },
    { key: "upcoming", label: "Upcoming", items: open.filter((t) => !t.due || t.due > today) },
  ];
  const done = tasks.filter((t) => t.status === "Done");

  const row = (t: TaskItem) => {
    const isDone = statusOf(t) === "Done";
    const overdue = !isDone && t.due && t.due < today;
    const editing = editor?.id === t.id ? editor.field : null;
    return (
      // The whole row opens the task; the tick box, edit buttons, links and inputs inside it keep their own job.
      <li key={t.id} className="flex cursor-pointer items-start gap-1 py-1 pr-2 transition-colors hover:bg-bg"
        onClick={(e) => { if (!editing && !(e.target as HTMLElement).closest("a, button, input, select, textarea, label, [role=group]")) router.push(t.href); }}>
        <button type="button" role="checkbox" aria-checked={isDone} aria-label={isDone ? `Reopen ${t.title}` : `Mark ${t.title} done`} onClick={() => tick(t)}
          className="flex h-11 w-11 shrink-0 items-center justify-center">
          <span className={`flex h-6 w-6 items-center justify-center rounded-brand border-2 transition-colors ${isDone ? "border-accent bg-accent text-white" : "border-line bg-white hover:border-accent"}`}>
            {isDone && <Icon name="check" size={14} />}
          </span>
        </button>
        <div className="min-w-0 flex-1 py-2">
          {editing === "title" ? (
            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Task title" maxLength={200}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save(t.id, { title: draft }); } if (e.key === "Escape") setEditor(null); }}
              onBlur={() => (draft.trim() && draft !== t.title ? save(t.id, { title: draft }) : setEditor(null))}
              className="w-full rounded-brand border border-ink bg-white px-2 py-1 text-base md:text-sm" />
          ) : (
            <span className="flex items-start gap-1.5">
              <Link href={t.href} className={`text-sm transition-colors ${isDone ? "text-muted line-through" : "text-ink hover:text-accent-ink"}`}>{t.title}</Link>
              {update && (
                <button type="button" onClick={() => { setEditor({ id: t.id, field: "title" }); setDraft(t.title); }} aria-label={`Rename ${t.title}`} title="Rename"
                  className="-my-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-brand text-muted hover:bg-white hover:text-ink"><Icon name="edit" size={13} /></button>
              )}
            </span>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {showAssignee && (update ? (
              <button type="button" onClick={() => setEditor(editing === "assignee" ? null : { id: t.id, field: "assignee" })} className="inline-flex items-center gap-1 hover:text-ink"><Icon name="users" size={12} />{t.assignee_name ?? "Unassigned"}</button>
            ) : <span className="inline-flex items-center gap-1"><Icon name="users" size={12} />{t.assignee_name ?? "Unassigned"}</span>)}
            {update ? (
              <button type="button" onClick={() => setEditor(editing === "due" ? null : { id: t.id, field: "due" })} className={`inline-flex items-center gap-1 tabular hover:text-ink ${overdue ? "text-red-700" : ""}`}><Icon name="calendar" size={12} />{t.due ? fmtDue(t.due, today) : "No date"}</button>
            ) : <span className={`inline-flex items-center gap-1 tabular ${overdue ? "text-red-700" : ""}`}><Icon name="calendar" size={12} />{t.due ? fmtDue(t.due, today) : "No date"}</span>}
            {t.priority === "high" && <span className="rounded-brand border px-1.5 py-px text-[11px]" style={{ borderColor: "var(--pill-red)", color: "var(--pill-red)" }}>High</span>}
            {t.linked && <Link href={t.href} className="text-accent-ink hover:underline">{t.linked}</Link>}
          </div>
          {editing === "assignee" && (
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Reassign">
              {employees.map((u) => <Chip key={u.id} on={t.assigned_to === u.id} onClick={() => save(t.id, { assigned_to: u.id })}>{u.name.split(" ")[0]}</Chip>)}
            </div>
          )}
          {editing === "due" && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="Change due date">
              {DUE_CHIPS.slice(0, 3).map((d) => <Chip key={d.key} on={false} onClick={() => save(t.id, { due: d.key })}>{d.label}</Chip>)}
              <input type="date" defaultValue={t.due ?? ""} aria-label="Pick date" onChange={(e) => e.target.value && save(t.id, { due: "date", due_date: e.target.value })} className="min-h-10 rounded-brand border border-line bg-white px-2 text-sm md:min-h-9" />
              <Chip on={false} onClick={() => save(t.id, { due: "none" })}>No date</Chip>
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.key} aria-label={g.label}>
          <h2 style={{ fontFamily: "var(--font-body)" }} className={`mb-1 text-xs font-medium uppercase tracking-[0.08em] ${g.key === "overdue" && g.items.length ? "text-red-700" : "text-muted"}`}>{g.label} <span className="tabular">({g.items.length})</span></h2>
          {g.items.length ? <ul className="divide-y divide-line rounded-brand border border-line bg-white">{g.items.map(row)}</ul> : <p className="rounded-brand border border-dashed border-line px-4 py-3 text-sm text-muted">Nothing {g.key === "overdue" ? "overdue" : g.key === "today" ? "due today" : "coming up"}.</p>}
        </section>
      ))}
      <details className="group">
        <summary className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-[0.08em] text-muted"><Icon name="chevron" size={14} className="chev transition-transform" />Done <span className="tabular">({done.length})</span></summary>
        {done.length ? <ul className="divide-y divide-line rounded-brand border border-line bg-white">{done.map(row)}</ul> : <p className="text-sm text-muted">No finished tasks yet.</p>}
      </details>
      {toast.node}
    </div>
  );
}
