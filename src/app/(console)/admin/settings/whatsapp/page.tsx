import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import Pill from "@/components/console/Pill";
import { Field, Input } from "@/components/console/Form";
import { inputCls } from "@/components/console/form-classes";
import { requireUser } from "@/lib/auth";
import { getWhatsAppConfig, isConfigured, maskToken, testConnection } from "@/lib/whatsapp";
import { getStaffAlerts } from "@/lib/notify";
import { disconnectWhatsAppAction, saveStaffAlertsAction, saveWhatsAppAction, sendTestMessageAction, testStaffAlertAction } from "./actions";

export default async function WhatsAppSettingsPage() {
  await requireUser("admin");
  const [cfg, alerts] = await Promise.all([getWhatsAppConfig(), getStaffAlerts()]);
  const connected = isConfigured(cfg);
  const test = connected ? await testConnection(cfg) : null;
  return (
    <div className="max-w-3xl">
      <PageHeader title="WhatsApp API" description="Meta WhatsApp Cloud API credentials used by Campaigns and staff alerts. Messages go out from your own business number." actions={<Pill value={test?.ok ? "Connected" : connected ? "Failed" : "Not connected"} />} />
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

      <form id="staff-alerts" action={saveStaffAlertsAction} className="mt-5 scroll-mt-6 rounded-brand border border-line bg-white p-5">
        <h2 className="text-base">Staff alerts on WhatsApp</h2>
        <p className="mt-1 text-xs text-muted">
          Sends admins every new website enquiry, and employees the leads and tasks given to them, as a WhatsApp message to the phone number on their account.
          Meta only allows this with an approved <span className="font-medium text-ink">Utility</span> template whose body has two variables, for example:
          &ldquo;Manav Narula Realtor alert: {"{{1}}"}. {"{{2}}"} Open the staff console for details.&rdquo; {"{{1}}"} is the alert (e.g. &ldquo;New enquiry: Simran Kaur&rdquo;), {"{{2}}"} the details.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Template name" htmlFor="template" hint="Exactly as approved in Meta, e.g. staff_alert"><Input id="template" name="template" defaultValue={alerts.template} placeholder="staff_alert" /></Field>
          <Field label="Template language code" htmlFor="language" hint="As chosen in Meta: en, en_US, hi…"><Input id="language" name="language" defaultValue={alerts.language} /></Field>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="whatsapp" defaultChecked={alerts.whatsapp} className="accent-[#00BF63]" />Send staff alerts on WhatsApp</label>
          <label className="flex items-center gap-2 pl-6"><input type="checkbox" name="newLeads" defaultChecked={alerts.newLeads} className="accent-[#00BF63]" />New website enquiries, to every admin</label>
          <label className="flex items-center gap-2 pl-6"><input type="checkbox" name="assignments" defaultChecked={alerts.assignments} className="accent-[#00BF63]" />Leads and tasks assigned, to that employee</label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="submit" className="rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">Save staff alerts</button>
          <button type="submit" formAction={testStaffAlertAction} disabled={!connected || !alerts.template} className="rounded-brand border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-white disabled:opacity-40">Send a test alert to my phone</button>
        </div>
        <p className="mt-3 text-xs text-muted">Each person also gets these in the console bell and, if they turn it on under Notifications, as a push notification on their phone or computer.</p>
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
