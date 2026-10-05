import Image from "next/image";
import Accordion from "@/components/Accordion";
import Icon from "@/components/Icon";
import LoanEnquiryForm from "@/components/LoanEnquiryForm";
import YouTubeLite from "@/components/YouTubeLite";
import { Breadcrumbs, Section, SectionTitle } from "@/components/ui";
import { getBusiness, getPageVideos, getPartnerBanks, phoneHref, whatsappHref } from "@/lib/site-data";

export const revalidate = 60;
export const metadata = {
  title: "Home loans",
  description: "Home loans arranged through Manav Narula Realtor with zero brokerage. We compare partner banks, prepare your file and follow up until the sanction letter, usually within 7 working days.",
};

const steps = [
  { title: "Share details", text: "Tell us the property, loan amount and your income. Five minutes on a call." },
  { title: "We compare banks", text: "We check eligibility and rates with our partner banks and show you the options side by side." },
  { title: "Documents and file", text: "We collect your papers, fill the forms and submit a complete file to the bank you choose." },
  { title: "Sanction letter", text: "We follow up with the bank until sanction, usually within 7 working days, then through disbursement." },
];

const documents = [
  { title: "Salaried", items: ["PAN card and Aadhaar", "Last 3 months' salary slips", "6 months' salary account statement", "Form 16 or ITR for 2 years", "Property papers or allotment letter"] },
  { title: "Self-employed", items: ["PAN card and Aadhaar", "ITR with computation for 3 years", "Audited balance sheet and P&L", "12 months' bank statements", "Business proof (GST or registration)"] },
  { title: "NRI", items: ["Passport with valid visa", "Overseas address proof", "Employment contract and 3 months' salary slips", "6 months' NRE/NRO statements", "Power of attorney, if someone signs in India"] },
];

const faqs = [
  { q: "How much home loan can I get?", a: "Banks lend up to 90% of the property value for loans up to ₹30 lakh, 80% for ₹30 to 75 lakh and 75% above ₹75 lakh, as per RBI rules. The final amount also depends on your income: most banks keep total EMIs within about half of your monthly take-home pay." },
  { q: "Do you charge anything for arranging the loan?", a: "No. There is no brokerage or processing fee from our side. The bank pays us a standard referral fee, which never changes the rate you are offered." },
  { q: "How long does the sanction take?", a: "Usually within 7 working days once the bank has a complete file. Most delays come from missing papers, so we check your documents before submitting." },
  { q: "Can NRIs take a home loan in India?", a: "Yes. NRIs can take a home loan from Indian banks for residential property. EMIs are paid from an NRE or NRO account, and a family member in India can sign on your behalf with a registered power of attorney." },
  { q: "Can I get a loan for a plot?", a: "Yes, for plots in approved colonies with a clear title. Banks usually lend a smaller share of the value for plots, and some ask that construction starts within a set period. We confirm which banks will fund the plot before you pay a token." },
];

export default async function HomeLoansPage() {
  const [business, banks, videos] = await Promise.all([getBusiness(), getPartnerBanks(), getPageVideos("home_loans")]);
  const [main, ...more] = videos;
  return (
    <>
      {/* Hero */}
      <Section className="border-b border-line">
        <Breadcrumbs items={[{ label: "Services", href: "/services" }, { label: "Home loans" }]} />
        <h1 className="mt-6 max-w-3xl text-4xl md:text-5xl">Home loans arranged through us, zero brokerage</h1>
        <p className="mt-4 max-w-xl text-lg text-muted">Sanction letters from partner banks, usually within 7 working days</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={phoneHref(business)} className="inline-flex items-center gap-2 rounded-brand bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="phone" size={16} />Call {business.phone}</a>
          <a href={whatsappHref(business)} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-brand border border-ink px-5 py-3 text-sm hover:bg-ink hover:text-white"><Icon name="whatsapp" size={16} />WhatsApp</a>
        </div>
      </Section>

      {/* Partner banks */}
      {banks.length > 0 && (
        <Section>
          <SectionTitle title="Partner banks" intro="We compare offers from each of these and recommend the one that suits your income and property." />
          <ul className={`grid grid-cols-2 gap-px overflow-hidden rounded-brand border border-line bg-line [&>li:last-child:nth-child(odd)]:col-span-2 ${banks.length === 5 ? "md:grid-cols-5" : banks.length === 6 ? "md:grid-cols-3 lg:grid-cols-6" : banks.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4"} md:[&>li:last-child:nth-child(odd)]:col-span-1`}>
            {banks.map((b) => (
              <li key={b.id} className="group flex flex-col items-start bg-white p-5">
                <div className="relative flex h-12 w-full items-center">
                  {b.logo ? (
                    <Image src={b.logo} alt={`${b.name} logo`} fill sizes="200px" className="object-contain object-left" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-brand border border-line text-muted"><Icon name="bank" size={22} /></span>
                  )}
                </div>
                <p className="mt-4 text-base">{b.name}</p>
                {b.tagline && <p className="mt-0.5 text-sm text-muted">{b.tagline}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* How it works */}
      <Section className="border-y border-line bg-white">
        <SectionTitle title="How it works" intro="One advisor handles your loan from the first call to disbursement." />
        <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="border-t border-line pt-6">
              <span className="font-heading text-sm tabular text-accent-ink">0{i + 1}</span>
              <h3 className="mt-3 text-xl leading-snug">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Videos */}
      {main && (
        <Section>
          <SectionTitle title="Watch before you apply" intro="Short explainers on eligibility, documents and choosing a bank." />
          <YouTubeLite id={main.youtubeId} title={main.title ?? "Home loan video"} large />
          {main.title && <p className="mt-3 text-base">{main.title}</p>}
          {more.length > 0 && (
            <ul className="mt-8 grid gap-6 sm:grid-cols-3">
              {more.map((v) => (
                <li key={v.id}>
                  <YouTubeLite id={v.youtubeId} title={v.title ?? "Home loan video"} />
                  {v.title && <p className="mt-2 text-sm">{v.title}</p>}
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {/* Documents */}
      <Section className={main ? "border-y border-line bg-white" : "border-b border-line bg-white"}>
        <SectionTitle title="Documents checklist" intro="Keep these ready and the bank can usually decide within a week." />
        <div className="grid gap-8 md:grid-cols-3">
          {documents.map((d) => (
            <div key={d.title} className="border-t border-line pt-6">
              <h3 className="text-xl">{d.title}</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {d.items.map((it) => <li key={it} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-accent" />{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Enquiry */}
      <Section id="loan-enquiry">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="text-3xl md:text-4xl">Check your loan eligibility</h2>
            <p className="mt-3 text-muted">Share a few details and a loan advisor will call you back with the banks and amounts you qualify for.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {["No brokerage or processing fee from us", "One advisor from application to disbursement", "Your details go only to the bank you choose"].map((t) => (
                <li key={t} className="flex gap-2"><Icon name="shield" size={16} className="mt-0.5 shrink-0 text-accent" />{t}</li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-brand border border-line bg-white p-5 md:p-8">
              <LoanEnquiryForm banks={banks.map((b) => b.name)} />
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="border-t border-line bg-white">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="text-3xl md:text-4xl">Home loan questions</h2>
            <p className="mt-3 text-muted">The five we are asked most. Anything else, ask your advisor on the call.</p>
          </div>
          <div className="md:col-span-8"><Accordion items={faqs} numbered /></div>
        </div>
      </Section>
    </>
  );
}
