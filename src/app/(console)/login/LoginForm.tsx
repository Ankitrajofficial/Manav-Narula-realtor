"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Field, FormError, Input, SubmitButton } from "@/components/console/Form";
import { loginAction, type LoginState } from "./actions";

export default function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-5 space-y-4">
      <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@manavnarularealtor.com" /></Field>
      <Field label="PIN" htmlFor="pin" hint="6 digits. Signing in for the first time since PINs? Use your old password once, then set a PIN."><Input id="pin" name="pin" type="password" inputMode="numeric" autoComplete="current-password" required /></Field>
      <FormError message={state.error} />
      <SubmitButton className="w-full">Sign in</SubmitButton>
      <p className="text-center text-sm"><Link href="/forgot-password" className="text-muted hover:text-ink">Forgot PIN</Link></p>
    </form>
  );
}
