import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import EmptyState from "@/components/console/EmptyState";
import Pill from "@/components/console/Pill";
import ToggleForm from "@/components/console/ToggleForm";
import ContentThumb from "@/components/console/ContentThumb";
import ConfirmButton from "@/components/console/ConfirmButton";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { listOffers, toDateInput } from "@/lib/queries/content";
import { deleteOffer, toggleOfferActive } from "./actions";

export default async function OffersPage() {
  await requireUser("admin");
  const offers = await listOffers();
  const today = toDateInput(new Date());
  return (
    <>
      <PageHeader title="Offers" description="Property offers, shown on the home page and the Properties page. Home loan offers are under Home Loans." actions={<Link href="/admin/offers/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={16} />Add offer</Link>} />
      {offers.length === 0 ? <EmptyState text="No offers yet." action={{ label: "Add offer", href: "/admin/offers/new" }} /> : (
        <ul className="space-y-2">
          {offers.map((o) => {
            const start = toDateInput(o.start_date), end = toDateInput(o.end_date);
            const state = !o.active ? "Draft" : start && start > today ? "Upcoming" : end && end < today ? "Closed lost" : "Published";
            const label = state === "Published" ? "Live" : state === "Upcoming" ? "Scheduled" : state === "Closed lost" ? "Expired" : "Inactive";
            return (
              <li key={o.id} className="flex items-center gap-4 rounded-brand border border-line bg-white p-3">
                <ContentThumb src={o.image} className="h-14 w-24 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/offers/${o.id}`} className="block truncate font-medium hover:text-accent-ink">{o.title}</Link>
                  <p className="truncate text-xs text-muted">{o.text}</p>
                  <p className="mt-1 truncate text-xs text-muted">{o.property_title ? `Property: ${o.property_title}` : o.project_name ? `Project: ${o.project_name}` : o.link ? `Link: ${o.link}` : "No link"}{start || end ? ` · ${start || "any time"} to ${end || "no end"}` : ""} · updated {formatShortDate(o.updated_at)}</p>
                </div>
                <Pill value={state} /><span className="text-xs text-muted">{label}</span>
                <ToggleForm on={o.active} label={o.active ? "Deactivate" : "Activate"} action={toggleOfferActive.bind(null, o.id, !o.active)} />
                <Link href={`/admin/offers/${o.id}`} className="rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink">Edit</Link>
                <form><ConfirmButton label="Delete" action={deleteOffer.bind(null, o.id)} /></form>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
