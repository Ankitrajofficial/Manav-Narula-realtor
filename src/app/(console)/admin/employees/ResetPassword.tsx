"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/console/Form";
import type { ResetState } from "./actions";

export default function ResetPassword({ action }: { action: () => Promise<ResetState> }) {
  const [state, act] = useActionState<ResetState, FormData>(async () => action(), {});
  return (
    <form action={act} className="rounded-brand border border-line bg-white p-5">
      <p className="text-base">Reset password</p>
      <p className="mt-1 text-sm text-muted">Generates a new temporary password. The old one stops working immediately.</p>
      {state.tempPassword ? (
        <p className="mt-3 rounded-brand border border-accent px-3 py-2 text-sm">New temporary password: <span className="font-mono text-base tabular">{state.tempPassword}</span><br /><span className="text-xs text-muted">Shown once. Share it with the employee now.</span></p>
      ) : (
        <div className="mt-3"><SubmitButton variant="secondary">Generate new password</SubmitButton></div>
      )}
      {state.message && <p className="mt-2 text-xs text-red-700">{state.message}</p>}
    </form>
  );
}
