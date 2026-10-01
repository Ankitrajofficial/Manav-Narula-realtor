# Manav Narula Realtor · website, admin console and employee console

Next.js 16, TypeScript, Tailwind CSS 4, one PostgreSQL database shared by the public website and both consoles.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

With no `DATABASE_URL` set, an embedded PostgreSQL (PGlite) is created in `web/.data/pglite` and seeded on first start. Delete that folder to reset to seed data. Do not run `npm run build` while the dev server is running against the embedded database; two processes on the same data folder can corrupt it. Set `DATABASE_URL` (Neon) for production; the schema in `src/db/schema.sql` is applied automatically and the seed runs only when the users table is empty.

## Consoles

| Console | URL | Seeded login |
| --- | --- | --- |
| Admin | `/admin` | Manav Narula and Komal, from `ADMIN_MANAV_*` and `ADMIN_KOMAL_*` in `.env` (see below). Without them the seeded admin@manavnarularealtor.com / Admin@1234 is used |
| Employee | `/employee` | arjun@manavnarularealtor.com / Employee@1234 (also priya@ and kiran@) |

Sign in at `/login`. There is no self sign-up; an admin creates employees under Employees. Both admins have identical permissions (every check is `role === "admin"`); an admin cannot block, delete or demote themselves, and the last active admin cannot be blocked, deleted or demoted.

