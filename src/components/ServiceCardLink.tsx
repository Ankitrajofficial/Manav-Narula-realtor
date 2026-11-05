"use client";
import Link from "next/link";
import type { PointerEvent, ReactNode } from "react";

/** Tells the .service-card CSS where the pointer crossed the edge, so the green fill grows from and shrinks back to that spot. */
function markPointer(e: PointerEvent<HTMLAnchorElement>) {
  const box = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--fill-x", `${e.clientX - box.left}px`);
  e.currentTarget.style.setProperty("--fill-y", `${e.clientY - box.top}px`);
}

export default function ServiceCardLink({ href, className = "", children }: { href: string; className?: string; children: ReactNode }) {
  return <Link href={href} onPointerEnter={markPointer} onPointerLeave={markPointer} className={`service-card ${className}`}>{children}</Link>;
}
