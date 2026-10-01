import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import DataTable, { queryString } from "@/components/console/DataTable";
import FilterBar from "@/components/console/FilterBar";
import Pill from "@/components/console/Pill";
import ToggleForm from "@/components/console/ToggleForm";
import ContentThumb from "@/components/console/ContentThumb";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { PROPERTY_STATUSES } from "@/lib/console";
import { formatPrice, formatShortDate } from "@/lib/format";
import { getSetting, listLocalities } from "@/lib/queries/common";
import { listProperties, type PropertyRow } from "@/lib/queries/content";
import { togglePropertyFlag } from "./actions";

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const sp = await searchParams;
  const [{ rows, total, page, size, sort }, localities, types] = await Promise.all([listProperties(sp), listLocalities(), getSetting<string[]>("property_types", ["Kothi", "Apartment", "Plot", "Commercial", "Farmhouse"])]);
  const opts = (xs: readonly string[]) => xs.map((x) => ({ value: x, label: x }));
  return (
    <>
      <PageHeader title="Properties" description="Listings shown on the website. Only published properties are visible to visitors." actions={<Link href="/admin/properties/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={16} />Add property</Link>} />
      <FilterBar searchPlaceholder="Search title or locality" filters={[
        { key: "type", label: "Type", options: opts(types) },
        { key: "purpose", label: "Listing", options: opts(["Buy", "Rent"]) },
        { key: "locality", label: "Locality", options: opts(localities) },
        { key: "status", label: "Status", options: opts(PROPERTY_STATUSES) },
        { key: "published", label: "Published", options: [{ value: "1", label: "Published" }, { value: "0", label: "Draft" }] },
      ]} />
      <DataTable<PropertyRow>
        rows={rows} total={total} page={page} pageSize={size} sp={sp} basePath="/admin/properties" sortKey={sort.key} sortDir={sort.dir}
        exportHref={`/admin/properties/export?${queryString(sp)}`}
        rowId={(r) => r.id}
        empty={{ text: "No properties match.", action: { label: "Add property", href: "/admin/properties/new" } }}
        columns={[
          { key: "cover", label: "", className: "w-16", render: (r) => <ContentThumb src={r.cover} /> },
          { key: "title", label: "Title", sortable: true, render: (r) => <Link href={`/admin/properties/${r.id}`} className="font-medium hover:text-accent-ink">{r.title}</Link> },
          { key: "type", label: "Type", sortable: true },
          { key: "purpose", label: "Listing", render: (r) => r.purpose === "Rent" ? "Rent" : "Buy" },
          { key: "locality", label: "Locality", sortable: true },
          { key: "price", label: "Price", sortable: true, className: "tabular", render: (r) => formatPrice(Number(r.price), r.purpose === "Rent" ? "Rent" : "Buy") },
          { key: "status", label: "Status", sortable: true, render: (r) => <Pill value={r.status} /> },
          { key: "published", label: "Published", render: (r) => <ToggleForm on={r.published} label={r.published ? "Unpublish" : "Publish"} action={togglePropertyFlag.bind(null, r.id, "published", !r.published)} /> },
          { key: "featured", label: "Featured", render: (r) => <ToggleForm on={r.featured} label={r.featured ? "Remove from featured" : "Mark featured"} action={togglePropertyFlag.bind(null, r.id, "featured", !r.featured)} /> },
          { key: "updated_at", label: "Updated", sortable: true, className: "whitespace-nowrap text-muted", render: (r) => formatShortDate(r.updated_at) },
        ]}
      />
    </>
  );
}
