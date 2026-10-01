export type ProjectStatus = "Upcoming" | "Under construction" | "Ready";

export interface Project {
  id?: number;
  slug: string;
  name: string;
  developer: string;
  locality: string;
  status: ProjectStatus;
  image: string;
  gallery: string[];
  configurations: { type: string; area: string; price: string }[];
  startingPrice: string;
  possession: string;
  progress: number;
  milestones: { label: string; done: boolean }[];
  keyFacts: { label: string; value: string }[];
  amenities: string[];
  rera: string;
  description: string[];
  brochure: string;
}

export const projects: Project[] = [
  {
    slug: "narula-greens-paragpur",
    name: "Narula Greens",
    developer: "Sukhmani Developers",
    locality: "Paragpur",
    status: "Under construction",
    image: "photo-1600607687939-ce8a6c25118c",
    gallery: ["photo-1600607687939-ce8a6c25118c", "photo-1460317442991-0ec209397118", "photo-1545324418-cc1a3fa10c00"],
    configurations: [
      { type: "2 BHK", area: "1,120 sq.ft", price: "₹46 L" },
      { type: "3 BHK", area: "1,580 sq.ft", price: "₹64 L" },
      { type: "3 BHK + study", area: "1,840 sq.ft", price: "₹78 L" },
    ],
    startingPrice: "₹46 L",
    possession: "December 2027",
    progress: 55,
    milestones: [
      { label: "Approvals", done: true },
      { label: "Foundation", done: true },
      { label: "Structure", done: true },
      { label: "Finishing", done: false },
      { label: "Handover", done: false },
    ],
    keyFacts: [
      { label: "Land", value: "4.2 acres" },
      { label: "Towers", value: "4 towers, G+7" },
      { label: "Units", value: "216" },
      { label: "Open area", value: "62%" },
      { label: "Launch", value: "March 2025" },
      { label: "Possession", value: "December 2027" },
    ],
    amenities: ["Clubhouse", "Swimming pool", "Gym", "Children's play area", "Jogging track", "24x7 security", "Power backup", "Rainwater harvesting"],
    rera: "PBRERA-SAS-79-1122",
    description: [
      "Narula Greens is a 216-unit gated society on the Paragpur bypass with four G+7 towers around a central lawn and clubhouse. Structure is complete on all four towers and finishing work has begun on towers A and B.",
      "Payment is construction-linked in six instalments. Home loans are pre-approved by four partner banks.",
    ],
    brochure: "/brochures/narula-greens.pdf",
  },
  {
    slug: "cantt-view-residency",
    name: "Cantt View Residency",
    developer: "Aujla Builders",
    locality: "Jalandhar Cantt",
    status: "Ready",
    image: "photo-1460317442991-0ec209397118",
    gallery: ["photo-1460317442991-0ec209397118", "photo-1522708323590-d24dbb6b0267", "photo-1560448204-e02f11c3d0e2"],
    configurations: [
      { type: "3 BHK", area: "1,650 sq.ft", price: "₹82 L" },
      { type: "4 BHK", area: "2,150 sq.ft", price: "₹1.08 Cr" },
    ],
    startingPrice: "₹82 L",
    possession: "Ready to move",
    progress: 100,
    milestones: [
      { label: "Approvals", done: true },
      { label: "Foundation", done: true },
      { label: "Structure", done: true },
      { label: "Finishing", done: true },
      { label: "Handover", done: true },
    ],
    keyFacts: [
      { label: "Land", value: "1.8 acres" },
      { label: "Towers", value: "2 towers, G+9" },
      { label: "Units", value: "72" },
      { label: "Available", value: "9 units" },
      { label: "Completion certificate", value: "Received" },
      { label: "Possession", value: "Immediate" },
    ],
    amenities: ["Lift", "Clubhouse", "Gym", "Covered parking", "Power backup", "Intercom", "Landscaped garden"],
    rera: "PBRERA-SAS-79-0983",
    description: [
      "Cantt View Residency is a completed 72-unit society near the Cantt gate with completion certificate received in 2025. Nine units remain with the developer, all ready for immediate registry.",
      "Society maintenance of ₹3.20 per sq.ft covers lift, generator, security and gardens.",
    ],
    brochure: "/brochures/cantt-view-residency.pdf",
  },
  {
    slug: "surya-enclave-plots-phase-3",
    name: "Surya Enclave Plots, Phase 3",
    developer: "Surya Colonisers",
    locality: "Surya Enclave",
    status: "Upcoming",
    image: "photo-1500382017468-9049fed747ef",
    gallery: ["photo-1500382017468-9049fed747ef", "photo-1500530855697-b586d89ba3ee"],
    configurations: [
      { type: "150 sq.yd plot", area: "150 sq.yd", price: "₹58 L" },
      { type: "200 sq.yd plot", area: "200 sq.yd", price: "₹76 L" },
      { type: "250 sq.yd plot", area: "250 sq.yd", price: "₹94 L" },
    ],
    startingPrice: "₹58 L",
    possession: "June 2027",
    progress: 15,
    milestones: [
      { label: "Approvals", done: true },
      { label: "Roads and sewer", done: false },
      { label: "Electricity", done: false },
      { label: "Parks", done: false },
      { label: "Handover", done: false },
    ],
    keyFacts: [
      { label: "Land", value: "12 acres" },
      { label: "Plots", value: "148" },
      { label: "Road width", value: "40 ft and 60 ft" },
      { label: "Approval", value: "PUDA layout approved" },
      { label: "Launch", value: "November 2026" },
      { label: "Possession", value: "June 2027" },
    ],
    amenities: ["Gated entry", "Underground cabling", "Two parks", "Street lights", "Sewer and water lines", "Community hall plot"],
    rera: "PBRERA-SAS-79-1341",
    description: [
      "Phase 3 of Surya Enclave adds 148 residential plots on 12 acres adjoining the existing colony. The PUDA layout is approved and development work begins in November 2026.",
      "Pre-launch bookings are open through our office with a refundable expression of interest of ₹1 L.",
    ],
    brochure: "/brochures/surya-enclave-phase-3.pdf",
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
