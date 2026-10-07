import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import Pill from "@/components/console/Pill";
import { Field, Input } from "@/components/console/Form";
import { inputCls } from "@/components/console/form-classes";
import { requireUser } from "@/lib/auth";
import { getWhatsAppConfig, isConfigured, maskToken, testConnection } from "@/lib/whatsapp";
import { disconnectWhatsAppAction, saveWhatsAppAction, sendTestMessageAction } from "./actions";

export default async function WhatsAppSettingsPage() {
  await requireUser("admin");
  const cfg = await getWhatsAppConfig();
  const connected = isConfigured(cfg);
  const test = connected ? await testConnection(cfg) : null;
  return (
    <div className="max-w-3xl">
      <PageHeader title="WhatsApp API" description="Meta WhatsApp Cloud API credentials used by Campaigns. Messages go out from your own business number." actions={<Pill value={test?.ok ? "Connected" : connected ? "Failed" : "Not connected"} />} />
      {test && !test.ok && <p className="mb-4 rounded-brand border border-red-600 bg-white px-4 py-3 text-sm text-red-700">Credentials are saved but the API rejected them: {test.error}</p>}
      {test?.ok && <p className="mb-4 rounded-brand border border-line bg-white px-4 py-3 text-sm">Sending as <span className="font-medium">{test.display}</span>{test.quality ? ` · quality rating ${test.quality}` : ""}.</p>}

      <form action={saveWhatsAppAction} className="rounded-brand border border-line bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Phone number ID" htmlFor="phoneNumberId" hint="Meta for Developers → WhatsApp → API setup"><Input id="phoneNumberId" name="phoneNumberId" defaultValue={cfg.phoneNumberId} required /></Field>
          <Field label="WhatsApp Business Account ID" htmlFor="businessAccountId" hint="Optional, for reference"><Input id="businessAccountId" name="businessAccountId" defaultValue={cfg.businessAccountId} /></Field>
          <Field label="Permanent access token" htmlFor="accessToken" hint={cfg.accessToken ? `Saved: ${maskToken(cfg.accessToken)}. Leave blank to keep it.` : "System user token with whatsapp_business_messaging permission"} className="md:col-span-2"><Input id="accessToken" name="accessToken" type="password" autoComplete="off" placeholder={cfg.accessToken ? "••••••••" : "EAAG…"} /></Field>
          <Field label="Sender name shown in tests" htmlFor="senderName"><Input id="senderName" name="senderName" defaultValue={cfg.senderName} /></Field>
          <Field label="Graph API version" htmlFor="apiVersion"><Input id="apiVersion" name="apiVersion" defaultValue={cfg.apiVersion} /></Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="submit" className="rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">Save and test connection</button>
          {cfg.accessToken && <button type="submit" formAction={disconnectWhatsAppAction} className="rounded-brand border border-line px-4 py-2 text-sm text-red-700 hover:border-red-700">Remove token</button>}
          <Link href="/admin/settings" className="ml-auto text-sm text-muted hover:text-ink">Back to settings</Link>
        </div>
      </form>

      <form action={sendTestMessageAction} className="mt-5 rounded-brand border border-line bg-white p-5">
        <h2 className="text-base">Send a test message</h2>
        <p className="mt-1 text-xs text-muted">Free-form text only reaches a number that has messaged your business in the last 24 hours. Send &ldquo;hi&rdquo; to your business number from the test phone first.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input name="to" inputMode="tel" placeholder="10-digit mobile" className={`${inputCls} w-48`} aria-label="Test number" />
          <button type="submit" disabled={!connected} className="rounded-brand border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-white disabled:opacity-40">Send test</button>
        </div>
      </form>

      <section className="mt-5 rounded-brand border border-line bg-white p-5 text-sm">
        <h2 className="text-base">How sending works</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted">
          <li>Only prospects with WhatsApp opt-in = Yes are ever included; closed-lost records are excluded.</li>
          <li>Text messages are delivered only inside Meta&apos;s 24-hour customer service window. For cold outreach, create a message template in Meta Business Manager, wait for approval, and choose &ldquo;Approved template&rdquo; in the campaign.</li>
          <li>Scheduled campaigns send when someone opens the Campaigns page after the time, or on the minute if a cron calls POST /api/campaigns/run with header x-cron-secret = CRON_SECRET.</li>
          <li>Every message is logged per person on the campaign and as a WhatsApp activity on the lead or prospect.</li>
        </ol>
      </section>
    </div>
  );
}
