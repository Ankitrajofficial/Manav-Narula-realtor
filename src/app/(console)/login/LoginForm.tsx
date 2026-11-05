"use client";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { TRAIL_KEY } from "@/components/BackButton";
import { Field, FormError, Input, SubmitButton } from "@/components/console/Form";
import { loginAction, type LoginState } from "./actions";

export default function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, {});
  // A new sign-in starts a new trail, so the back arrow never returns to the last person's pages.
  useEffect(() => { try { sessionStorage.removeItem(TRAIL_KEY); } catch {} }, []);
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
