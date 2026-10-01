import { requireUser } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { allPropertiesForExport, type PropertyRow } from "@/lib/queries/content";
import { audit } from "@/lib/records";

export async function GET(req: Request) {
  const user = await requireUser("admin");
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const rows = await allPropertiesForExport(sp);
  await audit(user.id, "export_csv", "property", null, { count: rows.length, filters: sp });
  const csv = toCsv<PropertyRow>(rows, [
    { key: "id", label: "ID" }, { key: "title", label: "Title" }, { key: "slug", label: "Slug" }, { key: "type", label: "Type" }, { key: "purpose", label: "Listing" }, { key: "locality", label: "Locality" },
    { key: "price", label: "Price (INR)", value: (r) => Number(r.price) }, { key: "bhk", label: "BHK" }, { key: "baths", label: "Baths" }, { key: "area", label: "Area", value: (r) => r.area == null ? "" : Number(r.area) }, { key: "area_unit", label: "Unit" },
    { key: "status", label: "Status" }, { key: "published", label: "Published", value: (r) => (r.published ? "Yes" : "No") }, { key: "featured", label: "Featured", value: (r) => (r.featured ? "Yes" : "No") },
    { key: "rera", label: "RERA" }, { key: "updated_at", label: "Updated" },
  ]);
  return csvResponse(csv, `properties-${new Date().toISOString().slice(0, 10)}.csv`);
}
