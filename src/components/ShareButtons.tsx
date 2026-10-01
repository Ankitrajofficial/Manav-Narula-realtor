"use client";
import { useState } from "react";
import Icon from "./Icon";

export default function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  return (
    <div className="flex items-center gap-3 text-sm">
      <a href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
        <Icon name="whatsapp" size={16} />Share
      </a>
      <button type="button" className="inline-flex items-center gap-1.5 text-muted hover:text-ink" onClick={async () => { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
        <Icon name="link" size={16} />{copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
