"use client";
import { useActionState } from "react";
import { Field, FormError, Input, Select, SubmitButton, Textarea } from "./Form";
import RecordPicker, { type PickerItem } from "./RecordPicker";
import { PRIORITIES, TASK_STATUSES } from "@/lib/console";
import type { TaskFormState } from "@/app/(console)/admin/tasks/actions";

export interface TaskFormValues { title?: string; description?: string | null; lead_ids?: number[]; prospect_ids?: number[]; assigned_to?: number | null; due_date?: string | null; priority?: string; status?: string }
type Opt = { id: number; name: string };

export default function TaskForm({ action, values = {}, employees, leads, prospects, submitLabel = "Save task" }: { action: (prev: TaskFormState, fd: FormData) => Promise<TaskFormState>; values?: TaskFormValues; employees: Opt[]; leads: PickerItem[]; prospects: PickerItem[]; submitLabel?: string }) {
  const [state, formAction] = useActionState<TaskFormState, FormData>(action, {});
  const e = state.errors ?? {};
  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-brand border border-line bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" htmlFor="title" error={e.title} className="md:col-span-2"><Input id="title" name="title" defaultValue={values.title ?? ""} required error={e.title} placeholder="What needs to be done, e.g. Call this week's Urban Estate enquiries" /></Field>
          <Field label="Description" htmlFor="description" className="md:col-span-2"><Textarea id="description" name="description" rows={3} defaultValue={values.description ?? ""} placeholder="Optional details, context or what to say on the call" /></Field>
          <Field label="Assign to" htmlFor="assigned_to" error={e.assigned_to}>
            <Select id="assigned_to" name="assigned_to" defaultValue={values.assigned_to ?? ""} error={e.assigned_to} required>
              <option value="">Choose an employee</option>
              {employees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label="Due date" htmlFor="due_date" error={e.due_date}><Input id="due_date" name="due_date" type="date" defaultValue={values.due_date ?? ""} error={e.due_date} /></Field>
          <Field label="Priority" htmlFor="priority" error={e.priority}>
            <Select id="priority" name="priority" defaultValue={values.priority ?? "Medium"}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</Select>
          </Field>
          <Field label="Status" htmlFor="status" error={e.status}>
            <Select id="status" name="status" defaultValue={values.status ?? "Open"}>{TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
          </Field>
        </div>
      </div>
      <div className="rounded-brand border border-line bg-white p-5">
        <h2 className="text-base">Call sheet</h2>
        <p className="mt-1 mb-4 text-xs text-muted">Tick the leads and prospects this task is about. The employee sees them as a list with Call and WhatsApp buttons. Optional.</p>
        <RecordPicker leads={leads} prospects={prospects} initialLeads={values.lead_ids ?? []} initialProspects={values.prospect_ids ?? []} />
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input type="checkbox" name="assign_records" value="1" defaultChecked className="mt-0.5 accent-[#00BF63]" />
          <span>Also assign everyone on this sheet to the chosen employee<span className="block text-xs text-muted">Their lead and prospect records move to this employee and an assignment is logged on each one.</span></span>
        </label>
        {e.records && <p className="mt-2 text-xs text-red-700" role="alert">{e.records}</p>}
      </div>
      <FormError message={state.error} />
      <div className="flex gap-2"><SubmitButton>{submitLabel}</SubmitButton></div>
    </form>
  );
}
