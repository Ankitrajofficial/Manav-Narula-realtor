-- Uploaded files live in the database. Next.js only serves files that were in public/ at build time, and hosts such as
-- Hostinger replace the app folder on every deploy, so files written to public/uploads after a deploy never load.
CREATE TABLE IF NOT EXISTS media (
  name text PRIMARY KEY,
  content_type text NOT NULL,
  size int NOT NULL,
  data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Website pop-ups, managed under Admin → Pop-ups. kind: 'promo' (image, text and a button) or 'consultation' (the free
-- consultation lead form). pages: 'all', 'home', or one path per line (a path also matches the pages below it).
CREATE TABLE IF NOT EXISTS popups (
  id serial PRIMARY KEY,
  kind text NOT NULL DEFAULT 'promo' CHECK (kind IN ('promo', 'consultation')),
  title text NOT NULL,
  text text,
  image text,
  cta_label text,
  cta_href text,
  pages text NOT NULL DEFAULT 'all',
  delay_seconds int NOT NULL DEFAULT 8,
  start_date date,
  end_date date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The existing consultation pop-up (Settings → Website pop-up) becomes the first pop-up, with its current wording and on/off state.
INSERT INTO popups (kind, title, text, delay_seconds, active)
SELECT 'consultation',
  COALESCE(NULLIF((SELECT value #>> '{}' FROM settings WHERE key = 'popup_headline'), ''), 'Free property consultation'),
  COALESCE(NULLIF((SELECT value #>> '{}' FROM settings WHERE key = 'popup_text'), ''), 'Tell us what you need. We will suggest 3 matching properties within 24 hours.'),
  COALESCE((SELECT (value #>> '{}')::int FROM settings WHERE key = 'popup_delay_seconds'), 20),
  COALESCE((SELECT (value #>> '{}')::boolean FROM settings WHERE key = 'popup_enabled'), true)
WHERE NOT EXISTS (SELECT 1 FROM popups);
