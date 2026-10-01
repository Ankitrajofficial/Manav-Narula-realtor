import { hashPassword } from "@/lib/password";
import { properties } from "@/data/properties";
import { projects } from "@/data/projects";
import { articles, faqGroups } from "@/data/content";
import { banners, localities, offer, site } from "@/data/site";
import { unsplash } from "@/lib/format";

interface Client { query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: T[] }> }
const j = (v: unknown) => JSON.stringify(v);
const daysAgo = (n: number, h = 10) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 0, 0, 0); return d.toISOString(); };
const daysAhead = (n: number, h = 11) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return d.toISOString(); };
const dateOnly = (iso: string) => iso.slice(0, 10);

export async function seed(db: Client) {
  const ins = async <T = { id: number }>(text: string, params: unknown[] = []) => (await db.query<T>(text, params)).rows[0];

  const admin = await ins("INSERT INTO users (name,email,phone,role,status,password_hash,last_login_at) VALUES ($1,$2,$3,'admin','active',$4,now()) RETURNING id", ["Manav Narula", "admin@manavnarularealtor.com", "+919012290522", hashPassword("Admin@1234")]);
  const arjun = await ins("INSERT INTO users (name,email,phone,role,status,password_hash,last_login_at) VALUES ($1,$2,$3,'employee','active',$4,$5) RETURNING id", ["Arjun Mehta", "arjun@manavnarularealtor.com", "+919876500011", hashPassword("Employee@1234"), daysAgo(0, 9)]);
  const priya = await ins("INSERT INTO users (name,email,phone,role,status,password_hash,last_login_at) VALUES ($1,$2,$3,'employee','active',$4,$5) RETURNING id", ["Priya Sharma", "priya@manavnarularealtor.com", "+919876500022", hashPassword("Employee@1234"), daysAgo(1, 18)]);
  await ins("INSERT INTO users (name,email,phone,role,status,password_hash,last_login_at) VALUES ($1,$2,$3,'employee','active',$4,$5) RETURNING id", ["Kirandeep Kaur", "kiran@manavnarularealtor.com", "+919876500033", hashPassword("Employee@1234"), daysAgo(3, 12)]);

  for (const [i, l] of localities.entries()) await db.query("INSERT INTO localities (name, sort_order) VALUES ($1,$2) ON CONFLICT (name) DO NOTHING", [l, i]);
  for (const t of ["NRI", "Investor", "End user", "Plot", "Commercial", "Rental"]) await db.query("INSERT INTO tags (name) VALUES ($1)", [t]);
  for (const s of ["Website", "Walk-in", "Referral", "Facebook", "Google", "Data entry", "Import", "Phone"]) await db.query("INSERT INTO lead_sources (name) VALUES ($1)", [s]);

  const settings: Record<string, unknown> = {
    business: { name: site.name, tagline: site.tagline, phone: site.phone, whatsapp: "+919012290522", email: site.email, address: site.address, hours: site.hours, rera: site.rera, rating: site.rating, reviews: site.reviews, instagram: site.social.instagram, facebook: site.social.facebook, youtube: site.social.youtube },
    property_types: ["Kothi", "Apartment", "Plot", "Commercial", "Farmhouse"],
    notification_email: site.email,
    faqs: faqGroups,
  };
  for (const [k, v] of Object.entries(settings)) await db.query("INSERT INTO settings (key, value) VALUES ($1, $2::jsonb)", [k, j(v)]);

  const projectIds: Record<string, number> = {};
  for (const p of projects) {
    const r = await ins("INSERT INTO projects (slug,name,developer,locality,status,image,gallery,starting_price,possession,key_facts,amenities,rera,description,brochure,published) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14,true) RETURNING id",
      [p.slug, p.name, p.developer, p.locality, p.status, unsplash(p.image, 1600, 900), j(p.gallery.map((g) => unsplash(g, 800, 600))), p.startingPrice, p.possession, j(p.keyFacts), j(p.amenities), p.rera, p.description.join("\n\n"), p.brochure]);
    projectIds[p.slug] = r.id;
    for (const [i, c] of p.configurations.entries()) await db.query("INSERT INTO project_configurations (project_id,type,area,price,sort_order) VALUES ($1,$2,$3,$4,$5)", [r.id, c.type, c.area, c.price, i]);
    for (const [i, m] of p.milestones.entries()) await db.query("INSERT INTO project_milestones (project_id,title,done,sort_order) VALUES ($1,$2,$3,$4)", [r.id, m.label, m.done, i]);
  }

  const propertyIds: Record<string, number> = {};
  for (const p of properties) {
    const r = await ins("INSERT INTO properties (slug,title,type,purpose,locality,price,bhk,baths,area,area_unit,floor,facing,furnishing,parking,possession,status,description,long_description,amenities,trust,rera,nearby,featured,published) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,$20::jsonb,$21,$22::jsonb,$23,true) RETURNING id",
      [p.slug, p.title, p.type, p.purpose, p.locality, p.price, p.bhk ?? null, p.baths ?? null, p.area, p.areaUnit, p.floor ?? null, p.facing, p.furnishing ?? null, p.parking ?? null, p.possession, p.status, p.description, p.longDescription.join("\n\n"), j(p.amenities), j(p.trust), p.rera ?? null, j(p.nearby), !!p.featured]);
    propertyIds[p.slug] = r.id;
    for (const [i, img] of p.images.entries()) await db.query("INSERT INTO property_images (property_id,url,sort_order,is_cover) VALUES ($1,$2,$3,$4)", [r.id, unsplash(img, 1200, 900), i, i === 0]);
  }

  for (const [i, b] of banners.entries()) await db.query('INSERT INTO banners ("group",image,headline,line,cta_label,cta_href,active,sort_order) VALUES ($1,$2,$3,$4,$5,$6,true,$7)', ["carousel", unsplash(b.image, 1600, 900), b.headline, b.line, b.cta.label, b.cta.href, i]);
  await db.query('INSERT INTO banners ("group",image,headline,line,cta_label,cta_href,active,sort_order) VALUES ($1,$2,$3,$4,$5,$6,true,0)', ["offer", unsplash(offer.image, 1600, 700), offer.headline, offer.line, offer.cta.label, offer.cta.href]);
  await db.query("INSERT INTO offers (title,image,text,link,active) VALUES ($1,$2,$3,$4,true)", [offer.headline, unsplash(offer.image, 1600, 700), offer.line, offer.cta.href]);

  for (const a of articles) await db.query("INSERT INTO blog_posts (slug,title,category,author,cover,excerpt,body,status,published_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'Published',$8)", [a.slug, a.title, a.category, a.author, unsplash(a.cover, 1200, 900), a.excerpt, a.body.join("\n\n"), a.date]);

  // Leads over the last 30 days
  const leadSeed: [string, string, string, string, string, string, string, number | null, string | null, number][] = [
    ["Harpreet Singh", "+919815012345", "Buy", "₹1 Cr to ₹2 Cr", "Urban Estate Phase 2", "Website", "Hot lead", arjun.id, "4-bhk-kothi-urban-estate-phase-2", 1],
    ["Simran Kaur", "+919872023456", "Rent", "Rent under ₹25,000/mo", "Jalandhar Cantt", "Website", "Follow up", priya.id, "3-bhk-kothi-rent-jalandhar-cantt", 2],
    ["Rakesh Verma", "+919780034567", "Sell", "", "Model Town", "Referral", "Called", arjun.id, null, 3],
    ["Gurdeep Dhillon", "+919646045678", "Buy", "Above ₹2 Cr", "Green Model Town", "Google", "Site visit", arjun.id, "5-bhk-kothi-green-model-town", 4],
    ["Neha Arora", "+919501056789", "Buy", "Under ₹50 L", "Paragpur", "Facebook", "New", null, "2-bhk-apartment-paragpur", 0],
    ["Manpreet Gill", "+919417067890", "Buy", "₹50 L to ₹1 Cr", "Surya Enclave", "Website", "Closed won", priya.id, "residential-plot-surya-enclave", 12],
    ["Vikram Chopra", "+919888078901", "Rent", "Rent above ₹25,000/mo", "GT Road", "Walk-in", "Closed lost", arjun.id, "showroom-gt-road", 15],
    ["Amandeep Kaur", "+919814089012", "Buy", "₹50 L to ₹1 Cr", "Mithapur", "Website", "New", null, "3-bhk-kothi-mithapur", 0],
    ["Sunil Malhotra", "+919876090123", "Sell", "", "Urban Estate Phase 1", "Phone", "Follow up", priya.id, null, 6],
    ["Jasleen Bedi", "+919779001234", "Buy", "Above ₹2 Cr", "Rama Mandi", "Website", "Hot lead", arjun.id, "farmhouse-rama-mandi", 8],
    ["Rohit Sethi", "+919855012346", "Buy", "₹1 Cr to ₹2 Cr", "Model Town", "Google", "Called", priya.id, "3-bhk-apartment-model-town", 9],
    ["Karan Bhatia", "+919592023457", "Rent", "Rent under ₹25,000/mo", "Maqsudan", "Website", "New", null, "3-bhk-apartment-rent-maqsudan", 1],
    ["Pooja Khanna", "+919463034568", "Buy", "Under ₹50 L", "Paragpur", "Facebook", "Follow up", arjun.id, null, 20],
    ["Deepak Sharma", "+919357045679", "Buy", "₹50 L to ₹1 Cr", "Urban Estate Phase 1", "Referral", "Closed won", arjun.id, "residential-plot-urban-estate-phase-1", 25],
  ];
  const leadIds: number[] = [];
  for (const [name, phone, interest, budget, locality, source, status, assigned, propSlug, ago] of leadSeed) {
    const created = daysAgo(ago, 9 + (ago % 8));
    const follow = status === "Follow up" ? (ago % 2 === 0 ? daysAgo(1, 11) : daysAhead(0, 16)) : status === "Hot lead" ? daysAhead(1, 12) : null;
    const r = await ins("INSERT INTO leads (name,phone,interest,budget,locality,property_id,source,status,assigned_to,created_by,next_follow_up_at,created_at,last_activity_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12,$12) RETURNING id",
      [name, phone, interest, budget || null, locality, propSlug ? propertyIds[propSlug] : null, source, status, assigned, source === "Website" ? null : admin.id, follow, created]);
    leadIds.push(r.id);
    await db.query("INSERT INTO lead_activities (lead_id,user_id,type,body,to_status,created_at) VALUES ($1,$2,'created',$3,'New',$4)", [r.id, source === "Website" ? null : admin.id, `Lead received from ${source}`, created]);
    if (assigned) await db.query("INSERT INTO lead_activities (lead_id,user_id,type,body,created_at) VALUES ($1,$2,'assign',$3,$4)", [r.id, admin.id, `Assigned to ${assigned === arjun.id ? "Arjun Mehta" : "Priya Sharma"}`, created]);
    if (status !== "New") await db.query("INSERT INTO lead_activities (lead_id,user_id,type,body,from_status,to_status,created_at) VALUES ($1,$2,'status',$3,'New',$4,$5)", [r.id, assigned ?? admin.id, `Status changed to ${status}`, status, daysAgo(Math.max(ago - 1, 0), 15)]);
    if (follow) await db.query("INSERT INTO lead_activities (lead_id,user_id,type,body,scheduled_at,created_at) VALUES ($1,$2,'follow_up',$3,$4,$5)", [r.id, assigned ?? admin.id, "Follow-up scheduled", follow, daysAgo(Math.max(ago - 1, 0), 16)]);
  }

  const prospectSeed: [string, string, string, string, string, string[], string, number | null, boolean, number][] = [
    ["Balwinder Singh", "+919814100001", "Urban Estate Phase 2", "₹1 Cr to ₹2 Cr", "Buy", ["NRI", "End user"], "New", priya.id, true, 2],
    ["Ritu Mahajan", "+919814100002", "Model Town", "Above ₹2 Cr", "Buy", ["Investor"], "Follow up", arjun.id, true, 5],
    ["Sukhwinder Kaur", "+919814100003", "Paragpur", "Under ₹50 L", "Buy", ["Plot", "End user"], "Called", priya.id, false, 7],
    ["Anil Kapoor", "+919814100004", "GT Road", "Rent above ₹25,000/mo", "Rent", ["Commercial"], "Hot lead", arjun.id, true, 3],
    ["Navjot Sidhu", "+919814100005", "Surya Enclave", "₹50 L to ₹1 Cr", "Buy", ["Plot"], "New", null, true, 1],
    ["Meera Chawla", "+919814100006", "Jalandhar Cantt", "Rent under ₹25,000/mo", "Rent", ["Rental"], "Follow up", priya.id, true, 4],
    ["Tarun Bajaj", "+919814100007", "Green Model Town", "Above ₹2 Cr", "Buy", ["NRI", "Investor"], "New", arjun.id, false, 0],
    ["Harjit Randhawa", "+919814100008", "Mithapur", "₹50 L to ₹1 Cr", "Sell", ["End user"], "Closed lost", arjun.id, false, 18],
  ];
  for (const [name, phone, locality, budget, interest, tags, status, assigned, optIn, ago] of prospectSeed) {
    const created = daysAgo(ago, 12);
    const follow = status === "Follow up" ? daysAhead(0, 15) : null;
    const r = await ins("INSERT INTO prospects (name,phone,locality,budget,interest,source,tags,status,assigned_to,added_by,whatsapp_opt_in,next_follow_up_at,last_contacted_at,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,'Data entry',$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$13) RETURNING id",
      [name, phone, locality, budget, interest, j(tags), status, assigned, assigned ?? admin.id, optIn, follow, status === "New" ? null : daysAgo(Math.max(ago - 1, 0), 14), created]);
    await db.query("INSERT INTO lead_activities (prospect_id,user_id,type,body,to_status,created_at) VALUES ($1,$2,'created','Added by data entry','New',$3)", [r.id, assigned ?? admin.id, created]);
  }

  const taskSeed: [string, number, number | null, "normal" | "high", string, number][] = [
    ["Call back Harpreet Singh about the corner kothi", arjun.id, leadIds[0], "high", "In progress", 0],
    ["Collect valuation documents from Rakesh Verma", arjun.id, leadIds[2], "normal", "Open", 1],
    ["Confirm Sunday site visit for Gurdeep Dhillon", arjun.id, leadIds[3], "high", "Open", 2],
    ["Send rent agreement draft to Simran Kaur", priya.id, leadIds[1], "normal", "Done", -1],
    ["Update NRI prospect list with WhatsApp opt-in", priya.id, null, "normal", "Open", 5],
    ["Follow up Pooja Khanna, no answer twice", arjun.id, leadIds[12], "normal", "Open", -2],
  ];
  for (const [title, assigned, leadId, priority, status, dueIn] of taskSeed) {
    await db.query("INSERT INTO tasks (title,lead_id,assigned_to,created_by,due_date,priority,status) VALUES ($1,$2,$3,$4,$5,$6,$7)", [title, leadId, assigned, admin.id, dateOnly(daysAhead(dueIn)), priority, status]);
  }

  await db.query("INSERT INTO sales (sale_date,lead_id,property_id,property_title,client_name,deal_value,commission,employee_id,status,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Approved',$9)", [dateOnly(daysAgo(10)), leadIds[5], propertyIds["residential-plot-surya-enclave"], "250 sq.yd plot, Surya Enclave", "Manpreet Gill", 1_10_00_000, 1_10_000, priya.id, "Registry done at Jalandhar sub-registrar."]);
  await db.query("INSERT INTO sales (sale_date,lead_id,property_id,property_title,client_name,deal_value,commission,employee_id,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Approved')", [dateOnly(daysAgo(22)), leadIds[13], propertyIds["residential-plot-urban-estate-phase-1"], "200 sq.yd plot, Urban Estate Phase 1", "Deepak Sharma", 96_00_000, 96_000, arjun.id]);
  await db.query("INSERT INTO sales (sale_date,property_title,client_name,deal_value,commission,employee_id,status,notes) VALUES ($1,$2,$3,$4,$5,$6,'Pending approval',$7)", [dateOnly(daysAgo(2)), "3 BHK society flat, Maqsudan (rental)", "Karan Bhatia", 22_000, 11_000, priya.id, "Half month rent from tenant side."]);

  await db.query("INSERT INTO audit_log (user_id,action,entity,details) VALUES ($1,'seed','database',$2::jsonb)", [admin.id, j({ note: "Initial data loaded from website content files" })]);
}
