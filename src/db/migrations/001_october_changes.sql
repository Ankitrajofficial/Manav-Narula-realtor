-- October changes: home loans page, localities by zone, structured property address, quick tasks, website pop-up.
-- Runs once per database (recorded in schema_migrations); every statement is also safe to re-run.
-- Statements are split on a semicolon at the end of a line.

CREATE TABLE IF NOT EXISTS partner_banks (
  id serial PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  tagline text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO partner_banks (name, tagline, sort_order) SELECT 'Partner Bank ' || n, 'Rates on request', n - 1 FROM generate_series(1, 4) AS n WHERE NOT EXISTS (SELECT 1 FROM partner_banks);

CREATE TABLE IF NOT EXISTS page_videos (
  id serial PRIMARY KEY,
  page_key text NOT NULL DEFAULT 'home_loans',
  youtube_id text NOT NULL,
  title text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS page_videos_page_idx ON page_videos(page_key, sort_order);

ALTER TABLE localities ADD COLUMN IF NOT EXISTS zone text NOT NULL DEFAULT 'Central';
ALTER TABLE localities ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
INSERT INTO localities (name, zone, sort_order) VALUES
  ('Model Town', 'Central', 0), ('Green Model Town', 'Central', 1), ('Adarsh Nagar', 'Central', 2), ('Lajpat Nagar', 'Central', 3), ('GTB Nagar', 'Central', 4), ('Defence Colony', 'Central', 5), ('Ram Nagar', 'Central', 6), ('New Jawahar Nagar', 'Central', 7), ('Old Jawahar Nagar', 'Central', 8), ('Chhoti Baradari', 'Central', 9), ('GT Road', 'Central', 10),
  ('Basti Sheikh', 'West', 20), ('Basti Danishmandan', 'West', 21), ('Nakodar Road', 'West', 22), ('Kapurthala Road', 'West', 23), ('Avtar Nagar', 'West', 24),
  ('Maqsudan', 'North', 30), ('Surya Enclave', 'North', 31), ('Ladowali Road', 'North', 32), ('Pathankot Bypass', 'North', 33),
  ('Mithapur', 'South', 40), ('Urban Estate Phase 1', 'South', 41), ('Urban Estate Phase 2', 'South', 42), ('Jalandhar Heights', 'South', 43), ('66 Feet Road', 'South', 44), ('120 Feet Road', 'South', 45), ('Garha', 'South', 46), ('Shaheed Babu Labh Singh Nagar', 'South', 47),
  ('Jalandhar Cantt', 'East', 50), ('Paragpur', 'East', 51), ('Rama Mandi', 'East', 52), ('Dakoha', 'East', 53),
  ('Kartarpur', 'Outskirts', 60), ('Adampur', 'Outskirts', 61)
  ON CONFLICT (name) DO UPDATE SET zone = EXCLUDED.zone, sort_order = EXCLUDED.sort_order;

ALTER TABLE properties ADD COLUMN IF NOT EXISTS address_line text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT 'Jalandhar';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pincode text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS maps_url text;

ALTER TABLE tasks ALTER COLUMN description DROP NOT NULL;
UPDATE tasks SET priority = CASE WHEN priority IN ('High', 'high') THEN 'high' ELSE 'normal' END;
ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT 'normal';
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('normal', 'high'));

INSERT INTO lead_sources (name) VALUES ('home_loan'), ('popup_consultation') ON CONFLICT (name) DO NOTHING;

INSERT INTO settings (key, value) VALUES
  ('popup_enabled', 'true'::jsonb),
  ('popup_headline', '"Free property consultation"'::jsonb),
  ('popup_text', '"Tell us what you need. We will suggest 3 matching properties within 24 hours."'::jsonb),
  ('popup_delay_seconds', '20'::jsonb)
  ON CONFLICT (key) DO NOTHING;

UPDATE offers SET link = '/home-loans' WHERE link = '/contact?interest=Buy' AND title ILIKE '%home loan%';
UPDATE banners SET cta_href = '/home-loans' WHERE "group" = 'offer' AND cta_href = '/contact?interest=Buy' AND headline ILIKE '%home loan%';
