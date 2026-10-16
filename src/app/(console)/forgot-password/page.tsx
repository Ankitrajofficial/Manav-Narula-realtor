"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Field, FormError, Input, SubmitButton } from "@/components/console/Form";
import { requestCodeAction, resetPinAction, type ForgotState } from "./actions";

export default function ForgotPage() {
  const [sent, request] = useActionState<ForgotState, FormData>(requestCodeAction, {});
  const [reset, finish] = useActionState<ForgotState, FormData>(resetPinAction, {});
  const step = reset.step ?? sent.step;
  const email = reset.email ?? sent.email ?? "";
  const e = reset.errors ?? {};
  const pin = { type: "password", inputMode: "numeric" as const, maxLength: 6, pattern: "\\d{6}", autoComplete: "new-password", required: true };
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-brand border border-line bg-white p-6">
        <h1 className="font-heading text-2xl">Forgot PIN</h1>
        {step === "code" ? (
          <form action={finish} className="mt-4 space-y-4">
            <p className="text-sm text-muted">If <span className="text-ink">{email}</span> has a staff account, a 6-digit code is on its way. Check spam too. It expires in 15 minutes.</p>
            <input type="hidden" name="email" value={email} />
            <Field label="Code from the email" htmlFor="code" error={e.code}><Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus /></Field>
            <Field label="New PIN" htmlFor="pin" error={e.pin} hint="Exactly 6 digits."><Input id="pin" name="pin" {...pin} /></Field>
            <Field label="Confirm new PIN" htmlFor="confirm" error={e.confirm}><Input id="confirm" name="confirm" {...pin} /></Field>
            <SubmitButton className="w-full">Reset PIN</SubmitButton>
          </form>
        ) : (
          <form action={request} className="mt-4 space-y-4">
            <p className="text-sm text-muted">Enter the email you sign in with. We will email you a code to set a new PIN.</p>
            <FormError message={sent.error} />
            <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" required /></Field>
            <SubmitButton className="w-full">Email me a code</SubmitButton>
          </form>
        )}
        <p className="mt-4 text-center text-sm"><Link href="/login" className="text-muted hover:text-ink">Back to sign in</Link></p>
      </div>
    </div>
  );
}
