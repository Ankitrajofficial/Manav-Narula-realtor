import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import Pill from "@/components/console/Pill";
import ConfirmButton from "@/components/console/ConfirmButton";
import { inputCls } from "@/components/console/Form";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { listEmployees } from "@/lib/queries/common";
import { getEmployee } from "@/lib/queries/employees";
import EmployeeForm from "../EmployeeForm";
import ResetPassword from "../ResetPassword";
import { deleteEmployee, resetPassword, setEmployeeStatus, updateEmployee } from "../actions";

export default async function EmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser("admin");
  const id = Number((await params).id);
  const [u, others] = await Promise.all([Number.isInteger(id) ? getEmployee(id) : null, listEmployees(true)]);
  if (!u) notFound();
  const isSelf = u.id === me.id;
  const targets = others.filter((o) => o.id !== u.id);
  return (
    <>
      <PageHeader title={u.name} description={`${u.email} · ${u.open_leads} open leads · last login ${formatDateTime(u.last_login_at) || "never"}`} actions={<Pill value={u.status === "blocked" ? "Blocked" : "Active"} />} />
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7"><EmployeeForm employee={u} isSelf={isSelf} action={updateEmployee.bind(null, u.id)} /></div>
        <div className="space-y-4 lg:col-span-5">
          <ResetPassword action={resetPassword.bind(null, u.id)} />
          {!isSelf && (
            <form action={setEmployeeStatus.bind(null, u.id, u.status === "blocked" ? "active" : "blocked")} className="rounded-brand border border-line bg-white p-5">
              <p className="text-base">{u.status === "blocked" ? "Unblock" : "Block"} account</p>
              <p className="mt-1 text-sm text-muted">{u.status === "blocked" ? "Lets them sign in again." : "Keeps every record and assignment but stops them signing in."}</p>
              <button type="submit" className={`mt-3 rounded-brand border px-4 py-2 text-sm ${u.status === "blocked" ? "border-line hover:border-ink" : "border-red-700 text-red-700 hover:bg-red-700 hover:text-white"}`}>{u.status === "blocked" ? "Unblock" : "Block"}</button>
            </form>
          )}
          {!isSelf && (
            <form className="rounded-brand border border-line bg-white p-5">
              <p className="text-base">Delete account</p>
              <p className="mt-1 text-sm text-muted">Their leads, prospects, tasks and sales are moved to the employee you choose. Activity history stays. This cannot be undone.</p>
              <label className="mt-3 block text-xs font-medium">Move records to<select name="reassign_to" className={`${inputCls} mt-1`} defaultValue="" required><option value="">Choose an employee</option>{targets.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
              <div className="mt-3"><ConfirmButton label="Delete employee" confirmLabel="Yes, delete and reassign" action={deleteEmployee.bind(null, u.id)} /></div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
