"use client";
import { useState } from "react";
import Icon from "./Icon";
import { Button, Field, inputCls } from "./ui";

const AMOUNTS = ["Under ₹25 L", "₹25 L to ₹50 L", "₹50 L to ₹1 Cr", "Above ₹1 Cr"];
const PROPERTY_TYPES = ["Kothi", "Apartment", "Plot", "Commercial", "Not decided yet"];
const EMPLOYMENT = ["Salaried", "Self-employed", "NRI"];

/** Home loan enquiry: saved as a lead with source home_loan; the loan answers go into the lead's notes. */
export default function LoanEnquiryForm({ banks }: { banks: string[] }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [employment, setEmployment] = useState("Salaried");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    if (String(data.name ?? "").trim().length < 2) { setError("Enter your name."); return; }
    if (!/^[6-9]\d{9}$/.test(String(data.phone).replace(/\D/g, "").slice(-10))) { setError("Enter a 10-digit Indian mobile number."); return; }
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name, phone: data.phone, interest: "Buy", source: "home_loan", subject: "Home loan", page: window.location.pathname,
          details: { "Loan amount": data.amount, "Property type": data.propertyType, "Employment": employment, "Preferred bank": data.bank || "No preference" },
        }),
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
        <p className="mt-3 font-heading text-xl">Thank you. A loan advisor will call you.</p>
        <p className="mt-2 text-sm text-muted">We call within working hours, usually within 2 hours, to check eligibility and the documents you will need.</p>
        <button type="button" onClick={() => setState("idle")} className="mt-4 text-sm text-accent-ink hover:underline">Send another enquiry</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="loan-name"><input id="loan-name" name="name" required className={inputCls} placeholder="Your name" autoComplete="name" /></Field>
        <Field label="Phone" htmlFor="loan-phone"><input id="loan-phone" name="phone" required inputMode="tel" className={inputCls} placeholder="10-digit mobile number" autoComplete="tel" /></Field>
        <Field label="Loan amount" htmlFor="loan-amount">
          <select id="loan-amount" name="amount" className={inputCls} defaultValue="">
            <option value="">Not sure yet</option>
            {AMOUNTS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Property type" htmlFor="loan-type">
          <select id="loan-type" name="propertyType" className={inputCls} defaultValue="">
            <option value="">Choose</option>
            {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <fieldset>
        <legend className="mb-1.5 block text-sm text-ink">Employment type</legend>
        <div className="grid grid-cols-3 overflow-hidden rounded-brand border border-line bg-white text-sm">
          {EMPLOYMENT.map((opt) => (
            <label key={opt} className="relative">
              <input type="radio" name="employment" value={opt} checked={employment === opt} onChange={() => setEmployment(opt)} className="peer sr-only" />
              <span className="block cursor-pointer py-2.5 text-center text-ink peer-checked:bg-accent peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-accent hover:bg-bg peer-checked:hover:bg-accent">{opt}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Preferred bank (optional)" htmlFor="loan-bank">
        <select id="loan-bank" name="bank" className={inputCls} defaultValue="">
          <option value="">No preference</option>
          {banks.map((b) => <option key={b}>{b}</option>)}
        </select>
      </Field>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      {state === "error" && <p className="text-sm text-red-700" role="alert">Could not send. Please call or WhatsApp us instead.</p>}
      <Button type="submit" className="w-full" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Check my eligibility"}</Button>
      <p className="text-xs text-muted">Zero brokerage. We call only about your loan.</p>
    </form>
  );
}
