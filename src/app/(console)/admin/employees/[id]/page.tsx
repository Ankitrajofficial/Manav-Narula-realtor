import Link from "next/link";
import { notFound } from "next/navigation";
import Pill from "@/components/console/Pill";
import ConfirmButton from "@/components/console/ConfirmButton";
import StatTile from "@/components/console/StatTile";
import { LineChart } from "@/components/console/Charts";
import { QuickTaskBar, TaskList } from "@/components/console/QuickTasks";
import { inputCls } from "@/components/console/Form";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { todayIST } from "@/lib/dates";
import { formatDateTime, formatPrice, formatShortDate, relativeTime } from "@/lib/format";
import { listEmployees } from "@/lib/queries/common";
import { getEmployee } from "@/lib/queries/employees";
import { listSales } from "@/lib/queries/sales";
import { listTasks, toTaskItem } from "@/lib/queries/tasks";
import {
  accountEvents, activityPerDay, assignedLeads, assignedProspects, countAssigned, leadsByStatus, profileStats, recentActivity,
  unassignedLeads, unassignedProspects, type ProfileRecord,
} from "@/lib/queries/employee-profile";
import { bulkAssignAction } from "@/app/(console)/records/actions";
import { quickCreateTask, toggleTaskDone, updateTaskInline } from "../../tasks/actions";
import EmployeeForm from "../EmployeeForm";
import ResetPassword from "../ResetPassword";
import { awardStar, deleteEmployee, promoteToExecutive, removeStar, resetPassword, setEmployeeStatus, updateEmployee } from "../actions";
import { togglePersonAutoAssign } from "../../auto-assign/actions";
import GrowthPanel from "@/components/console/GrowthPanel";
import Stars from "@/components/console/Stars";
import { levelLabel } from "@/lib/growth";
import { getGrowth, listCertificates, listStarAwards } from "@/lib/queries/growth";
import { myBatch } from "@/lib/auto-assign";
import { mailConfigured } from "@/lib/mailer";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "growth", label: "Stars & growth" },
  { key: "tasks", label: "Tasks" },
  { key: "leads", label: "Leads" },
  { key: "prospects", label: "Prospects" },
  { key: "sales", label: "Sales" },
  { key: "activity", label: "Activity" },
  { key: "account", label: "Account" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const ACTIVITY_LABEL: Record<string, string> = { created: "Added", note: "Note", status: "Status", call: "Call", follow_up: "Follow-up", assign: "Assigned", sale: "Sale", whatsapp: "WhatsApp" };
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
const money = (n: number) => (n ? formatPrice(n) : "₹0");
const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

function RecordList({ rows, kind, empty }: { rows: ProfileRecord[]; kind: "leads" | "prospects"; empty: string }) {
  if (!rows.length) return <p className="rounded-brand border border-dashed border-line px-4 py-6 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line rounded-brand border border-line bg-white">
      {rows.map((r) => {
        const due = r.next_follow_up_at ? new Date(r.next_follow_up_at) : null;
        return (
          <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
            <Link href={`/admin/${kind}/${r.id}`} className="min-w-0 flex-1 font-medium hover:text-accent-ink">{r.name}</Link>
            <a href={`tel:${r.phone}`} className="tabular text-muted hover:text-ink">{r.phone}</a>
            <span className="hidden w-36 truncate text-muted md:inline">{r.locality ?? "—"}</span>
            <span className={`w-32 text-xs tabular ${r.overdue ? "text-red-700" : "text-muted"}`}>{due ? `Follow-up ${formatShortDate(due)}` : "No follow-up"}</span>
            <Pill value={r.status} />
          </li>
        );
      })}
    </ul>
  );
}

