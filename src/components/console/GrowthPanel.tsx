import Link from "next/link";
import Pill from "@/components/console/Pill";
import Stars, { StarLegend, TierStar } from "@/components/console/Stars";
import ConfirmButton from "@/components/console/ConfirmButton";
import ToggleForm from "@/components/console/ToggleForm";
import Icon from "@/components/Icon";
import { MAX_STARS, STAR_THRESHOLDS, STAR_TIERS, canPromote, levelLabel, nextThreshold, starsDue } from "@/lib/growth";
import { formatShortDate, relativeTime } from "@/lib/format";
import type { Certificate, Growth, StarAward } from "@/lib/queries/growth";
import type { MyBatch } from "@/lib/auto-assign";

type Action = () => Promise<void>;
export interface GrowthAdmin { award: Action; remove: Action; promote: Action; toggleAutoAssign: Action; autoAssign: boolean }

const card = "rounded-brand border border-line bg-white p-5";
const label = "text-xs uppercase tracking-[0.08em] text-muted";

/** Stars, promotion, the current lead batch and certificates for one person. `admin` adds the award and promote controls. */
export default function GrowthPanel({ g, awards, batch, certificates, leadBase, admin }: { g: Growth; awards: StarAward[]; batch: MyBatch | null; certificates: Certificate[]; leadBase: string; admin?: GrowthAdmin }) {
  const due = starsDue(g.sales);
  const next = nextThreshold(g.stars);
  const prev = g.stars ? STAR_THRESHOLDS[g.stars - 1] : 0;
  const pct = next ? Math.min(100, Math.round(((g.sales - prev) / (next - prev)) * 100)) : 100;
  const nextTier = STAR_TIERS[g.stars];
  const ready = canPromote(g.role, g.level, g.stars);
  const first = g.name.split(" ")[0];
  const contacted = batch ? batch.leads.filter((l) => l.status !== "New").length : 0;

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="space-y-5 lg:col-span-7">
        <section className={card}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={label}>Stars</p>
              <Stars count={g.stars} size={32} className="mt-2" />
              <p className="mt-2 text-sm">{g.stars} of {MAX_STARS} stars · <span className="tabular">{g.sales}</span> approved {g.sales === 1 ? "sale" : "sales"}</p>
            </div>
            <Pill value={levelLabel(g.role, g.level)} />
          </div>

          {next && nextTier ? (
            <div className="mt-4">
              <div className="flex justify-between text-xs"><span>Next: <span style={{ color: nextTier.color }}>{nextTier.name}</span> star at {next} {next === 1 ? "sale" : "sales"}</span><span className="tabular text-muted">{Math.min(g.sales, next)} / {next}</span></div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to the next star">
                <div className="h-full" style={{ width: `${pct}%`, background: nextTier.color }} />
              </div>
              {due > g.stars && <p className="mt-2 text-sm text-accent-ink">{admin ? `${first} has reached ${due} ${due === 1 ? "star" : "stars"} worth of sales.` : "You have reached the sales for your next star. The admin will award it."}</p>}
            </div>
          ) : <p className="mt-4 text-sm text-accent-ink">All five stars earned.</p>}

          {admin && (
            <form className="mt-4 flex flex-wrap items-center gap-2">
              <button type="submit" formAction={admin.award} disabled={due <= g.stars || g.stars >= MAX_STARS} className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink disabled:cursor-not-allowed disabled:opacity-40">
                <Icon name="star" size={14} />{g.stars >= MAX_STARS ? "Five stars awarded" : `Award ${STAR_TIERS[g.stars].name.toLowerCase()} star`}
              </button>
              {g.stars > 0 && <ConfirmButton label="Remove last star" confirmLabel={`Remove star ${g.stars}`} action={admin.remove} className="rounded-brand border border-line px-3 py-2 text-sm text-muted hover:border-ink" />}
              {next && due <= g.stars && (
                <p className="w-full text-xs text-muted">
                  Unlocks at {next} approved {next === 1 ? "sale" : "sales"}; {first} has {g.sales}.{" "}
                  <Link href={`/admin/sales/new?employee=${g.id}`} className="text-accent-ink hover:underline">Record a sale for {first}</Link>
                </p>
              )}
            </form>
          )}
          <div className="mt-4 border-t border-line pt-3"><StarLegend thresholds={STAR_THRESHOLDS} /></div>
        </section>

        {(ready || g.level === "executive") && (
          <section className={`${card} ${ready ? "border-accent" : ""}`}>
            <p className={label}>Promotion</p>
            {g.level === "executive" ? (
              <p className="mt-2 text-sm">{admin ? first : "You"} {admin ? "is" : "are"} an Executive{g.promoted_at ? ` since ${formatShortDate(g.promoted_at)}` : ""}.</p>
            ) : admin ? (
              <>
                <p className="mt-2 text-sm">{first} has all five stars and is ready to become an Executive.</p>
                <form className="mt-3"><button type="submit" formAction={admin.promote} className="rounded-brand bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">Promote to Executive</button></form>
              </>
            ) : <p className="mt-2 text-sm">You have all five stars. Your promotion to Executive is with the admin.</p>}
          </section>
        )}

        {awards.length > 0 && (
          <section className={card}>
            <p className={label}>Star history</p>
            <ul className="mt-2 divide-y divide-line text-sm">
              {awards.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex items-center gap-2"><TierStar star={a.star} /><span style={{ color: STAR_TIERS[a.star - 1]?.color }}>{STAR_TIERS[a.star - 1]?.name}</span> star at {a.sales_count} {a.sales_count === 1 ? "sale" : "sales"}</span>
                  <span className="text-xs text-muted">{formatShortDate(a.created_at)}{a.awarded_by_name ? ` · ${a.awarded_by_name}` : ""}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="space-y-5 lg:col-span-5">
        <section className={card}>
          <div className="flex items-center justify-between gap-3">
            <p className={label}>Current lead batch</p>
            {admin && <span className="flex items-center gap-2 text-xs text-muted">Auto-assign {admin.autoAssign ? "on" : "paused"}<ToggleForm on={admin.autoAssign} action={admin.toggleAutoAssign} label={`Auto-assign for ${g.name}`} /></span>}
          </div>
          {g.role === "admin" ? <p className="mt-2 text-sm text-muted">Admins do not receive automatic leads.</p> : !batch ? (
            <p className="mt-2 text-sm text-muted">{admin ? `No open batch. ${first} gets the next leads as soon as new ones arrive.` : "No open batch. Your next leads arrive as soon as new enquiries come in."}</p>
          ) : (
            <>
              <p className="mt-2 text-sm">{contacted} of {batch.leads.length} contacted · started {relativeTime(batch.created_at)} · {batch.completed} {batch.completed === 1 ? "batch" : "batches"} done before</p>
              <p className="mt-1 text-xs text-muted">Move every lead past &quot;New&quot; (call, follow-up, site visit…) to receive the next batch.</p>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {batch.leads.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <Link href={`${leadBase}/leads/${l.id}`} className="min-w-0 truncate hover:text-accent-ink">{l.name}</Link>
                    <Pill value={l.status} />
                  </li>
                ))}
              </ul>
              {batch.task_id && <Link href={`${leadBase}/tasks/${batch.task_id}`} className="mt-3 inline-block text-sm text-accent-ink hover:underline">Open the call sheet</Link>}
            </>
          )}
        </section>

        {(g.level === "intern" || certificates.length > 0) && (
          <section className={card}>
            <div className="flex items-center justify-between gap-3">
              <p className={label}>Certificates</p>
              {admin && g.level === "intern" && <Link href={`/admin/certificates?user=${g.id}`} className="text-sm text-accent-ink hover:underline">Issue certificate</Link>}
            </div>
            {certificates.length === 0 ? <p className="mt-2 text-sm text-muted">None issued yet.</p> : (
              <ul className="mt-2 divide-y divide-line text-sm">
                {certificates.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <Link href={`/certificate/${c.id}`} target="_blank" className="hover:text-accent-ink">{c.title}</Link>
                      <p className="truncate text-xs text-muted">{c.code} · {formatShortDate(c.issue_date)} · {c.skills.join(", ")}</p>
                    </div>
                    <Pill value={c.revoked ? "Revoked" : "Valid"} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
