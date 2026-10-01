import Link from "next/link";
import { Suspense } from "react";
import PageHeader from "@/components/console/PageHeader";
import { queryString } from "@/components/console/DataTable";
import FilterBar from "@/components/console/FilterBar";
import TaskBoard from "@/components/console/TaskBoard";
import { QuickTaskBar, TaskList } from "@/components/console/QuickTasks";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { PRIORITIES, TASK_STATUSES, priorityLabel } from "@/lib/console";
import { listEmployees } from "@/lib/queries/common";
import { listTasks, toTaskItem } from "@/lib/queries/tasks";
import { todayIST } from "@/lib/dates";
import { quickCreateTask, setTaskStatus, toggleTaskDone, updateTaskInline } from "./actions";

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const sp = await searchParams;
  const board = sp.view === "board";
  const employees = await listEmployees(true);
  const data = await listTasks(sp, { all: true });
  const qs = queryString(sp, { quick: undefined, leads: undefined, prospects: undefined });
  const back = `/admin/tasks${qs ? `?${qs}` : ""}`;
  const ids = (v?: string) => (v ?? "").split(",").map(Number).filter((n) => n > 0);
  const linked = { leadIds: ids(sp.leads), prospectIds: ids(sp.prospects) };
  const staff = employees.filter((u) => u.role === "employee").map((u) => ({ id: u.id, name: u.name }));

  return (
    <>
      <PageHeader title="Tasks" description="Type a task, tap who it is for and when it is due, press Enter. Tick a task to close it." actions={
        <Link href={`/admin/tasks?${queryString(sp, { view: board ? undefined : "board", page: undefined, quick: undefined, leads: undefined, prospects: undefined })}`} className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name={board ? "list" : "kanban"} size={14} />{board ? "List view" : "Kanban view"}</Link>
      } />
      <QuickTaskBar key={`${sp.leads ?? ""}|${sp.prospects ?? ""}`} employees={staff} action={quickCreateTask} linked={linked} autoFocus={sp.quick === "1"} />
      <Suspense>
        <FilterBar searchPlaceholder="Search title or linked name" filters={[
          { key: "status", label: "Status", options: TASK_STATUSES.map((s) => ({ value: s, label: s })) },
          { key: "assignee", label: "Assignee", options: employees.map((u) => ({ value: String(u.id), label: u.name })) },
          { key: "priority", label: "Priority", options: PRIORITIES.map((p) => ({ value: p, label: priorityLabel(p) })) },
        ]} />
      </Suspense>
      {board ? (
        <TaskBoard tasks={data.rows} basePath="/admin/tasks" moveAction={setTaskStatus} back={back} />
      ) : (
        <TaskList tasks={data.rows.map((t) => toTaskItem(t, "/admin"))} today={todayIST()} employees={staff} toggle={toggleTaskDone} update={updateTaskInline} showAssignee />
      )}
    </>
  );
}
