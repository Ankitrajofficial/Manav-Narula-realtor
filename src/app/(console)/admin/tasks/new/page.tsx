import PageHeader from "@/components/console/PageHeader";
import TaskForm from "@/components/console/TaskForm";
import { requireUser } from "@/lib/auth";
import { listEmployees } from "@/lib/queries/common";
import { leadPickerOptions, prospectPickerOptions } from "@/lib/queries/tasks";
import { createTask } from "../actions";

export default async function NewTaskPage({ searchParams }: { searchParams: Promise<{ lead?: string; prospect?: string; leads?: string; prospects?: string; assignee?: string }> }) {
  await requireUser("admin");
  const sp = await searchParams;
  const [employees, leads, prospects] = await Promise.all([listEmployees(), leadPickerOptions(), prospectPickerOptions()]);
  const ids = (v?: string) => (v ?? "").split(",").map(Number).filter((n) => n > 0);
  return (
    <div className="max-w-4xl">
      <PageHeader title="Add task" description="Assign a piece of work to an employee, with the leads and prospects it is about." />
      <TaskForm action={createTask} employees={employees} leads={leads} prospects={prospects} submitLabel="Create task" values={{ lead_ids: [...ids(sp.lead), ...ids(sp.leads)], prospect_ids: [...ids(sp.prospect), ...ids(sp.prospects)], assigned_to: sp.assignee ? Number(sp.assignee) : null }} />
    </div>
  );
}
