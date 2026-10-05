"use client";
import { useActionState } from "react";
import { Field, FormError, Input, Select, SubmitButton, Textarea } from "./Form";
import DocumentPicker from "./DocumentPicker";
import type { SaleFormState } from "@/lib/queries/sales";

export interface SaleFormValues { sale_date?: string; lead_id?: number | null; prospect_id?: number | null; property_id?: number | null; property_title?: string | null; client_name?: string | null; deal_value?: number | string; commission?: number | string; employee_id?: number | null; notes?: string | null; document_url?: string | null }
type Opt = { id: number; name: string; phone?: string | null };

export default function SaleForm({ action, values = {}, leads, prospects, properties, employees, submitLabel = "Save sale" }: { action: (prev: SaleFormState, fd: FormData) => Promise<SaleFormState>; values?: SaleFormValues; leads: Opt[]; prospects: Opt[]; properties: { id: number; title: string; locality: string | null }[]; employees?: Opt[]; submitLabel?: string }) {
  const [state, formAction] = useActionState<SaleFormState, FormData>(action, {});
  const e = state.errors ?? {};
  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-brand border border-line bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Sale date" htmlFor="sale_date" error={e.sale_date}><Input id="sale_date" name="sale_date" type="date" defaultValue={values.sale_date ?? new Date().toISOString().slice(0, 10)} required error={e.sale_date} /></Field>
          {employees && (
            <Field label="Closed by" htmlFor="employee_id" error={e.employee_id}>
              <Select id="employee_id" name="employee_id" defaultValue={values.employee_id ?? ""} error={e.employee_id} required>
                <option value="">Choose an employee</option>
                {employees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Lead" htmlFor="lead_id" error={e.lead_id} hint="Pick the lead this sale came from">
            <Select id="lead_id" name="lead_id" defaultValue={values.lead_id ?? ""}>
              <option value="">None</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.name}{l.phone ? ` · ${l.phone}` : ""}</option>)}
            </Select>
          </Field>
          <Field label="Prospect" htmlFor="prospect_id" hint="Or the prospect, if not a website lead">
            <Select id="prospect_id" name="prospect_id" defaultValue={values.prospect_id ?? ""}>
              <option value="">None</option>
              {prospects.map((l) => <option key={l.id} value={l.id}>{l.name}{l.phone ? ` · ${l.phone}` : ""}</option>)}
            </Select>
          </Field>
          <Field label="Client name" htmlFor="client_name" error={e.client_name} hint="Filled from the lead or prospect when left blank" className="md:col-span-2"><Input id="client_name" name="client_name" defaultValue={values.client_name ?? ""} error={e.client_name} /></Field>
          <Field label="Listed property" htmlFor="property_id">
            <Select id="property_id" name="property_id" defaultValue={values.property_id ?? ""}>
              <option value="">Not a listed property</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.title}{p.locality ? ` · ${p.locality}` : ""}</option>)}
            </Select>
          </Field>
          <Field label="Property (free text)" htmlFor="property_title" error={e.property_title} hint="Used when the property is not listed"><Input id="property_title" name="property_title" defaultValue={values.property_title ?? ""} error={e.property_title} placeholder="e.g. 200 sq.yd plot, Model Town" /></Field>
          <Field label="Deal value (₹)" htmlFor="deal_value" error={e.deal_value}><Input id="deal_value" name="deal_value" inputMode="numeric" defaultValue={values.deal_value ?? ""} required error={e.deal_value} placeholder="e.g. 8500000" /></Field>
          <Field label="Commission (₹)" htmlFor="commission" error={e.commission}><Input id="commission" name="commission" inputMode="numeric" defaultValue={values.commission ?? ""} error={e.commission} placeholder="e.g. 85000" /></Field>
          <Field label="Notes" htmlFor="notes" className="md:col-span-2"><Textarea id="notes" name="notes" rows={3} defaultValue={values.notes ?? ""} /></Field>
          <div className="md:col-span-2">
            <p className="mb-1 block text-xs font-medium text-ink">{values.document_url ? "Add more documents" : "Documents"}</p>
            <DocumentPicker error={e.documents} />
            <p className="mt-1 text-xs text-muted">Agreement, receipts, ID proofs, site photos. Optional, up to 16 MB per save.{values.document_url ? " Files already on this sale stay; remove them from the sale page." : ""}</p>
          </div>
        </div>
      </div>
      <FormError message={state.error} />
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
