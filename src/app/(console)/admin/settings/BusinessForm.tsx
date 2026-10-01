"use client";
import { useActionState } from "react";
import { Field, FormError, Input, Section, SubmitButton, Textarea } from "@/components/console/Form";
import type { Business } from "@/lib/queries/settings";
import type { BusinessState } from "./actions";

export default function BusinessForm({ business: b, notificationEmail, action }: { business: Business; notificationEmail: string; action: (p: BusinessState, fd: FormData) => Promise<BusinessState> }) {
  const [state, act] = useActionState<BusinessState, FormData>(action, {});
  const e = state.errors ?? {};
  return (
    <form action={act} className="space-y-5">
      <FormError message={state.message} />
      <Section title="Business details" description="Shown in the website header, footer, contact page and schema markup.">
        <Field label="Business name" htmlFor="name" error={e.name}><Input id="name" name="name" defaultValue={b.name} /></Field>
        <Field label="Tagline" htmlFor="tagline"><Input id="tagline" name="tagline" defaultValue={b.tagline} /></Field>
        <Field label="Phone" htmlFor="phone" error={e.phone}><Input id="phone" name="phone" defaultValue={b.phone} placeholder="+91 90122 90522" /></Field>
        <Field label="WhatsApp number" htmlFor="whatsapp" hint="Digits with country code, e.g. +919012290522"><Input id="whatsapp" name="whatsapp" defaultValue={b.whatsapp} /></Field>
        <Field label="Email" htmlFor="email" error={e.email}><Input id="email" name="email" type="email" defaultValue={b.email} /></Field>
        <Field label="RERA number" htmlFor="rera"><Input id="rera" name="rera" defaultValue={b.rera} /></Field>
        <Field label="Address" htmlFor="address" className="md:col-span-2"><Textarea id="address" name="address" rows={2} defaultValue={b.address} /></Field>
        <Field label="Working hours" htmlFor="hours" className="md:col-span-2"><Input id="hours" name="hours" defaultValue={b.hours} /></Field>
        <Field label="Google rating" htmlFor="rating" error={e.rating}><Input id="rating" name="rating" type="number" step="0.1" min={0} max={5} defaultValue={b.rating} /></Field>
        <Field label="Google reviews" htmlFor="reviews" error={e.reviews}><Input id="reviews" name="reviews" type="number" min={0} defaultValue={b.reviews} /></Field>
        <Field label="Instagram" htmlFor="instagram" error={e.instagram}><Input id="instagram" name="instagram" defaultValue={b.instagram} placeholder="https://instagram.com/…" /></Field>
        <Field label="Facebook" htmlFor="facebook" error={e.facebook}><Input id="facebook" name="facebook" defaultValue={b.facebook} /></Field>
        <Field label="YouTube" htmlFor="youtube" error={e.youtube}><Input id="youtube" name="youtube" defaultValue={b.youtube} /></Field>
        <Field label="Notification email for new leads" htmlFor="notification_email" error={e.notification_email} hint="Each website enquiry is sent here once email delivery is connected."><Input id="notification_email" name="notification_email" type="email" defaultValue={notificationEmail} /></Field>
      </Section>
      <SubmitButton>Save business details</SubmitButton>
    </form>
  );
}
