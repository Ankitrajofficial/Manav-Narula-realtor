"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/console/Form";
import type { ResetState } from "./actions";

export default function ResetPassword({ action, canEmail, email }: { action: (email: boolean) => Promise<ResetState>; canEmail: boolean; email: string }) {
  const [state, act] = useActionState<ResetState, FormData>(async (_p, fd) => action(!!fd.get("email_it")), {});
  return (
    <form action={act} className="rounded-brand border border-line bg-white p-5">
      <p className="text-base">Reset password</p>
      <p className="mt-1 text-sm text-muted">Generates a new temporary password. The old one stops working immediately.</p>
      {state.tempPassword ? (
        <div className="mt-3 rounded-brand border border-accent px-3 py-2 text-sm">
          <p>New temporary password: <span className="font-mono text-base tabular">{state.tempPassword}</span></p>
          {state.emailed && <p className="mt-1 text-accent-ink">Emailed to {email}.</p>}
          {state.emailError && <p className="mt-1 text-red-700">Email not sent: {state.emailError}</p>}
          <p className="mt-1 text-xs text-muted">Shown once.{state.emailed ? "" : " Share it with the employee now."}</p>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SubmitButton variant="secondary">Generate new password</SubmitButton>
          {canEmail && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="email_it" defaultChecked className="accent-[#00BF63]" />Email it to {email}</label>}
        </div>
      )}
      {state.message && <p className="mt-2 text-xs text-red-700">{state.message}</p>}
    </form>
  );
}
