"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import type { Flash } from "@/lib/flash";

/** Shows ?toast=Message (success) or ?error=Message, then clears it from the URL; also a one-off `flash` left by an action. */
export default function Toast({ flash }: { flash?: Flash | null }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = sp.get("toast");
  const error = sp.get("error");
  const [msg, setMsg] = useState<{ text: string; kind: "ok" | "error" } | null>(null);
  useEffect(() => {
    if (!toast && !error) return;
    const show = setTimeout(() => setMsg({ text: toast ?? error ?? "", kind: toast ? "ok" : "error" }), 0);
    const next = new URLSearchParams(sp.toString());
    next.delete("toast"); next.delete("error");
    router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false });
    const hide = setTimeout(() => setMsg(null), 3500);
    return () => { clearTimeout(show); clearTimeout(hide); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, error]);
  // A flash arrives with the refresh after a switch or reorder action. Show it once, then drop the cookie.
  useEffect(() => {
    if (!flash) return;
    document.cookie = "mn_flash=; Max-Age=0; path=/";
    const show = setTimeout(() => setMsg({ text: flash.text, kind: flash.kind }), 0);
    const hide = setTimeout(() => setMsg(null), 3500);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [flash?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!msg) return null;
  return (
    <div role="status" className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-brand border bg-white px-4 py-3 text-sm ${msg.kind === "ok" ? "border-accent text-ink" : "border-red-600 text-red-700"}`}>
      <Icon name={msg.kind === "ok" ? "check" : "info"} size={16} className={msg.kind === "ok" ? "text-accent" : "text-red-600"} />
      {msg.text}
    </div>
  );
}
