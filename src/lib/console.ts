/** Shared constants for the admin and employee consoles. */
export const LEAD_STATUSES = ["New", "First time contact", "Second time contact", "Warm lead", "Hot lead", "Follow up", "Called", "Site visit", "Closed won", "Closed lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const PILL_COLORS: Record<string, string> = {
  New: "var(--pill-grey)",
  "First time contact": "var(--pill-blue)",
  "Second time contact": "var(--pill-blue)",
  "Warm lead": "var(--pill-amber)",
  "Follow up": "var(--pill-amber)",
  "Hot lead": "var(--pill-green)",
  Called: "var(--pill-blue)",
  "Site visit": "var(--pill-blue)",
  "Closed won": "var(--pill-darkgreen)",
  "Closed lost": "var(--pill-red)",
  Blocked: "var(--pill-red)",
  Active: "var(--pill-darkgreen)",
  Open: "var(--pill-grey)",
  "In progress": "var(--pill-blue)",
  Done: "var(--pill-darkgreen)",
  Draft: "var(--pill-grey)",
  Published: "var(--pill-darkgreen)",
  "Pending approval": "var(--pill-amber)",
  Approved: "var(--pill-darkgreen)",
  High: "var(--pill-red)",
  Normal: "var(--pill-grey)",
  Medium: "var(--pill-amber)",
  Low: "var(--pill-grey)",
  Ready: "var(--pill-darkgreen)",
  "Under construction": "var(--pill-amber)",
  Upcoming: "var(--pill-blue)",
  Overdue: "var(--pill-red)",
  Scheduled: "var(--pill-blue)",
  Sending: "var(--pill-amber)",
  Paused: "var(--pill-grey)",
  Sent: "var(--pill-darkgreen)",
  Failed: "var(--pill-red)",
  Queued: "var(--pill-grey)",
  Skipped: "var(--pill-amber)",
  Connected: "var(--pill-darkgreen)",
  "Not connected": "var(--pill-grey)",
  Admin: "var(--ink)",
  Employee: "var(--pill-blue)",
  Intern: "var(--pill-amber)",
  Executive: "var(--pill-darkgreen)",
  "Star due": "var(--pill-amber)",
  "Ready for promotion": "var(--pill-green)",
  Valid: "var(--pill-darkgreen)",
  Revoked: "var(--pill-red)",
};

export const INTERESTS = ["Buy", "Sell", "Rent"] as const;
export const BUDGETS = ["Under ₹50 L", "₹50 L to ₹1 Cr", "₹1 Cr to ₹2 Cr", "Above ₹2 Cr", "Rent under ₹25,000/mo", "Rent above ₹25,000/mo"];
export const TASK_STATUSES = ["Open", "In progress", "Done"] as const;
export const PRIORITIES = ["normal", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const priorityLabel = (p: string) => (p === "high" ? "High" : "Normal");
export const PROPERTY_STATUSES = ["Ready", "Under construction", "New"] as const;
export const PROJECT_STATUSES = ["Upcoming", "Under construction", "Ready"] as const;
export const AMENITY_OPTIONS = ["Modular kitchen", "Servant quarter", "Solar water heater", "Solar panels", "Inverter backup", "Generator backup", "Borewell", "Terrace garden", "Lawn", "CCTV wiring", "Park facing", "Lift", "Power backup", "24x7 security", "Covered parking", "Open parking", "Children's park", "Intercom", "Rainwater harvesting", "Swimming pool", "Gym", "Clubhouse", "Wardrobes", "Geysers in all baths", "Air conditioning", "Boundary wall", "Approved colony", "Wide road", "Sewer and water", "Street lights", "Main road frontage", "Three-phase power", "Signage rights", "Pantry", "Meeting room"];

export const adminNav = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/leads", label: "Leads", icon: "users", group: "Sales" },
  { href: "/admin/tasks", label: "Tasks", icon: "check", group: "Sales" },
  { href: "/admin/sales", label: "Sales", icon: "rupee", group: "Sales" },
  { href: "/admin/campaigns", label: "Campaigns", icon: "send", group: "Marketing" },
  { href: "/admin/ad-links", label: "Ad links", icon: "link", group: "Marketing" },
  // Developer projects are part of Properties (as on the website); their editor lives under /admin/projects/<id>.
  { href: "/admin/properties", label: "Properties", icon: "home", also: ["/admin/projects"], group: "Website" },
  { href: "/admin/developers", label: "Developers", icon: "kanban", group: "Website" },
  { href: "/admin/banners", label: "Banners", icon: "image", group: "Website" },
  { href: "/admin/offers", label: "Offers", icon: "tag", group: "Website" },
  { href: "/admin/popups", label: "Pop-ups", icon: "chat", group: "Website" },
  { href: "/admin/home-loans", label: "Home Loans", icon: "bank", group: "Website" },
  { href: "/admin/blog", label: "Blog", icon: "file", group: "Website" },
  { href: "/admin/team", label: "Website team", icon: "users", group: "Website" },
  { href: "/admin/employees", label: "Employees", icon: "badge", group: "Staff" },
  { href: "/admin/auto-assign", label: "Auto-assign", icon: "manage", group: "Staff" },
  { href: "/admin/certificates", label: "Certificates", icon: "shield", group: "Staff" },
  { href: "/admin/reports", label: "Reports", icon: "chart", group: "Business" },
  { href: "/admin/settings", label: "Settings", icon: "settings", group: "Business" },
];

export const employeeNav = [
  { href: "/employee", label: "My Dashboard", icon: "grid" },
  { href: "/employee/leads", label: "Leads", icon: "users" },
  { href: "/employee/tasks", label: "My Tasks", icon: "check" },
  { href: "/employee/sales", label: "My Sales", icon: "rupee" },
  { href: "/employee/blog", label: "My Blog", icon: "file" },
];

/** Parse a "from,to" style filter into SQL-safe date strings. */
export function dateRange(sp: Record<string, string | undefined>): { from: string | null; to: string | null } {
  const ok = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
  return { from: ok(sp.from), to: ok(sp.to) };
}

export function pageOf(sp: Record<string, string | undefined>, size = 20) {
  const page = Math.min(1_000_000, Math.max(1, Math.floor(Number(sp.page)) || 1));
  return { page, size, offset: (page - 1) * size };
}

export function sortOf(sp: Record<string, string | undefined>, allowed: Record<string, string>, fallback: string): { sql: string; key: string; dir: "asc" | "desc" } {
  const key = sp.sort && Object.hasOwn(allowed, sp.sort) ? sp.sort : fallback;
  const dir = sp.dir === "asc" ? "asc" : "desc";
  return { sql: `${allowed[key]} ${dir} NULLS LAST`, key, dir };
}
