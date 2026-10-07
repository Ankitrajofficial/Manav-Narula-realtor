"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormError, Input, Section, Select, SubmitButton, Textarea, inputCls } from "@/components/console/Form";
import LocalitySelect from "@/components/LocalitySelect";
import type { LocalityOption } from "@/lib/localities";
import ImageUploader from "@/components/console/ImageUploader";
import ImageField from "@/components/console/ImageField";
import RowsEditor from "@/components/console/RowsEditor";
import ConfirmButton from "@/components/console/ConfirmButton";
import { AMENITY_OPTIONS, PROPERTY_STATUSES } from "@/lib/console";
import type { PropertyRow } from "@/lib/queries/content";
import type { PropertyFormState } from "./actions";

interface Props {
  property?: PropertyRow | null;
  images?: string[];
  cover?: string | null;
  localities: LocalityOption[];
  types: string[];
  projects: { id: number; name: string }[];
  action: (prev: PropertyFormState, fd: FormData) => Promise<PropertyFormState>;
  onDuplicate?: () => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function PropertyForm({ property: p, images = [], cover, localities, types, projects, action, onDuplicate, onDelete }: Props) {
  const [state, act] = useActionState<PropertyFormState, FormData>(action, {});
  const e = state.errors ?? {};
  const [price, setPrice] = useState(p ? String(Number(p.price)) : "");
  const [area, setArea] = useState(p?.area == null ? "" : String(Number(p.area)));
  const [unit, setUnit] = useState(p?.area_unit ?? "sq.ft");
  const [purpose, setPurpose] = useState(p?.purpose ?? "Buy");
  const sqft = unit === "sq.yd" ? Number(area) * 9 : Number(area);
  const perSqft = Number(price) > 0 && sqft > 0 ? Math.round(Number(price) / sqft) : null;
  const trust = p?.trust ?? [];
  // Keep a property's current locality selectable even if it has since been deactivated.
  const withCurrent = p?.locality && !localities.some((l) => l.name === p.locality) ? [...localities, { name: p.locality, zone: "Inactive" }] : localities;

  return (
    <form action={act} className="space-y-5">
      <FormError message={state.message} />
      <Section title="Basic" description="What it is and where it is.">
        <Field label="Title" htmlFor="title" error={e.title} className="md:col-span-2"><Input id="title" name="title" defaultValue={p?.title} required maxLength={120} placeholder="Corner kothi on 300 sq.yd" /></Field>
        <Field label="Type" htmlFor="type" error={e.type}><Select id="type" name="type" defaultValue={p?.type ?? ""}><option value="">Choose</option>{types.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="Listing type" htmlFor="purpose"><Select id="purpose" name="purpose" value={purpose} onChange={(ev) => setPurpose(ev.target.value)}><option>Buy</option><option>Rent</option></Select></Field>
        <Field label="Project (optional)" htmlFor="project_id"><Select id="project_id" name="project_id" defaultValue={p?.project_id ?? ""}><option value="">None</option>{projects.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}</Select></Field>
        <Field label="Status" htmlFor="status"><Select id="status" name="status" defaultValue={p?.status ?? "Ready"}>{PROPERTY_STATUSES.map((st) => <option key={st}>{st}</option>)}</Select></Field>
        <div className="flex items-end pb-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={p?.featured} className="accent-[#00BF63]" />Featured on home page</label></div>
      </Section>

      <Section title="Address" description="The website shows Street/Block, Locality and City only. House/plot number, pincode and the map link stay in the console.">
        <Field label="House / plot no. (optional, not shown on website)" htmlFor="address_line"><Input id="address_line" name="address_line" defaultValue={p?.address_line ?? ""} maxLength={80} placeholder="H.No. 412" /></Field>
        <Field label="Street / Block" htmlFor="street"><Input id="street" name="street" defaultValue={p?.street ?? ""} maxLength={120} placeholder="Block C, near Shivalik Park" /></Field>
        <Field label="Locality" htmlFor="locality" error={e.locality} hint="Type to search; grouped by zone.">
          <LocalitySelect id="locality" name="locality" options={withCurrent} defaultValue={p?.locality ?? ""} placeholder="Search locality" inputClassName={inputCls} invalid={!!e.locality} />
        </Field>
        <Field label="City" htmlFor="city"><Input id="city" name="city" defaultValue={p?.city ?? "Jalandhar"} maxLength={60} /></Field>
        <Field label="Pincode" htmlFor="pincode" error={e.pincode}><Input id="pincode" name="pincode" inputMode="numeric" maxLength={6} defaultValue={p?.pincode ?? ""} placeholder="144001" /></Field>
        <Field label="Google Maps link (optional)" htmlFor="maps_url" error={e.maps_url}><Input id="maps_url" name="maps_url" type="url" defaultValue={p?.maps_url ?? ""} placeholder="https://maps.app.goo.gl/…" /></Field>
      </Section>

      <Section title="Specs">
        <Field label="BHK" htmlFor="bhk"><Input id="bhk" name="bhk" type="number" min={0} max={20} defaultValue={p?.bhk ?? ""} /></Field>
        <Field label="Baths" htmlFor="baths"><Input id="baths" name="baths" type="number" min={0} max={20} defaultValue={p?.baths ?? ""} /></Field>
        <Field label="Carpet area" htmlFor="area" error={e.area}><div className="flex gap-2"><Input id="area" name="area" inputMode="decimal" value={area} onChange={(ev) => setArea(ev.target.value)} placeholder="1640" /><Select name="area_unit" value={unit} onChange={(ev) => setUnit(ev.target.value)} className="w-28"><option>sq.ft</option><option>sq.yd</option></Select></div></Field>
        <Field label="Super area (optional)" htmlFor="super_area" hint="Same unit as carpet area."><Input id="super_area" name="super_area" inputMode="decimal" defaultValue={p?.super_area == null ? "" : String(Number(p.super_area))} /></Field>
        <Field label="Floor" htmlFor="floor"><Input id="floor" name="floor" defaultValue={p?.floor ?? ""} placeholder="Ground + 1 or 4th of 8" /></Field>
        <Field label="Facing" htmlFor="facing"><Select id="facing" name="facing" defaultValue={p?.facing ?? ""}><option value="">Not set</option>{["East", "West", "North", "South", "North-east", "North-west", "South-east", "South-west"].map((f) => <option key={f}>{f}</option>)}</Select></Field>
        <Field label="Furnishing" htmlFor="furnishing"><Select id="furnishing" name="furnishing" defaultValue={p?.furnishing ?? ""}><option value="">Not set</option>{["Unfurnished", "Semi-furnished", "Fully furnished", "Bare shell"].map((f) => <option key={f}>{f}</option>)}</Select></Field>
        <Field label="Parking" htmlFor="parking"><Input id="parking" name="parking" defaultValue={p?.parking ?? ""} placeholder="2 covered" /></Field>
        <Field label="Possession" htmlFor="possession"><Input id="possession" name="possession" defaultValue={p?.possession ?? "Immediate"} placeholder="Immediate or March 2027" /></Field>
      </Section>

      <Section title="Pricing">
        <Field label={purpose === "Rent" ? "Monthly rent (₹)" : "Price (₹)"} htmlFor="price" error={e.price} hint={Number(price) > 0 ? `Shown as ${purpose === "Rent" ? `₹${Number(price).toLocaleString("en-IN")}/mo` : Number(price) >= 1e7 ? `₹${(Number(price) / 1e7).toFixed(2).replace(/\.?0+$/, "")} Cr` : `₹${(Number(price) / 1e5).toFixed(1).replace(/\.0$/, "")} L`}` : "Whole rupees, e.g. 8500000 for ₹85 L. Leave blank or 0 to show \"Price on request\"."}>
          <Input id="price" name="price" inputMode="numeric" value={price} onChange={(ev) => setPrice(ev.target.value)} />
        </Field>
        <div className="rounded-brand border border-line bg-bg px-3 py-2 text-sm"><p className="text-xs text-muted">Price per sq.ft (auto)</p><p className="mt-1 tabular">{perSqft ? `₹${perSqft.toLocaleString("en-IN")}/sq.ft` : "Enter price and area"}</p></div>
      </Section>

      <Section title="Description">
        <Field label="Short description" htmlFor="description" hint="Two lines shown on the property card." className="md:col-span-2"><Textarea id="description" name="description" rows={2} maxLength={220} defaultValue={p?.description ?? ""} /></Field>
        <Field label="Full description" htmlFor="long_description" hint="Blank line between paragraphs." className="md:col-span-2"><Textarea id="long_description" name="long_description" rows={7} defaultValue={p?.long_description ?? ""} /></Field>
      </Section>

      <Section title="Amenities">
        <div className="grid grid-cols-2 gap-2 md:col-span-2 md:grid-cols-4">
          {[...AMENITY_OPTIONS, ...(p?.amenities ?? []).filter((x) => !AMENITY_OPTIONS.includes(x))].map((a) => <label key={a} className="flex items-center gap-2 text-sm"><input type="checkbox" name="amenities" value={a} defaultChecked={p?.amenities?.includes(a)} className="accent-[#00BF63]" />{a}</label>)}
        </div>
      </Section>

      <Section title="Images" description="First image or the one marked Cover is used on cards. 4:3 crops look best.">
        <div className="md:col-span-2"><ImageUploader name="images" initial={images} initialCover={cover} /></div>
      </Section>

      <Section title="Plans" description="Shown in their own sections on the property page.">
        <ImageField name="master_plan" label="Master plan" initial={p?.master_plan} />
        <ImageField name="floor_plan" label="Floor plans" initial={p?.floor_plan} />
        {e.master_plan && <p className="text-sm text-red-700 md:col-span-2">{e.master_plan}</p>}
      </Section>

      <Section title="Trust">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="trust_verified" defaultChecked={trust.includes("verified")} className="accent-[#00BF63]" />Verified title</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="trust_visit" defaultChecked={trust.includes("visit")} className="accent-[#00BF63]" />Site visit available</label>
        <Field label="RERA number" htmlFor="rera" hint="Adds the RERA registered badge when filled." className="md:col-span-2"><Input id="rera" name="rera" defaultValue={p?.rera ?? ""} placeholder="e.g. PBRERA-JAL33-PR0000" /></Field>
      </Section>

      <Section title="Nearby places" description="Shown with distances on the property page.">
        <div className="md:col-span-2"><RowsEditor columns={[{ name: "nearby_name", label: "Place", placeholder: "Model Town market" }, { name: "nearby_distance", label: "Distance", placeholder: "600 m", width: "160px" }]} initial={(p?.nearby ?? []).map((x) => ({ nearby_name: x.name, nearby_distance: x.distance }))} addLabel="Add place" /></div>
      </Section>

      <Section title="SEO">
        <Field label="Slug" htmlFor="slug" hint="Leave blank to generate from the title. Changing it changes the public URL."><Input id="slug" name="slug" defaultValue={p?.slug ?? ""} /></Field>
        <Field label="Meta title" htmlFor="meta_title"><Input id="meta_title" name="meta_title" maxLength={70} defaultValue={p?.meta_title ?? ""} /></Field>
        <Field label="Meta description" htmlFor="meta_description" className="md:col-span-2"><Textarea id="meta_description" name="meta_description" rows={2} maxLength={160} defaultValue={p?.meta_description ?? ""} /></Field>
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap gap-2">
          <SubmitButton name="intent" value="draft" variant="secondary">Save as draft</SubmitButton>
          <SubmitButton name="intent" value="publish">Publish</SubmitButton>
          {p && p.published && <span className="self-center text-xs text-muted">Currently published. Save as draft to unpublish.</span>}
          <Link href="/admin/properties" className="self-center text-sm text-muted hover:text-ink">Cancel</Link>
        </div>
        {p && (
          <div className="flex items-center gap-2">
            {onDuplicate && <button type="submit" formAction={onDuplicate} formNoValidate className="rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink">Duplicate</button>}
            {onDelete && <ConfirmButton label="Delete" confirmLabel="Delete property" action={onDelete} />}
          </div>
        )}
      </div>
    </form>
  );
}
