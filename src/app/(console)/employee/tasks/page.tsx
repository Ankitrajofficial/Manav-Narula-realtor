import PageHeader from "@/components/console/PageHeader";
import { TaskList } from "@/components/console/QuickTasks";
import { requireUser } from "@/lib/auth";
import { todayIST } from "@/lib/dates";
import { listTasks, toTaskItem } from "@/lib/queries/tasks";
import { employeeToggleTaskDone } from "./actions";

export default async function MyTasksPage() {
  const user = await requireUser("employee");
  const data = await listTasks({}, { assignedTo: user.id, all: true });
  return (
    <div className="max-w-3xl">
      <PageHeader title="My Tasks" description="Tick a task when it is done. Open one to see its call sheet and comments." />
      <TaskList tasks={data.rows.map((t) => toTaskItem(t, "/employee"))} today={todayIST()} toggle={employeeToggleTaskDone} />
    </div>
  );
}
