import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import Pill from "@/components/console/Pill";
import ToggleForm from "@/components/console/ToggleForm";
import ConfirmButton from "@/components/console/ConfirmButton";
import Icon from "@/components/Icon";
import { inputCls } from "@/components/console/form-classes";
import { requireUser } from "@/lib/auth";
import { todayIST } from "@/lib/dates";
import { formatShortDate } from "@/lib/format";
import { listCertificates, listInterns, listSkills } from "@/lib/queries/growth";
import { addSkill, deleteSkill, issueCertificate, setCertificateRevoked, toggleSkill } from "./actions";

export const metadata = { title: "Certificates" };

export default async function CertificatesPage({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  await requireUser("admin");
  const sp = await searchParams;
  const [interns, skills, certs] = await Promise.all([listInterns(), listSkills(), listCertificates()]);
  const active = skills.filter((s) => s.active);
  const preselect = interns.some((i) => String(i.id) === sp.user) ? sp.user : "";
  return (
    <>
      <PageHeader title="Certificates" description="Issue internship certificates listing the skills an intern has learned. Each one gets a number and a printable page the intern can also open." />
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <form action={issueCertificate} className="rounded-brand border border-line bg-white p-5">
            <h2 className="text-base">Issue a certificate</h2>
            {interns.length === 0 ? (
              <div className="mt-2">
                <p className="text-sm text-muted">Certificates are issued to interns, and there are no active interns yet. Add one, or set an existing person&apos;s level to Intern under <Link href="/admin/employees" className="text-accent-ink hover:underline">Employees</Link>; the form appears here as soon as there is one.</p>
                <Link href="/admin/employees/new" className="mt-3 inline-flex items-center gap-1.5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">Add an intern</Link>
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col text-xs font-medium">Intern<select name="user_id" required defaultValue={preselect} className={`${inputCls} mt-1`}><option value="">Choose an intern</option>{interns.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
                  <label className="flex flex-col text-xs font-medium">Title<input name="title" defaultValue="Certificate of Internship" maxLength={120} className={`${inputCls} mt-1`} /></label>
                  <label className="flex flex-col text-xs font-medium">Internship from<input name="start_date" type="date" className={`${inputCls} mt-1`} /></label>
                  <label className="flex flex-col text-xs font-medium">Internship to<input name="end_date" type="date" className={`${inputCls} mt-1`} /></label>
                  <label className="flex flex-col text-xs font-medium">Issue date<input name="issue_date" type="date" defaultValue={todayIST()} className={`${inputCls} mt-1`} /></label>
                  <label className="flex flex-col text-xs font-medium">Remarks (optional)<input name="remarks" maxLength={400} placeholder="e.g. Completed with distinction" className={`${inputCls} mt-1`} /></label>
                </div>
                <fieldset className="mt-4">
                  <legend className="text-xs font-medium">Skills</legend>
                  {active.length === 0 ? <p className="mt-1 text-sm text-muted">Add skills on the right first.</p> : (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {active.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 rounded-brand border border-line px-3 py-2 text-sm hover:border-ink">
                          <input type="checkbox" name="skills" value={s.name} className="h-4 w-4 accent-[#00BF63]" />{s.name}
                        </label>
                      ))}
                    </div>
                  )}
                </fieldset>
                <button type="submit" className="mt-5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">Issue certificate</button>
              </>
            )}
          </form>

          <section className="rounded-brand border border-line bg-white">
            <h2 className="border-b border-line px-5 py-3 text-base">Issued <span className="tabular text-muted">({certs.length})</span></h2>
            {certs.length === 0 ? <p className="px-5 py-4 text-sm text-muted">No certificates issued yet.</p> : (
              <ul className="divide-y divide-line">
                {certs.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                    <div className="min-w-0 flex-1 basis-56">
                      <Link href={`/admin/employees/${c.user_id}?tab=growth`} className="font-medium hover:text-accent-ink">{c.user_name}</Link>
                      <p className="truncate text-xs text-muted">{c.code} · {c.title} · {c.skills.join(", ")}</p>
                    </div>
                    <span className="w-24 text-xs tabular text-muted">{formatShortDate(c.issue_date)}</span>
                    <Pill value={c.revoked ? "Revoked" : "Valid"} />
                    <Link href={`/certificate/${c.id}`} target="_blank" className="inline-flex items-center gap-1 rounded-brand border border-line px-2.5 py-1 text-xs hover:border-ink"><Icon name="eye" size={12} />View</Link>
                    {c.revoked ? (
                      <form action={setCertificateRevoked.bind(null, c.id, false)}><button type="submit" className="rounded-brand border border-line px-2.5 py-1 text-xs hover:border-ink">Restore</button></form>
                    ) : (
                      <form><ConfirmButton label="Revoke" confirmLabel="Yes, revoke" action={setCertificateRevoked.bind(null, c.id, true)} className="rounded-brand border border-line px-2.5 py-1 text-xs text-red-700 hover:border-red-700" /></form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="h-fit rounded-brand border border-line bg-white p-5 lg:col-span-4">
          <h2 className="text-base">Skills</h2>
          <p className="mt-1 text-xs text-muted">The list you tick from when issuing. Hidden skills stay on certificates already issued.</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {skills.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className={s.active ? "" : "text-muted line-through"}>{s.name}{s.used > 0 && <span className="ml-1 text-xs tabular text-muted no-underline">· {s.used}</span>}</span>
                <span className="flex items-center gap-2">
                  <ToggleForm on={s.active} action={toggleSkill.bind(null, s.id)} label={`${s.active ? "Hide" : "Show"} ${s.name}`} />
                  {s.used === 0 && <form action={deleteSkill.bind(null, s.id)}><button type="submit" aria-label={`Delete ${s.name}`} className="rounded-brand border border-line p-1 text-red-700 hover:border-red-700"><Icon name="x" size={12} /></button></form>}
                </span>
              </li>
            ))}
            {skills.length === 0 && <li className="py-2 text-sm text-muted">No skills yet.</li>}
          </ul>
          <form action={addSkill} className="mt-3 flex gap-2">
            <input name="name" required minLength={2} maxLength={60} placeholder="Add a skill…" className={`${inputCls} py-1.5`} aria-label="New skill" />
            <button type="submit" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">Add</button>
          </form>
        </section>
      </div>
    </>
  );
}
