export type PropertyType = "Kothi" | "Apartment" | "Plot" | "Commercial" | "Farmhouse";
export type Purpose = "Buy" | "Rent";
export type Status = "Ready" | "Under construction" | "New";
export type Trust = "verified" | "rera" | "visit";

export interface Property {
  id?: number;
  slug: string;
  title: string;
  type: PropertyType;
  purpose: Purpose;
  locality: string;
  /** Street or block; shown on the website. The house/plot number is never sent to the website. */
  street?: string;
  city?: string;
  price: number;
  bhk?: number;
  baths?: number;
  area: number;
  areaUnit: "sq.ft" | "sq.yd";
  floor?: string;
  facing: string;
  furnishing?: string;
  parking?: string;
  possession: string;
  status: Status;
  description: string;
  longDescription: string[];
  amenities: string[];
  images: string[];
  trust: Trust[];
  rera?: string;
  nearby: { name: string; distance: string }[];
  featured?: boolean;
  masterPlan?: string;
  floorPlans?: { url: string; label: string }[];
  metaTitle?: string;
  metaDescription?: string;
}

export const properties: Property[] = [
  {
    slug: "4-bhk-kothi-urban-estate-phase-2",
    title: "Corner kothi on 300 sq.yd",
    type: "Kothi",
    purpose: "Buy",
    locality: "Urban Estate Phase 2",
    price: 2_35_00_000,
    bhk: 4,
    baths: 4,
    area: 300,
    areaUnit: "sq.yd",
    floor: "Ground + 1",
    facing: "East",
    furnishing: "Semi-furnished",
    parking: "2 covered",
    possession: "Immediate",
    status: "Ready",
    description: "Corner plot kothi with a double-height lounge, modular kitchen and a separate servant quarter on the terrace.",
    longDescription: [
      "Built in 2019 on a 300 sq.yd corner plot, this east-facing kothi has four bedrooms across two floors, each with an attached bath and wardrobes. The ground floor has a double-height lounge, a formal drawing room and a modular kitchen with a separate utility.",
      "The terrace has a servant quarter with its own bath. Two covered parking bays plus street parking on the corner. All approvals from Jalandhar Improvement Trust are in place and the title is clear.",
    ],
    amenities: ["Modular kitchen", "Servant quarter", "Solar water heater", "Inverter backup", "Borewell", "Terrace garden", "CCTV wiring", "Park facing"],
    images: ["photo-1600596542815-ffad4c1539a9", "photo-1600566753086-00f18fb6b3ea", "photo-1502005229762-cf1b2da7c5d6", "photo-1600585154340-be6161a56a0c", "photo-1600573472592-401b489a3cdc"],
    trust: ["verified", "rera", "visit"],
    rera: "",
    nearby: [
      { name: "Urban Estate market", distance: "400 m" },
      { name: "Innocent Hearts School", distance: "1.2 km" },
      { name: "Model Town market", distance: "3 km" },
      { name: "Jalandhar City railway station", distance: "6 km" },
    ],
    featured: true,
  },
  {
    slug: "3-bhk-apartment-model-town",
    title: "3 BHK on the 4th floor, Model Town",
    type: "Apartment",
    purpose: "Buy",
    locality: "Model Town",
    price: 85_00_000,
    bhk: 3,
    baths: 3,
    area: 1640,
    areaUnit: "sq.ft",
    floor: "4th of 8",
    facing: "North-east",
    furnishing: "Unfurnished",
    parking: "1 covered",
    possession: "Immediate",
    status: "Ready",
    description: "Park-facing 3 BHK in a gated society with lift, power backup and a covered parking bay.",
    longDescription: [
      "A north-east facing 3 BHK of 1,640 sq.ft in a 2017 gated society off Model Town's main road. Three bedrooms with attached baths, a large balcony off the living room and a utility balcony off the kitchen.",
      "Society maintenance is ₹2,800 a month and covers lift, security and generator backup. Society NOC and completion certificate available.",
    ],
    amenities: ["Lift", "Power backup", "24x7 security", "Covered parking", "Children's park", "Intercom", "Rainwater harvesting"],
    images: ["photo-1522708323590-d24dbb6b0267", "photo-1484154218962-a197022b5858", "photo-1560448204-e02f11c3d0e2", "photo-1460317442991-0ec209397118"],
    trust: ["verified", "visit"],
    nearby: [
      { name: "Model Town market", distance: "600 m" },
      { name: "Apeejay School", distance: "1.5 km" },
      { name: "Civil Hospital", distance: "2.8 km" },
    ],
    featured: true,
  },
  {
    slug: "residential-plot-surya-enclave",
    title: "250 sq.yd plot, Surya Enclave",
    type: "Plot",
    purpose: "Buy",
    locality: "Surya Enclave",
    price: 1_10_00_000,
    area: 250,
    areaUnit: "sq.yd",
    facing: "North",
    possession: "Immediate",
    status: "Ready",
    description: "North-facing plot on a 40 ft road inside an approved colony, with boundary wall and registry ready.",
    longDescription: [
      "A 250 sq.yd residential plot in the approved part of Surya Enclave, on a 40 ft internal road. Boundary wall built on three sides. Electricity and sewer lines are at the plot edge.",
      "PUDA-approved layout, clear title with the original allotment letter and no dues. Registry can be done within a week of token.",
    ],
    amenities: ["Approved colony", "40 ft road", "Boundary wall", "Sewer at plot", "Street lights"],
    images: ["photo-1500382017468-9049fed747ef", "photo-1500530855697-b586d89ba3ee"],
    trust: ["verified", "rera"],
    rera: "",
    nearby: [
      { name: "Surya Enclave gate", distance: "300 m" },
      { name: "Kapurthala Road", distance: "900 m" },
      { name: "DAV University", distance: "8 km" },
    ],
    featured: true,
  },
  {
    slug: "showroom-gt-road",
    title: "Ground-floor showroom on GT Road",
    type: "Commercial",
    purpose: "Rent",
    locality: "GT Road",
    price: 1_45_000,
    area: 2200,
    areaUnit: "sq.ft",
    floor: "Ground",
    facing: "West",
    furnishing: "Bare shell",
    parking: "Front parking for 6 cars",
    possession: "Immediate",
    status: "Ready",
    description: "38 ft frontage on the main GT Road, 14 ft clear height, ideal for a bank, showroom or clinic.",
    longDescription: [
      "A 2,200 sq.ft ground-floor showroom with 38 ft of frontage directly on GT Road near Maqsudan chowk. Clear height of 14 ft, two shutters, three-phase power connection and a separate washroom block.",
      "Available on a minimum 5-year lease with a 15% escalation every 3 years. Fit-out period of 45 days is rent-free.",
    ],
    amenities: ["Main road frontage", "Three-phase power", "Front parking", "Two shutters", "Washroom block", "Signage rights"],
    images: ["photo-1486406146926-c627a92ad1ab", "photo-1497366216548-37526070297c"],
    trust: ["verified", "visit"],
    nearby: [
      { name: "Maqsudan chowk", distance: "500 m" },
      { name: "PAP chowk", distance: "3.5 km" },
      { name: "Bus stand", distance: "4 km" },
    ],
    featured: true,
  },
  {
    slug: "3-bhk-kothi-rent-jalandhar-cantt",
    title: "Independent 3 BHK kothi for rent",
    type: "Kothi",
    purpose: "Rent",
    locality: "Jalandhar Cantt",
    price: 28_000,
    bhk: 3,
    baths: 3,
    area: 1800,
    areaUnit: "sq.ft",
    floor: "Ground floor",
    facing: "South",
    furnishing: "Semi-furnished",
    parking: "1 covered",
    possession: "Immediate",
    status: "Ready",
    description: "Ground floor of a quiet kothi near the Cantt gate, with a lawn, modular kitchen and wardrobes in all rooms.",
    longDescription: [
      "Ground floor of a two-storey kothi in a quiet lane near Jalandhar Cantt gate. Three bedrooms with wardrobes, a modular kitchen with chimney and hob, and a private front lawn.",
      "Owner lives on the first floor. Preferred for families or officers; 11-month registered agreement, two months' security.",
    ],
    amenities: ["Private lawn", "Modular kitchen", "Wardrobes", "Inverter backup", "Covered parking", "Geysers in all baths"],
    images: ["photo-1568605114967-8130f3a36994", "photo-1502005229762-cf1b2da7c5d6", "photo-1600566753086-00f18fb6b3ea"],
    trust: ["verified", "visit"],
    nearby: [
      { name: "Cantt railway station", distance: "1.5 km" },
      { name: "Army Public School", distance: "2 km" },
      { name: "Military Hospital", distance: "2.5 km" },
    ],
    featured: true,
  },
  {
    slug: "2-bhk-apartment-paragpur",
    title: "2 BHK ready to move, Paragpur",
    type: "Apartment",
    purpose: "Buy",
    locality: "Paragpur",
    price: 48_00_000,
    bhk: 2,
    baths: 2,
    area: 1120,
    areaUnit: "sq.ft",
    floor: "2nd of 4",
    facing: "East",
    furnishing: "Unfurnished",
    parking: "1 open",
    possession: "Immediate",
    status: "New",
    description: "Newly built 2 BHK in a low-rise society with lift, 5 minutes from the Paragpur bypass.",
    longDescription: [
      "A new 1,120 sq.ft 2 BHK on the second floor of a four-storey society completed in 2025. Vitrified flooring, granite kitchen counter and a covered balcony.",
      "First sale from the builder with completion certificate. Home loan pre-approved by two partner banks.",
    ],
    amenities: ["Lift", "Power backup", "Gated entry", "Open parking", "Rooftop terrace"],
    images: ["photo-1560448204-e02f11c3d0e2", "photo-1484154218962-a197022b5858"],
    trust: ["verified", "rera", "visit"],
    rera: "PBRERA-SAS-79-1122",
    nearby: [
      { name: "Paragpur bypass", distance: "1 km" },
      { name: "Lovely Professional University", distance: "9 km" },
      { name: "Phagwara", distance: "12 km" },
    ],
    featured: true,
  },
  {
    slug: "farmhouse-rama-mandi",
    title: "Farmhouse on 2 kanal, Rama Mandi",
    type: "Farmhouse",
    purpose: "Buy",
    locality: "Rama Mandi",
    price: 3_20_00_000,
    bhk: 4,
    baths: 5,
    area: 1210,
    areaUnit: "sq.yd",
    floor: "Ground + 1",
    facing: "North",
    furnishing: "Fully furnished",
    parking: "4 covered",
    possession: "Immediate",
    status: "Ready",
    description: "Furnished farmhouse with a pool, lawn and a mango orchard on the Hoshiarpur road side of Rama Mandi.",
    longDescription: [
      "A 2 kanal farmhouse with a 4-bedroom furnished house, a 30 ft swimming pool, a 6,000 sq.ft lawn and 22 mango trees. The house was renovated in 2023 with new bathrooms and a modular kitchen.",
      "Suitable as a weekend home or for events. Change of land use documents available; access from a 33 ft metalled road.",
    ],
    amenities: ["Swimming pool", "Lawn", "Mango orchard", "Caretaker room", "Tube well", "Solar panels", "Generator", "Boundary wall"],
    images: ["photo-1600585154526-990dced4db0d", "photo-1613490493576-7fde63acd811", "photo-1600047509807-ba8f99d2cdde"],
    trust: ["verified", "visit"],
    nearby: [
      { name: "Rama Mandi chowk", distance: "2 km" },
      { name: "Hoshiarpur Road", distance: "800 m" },
      { name: "Jalandhar city centre", distance: "9 km" },
    ],
    featured: true,
  },
  {
    slug: "5-bhk-kothi-green-model-town",
    title: "Duplex kothi on 500 sq.yd",
    type: "Kothi",
    purpose: "Buy",
    locality: "Green Model Town",
    price: 3_75_00_000,
    bhk: 5,
    baths: 6,
    area: 500,
    areaUnit: "sq.yd",
    floor: "Ground + 2",
    facing: "West",
    furnishing: "Semi-furnished",
    parking: "3 covered",
    possession: "March 2027",
    status: "Under construction",
    description: "Under-construction duplex with a lift, home theatre and a rooftop deck, ready for possession in March 2027.",
    longDescription: [
      "A 5-bedroom duplex on a 500 sq.yd plot in Green Model Town, currently at plaster stage. A lift serves all three floors; the basement has a home theatre and a gym.",
      "Buyer can still choose flooring and kitchen finishes. Payment in three construction-linked instalments.",
    ],
    amenities: ["Lift", "Home theatre", "Gym", "Rooftop deck", "Modular kitchen", "Servant quarter", "Solar panels"],
    images: ["photo-1600573472592-401b489a3cdc", "photo-1600585154340-be6161a56a0c", "photo-1600566753190-17f0baa2a6c3"],
    trust: ["verified", "rera", "visit"],
    rera: "",
    nearby: [
      { name: "Green Model Town park", distance: "200 m" },
      { name: "Sacred Heart School", distance: "1.8 km" },
      { name: "Model Town market", distance: "2.2 km" },
    ],
    featured: true,
  },
  {
    slug: "office-space-mithapur",
    title: "Furnished office near 66 Feet Road",
    type: "Commercial",
    purpose: "Rent",
    locality: "Mithapur",
    price: 42_000,
    area: 1100,
    areaUnit: "sq.ft",
    floor: "1st",
    facing: "East",
    furnishing: "Fully furnished",
    parking: "3 open",
    possession: "Immediate",
    status: "Ready",
    description: "Plug-and-play office with 14 workstations, a cabin and a meeting room, lift access and 24-hour power backup.",
    longDescription: [
      "A 1,100 sq.ft furnished office on the first floor of a commercial building on 66 Feet Road, Mithapur. 14 workstations, one cabin, a 6-seat meeting room, pantry and washroom.",
      "Includes air conditioning, 24-hour generator backup and fibre internet wiring. Minimum 3-year lease.",
    ],
    amenities: ["14 workstations", "Meeting room", "Lift", "Generator backup", "Air conditioning", "Pantry"],
    images: ["photo-1497366216548-37526070297c", "photo-1486406146926-c627a92ad1ab"],
    trust: ["verified", "visit"],
    nearby: [
      { name: "Punjab & Sind Bank", distance: "100 m" },
      { name: "Mithapur chowk", distance: "700 m" },
      { name: "Bus stand", distance: "2.5 km" },
    ],
  },
  {
    slug: "residential-plot-urban-estate-phase-1",
    title: "200 sq.yd plot, Urban Estate Phase 1",
    type: "Plot",
    purpose: "Buy",
    locality: "Urban Estate Phase 1",
    price: 96_00_000,
    area: 200,
    areaUnit: "sq.yd",
    facing: "East",
    possession: "Immediate",
    status: "Ready",
    description: "East-facing plot in a fully developed sector, opposite a park, with PUDA allotment papers.",
    longDescription: [
      "A 200 sq.yd east-facing plot in Urban Estate Phase 1, opposite a green belt. Fully developed sector with roads, sewer and electricity in place.",
      "Original PUDA allotment and no-dues certificate available. Suitable for a ground plus two kothi.",
    ],
    amenities: ["Park facing", "Developed sector", "PUDA approved", "Sewer and water", "Wide road"],
    images: ["photo-1500530855697-b586d89ba3ee", "photo-1500382017468-9049fed747ef"],
    trust: ["verified", "rera"],
    rera: "",
    nearby: [
      { name: "Urban Estate market", distance: "700 m" },
      { name: "Wadala chowk", distance: "2 km" },
      { name: "Bus stand", distance: "4.5 km" },
    ],
  },
  {
    slug: "3-bhk-apartment-rent-maqsudan",
    title: "3 BHK society flat for rent, Maqsudan",
    type: "Apartment",
    purpose: "Rent",
    locality: "Maqsudan",
    price: 22_000,
    bhk: 3,
    baths: 2,
    area: 1450,
    areaUnit: "sq.ft",
    floor: "3rd of 6",
    facing: "North",
    furnishing: "Semi-furnished",
    parking: "1 covered",
    possession: "1 October 2026",
    status: "Ready",
    description: "Well-kept 3 BHK with wardrobes, kitchen cabinets and a covered parking slot near Maqsudan chowk.",
    longDescription: [
      "A 1,450 sq.ft 3 BHK on the third floor of a six-storey society, five minutes from Maqsudan chowk. Wardrobes in all rooms, fitted kitchen, geysers and fans included.",
      "Vacant from 1 October 2026. Registered 11-month agreement, two months' security, family tenants preferred.",
    ],
    amenities: ["Lift", "Power backup", "Security", "Covered parking", "Wardrobes"],
    images: ["photo-1484154218962-a197022b5858", "photo-1522708323590-d24dbb6b0267"],
    trust: ["verified", "visit"],
    nearby: [
      { name: "Maqsudan chowk", distance: "1 km" },
      { name: "GT Road", distance: "1.5 km" },
      { name: "DAV College", distance: "3 km" },
    ],
  },
  {
    slug: "3-bhk-kothi-mithapur",
    title: "Compact 3 BHK kothi on 150 sq.yd",
    type: "Kothi",
    purpose: "Buy",
    locality: "Mithapur",
    price: 72_00_000,
    bhk: 3,
    baths: 3,
    area: 150,
    areaUnit: "sq.yd",
    floor: "Ground + 1",
    facing: "North",
    furnishing: "Unfurnished",
    parking: "1 covered",
    possession: "Immediate",
    status: "New",
    description: "Newly built 3 BHK kothi in Mithapur, two lanes from our office, with a small front lawn and terrace.",
    longDescription: [
      "A newly completed 3 BHK kothi on a 150 sq.yd plot in Mithapur. Two bedrooms on the first floor, one on the ground, with a front lawn and covered parking.",
      "Built by a local builder we have worked with on six kothis; title and sanctioned plan verified by our legal desk.",
    ],
    amenities: ["Front lawn", "Terrace", "Covered parking", "Inverter wiring", "Borewell", "Modular kitchen"],
    images: ["photo-1564013799919-ab600027ffc6", "photo-1570129477492-45c003edd2be", "photo-1523217582562-09d0def993a6"],
    trust: ["verified", "rera", "visit"],
    rera: "",
    nearby: [
      { name: "Manav Narula Realtor office", distance: "300 m" },
      { name: "Mithapur chowk", distance: "900 m" },
      { name: "Civil Hospital", distance: "3.5 km" },
    ],
  },
];

export const featuredProperties = properties.filter((p) => p.featured).slice(0, 8);

export function getProperty(slug: string) {
  return properties.find((p) => p.slug === slug);
}

export function similarProperties(p: Property, n = 3) {
  return properties
    .filter((q) => q.slug !== p.slug)
    .sort((a, b) => {
      const score = (x: Property) => (x.type === p.type ? 2 : 0) + (x.locality === p.locality ? 2 : 0) + (x.purpose === p.purpose ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, n);
}

export function localityCounts() {
  const counts: Record<string, number> = {};
  for (const p of properties) counts[p.locality] = (counts[p.locality] ?? 0) + 1;
  return counts;
}
