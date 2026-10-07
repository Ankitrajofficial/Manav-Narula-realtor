import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import EmptyState from "@/components/console/EmptyState";
import ToggleForm from "@/components/console/ToggleForm";
import ContentThumb from "@/components/console/ContentThumb";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { listTeam } from "@/lib/queries/team";
import { moveTeamMemberAction, toggleTeamMember } from "./actions";

export default async function TeamAdminPage() {
  await requireUser("admin");
  const team = await listTeam();
  const shown = team.filter((t) => t.active).length;
  return (
    <div className="max-w-4xl">
      <PageHeader title="Team" description={`"The team" on the About page. It is hidden while no member is shown${team.length ? ` (${shown} of ${team.length} shown now)` : ""}.`} actions={<>
        <Link href="/about" target="_blank" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name="eye" size={14} />View page</Link>
        <Link href="/admin/team/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={16} />Add member</Link>
      </>} />
      {team.length === 0 ? <EmptyState text="No team members yet. The About page hides the team section until you add one." action={{ label: "Add member", href: "/admin/team/new" }} /> : (
        <ul className="space-y-2">
          {team.map((t, i) => (
            <li key={t.id} className="flex items-center gap-4 rounded-brand border border-line bg-white p-3">
              <span className="flex flex-col gap-1">
                <form action={moveTeamMemberAction.bind(null, t.id, -1)}><button type="submit" disabled={i === 0} aria-label={`Move ${t.name} up`} className="rounded-brand border border-line p-1 hover:border-ink disabled:opacity-30"><Icon name="up" size={12} /></button></form>
                <form action={moveTeamMemberAction.bind(null, t.id, 1)}><button type="submit" disabled={i === team.length - 1} aria-label={`Move ${t.name} down`} className="rounded-brand border border-line p-1 hover:border-ink disabled:opacity-30"><Icon name="down" size={12} /></button></form>
              </span>
              <ContentThumb src={t.photo} className="h-16 w-14 shrink-0" />
              <div className="min-w-0 flex-1">
                <Link href={`/admin/team/${t.id}`} className="block truncate font-medium hover:text-accent-ink">{t.name}</Link>
                <p className="truncate text-xs text-accent-ink">{t.role}</p>
                <p className="truncate text-xs text-muted">{t.bio}</p>
              </div>
              <span className="text-xs text-muted">{t.active ? "Shown" : "Hidden"}</span>
              <ToggleForm on={t.active} label={t.active ? "Hide from About page" : "Show on About page"} action={toggleTeamMember.bind(null, t.id, !t.active)} />
              <Link href={`/admin/team/${t.id}`} className="rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink">Edit</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
