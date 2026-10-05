export interface Article {
  id?: number;
  slug: string;
  title: string;
  category: string;
  date: string;
  author: string;
  /** Staff posts: the writer's designation (Intern, Employee, Executive) and passport-size photo. */
  authorTitle?: string;
  authorPhoto?: string | null;
  cover: string;
  excerpt: string;
  body: string[];
}

export const articles: Article[] = [
  {
    slug: "documents-to-check-before-buying-a-plot",
    title: "Nine documents to check before you pay a token for a plot",
    category: "Legal",
    date: "2026-08-20",
    author: "Kirandeep Kaur",
    cover: "photo-1500382017468-9049fed747ef",
    excerpt: "The exact checklist our legal desk runs on every plot we list, from the allotment letter to the no-dues certificate.",
    body: [
      "Plots are where most disputes start, because a plot with a clean fence can still carry an unclear title. This is the checklist we run before listing any plot, and it is the same one you should run before paying a token.",
      "1. Original allotment letter or sale deed in the seller's name. 2. Chain of title for the last 30 years. 3. Jamabandi or property card from the tehsil. 4. PUDA or Improvement Trust layout approval for the colony. 5. Non-encumbrance certificate from the sub-registrar. 6. No-dues certificate from the colony or society. 7. Latest property tax receipt. 8. Court case search in the seller's name. 9. Mutation entry showing the seller as the current owner.",
      "## The two that people skip",
      "The layout approval and the mutation are the ones most buyers skip, and they are the ones that surface years later when you try to build or sell. If the seller cannot produce either, walk away or let us get it checked before you decide.",
    ],
  },
  {
    slug: "nri-selling-property-jalandhar",
    title: "Selling property in Jalandhar from abroad: how it works",
    category: "NRI",
    date: "2026-07-28",
    author: "Priya Sharma",
    cover: "photo-1613490493576-7fde63acd811",
    excerpt: "Power of attorney, TDS at 20%, repatriation limits and the video visits we run for owners in Canada, the UK and Australia.",
    body: [
      "About a third of our sellers live outside India. The process is well defined, but it has three steps that need to be done in the right order.",
      "## Power of attorney",
      "A registered power of attorney in favour of a trusted person in India, attested at the Indian consulate and adjudicated in Punjab within three months of arrival. We share a template and walk you through the consulate appointment.",
      "## Tax at source",
      "The buyer deducts TDS at 20% plus surcharge on the sale value for an NRI seller, unless you obtain a lower-deduction certificate from the assessing officer. We coordinate with your chartered accountant so that the certificate is ready before the registry date.",
      "## Repatriation",
      "Sale proceeds go into an NRO account. Up to USD 1 million per financial year can be repatriated with Form 15CA and 15CB. Monthly statements and a final settlement note are sent to you on email.",
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((a) => a.slug === slug);
}

export const faqGroups: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: "Buying",
    items: [
      { q: "What is your fee when I buy through you?", a: "1% of the sale value, agreed in writing before the token. Nothing is payable until the registry is done." },
      { q: "Do you verify the title before showing a property?", a: "Yes. Our legal desk checks the title chain, encumbrance and approvals before a property is listed. If it does not hold up, we do not show it." },
      { q: "Can I visit a property on a Sunday?", a: "Yes, by appointment. Every visit is accompanied by an advisor from our office." },
      { q: "How is a kothi price decided in Jalandhar?", a: "Mainly by plot size, locality and road width, then by build year and quality. We share recent registries in the same locality so you can see the benchmark." },
    ],
  },
  {
    group: "Selling",
    items: [
      { q: "How do you value my property?", a: "From registries completed in your locality in the last 12 months, adjusted for plot size, facing and build quality. You get a written valuation within 48 hours of the site visit." },
      { q: "Is the valuation free?", a: "Yes, and it carries no obligation to list with us." },
      { q: "How long does a sale take?", a: "Correctly priced kothis and plots in established localities usually sell in 6 to 10 weeks. Apartments and commercial spaces take longer." },
    ],
  },
  {
    group: "Renting",
    items: [
      { q: "What is the fee for renting?", a: "Half a month's rent from the owner and half from the tenant for residential; one month's rent for commercial leases." },
      { q: "Do you do police verification?", a: "Yes. Every tenant is verified with the Jalandhar Police tenant registration before the agreement is signed." },
      { q: "Is the rent agreement registered?", a: "Yes, an 11-month agreement is registered at the sub-registrar's office. Longer leases are registered as lease deeds." },
    ],
  },
  {
    group: "Legal",
    items: [
      { q: "What is stamp duty in Punjab?", a: "Currently 7% for men, 5% for women and 6% for joint ownership, plus a 1% social infrastructure cess. Registration fee is 1%. We confirm the applicable rate before registry." },
      { q: "What is mutation and do I need it?", a: "Mutation records you as the owner in the revenue records after registry. It is required to sell or mortgage later. We complete it for every purchase through us." },
    ],
  },
  {
    group: "Home loans",
    items: [
      { q: "Do you charge for arranging a home loan?", a: "No. The bank pays us a standard referral fee, which never affects your interest rate." },
      { q: "How long does sanction take?", a: "Usually 7 working days for salaried applicants and 10 to 15 for self-employed, once the file is complete." },
      { q: "Can I get a loan on a plot?", a: "Yes, most partner banks offer plot loans up to 70% of the value for approved colonies, with a condition to build within a set period." },
    ],
  },
  {
    group: "NRI",
    items: [
      { q: "Can I buy property in Jalandhar as an NRI?", a: "Yes, any residential or commercial property. Agricultural land and farmhouses cannot be bought by NRIs under FEMA." },
      { q: "Do I need to be present for the registry?", a: "No. A registered power of attorney holder can sign on your behalf. We guide you through consulate attestation." },
      { q: "How do I receive rent or sale proceeds abroad?", a: "Into your NRO account, then repatriated with Form 15CA and 15CB. We send monthly statements for managed properties." },
    ],
  },
];

export const homeFaqs = [
  { ...faqGroups[0].items[0], tag: "Buying" },
  { ...faqGroups[0].items[1], tag: "Buying" },
  { ...faqGroups[1].items[0], tag: "Selling" },
  { ...faqGroups[5].items[1], tag: "NRI" },
];
