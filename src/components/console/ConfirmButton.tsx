"use client";
import { useState } from "react";

/** Two-step destructive action rendered inline: click once to reveal Confirm / Cancel. Wrap in a <form action> or pass `action`. */
export default function ConfirmButton({ label, confirmLabel = "Confirm", action, className = "", children }: { label: string; confirmLabel?: string; action?: (formData: FormData) => void | Promise<void>; className?: string; children?: React.ReactNode }) {
  const [arm, setArm] = useState(false);
  if (!arm) return <button type="button" onClick={() => setArm(true)} className={className || "rounded-brand border border-line px-3 py-1.5 text-sm text-red-700 hover:border-red-700"}>{label}</button>;
  return (
    <span className="inline-flex items-center gap-2">
      {children}
      <button type="submit" formAction={action} className="rounded-brand bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800">{confirmLabel}</button>
      <button type="button" onClick={() => setArm(false)} className="rounded-brand border border-line px-3 py-1.5 text-sm">Cancel</button>
    </span>
  );
}
