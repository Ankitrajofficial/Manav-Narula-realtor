"use client";

export default function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">Print or save as PDF</button>;
}
