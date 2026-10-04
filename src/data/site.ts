export const site = {
  name: "Manav Narula Realtor",
  monogram: "MN",
  tagline: "Trusted property advisors in Jalandhar since 2012",
  foundedYear: 2012,
  address: "66 Feet Rd, opp. Punjab & Sind Bank, IsharPuri Colony, Mithapur, Jalandhar, Punjab 144005",
  addressShort: "66 Feet Rd, Mithapur, Jalandhar 144005",
  phone: "+91 90122 90522",
  phoneHref: "tel:+919012290522",
  whatsappHref: "https://wa.me/919012290522?text=Hello%2C%20I%20want%20to%20enquire%20about%20a%20property.",
  email: "realtormanavnarula@gmail.com",
  hours: "Mon to Sat, 10:00 am to 7:00 pm · Sunday by appointment",
  rera: "PBRERA-JAL-AGT-2024-0119",
  rating: 4.8,
  reviews: 21,
  mapHref: "https://www.google.com/maps/search/?api=1&query=Manav+Narula+Realtor+66+Feet+Rd+Mithapur+Jalandhar",
  reviewHref: "https://www.google.com/maps/search/?api=1&query=Manav+Narula+Realtor+Jalandhar",
  url: "https://manavnarularealtor.com",
  social: {
    instagram: "https://instagram.com/manavnarularealtor",
    facebook: "https://facebook.com/manavnarularealtor",
    youtube: "https://youtube.com/@manavnarularealtor",
  },
};

export const nav = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/properties", label: "Properties" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const localities = [
  "Mithapur",
  "Model Town",
  "Urban Estate Phase 1",
  "Urban Estate Phase 2",
  "Jalandhar Cantt",
  "Paragpur",
  "Rama Mandi",
  "GT Road",
  "Maqsudan",
  "Surya Enclave",
  "Green Model Town",
];

export const banners = [
  {
    id: "b1",
    image: "photo-1600596542815-ffad4c1539a9",
    headline: "Kothis, plots and commercial spaces across Jalandhar",
    line: "Verified titles, honest advice and accompanied site visits.",
    cta: { label: "View properties", href: "/properties" },
  },
  {
    id: "b2",
    image: "photo-1613490493576-7fde63acd811",
    headline: "Selling your kothi? Get an honest valuation first",
    line: "A written, no-obligation valuation within 48 hours of the site visit.",
    cta: { label: "Request a valuation", href: "/contact?interest=Sell" },
  },
  {
    id: "b3",
    image: "photo-1600585154340-be6161a56a0c",
    headline: "NRI owners: we manage, rent and sell on your behalf",
    line: "Power of attorney guidance, tenant checks and monthly statements.",
    cta: { label: "NRI services", href: "/services#nri" },
  },
];

export const offer = {
  image: "photo-1600607687939-ce8a6c25118c",
  headline: "Zero brokerage on home loans arranged through us",
  line: "Sanction letters from 4 partner banks, usually within 7 working days.",
  cta: { label: "Check loan eligibility", href: "/home-loans" },
};

export const trustPoints = [
  { label: "Years in Jalandhar", value: `${new Date().getFullYear() - 2012}+` },
  { label: "Properties sold", value: "1000+" },
];

export const workEthics = [
  { icon: "rupee", title: "Honest pricing with no hidden charges", text: "Our fee is agreed in writing before any deal, and it is the only fee you pay." },
  { icon: "shield", title: "Verified titles and paperwork before any deal", text: "Title chain, encumbrance and approvals are checked before we show a property." },
  { icon: "walk", title: "Every site visit accompanied", text: "An advisor from our office is present at every visit, from the first look to handover." },
  { icon: "chat", title: "Clear communication at every step", text: "One point of contact, written updates and no surprises at registry." },
];

export const aboutCommitments = [
  ...workEthics.map((w) => ({ title: w.title, text: w.text })),
  { title: "We say no to unclear titles", text: "If the paperwork does not hold up, we do not list it, whatever the commission." },
  { title: "We stay after the deal", text: "Mutation, possession letters and society transfers are handled by us, at no extra charge." },
];

export const servicesShort = [
  { id: "buying", icon: "home", title: "Buying", line: "Shortlisted, verified and negotiated on your behalf." },
  { id: "selling", icon: "tag", title: "Selling and valuation", line: "Honest valuation, wide reach and screened buyers." },
  { id: "renting", icon: "key", title: "Renting", line: "Tenant checks, agreements and hassle-free handover." },
  { id: "legal", icon: "file", title: "Legal and documentation", line: "Title checks, registry, mutation and NOCs." },
  { id: "loans", icon: "bank", title: "Home loans", line: "Sanction letters from partner banks, zero brokerage.", href: "/home-loans" },
  { id: "nri", icon: "globe", title: "NRI services", line: "Buy, sell or manage from abroad with one contact." },
];

