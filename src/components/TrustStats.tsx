"use client";
import { useEffect, useRef, useState } from "react";
import { trustLayout, type TrustStat } from "@/lib/trust-stats";

const DURATION = 1200;
const STAGGER = 80;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const decimals = (v: string) => (v.includes(".") ? v.split(".")[1].length : 0);

function ShieldCheck() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="var(--accent)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="relative top-[2px] shrink-0 md:top-[3px]">
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Zm-3 9 2 2 4-4" />
    </svg>
  );
}

/**
 * Trust numbers row. The server renders the final values; in the browser they count up from 0 once,
 * when the row scrolls into view (skipped with prefers-reduced-motion).
 */
export default function TrustStats({ stats }: { stats: TrustStat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<string[]>(() => stats.map((s) => s.value));
  const layout = trustLayout(stats.length);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const targets = stats.map((s) => Number(s.value));
    if (targets.some((n) => !Number.isFinite(n))) return;
    let raf = 0;
    const zero = setTimeout(() => setShown(stats.map((s) => (0).toFixed(decimals(s.value)))), 0);
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        let running = false;
        setShown(stats.map((s, i) => {
          const t = Math.min(1, Math.max(0, (now - start - i * STAGGER) / DURATION));
          if (t < 1) running = true;
          return t >= 1 ? s.value : (targets[i] * easeOut(t)).toFixed(decimals(s.value));
        }));
        if (running) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.25 });
    io.observe(el);
    return () => { clearTimeout(zero); io.disconnect(); cancelAnimationFrame(raf); };
  }, [stats]);

  return (
    // Six numbers in one desktop row leaves ~150px per cell, so the figures step down from 48px to fit.
    <div ref={ref} className="trust-grid mt-8 md:mt-10" style={{ "--count": stats.length, "--number-lg": stats.length >= 6 ? "38px" : stats.length === 5 ? "42px" : "48px" } as React.CSSProperties}>
      {stats.map((s, i) => {
        const l = layout[i];
        const style = {
          "--span-m": l.mobile.span, "--left-m": l.mobile.left ? 1 : 0, "--top-m": l.mobile.top ? 1 : 0,
          "--span-d": l.desktop.span, "--left-d": l.desktop.left ? 1 : 0, "--top-d": l.desktop.top ? 1 : 0, "--left-lg": i > 0 ? 1 : 0,
        } as React.CSSProperties;
        const body = (
          <>
            <span className="sr-only">{`${s.value}${s.suffix === "★" ? " stars" : s.suffix}, ${s.label}`}</span>
            <span aria-hidden="true" className="flex items-center gap-2.5">
              <ShieldCheck />
              <span className="trust-number">{shown[i]}{s.suffix && <span className="text-accent">{s.suffix}</span>}</span>
            </span>
            <span aria-hidden="true" className="trust-label block">{s.label}</span>
          </>
        );
        return s.link ? (
          <a key={`${s.label}-${i}`} href={s.link} target={/^https?:/.test(s.link) ? "_blank" : undefined} rel={/^https?:/.test(s.link) ? "noopener" : undefined} className="trust-cell block" style={style}>{body}</a>
        ) : (
          <div key={`${s.label}-${i}`} className="trust-cell" style={style}>{body}</div>
        );
      })}
    </div>
  );
}
