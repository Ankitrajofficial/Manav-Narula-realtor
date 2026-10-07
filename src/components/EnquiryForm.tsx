"use client";
import { useState } from "react";
import { localities } from "@/data/site";
import Icon from "./Icon";
import { Button, Field, inputCls } from "./ui";

type Variant = "short" | "visit" | "full" | "project";

export default function EnquiryForm({
  variant = "short",
  subject,
  defaultInterest,
  submitLabel,
  propertyId,
  projectId,
}: {
  variant?: Variant;
  subject?: string;
  defaultInterest?: string;
  submitLabel?: string;
  propertyId?: number;
  projectId?: number;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const id = (s: string) => `${variant}-${s}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    if (!/^[6-9]\d{9}$/.test(String(data.phone).replace(/\D/g, "").slice(-10))) {
      setError("Enter a 10-digit Indian mobile number.");
      return;
    }
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, subject, variant, propertyId, projectId, ...(variant === "project" && projectId ? { source: "project_page" } : {}), page: window.location.pathname }),
      });
      if (!res.ok) throw new Error("failed");
      setState("done");
      form.reset();
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-brand border border-line bg-white p-6" role="status">
        <Icon name="check" size={28} className="text-accent" />
        <p className="mt-3 font-heading text-xl">Thank you. We have your enquiry.</p>
        <p className="mt-2 text-sm text-muted">An advisor will call you within working hours, usually within 2 hours. For anything urgent, WhatsApp or call us.</p>
        <button type="button" onClick={() => setState("idle")} className="mt-4 text-sm text-accent-ink hover:underline">Send another enquiry</button>
      </div>
    );
  }

  const label = submitLabel ?? (variant === "visit" ? "Schedule a visit" : "Send enquiry");
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {subject && <p className="text-sm text-muted">Regarding: <span className="text-ink">{subject}</span></p>}
      <div className={variant === "short" || variant === "full" ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        <Field label="Name" htmlFor={id("name")}>
          <input id={id("name")} name="name" required className={inputCls} placeholder="Your name" autoComplete="name" />
        </Field>
        <Field label="Phone" htmlFor={id("phone")}>
          <input id={id("phone")} name="phone" required inputMode="tel" className={inputCls} placeholder="10-digit mobile number" autoComplete="tel" />
        </Field>
      </div>
      {variant === "full" && (
        <Field label="Email (optional)" htmlFor={id("email")}>
          <input id={id("email")} name="email" type="email" className={inputCls} placeholder="you@example.com" autoComplete="email" />
        </Field>
      )}
      {variant !== "visit" && variant !== "project" && (
        <fieldset>
          <legend className="mb-1.5 block text-sm text-ink">I want to</legend>
          <div className="grid grid-cols-3 overflow-hidden rounded-brand border border-line bg-white text-sm">
            {["Buy", "Sell", "Rent"].map((opt) => (
              <label key={opt} className="relative">
                <input type="radio" name="interest" value={opt} defaultChecked={(defaultInterest ?? "Buy") === opt} className="peer sr-only" />
                <span className="block cursor-pointer py-2.5 text-center text-ink peer-checked:bg-accent peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-accent hover:bg-bg peer-checked:hover:bg-accent">{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {variant === "full" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Budget" htmlFor={id("budget")}>
            <select id={id("budget")} name="budget" className={inputCls} defaultValue="">
              <option value="">Any</option>
              <option>Under ₹50 L</option>
              <option>₹50 L to ₹1 Cr</option>
              <option>₹1 Cr to ₹2 Cr</option>
              <option>Above ₹2 Cr</option>
              <option>Rent under ₹25,000/mo</option>
              <option>Rent above ₹25,000/mo</option>
            </select>
          </Field>
          <Field label="Locality" htmlFor={id("locality")}>
            <select id={id("locality")} name="locality" className={inputCls} defaultValue="">
              <option value="">Any</option>
              {localities.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
        </div>
      )}
      {variant === "visit" && (
        <Field label="Preferred visit date" htmlFor={id("date")}>
          <input id={id("date")} name="visitDate" type="date" className={inputCls} min={new Date().toISOString().slice(0, 10)} />
        </Field>
      )}
      <Field label="Message" htmlFor={id("message")}>
        <textarea id={id("message")} name="message" rows={3} className={inputCls} placeholder={variant === "visit" ? "Anything we should know before the visit" : "Tell us what you are looking for"} />
      </Field>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      {state === "error" && <p className="text-sm text-red-700" role="alert">Could not send. Please call or WhatsApp us instead.</p>}
      <Button type="submit" className="w-full" disabled={state === "sending"}>{state === "sending" ? "Sending…" : label}</Button>
      <p className="text-xs text-muted">No spam. We call only about your enquiry.</p>
    </form>
  );
}
