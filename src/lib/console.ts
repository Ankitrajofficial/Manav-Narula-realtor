/** Shared constants for the admin and employee consoles. */
export const LEAD_STATUSES = ["New", "Follow up", "Hot lead", "Called", "Site visit", "Closed won", "Closed lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const PILL_COLORS: Record<string, string> = {
  New: "var(--pill-grey)",
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
  { href: "/admin/leads", label: "Leads", icon: "users" },
  { href: "/admin/prospects", label: "Prospects", icon: "userPlus" },
  { href: "/admin/tasks", label: "Tasks", icon: "check" },
  { href: "/admin/campaigns", label: "Campaigns", icon: "send" },
  { href: "/admin/properties", label: "Properties", icon: "home" },
  { href: "/admin/projects", label: "Projects", icon: "layers" },
  { href: "/admin/banners", label: "Banners", icon: "image" },
  { href: "/admin/offers", label: "Offers", icon: "tag" },
  { href: "/admin/popups", label: "Pop-ups", icon: "chat" },
  { href: "/admin/home-loans", label: "Home Loans", icon: "bank" },
  { href: "/admin/blog", label: "Blog", icon: "file" },
  { href: "/admin/employees", label: "Employees", icon: "badge" },
  { href: "/admin/sales", label: "Sales", icon: "rupee" },
  { href: "/admin/reports", label: "Reports", icon: "chart" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export const employeeNav = [
  { href: "/employee", label: "My Dashboard", icon: "grid" },
  { href: "/employee/leads", label: "My Leads", icon: "users" },
  { href: "/employee/prospects", label: "My Prospects", icon: "userPlus" },
  { href: "/employee/data-entry", label: "Data Entry", icon: "edit" },
  { href: "/employee/tasks", label: "My Tasks", icon: "check" },
  { href: "/employee/sales", label: "My Sales", icon: "rupee" },
];

/** Parse a "from,to" style filter into SQL-safe date strings. */
export function dateRange(sp: Record<string, string | undefined>): { from: string | null; to: string | null } {
  const ok = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
  return { from: ok(sp.from), to: ok(sp.to) };
}

export function pageOf(sp: Record<string, string | undefined>, size = 20) {
  const page = Math.max(1, Number(sp.page) || 1);
  return { page, size, offset: (page - 1) * size };
}

export function sortOf(sp: Record<string, string | undefined>, allowed: Record<string, string>, fallback: string): { sql: string; key: string; dir: "asc" | "desc" } {
  const key = sp.sort && allowed[sp.sort] ? sp.sort : fallback;
  const dir = sp.dir === "asc" ? "asc" : "desc";
  return { sql: `${allowed[key]} ${dir} NULLS LAST`, key, dir };
}