export const services = [
  {
    id: "buying",
    title: "Buying",
    description: "We shortlist only properties whose title, approvals and pricing we have verified ourselves, then accompany you on every visit and negotiate on your behalf.",
    points: ["Verified shortlist matched to your budget and locality", "Accompanied site visits and price benchmarking", "Negotiation, token, agreement and registry support"],
    fee: "Fee: 1% of the sale value, agreed in writing before the token. No charge until the deal closes.",
  },
  {
    id: "selling",
    title: "Selling and valuation",
    description: "A written valuation based on recent registries in your locality, professional photography, listing across portals and screening of every buyer before a visit.",
    points: ["Written valuation within 48 hours of the site visit", "Photography, listing and buyer screening", "Offer management and registry coordination"],
    fee: "Fee: 1% of the sale value on completion. Valuation is free and carries no obligation.",
  },
  {
    id: "renting",
    title: "Renting and leasing",
    description: "For owners and tenants: verified listings, police verification, registered rent agreements and a clear handover checklist.",
    points: ["Tenant or property shortlist within 7 days", "Police verification and registered rent agreement", "Inventory checklist at move-in and move-out"],
    fee: "Fee: half a month's rent from each side for residential, one month's rent for commercial leases.",
  },
  {
    id: "legal",
    title: "Legal and documentation",
    description: "Our empanelled advocates check the title chain, encumbrances, building approvals and dues so that nothing surfaces after you have paid.",
    points: ["Title search and encumbrance report", "Sale deed drafting, stamp duty and registry", "Mutation, NOCs and society transfer"],
    fee: "Fee: fixed per document, quoted upfront. Included free with any purchase or sale through us.",
  },
  {
    id: "loans",
    title: "Home loans",
    description: "We compare offers from partner banks and NBFCs, assemble the file and follow up until sanction, at no cost to you.",
    points: ["Eligibility check and rate comparison from 4 partner banks", "Document collection and file submission", "Follow-up until sanction and disbursement"],
    fee: "Fee: none. The bank pays us a standard referral fee, which never affects your rate.",
  },
  {
    id: "nri",
    title: "NRI services",
    description: "For owners abroad: we act on a registered power of attorney, keep you updated on video and remit proceeds through the correct channels.",
    points: ["Power of attorney guidance and video site visits", "Sale, rental or purchase handled end to end", "Repatriation and tax documentation support"],
    fee: "Fee: same as the underlying service. Video updates and monthly statements are included.",
  },
  {
    id: "management",
    title: "Property management",
    description: "Rent collection, maintenance, utility payments and quarterly inspections for owners who cannot be in Jalandhar.",
    points: ["Rent collection and monthly statement", "Repairs, utility bills and society dues", "Quarterly inspection with photos"],
    fee: "Fee: 8% of monthly rent, or a fixed quarterly amount for vacant properties. Quoted in writing.",
  },
];

export const testimonials = [
  { quote: "They showed us only four kothis, all with clean papers, and we bought the second one. No pressure, no surprises at registry.", name: "Harpreet and Simran Kaur", locality: "Urban Estate Phase 2" },
  { quote: "Sold my plot in Paragpur from Canada. Manav handled the POA, buyer visits and the bank remittance. I never had to fly down.", name: "Gurdeep Singh", locality: "NRI owner, Paragpur" },
  { quote: "The valuation they gave was honest, lower than others promised but it actually sold in six weeks at that price.", name: "Rakesh Verma", locality: "Model Town" },
];

export const milestones = [
  { year: "2012", text: "Office opened on 66 Feet Road, Mithapur, with two advisors." },
  { year: "2016", text: "First 100 registries completed; legal desk added with an empanelled advocate." },
  { year: "2019", text: "NRI desk started after a third of enquiries came from Canada, the UK and Australia." },
  { year: "2022", text: "Home loan partnerships with four banks; 500th family handed keys." },
  { year: "2024", text: "Property management service launched." },
];

export const team = [
  { name: "Manav Narula", role: "Founder and principal advisor", line: "13 years in Jalandhar real estate. Handles every valuation personally.", initials: "MN" },
  { name: "Kirandeep Kaur", role: "Legal and documentation", line: "Coordinates title searches, registry and mutation with our advocates.", initials: "KK" },
  { name: "Arjun Mehta", role: "Sales advisor, plots and kothis", line: "Accompanies site visits across Urban Estate, Model Town and Cantt.", initials: "AM" },
  { name: "Priya Sharma", role: "NRI and rentals desk", line: "Video visits, tenant verification and monthly owner statements.", initials: "PS" },
];

export const certifications = [
  { title: "Empanelled advocate", text: "Title and documentation reviewed by an advocate enrolled with the Bar Council of Punjab and Haryana." },
  { title: "Home loan partner", text: "Direct selling associate with four scheduled banks and one housing finance company." },
];