The two admin accounts are created once at start-up from `ADMIN_MANAV_EMAIL` / `ADMIN_MANAV_TEMP_PASSWORD` and `ADMIN_KOMAL_EMAIL` / `ADMIN_KOMAL_TEMP_PASSWORD` (Manav's takes over the seeded admin so his history is kept). Any account with a temporary password (new accounts, Employees > Reset password, the two admins) is sent to `/change-password` at sign-in and cannot use the console until it sets its own. Admins can also change their password from Settings.

## Where things live

| Path | Holds |
| --- | --- |
| `src/app/(site)/` | Public website pages |
| `src/app/(console)/admin/`, `src/app/(console)/employee/` | Console screens; each module has `page.tsx`, `actions.ts` (server actions) and, in the admin console, an `export/route.ts` for CSV/PDF |
| `src/components/console/` | Shell, DataTable, FilterBar, Pill, forms, charts, toast, confirm buttons |
| `src/lib/db.ts`, `src/db/schema.sql`, `src/db/seed.ts` | Database connection, schema and seed |
| `src/lib/site-data.ts` | Loaders the public site uses to read banners, properties, projects, blog, settings |
| `src/lib/queries/` | SQL for each console module |
| `src/lib/pdf.ts`, `src/lib/csv.ts` | Server-side export writers |
| `src/data/` | Seed content only (the site no longer reads it directly) |
| `public/uploads/` | Uploaded images and documents (local disk; use blob storage on Vercel) |

Brand colours, fonts and status pill colours are in `src/app/globals.css` under `:root`.

## Trust numbers

The row under the brand statement on the home page reads settings key `trust_stats` (value, suffix `+`/`★`/none, label, optional link, order, active) and `founded_year`, which also sets the "since YYYY" in the tagline and footer. Admin > Settings > Trust numbers edits them; 3 to 6 can be shown and the grid fills without gaps (3, 2+2, 3+2, 3+3; two columns on phones). Values are rendered on the server and count up once when scrolled into view (not with reduced motion).

## Website pop-up

A free consultation pop-up (`src/components/ConsultationPopup.tsx`) appears once per visitor session, after the configured delay (default 20 s) or at 50% scroll, whichever comes first. It never shows on `/contact` or `/home-loans` or over another dialog, and not again for 7 days after it is closed or sent (kept in localStorage). On desktop it is a centred card, on phones a bottom sheet; Esc, the close button and clicking outside close it, and focus stays inside while open. A reply is saved as a lead with source `popup_consultation` and the pop-up then shows 3 published properties matched on interest, budget and locality (topped up with featured ones). Admin > Settings > Website pop-up turns it on or off and edits the headline, line and delay.

## Tasks

Admin > Tasks opens with a quick-add bar: type the title, tap the employee, tap a due shortcut (Today, Tomorrow, This week = coming Saturday, or Pick date), optionally High, press Enter. "+ New > Task" and "Create task from selected" open the same bar, with the selected leads or prospects shown as a removable "Linked" chip. The list is grouped Overdue / Today / Upcoming / Done; the tick box closes a task (with Undo) and unticking reopens it. Admins rename, reassign and re-date inline by tapping. Employees see the same list under My Tasks and can tick only their own tasks. Task priority is `normal` or `high`; the description column is kept in the database but no longer used.

## Mobile back arrow

Below 768px every page except the website home and the console dashboards shows a 44x44 "Go back" arrow left of the logo (`src/components/BackButton.tsx`). It uses browser history when the visitor reached the page from within the site, otherwise it goes to the logical parent: property, project or blog article to its list, other website pages to Home, console sub-pages to their list page.

## Exports

Only admins can export or download. Every export route calls `requireExporter` (`src/lib/export-guard.ts`): other roles get 403 and the attempt is written to the audit log as `export_blocked`. The old employee export URLs remain only to refuse and log; `/employee/downloads` redirects to My Dashboard.

## Database migrations

`src/db/schema.sql` creates the base tables on every start. Numbered files in `src/db/migrations/` run once each, in name order, and are recorded in `schema_migrations`. `001_october_changes.sql` adds partner banks, page videos, locality zones, the structured property address, task priority (normal/high), the home_loan and popup_consultation lead sources and the pop-up settings.

## Home loans

`/home-loans` shows partner banks, how it works, videos, a documents checklist, the loan enquiry form (saved as a lead with source `home_loan`) and an FAQ. Admin > Home Loans manages the banks (logo, name, short line, order, active) and the YouTube videos (paste any YouTube link; the id is extracted and checked). The home page offer slot rotates through every active offer in Admin > Offers.

## Localities and addresses

Localities live in the `localities` table with a zone (Central, West, North, South, East, Outskirts) and an active flag. Admin > Settings > Localities adds, renames (the new name is written to every property, project, lead and prospect that used the old one), moves between zones, reorders and deactivates them; the website updates immediately. The zones seeded for the October list are a starting point; adjust them in Settings.

Properties have a structured address: house/plot no. (`address_line`, console only), street/block, locality, city (default Jalandhar), pincode and a Google Maps link. The website shows Street/Block, Locality and City only. The website locality filter is a type-to-search list grouped by zone and lists only localities with at least one published property, with the count.

## Leads

Every website form posts to `/api/enquiry`, which validates the phone (stored as E.164), inserts a lead with source Website and writes a "created" activity. Optionally set `CRM_WEBHOOK_URL` to also forward each lead as JSON.

## WhatsApp campaigns

Admin > Settings > WhatsApp API stores the Meta Cloud API phone number ID and permanent access token (settings key `whatsapp`). Admin > Campaigns writes a message with placeholders (`{{name}}`, `{{locality}}`, `{{employee}}`...), picks an audience (prospects with opt-in, leads, filtered by status, interest, locality, tags), previews the count, then sends now or schedules. Text messages only reach people inside Meta's 24-hour window; for cold outreach create an approved template and choose "Approved template". A campaign can carry an image, a PDF brochure or an MP4 video of up to 20 seconds (sent as caption media, or as the header of a Meta template), up to two wording variants rotated per person, a sending window in IST, a daily cap and a random gap between messages; sending runs in batches and continues on later page views or cron runs. Every send is logged per recipient under the campaign and as a WhatsApp activity on the record. Only admins can see or send campaigns. Meta downloads attachments from the public site, so set `PUBLIC_URL` (or the live domain in `src/data/site.ts`) before sending media. Scheduled campaigns run when the Campaigns page is opened after the time, or on schedule if a cron calls `POST /api/campaigns/run` with header `x-cron-secret: $CRON_SECRET`.

## Environment

See `.env.example`: `DATABASE_URL`, `SESSION_SECRET` (random string that signs login cookies), `CRM_WEBHOOK_URL`, `CRON_SECRET`, and the four `ADMIN_*` values for the two admin accounts.

## Deploy (Vercel)

1. Push this repository and import it on vercel.com with root directory `web`.
2. Add `DATABASE_URL` (Neon), `SESSION_SECRET` and, if used, `CRM_WEBHOOK_URL`.
3. Replace `src/lib/upload.ts` storage with Vercel Blob or S3, since the Vercel filesystem is read-only.
4. Set the live domain in `src/data/site.ts` `url` for the sitemap and schema markup.
