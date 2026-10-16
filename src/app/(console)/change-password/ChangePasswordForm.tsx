"use client";
import { useActionState } from "react";
import { Field, FormError, Input, SubmitButton } from "@/components/console/Form";
import { changePasswordAction, type ChangePasswordState } from "./actions";

/** `firstPin`: the account still has an old password, which is what "current" asks for. */
export default function ChangePasswordForm({ firstPin = false }: { firstPin?: boolean }) {
  const [state, action] = useActionState<ChangePasswordState, FormData>(changePasswordAction, {});
  const e = state.errors ?? {};
  const pin = { type: "password", inputMode: "numeric" as const, maxLength: 6, pattern: "\\d{6}", autoComplete: "new-password", required: true };
  return (
    <form action={action} className="mt-5 space-y-4">
      <FormError message={state.message} />
      <Field label={firstPin ? "Current password" : "Current PIN"} htmlFor="current" error={e.current}><Input id="current" name="current" type="password" autoComplete="current-password" required /></Field>
      <Field label="New PIN" htmlFor="password" error={e.password} hint="Exactly 6 digits. Avoid 123456, 111111 and your birthday."><Input id="password" name="password" {...pin} /></Field>
      <Field label="Confirm new PIN" htmlFor="confirm" error={e.confirm}><Input id="confirm" name="confirm" {...pin} /></Field>
      <SubmitButton className="w-full">Save PIN</SubmitButton>
    </form>
  );
}
