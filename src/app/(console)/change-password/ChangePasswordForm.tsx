"use client";
import { useActionState } from "react";
import { Field, FormError, Input, SubmitButton } from "@/components/console/Form";
import { changePasswordAction, type ChangePasswordState } from "./actions";

export default function ChangePasswordForm() {
  const [state, action] = useActionState<ChangePasswordState, FormData>(changePasswordAction, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="mt-5 space-y-4">
      <FormError message={state.message} />
      <Field label="Current password" htmlFor="current" error={e.current}><Input id="current" name="current" type="password" autoComplete="current-password" required /></Field>
      <Field label="New password" htmlFor="password" error={e.password} hint="At least 10 characters, with letters and a number."><Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required /></Field>
      <Field label="Confirm new password" htmlFor="confirm" error={e.confirm}><Input id="confirm" name="confirm" type="password" autoComplete="new-password" required /></Field>
      <SubmitButton className="w-full">Save new password</SubmitButton>
    </form>
  );
}
