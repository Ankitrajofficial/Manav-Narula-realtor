"use client";
import { useState } from "react";
import Icon from "@/components/Icon";

/** Copies a text (an ad link URL) to the clipboard and says so for two seconds. */
export default function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* clipboard blocked: the URL is shown to copy by hand */ } }}
      className={`inline-flex items-center gap-1.5 rounded-brand border px-3 py-1.5 text-sm ${done ? "border-accent text-accent-ink" : "border-line bg-white hover:border-ink"}`}>
      <Icon name={done ? "check" : "copy"} size={14} />{done ? "Copied" : label}
    </button>
  );
}
