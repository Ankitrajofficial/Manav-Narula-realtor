import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import EmptyState from "@/components/console/EmptyState";
import ToggleForm from "@/components/console/ToggleForm";
import ContentThumb from "@/components/console/ContentThumb";
import ConfirmButton from "@/components/console/ConfirmButton";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { toDateInput } from "@/lib/dates";
import { formatShortDate } from "@/lib/format";
import { describePages, parsePagePaths, POPUP_KINDS } from "@/lib/popups";
import { listPopups } from "@/lib/queries/popups";
import { deletePopup, togglePopupActive } from "./actions";

export default async function PopupsPage() {
  await requireUser("admin");
  const popups = await listPopups();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return (
    <>
      <PageHeader
        title="Pop-ups"
        description="Pop-ups shown on the website. A visitor sees at most one each time a page loads (a refresh shows it again): the newest live pop-up for that page. Once closed, the same pop-up stays hidden for that visitor for a day; once its form is sent, for 30 days."
        actions={<Link href="/admin/popups/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={16} />New pop-up</Link>}
      />
      {popups.length === 0 ? <EmptyState text="No pop-ups yet." action={{ label: "New pop-up", href: "/admin/popups/new" }} /> : (
        <ul className="space-y-2">
          {popups.map((p) => {
            const start = toDateInput(p.start_date), end = toDateInput(p.end_date);
            const status = !p.active ? "Off" : start && start > today ? "Scheduled" : end && end < today ? "Ended" : "Live";
            const tone = status === "Live" ? "bg-accent/10 text-accent-ink" : status === "Scheduled" ? "bg-amber-50 text-amber-800" : "bg-bg text-muted";
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-brand border border-line bg-white p-3">
                <ContentThumb src={p.image} className="h-14 w-20 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/popups/${p.id}`} className="block truncate font-medium hover:text-accent-ink">{p.title}</Link>
                  <p className="truncate text-xs text-muted">{POPUP_KINDS.find((k) => k.value === p.kind)?.label} · {describePages(p.pages)} · after {p.delay_seconds}s</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{start || end ? `${start || "any time"} to ${end || "no end date"} · ` : ""}updated {formatShortDate(p.updated_at)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{status}</span>
                <ToggleForm on={p.active} label={p.active ? "Switch off" : "Switch on"} action={togglePopupActive.bind(null, p.id, !p.active)} />
                {status === "Live"
                  ? <a href={`${p.pages === "all" || p.pages === "home" ? "/" : parsePagePaths(p.pages)[0] ?? "/"}?popup=${p.id}`} target="_blank" rel="noopener" className="rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink">Preview on website</a>
                  : <span className="px-1 text-xs text-muted" title="Only live pop-ups can be previewed">Switch on to preview</span>}
                <Link href={`/admin/popups/${p.id}`} className="rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink">Edit</Link>
                <form><ConfirmButton label="Delete" action={deletePopup.bind(null, p.id)} /></form>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
