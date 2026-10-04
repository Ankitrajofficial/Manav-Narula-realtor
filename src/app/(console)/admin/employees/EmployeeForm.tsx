"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Field, FormError, Input, Section, Select, SubmitButton } from "@/components/console/Form";
import type { EmployeeRow } from "@/lib/queries/employees";
import type { EmployeeFormState } from "./actions";

export default function EmployeeForm({ employee: u, isSelf, action }: { employee?: EmployeeRow | null; isSelf?: boolean; action: (p: EmployeeFormState, fd: FormData) => Promise<EmployeeFormState> }) {
  const [state, act] = useActionState<EmployeeFormState, FormData>(action, {});
  const e = state.errors ?? {};
  if (state.created) {
    return (
      <div className="max-w-lg rounded-brand border border-accent bg-white p-5">
        <p className="text-base">Account created for {state.created.name}</p>
        {state.created.emailed ? (
          <p className="mt-1 text-sm text-accent-ink">Sign-in details emailed to {state.created.email}. They are also shown below, once.</p>
        ) : (
          <p className="mt-1 text-sm text-muted">{state.created.emailError ? <span className="text-red-700">Email not sent: {state.created.emailError}. </span> : null}Share these details with them now. The temporary password is shown only once.</p>
        )}
        <dl className="mt-4 grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <dt className="text-muted">Email</dt><dd>{state.created.email}</dd>
          <dt className="text-muted">Password</dt><dd className="font-mono text-base tabular">{state.created.tempPassword}</dd>
          <dt className="text-muted">Sign in at</dt><dd className="break-all">{state.created.signIn}</dd>
        </dl>
        <div className="mt-5 flex gap-2">
          <Link href={`/admin/employees/${state.created.id}`} className="rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">Open profile</Link>
          <Link href="/admin/employees" className="rounded-brand border border-line px-4 py-2 text-sm hover:border-ink">Back to employees</Link>
        </div>
      </div>
    );
  }
  return (
    <form action={act} className="max-w-3xl space-y-5">
      <FormError message={state.message} />
      <Section title={u ? "Details" : "New employee"}>
        <Field label="Name" htmlFor="name" error={e.name}><Input id="name" name="name" defaultValue={u?.name} required /></Field>
        <Field label="Email" htmlFor="email" error={e.email}><Input id="email" name="email" type="email" defaultValue={u?.email} required /></Field>
        <Field label="Phone" htmlFor="phone" error={e.phone}><Input id="phone" name="phone" inputMode="tel" defaultValue={u?.phone ?? ""} placeholder="10-digit mobile" /></Field>
        <Field label="Role" htmlFor="role" error={e.role} hint={isSelf ? "You cannot change your own role." : undefined}><Select id="role" name="role" defaultValue={u?.role ?? "employee"} disabled={isSelf}><option value="employee">Employee</option><option value="admin">Admin</option></Select>{isSelf && <input type="hidden" name="role" value="admin" />}</Field>
        {!u && (
          <>
            <Field label="Temporary password" htmlFor="password" error={e.password} hint="Leave blank to generate one. It is shown once after saving."><Input id="password" name="password" minLength={8} autoComplete="new-password" /></Field>
            <div className="flex items-end pb-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="send_invite" defaultChecked className="accent-[#00BF63]" />Email the sign-in details to them</label></div>
          </>
        )}
      </Section>
      <div className="flex gap-2"><SubmitButton>{u ? "Save changes" : "Create employee"}</SubmitButton><Link href="/admin/employees" className="self-center text-sm text-muted hover:text-ink">Cancel</Link></div>
    </form>
  );
}
