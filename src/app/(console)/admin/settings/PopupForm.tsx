"use client";
import { useActionState } from "react";
import { Field, FormError, Input, Section, SubmitButton } from "@/components/console/Form";
import type { PopupSettings } from "@/lib/site-data";
import type { PopupState } from "./actions";

export default function PopupForm({ popup, action }: { popup: PopupSettings; action: (p: PopupState, fd: FormData) => Promise<PopupState> }) {
  const [state, act] = useActionState<PopupState, FormData>(action, {});
  const e = state.errors ?? {};
  return (
    <form action={act} id="popup" className="scroll-mt-20 space-y-3">
      <FormError message={state.message} />
      <Section title="Website pop-up" description="Free consultation pop-up: once per visit, after the delay or half-way down a page, never on Contact or Home loans, and not again for 7 days once closed. Each reply becomes a lead with source popup_consultation.">
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="popup_enabled" defaultChecked={popup.enabled} className="accent-[#00BF63]" />Show the pop-up on the website</label>
        <Field label="Headline" htmlFor="popup_headline" error={e.popup_headline}><Input id="popup_headline" name="popup_headline" defaultValue={popup.headline} maxLength={80} /></Field>
        <Field label="Delay (seconds)" htmlFor="popup_delay_seconds" error={e.popup_delay_seconds} hint="It also appears earlier if the visitor scrolls half-way down."><Input id="popup_delay_seconds" name="popup_delay_seconds" type="number" min={0} max={600} defaultValue={popup.delaySeconds} /></Field>
        <Field label="Line" htmlFor="popup_text" error={e.popup_text} className="md:col-span-2"><Input id="popup_text" name="popup_text" defaultValue={popup.text} maxLength={200} /></Field>
      </Section>
      <SubmitButton>Save pop-up</SubmitButton>
    </form>
  );
}