function AssignPicker({ rows, kind, employeeId, name, back }: { rows: ProfileRecord[]; kind: "lead" | "prospect"; employeeId: number; name: string; back: string }) {
  if (!rows.length) return <p className="mt-6 text-sm text-muted">No unassigned {kind === "lead" ? "leads" : "prospects"} waiting.</p>;
  return (
    <details className="mt-6 rounded-brand border border-line bg-white">
      <summary className="flex items-center justify-between px-4 py-3 text-sm">
        <span>Assign unassigned {kind === "lead" ? "leads" : "prospects"} to {name.split(" ")[0]} <span className="tabular text-muted">({rows.length})</span></span>
        <Icon name="chevron" size={16} className="chev text-muted transition-transform" />
      </summary>
      <form className="border-t border-line">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="assigned_to" value={employeeId} />
        <input type="hidden" name="return" value={back} />
        <ul className="max-h-80 divide-y divide-line overflow-y-auto">
          {rows.map((r) => (
            <li key={r.id}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm hover:bg-bg">
                <input type="checkbox" name="ids" value={r.id} className="h-4 w-4 accent-[#00BF63]" />
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                <span className="hidden tabular text-muted sm:inline">{r.phone}</span>
                <span className="hidden w-32 truncate text-muted md:inline">{r.locality ?? "—"}</span>
                <Pill value={r.status} />
              </label>
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-4 py-3">
          <button type="submit" formAction={bulkAssignAction} className="rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">Assign selected to {name.split(" ")[0]}</button>
        </div>
      </form>
    </details>
  );
}

export default async function EmployeeProfilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const me = await requireUser("admin");
  const id = Number((await params).id);
  const sp = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as Tab) : "overview";
  const u = Number.isInteger(id) ? await getEmployee(id) : null;
  if (!u) notFound();
  const isSelf = u.id === me.id;
  const base = `/admin/employees/${u.id}`;
  const first = u.name.split(" ")[0];
  const [stats, counts] = await Promise.all([profileStats(u.id), countAssigned(u.id)]);
  const tabCount: Partial<Record<Tab, number>> = { tasks: stats.openTasks, leads: counts.leads, prospects: counts.prospects, sales: stats.sales.count + stats.pendingSales };

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-brand border border-ink font-heading text-lg">{initials(u.name)}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl">{u.name}{isSelf && <span className="ml-2 align-middle text-xs text-muted">(you)</span>}</h1>
              <Pill value={levelLabel(u.role, u.level)} />
              {u.role !== "admin" && <Link href={`${base}?tab=growth`} aria-label="Stars and growth"><Stars count={u.stars} size={16} /></Link>}
              <Pill value={u.status === "blocked" ? "Blocked" : "Active"} />
            </div>
            <p className="mt-1 truncate text-sm text-muted">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
            <p className="text-xs text-muted">Last sign-in {formatDateTime(u.last_login_at) || "never"} · joined {formatShortDate(u.created_at)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {u.phone && <a href={`tel:${u.phone}`} className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name="phone" size={14} />Call</a>}
          {u.phone && <a href={waLink(u.phone)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name="whatsapp" size={14} />WhatsApp</a>}
          <a href={`mailto:${u.email}`} className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name="mail" size={14} />Email</a>
          <Link href={`${base}?tab=tasks`} className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={14} />Assign task</Link>
        </div>
      </div>

      {/* Tabs */}
      <nav className="no-scrollbar -mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0" aria-label="Employee profile">
        {TABS.map((t) => (
          <Link key={t.key} href={t.key === "overview" ? base : `${base}?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm ${tab === t.key ? "border-accent text-accent-ink" : "border-transparent text-muted hover:text-ink"}`}>
            {t.label}{tabCount[t.key] != null && <span className="ml-1 tabular text-muted">({tabCount[t.key]})</span>}
          </Link>
        ))}
      </nav>

      {tab === "overview" && <Overview userId={u.id} base={base} stats={stats} />}
      {tab === "growth" && <GrowthTab userId={u.id} base={base} autoAssign={u.auto_assign} />}
      {tab === "tasks" && <TasksTab userId={u.id} name={u.name} />}
      {tab === "leads" && <LeadsTab userId={u.id} name={u.name} base={base} total={counts.leads} />}
      {tab === "prospects" && <ProspectsTab userId={u.id} name={u.name} base={base} total={counts.prospects} />}
      {tab === "sales" && <SalesTab userId={u.id} first={first} />}
      {tab === "activity" && <ActivityTab userId={u.id} />}
      {tab === "account" && <AccountTab userId={u.id} isSelf={isSelf} />}
    </>
  );
}

async function Overview({ userId, base, stats }: { userId: number; base: string; stats: Awaited<ReturnType<typeof profileStats>> }) {
  const [perDay, byStatus, activity, tasks] = await Promise.all([activityPerDay(userId), leadsByStatus(userId), recentActivity(userId, 8), listTasks({}, { assignedTo: userId, all: true })]);
  const open = tasks.rows.filter((t) => t.status !== "Done").slice(0, 5);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Open leads" value={stats.openLeads} hint={`${stats.hot} hot`} href={`${base}?tab=leads`} />
        <StatTile label="Open prospects" value={stats.openProspects} href={`${base}?tab=prospects`} />
        <StatTile label="Follow-ups due" value={stats.followUpsDue} hint="today or overdue" href={`${base}?tab=leads`} />
        <StatTile label="Open tasks" value={stats.openTasks} hint={stats.overdueTasks ? `${stats.overdueTasks} overdue` : "none overdue"} href={`${base}?tab=tasks`} />
        <StatTile label="Sales this month" value={money(stats.sales.monthValue)} hint={`${stats.sales.monthCount} approved`} href={`${base}?tab=sales`} />
        <StatTile label="Total sales" value={money(stats.sales.value)} hint={`${stats.sales.count} deals · ${money(stats.sales.commission)} commission`} href={`${base}?tab=sales`} />
        <StatTile label="Lead conversion" value={stats.conversion == null ? "—" : `${stats.conversion}%`} hint={`${stats.won} won · ${stats.lost} lost`} />
        <StatTile label="Activity, 30 days" value={stats.activities30} hint={`${stats.doneTasks30} tasks closed`} href={`${base}?tab=activity`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-12">
        <section className="rounded-brand border border-line bg-white p-4 lg:col-span-8">
          <p className="mb-3 text-xs uppercase tracking-[0.08em] text-muted">Calls, notes and updates · last 30 days</p>
          <LineChart points={perDay} label="Activity per day, last 30 days" />
        </section>
        <section className="rounded-brand border border-line bg-white p-4 lg:col-span-4">
          <p className="mb-3 text-xs uppercase tracking-[0.08em] text-muted">Leads by status</p>
          {byStatus.length === 0 ? <p className="text-sm text-muted">No leads assigned.</p> : (
            <ul className="space-y-2 text-sm">
              {byStatus.map((s) => <li key={s.status} className="flex items-center justify-between"><Pill value={s.status} /><span className="tabular">{s.n}</span></li>)}
            </ul>
          )}
        </section>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-brand border border-line bg-white p-4">
          <div className="mb-2 flex items-center justify-between"><p className="text-xs uppercase tracking-[0.08em] text-muted">Open tasks</p><Link href={`${base}?tab=tasks`} className="text-sm text-accent-ink hover:underline">All tasks</Link></div>
          {open.length === 0 ? <p className="text-sm text-muted">Nothing open.</p> : (
            <ul className="divide-y divide-line text-sm">
              {open.map((t) => <li key={t.id} className="flex items-center justify-between gap-3 py-2"><Link href={`/admin/tasks/${t.id}`} className="min-w-0 truncate hover:text-accent-ink">{t.title}</Link><span className={`shrink-0 text-xs tabular ${t.overdue ? "text-red-700" : "text-muted"}`}>{t.due_date ? formatShortDate(t.due_date) : "No date"}</span></li>)}
            </ul>
          )}
        </section>
        <section className="rounded-brand border border-line bg-white p-4">
          <div className="mb-2 flex items-center justify-between"><p className="text-xs uppercase tracking-[0.08em] text-muted">Recent activity</p><Link href={`${base}?tab=activity`} className="text-sm text-accent-ink hover:underline">All activity</Link></div>
          <ActivityRows rows={activity} />
        </section>
      </div>
    </div>
  );
}

async function GrowthTab({ userId, base, autoAssign }: { userId: number; base: string; autoAssign: boolean }) {
  const [g, awards, batch, certificates] = await Promise.all([getGrowth(userId), listStarAwards(userId), myBatch(userId), listCertificates(userId)]);
  if (!g) return null;
  return (
    <GrowthPanel g={g} awards={awards} batch={batch} certificates={certificates} leadBase="/admin" admin={{
      award: awardStar.bind(null, userId), remove: removeStar.bind(null, userId), promote: promoteToExecutive.bind(null, userId),
      toggleAutoAssign: togglePersonAutoAssign.bind(null, userId, `${base}?tab=growth`), autoAssign,
    }} />
  );
}

async function TasksTab({ userId, name }: { userId: number; name: string }) {
  const [tasks, employees] = await Promise.all([listTasks({}, { assignedTo: userId, all: true }), listEmployees(true)]);
  const staff = employees.filter((e) => e.role === "employee" || e.id === userId).map((e) => ({ id: e.id, name: e.name }));
  return (
    <>
      <p className="mb-2 text-sm text-muted">New tasks here go to {name}. Type, tap a due date, press Enter.</p>
      <QuickTaskBar employees={[{ id: userId, name }]} action={quickCreateTask} />
      <TaskList tasks={tasks.rows.map((t) => toTaskItem(t, "/admin"))} today={todayIST()} employees={staff} toggle={toggleTaskDone} update={updateTaskInline} />
    </>
  );
}

async function LeadsTab({ userId, name, base, total }: { userId: number; name: string; base: string; total: number }) {
  const [rows, unassigned] = await Promise.all([assignedLeads(userId), unassignedLeads()]);
  return (
    <>
      <div className="mb-3 flex items-center justify-between text-sm">
        <p className="text-muted">Open leads first, by next follow-up. Showing {rows.length} of {total}.</p>
        <Link href={`/admin/leads?assigned=${userId}`} className="text-accent-ink hover:underline">Open in Leads</Link>
      </div>
      <RecordList rows={rows} kind="leads" empty={`No leads assigned to ${name} yet.`} />
      <AssignPicker rows={unassigned} kind="lead" employeeId={userId} name={name} back={`${base}?tab=leads`} />
    </>
  );
}

async function ProspectsTab({ userId, name, base, total }: { userId: number; name: string; base: string; total: number }) {
  const [rows, unassigned] = await Promise.all([assignedProspects(userId), unassignedProspects()]);
  return (
    <>
      <div className="mb-3 flex items-center justify-between text-sm">
        <p className="text-muted">Open prospects first, by next follow-up. Showing {rows.length} of {total}.</p>
        <Link href={`/admin/prospects?assigned=${userId}`} className="text-accent-ink hover:underline">Open in Prospects</Link>
      </div>
      <RecordList rows={rows} kind="prospects" empty={`No prospects assigned to ${name} yet.`} />
      <AssignPicker rows={unassigned} kind="prospect" employeeId={userId} name={name} back={`${base}?tab=prospects`} />
    </>
  );
}

async function SalesTab({ userId, first }: { userId: number; first: string }) {
  const data = await listSales({}, { employeeId: userId, all: true });
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile label="Deals recorded" value={data.total} />
        <StatTile label="Deal value" value={money(data.totalValue)} />
        <StatTile label="Commission" value={money(data.totalCommission)} />
      </div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <p className="text-muted">Every sale {first} recorded, newest first.</p>
        <Link href={`/admin/sales/new?employee=${userId}`} className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-1.5 hover:border-ink"><Icon name="plus" size={14} />Record sale</Link>
      </div>
      {data.rows.length === 0 ? <p className="rounded-brand border border-dashed border-line px-4 py-6 text-center text-sm text-muted">No sales yet.</p> : (
        <ul className="divide-y divide-line rounded-brand border border-line bg-white">
          {data.rows.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
              <span className="w-24 tabular text-muted">{formatShortDate(s.sale_date)}</span>
              <Link href={`/admin/sales/${s.id}`} className="min-w-0 flex-1 hover:text-accent-ink">{s.client_name ?? s.lead_name ?? s.prospect_name ?? "Client"}<span className="block truncate text-xs text-muted">{s.property_title ?? s.property_name ?? ""}</span></Link>
              <span className="tabular">{formatPrice(Number(s.deal_value))}</span>
              <Pill value={s.status} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ActivityRows({ rows }: { rows: Awaited<ReturnType<typeof recentActivity>> }) {
  if (!rows.length) return <p className="text-sm text-muted">No activity logged yet.</p>;
  return (
    <ul className="divide-y divide-line text-sm">
      {rows.map((a) => (
        <li key={a.id} className="flex items-start gap-3 py-2">
          <span className="w-20 shrink-0 text-xs uppercase tracking-[0.06em] text-muted">{ACTIVITY_LABEL[a.type] ?? a.type}</span>
          <span className="min-w-0 flex-1">
            {a.record_id && a.record_kind ? <Link href={`/admin/${a.record_kind === "lead" ? "leads" : "prospects"}/${a.record_id}`} className="hover:text-accent-ink">{a.record_name}</Link> : null}
            {a.body && <span className="block truncate text-muted">{a.body}</span>}
          </span>
          <span className="shrink-0 text-xs text-muted" title={formatDateTime(a.created_at)}>{relativeTime(a.created_at)}</span>
        </li>
      ))}
    </ul>
  );
}

async function ActivityTab({ userId }: { userId: number }) {
  const [rows, perDay, events] = await Promise.all([recentActivity(userId, 60), activityPerDay(userId), accountEvents(userId)]);
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="space-y-5 lg:col-span-8">
        <section className="rounded-brand border border-line bg-white p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.08em] text-muted">Activity per day · last 30 days</p>
          <LineChart points={perDay} label="Activity per day, last 30 days" />
        </section>
        <section className="rounded-brand border border-line bg-white p-4">
          <p className="mb-2 text-xs uppercase tracking-[0.08em] text-muted">Calls, notes, status changes and follow-ups</p>
          <ActivityRows rows={rows} />
        </section>
      </div>
      <section className="rounded-brand border border-line bg-white p-4 lg:col-span-4">
        <p className="mb-2 text-xs uppercase tracking-[0.08em] text-muted">Account events</p>
        {events.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : (
          <ul className="divide-y divide-line text-sm">
            {events.map((e) => (
              <li key={e.id} className="py-2">
                <p>{e.action.replace(/_/g, " ")}{e.actor ? <span className="text-muted"> · by {e.actor}</span> : null}</p>
                <p className="text-xs text-muted">{formatDateTime(e.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

async function AccountTab({ userId, isSelf }: { userId: number; isSelf: boolean }) {
  const [u, others] = await Promise.all([getEmployee(userId), listEmployees(true)]);
  if (!u) return null;
  const targets = others.filter((o) => o.id !== u.id);
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="lg:col-span-7"><EmployeeForm employee={u} isSelf={isSelf} action={updateEmployee.bind(null, u.id)} /></div>
      <div className="space-y-4 lg:col-span-5">
        <ResetPassword action={resetPassword.bind(null, u.id)} canEmail={mailConfigured()} email={u.email} />
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
            <p className="mt-1 text-sm text-muted">Their leads, prospects, tasks and sales are moved to the person you choose. Activity history stays. This cannot be undone.</p>
            <label className="mt-3 block text-xs font-medium">Move records to<select name="reassign_to" className={`${inputCls} mt-1`} defaultValue="" required><option value="">Choose an employee</option>{targets.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
            <div className="mt-3"><ConfirmButton label="Delete employee" confirmLabel="Yes, delete and reassign" action={deleteEmployee.bind(null, u.id)} /></div>
          </form>
        )}
      </div>
    </div>
  );
}
