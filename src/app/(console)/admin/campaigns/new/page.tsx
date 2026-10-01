import PageHeader from "@/components/console/PageHeader";
import CampaignForm from "@/components/console/CampaignForm";
import { requireUser } from "@/lib/auth";
import { audienceOptions, getTemplate, listTemplates } from "@/lib/queries/campaigns";
import { getWhatsAppConfig, isConfigured } from "@/lib/whatsapp";
import { saveCampaign } from "../actions";

export default async function NewCampaignPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  await requireUser("admin");
  const { template } = await searchParams;
  const [{ localities, tags }, cfg, templates, from] = await Promise.all([audienceOptions(), getWhatsAppConfig(), listTemplates(), template ? getTemplate(Number(template)) : Promise.resolve(null)]);
  const values = from ? { name: from.name, message: from.message, variants: from.variants ?? [], message_type: from.message_type, template_name: from.template_name, template_language: from.template_language, media_type: from.media_type, media_url: from.media_url, media_filename: from.media_filename } : {};
  return (
    <>
      <PageHeader title="New campaign" description={from ? `Started from the template "${from.name}". Adjust and send.` : "Write one message, attach a brochure or video if you like, choose who gets it, then send now or schedule."} />
      <CampaignForm action={saveCampaign.bind(null, null)} values={values} localities={localities} tags={tags} connected={isConfigured(cfg)} isNew templates={templates.map((t) => ({ id: t.id, name: t.name }))} />
    </>
  );
}
