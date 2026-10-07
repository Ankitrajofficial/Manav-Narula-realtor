"use client";
import { useState } from "react";
import Icon from "./Icon";
import { Button, Field, inputCls } from "./ui";

/** The short enquiry form on an ad link page (/l/<slug>). The lead is tagged with the link on the server. */
export default function LinkEnquiryForm({ linkId, subject }: { linkId: number; subject: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    if (String(data.name).trim().length < 2) { setError("Enter your name."); return; }
    if (!/^[6-9]\d{9}$/.test(String(data.phone).replace(/\D/g, "").slice(-10))) { setError("Enter a 10-digit Indian mobile number."); return; }
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, linkId, subject, page: window.location.pathname }),
      });
      if (!res.ok) throw new Error("failed");
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-brand border border-line bg-white p-6 text-center" role="status">
        <Icon name="check" size={32} className="mx-auto text-accent" />
        <p className="mt-3 font-heading text-xl">Thank you. We have your details.</p>
        <p className="mt-2 text-sm text-muted">An advisor will call you within working hours, usually within 2 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Name" htmlFor="l-name"><input id="l-name" name="name" required className={inputCls} placeholder="Your name" autoComplete="name" /></Field>
      <Field label="Phone" htmlFor="l-phone"><input id="l-phone" name="phone" required inputMode="tel" className={inputCls} placeholder="10-digit mobile number" autoComplete="tel" /></Field>
      <Field label="Budget (optional)" htmlFor="l-budget">
        <select id="l-budget" name="budget" className={inputCls} defaultValue="">
          <option value="">Not sure yet</option>
          <option>Under ₹50 L</option>
          <option>₹50 L to ₹1 Cr</option>
          <option>₹1 Cr to ₹2 Cr</option>
          <option>Above ₹2 Cr</option>
        </select>
      </Field>
      <Field label="Message (optional)" htmlFor="l-message"><textarea id="l-message" name="message" rows={2} className={inputCls} placeholder="What are you looking for?" /></Field>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      {state === "error" && <p className="text-sm text-red-700" role="alert">Could not send. Please call or WhatsApp us instead.</p>}
      <Button type="submit" className="w-full" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Get a call back"}</Button>
      <p className="text-center text-xs text-muted">No spam. We call only about your enquiry.</p>
    </form>
  );
}
