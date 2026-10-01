import EnquiryForm from "@/components/EnquiryForm";
import Icon from "@/components/Icon";
import { Breadcrumbs, GoogleRating, Section } from "@/components/ui";
import { site } from "@/data/site";

export const metadata = { title: "Contact", description: "Send an enquiry, request a callback or visit our office on 66 Feet Road, Mithapur, Jalandhar. Phone +91 90122 90522." };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ interest?: string; service?: string }> }) {
  const { interest, service } = await searchParams;
  const defaultInterest = interest ?? (service === "selling" ? "Sell" : service === "renting" ? "Rent" : undefined);
  return (
    <Section>
      <Breadcrumbs items={[{ label: "Contact" }]} />
      <h1 className="mt-6 text-4xl md:text-5xl">Contact</h1>
      <p className="mt-3 max-w-2xl text-muted">Send an enquiry, ask for a callback, or walk into the office. We reply within working hours, usually within 2 hours.</p>
      <div className="mt-12 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-6 lg:col-span-5">
          <h2 className="mb-6 text-2xl">Send an enquiry</h2>
          <EnquiryForm variant="full" defaultInterest={defaultInterest} subject={service ? `Service: ${service}` : undefined} />
        </div>
        <div className="md:col-span-6 lg:col-span-5 lg:col-start-8">
          <h2 className="text-2xl">Office</h2>
          <address className="mt-4 space-y-3 text-sm not-italic">
            <p className="flex gap-2"><Icon name="pin" size={18} className="mt-0.5 shrink-0 text-muted" />{site.address}</p>
            <p className="flex gap-2"><Icon name="phone" size={18} className="mt-0.5 shrink-0 text-muted" /><a href={site.phoneHref} className="tabular hover:text-accent-ink">{site.phone}</a></p>
            <p className="flex gap-2"><Icon name="whatsapp" size={18} className="mt-0.5 shrink-0 text-muted" /><a href={site.whatsappHref} target="_blank" rel="noopener" className="hover:text-accent-ink">WhatsApp us</a></p>
            <p className="flex gap-2"><Icon name="mail" size={18} className="mt-0.5 shrink-0 text-muted" /><a href={`mailto:${site.email}`} className="hover:text-accent-ink">{site.email}</a></p>
            <p className="flex gap-2"><Icon name="clock" size={18} className="mt-0.5 shrink-0 text-muted" />{site.hours}</p>
          </address>
          <a href={site.mapHref} target="_blank" rel="noopener" className="mt-5 inline-flex items-center gap-2 text-sm text-accent-ink hover:underline"><Icon name="pin" size={16} />Open in Google Maps</a>
          <GoogleRating rating={site.rating} reviews={site.reviews} className="mt-6" />
          <p className="mt-2 text-xs text-muted">RERA agent no. {site.rera}</p>

          <div className="mt-10 rounded-brand border border-line bg-white p-5">
            <h2 className="text-xl">Request a callback</h2>
            <p className="mb-4 mt-1 text-sm text-muted">Leave your number and we call you, no form to fill.</p>
            <EnquiryForm variant="visit" submitLabel="Call me back" subject="Callback request" />
          </div>
        </div>
      </div>
    </Section>
  );
}
