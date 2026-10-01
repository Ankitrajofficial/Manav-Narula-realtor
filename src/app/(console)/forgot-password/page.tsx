"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Field, Input, SubmitButton } from "@/components/console/Form";
import { forgotAction } from "../login/actions";

export default function ForgotPage() {
  const [state, action] = useActionState<{ done?: boolean }, FormData>(forgotAction, {});
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-brand border border-line bg-white p-6">
        <h1 className="font-heading text-2xl">Forgot password</h1>
        {state.done ? (
          <p className="mt-3 text-sm text-muted">Request recorded. The admin will reset your password from the Employees page and share the new one with you.</p>
        ) : (
          <form action={action} className="mt-4 space-y-4">
            <p className="text-sm text-muted">Passwords are reset by the admin. Enter your email and we will log the request for them.</p>
            <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" required /></Field>
            <SubmitButton className="w-full">Request reset</SubmitButton>
          </form>
        )}
        <p className="mt-4 text-center text-sm"><Link href="/login" className="text-muted hover:text-ink">Back to sign in</Link></p>
      </div>
    </div>
  );
}
