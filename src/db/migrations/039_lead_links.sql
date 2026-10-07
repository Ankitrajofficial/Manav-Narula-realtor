-- Ad links: a short URL per Facebook / Instagram ad (/l/<slug>) with its own enquiry page. Leads from it carry the
-- link's channel as their source and the link id, so each ad's visits and leads can be counted.
CREATE TABLE IF NOT EXISTS lead_links (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'Facebook',
  project_id integer REFERENCES projects(id) ON DELETE SET NULL,
  headline text,
  intro text,
  active boolean NOT NULL DEFAULT true,
  visits integer NOT NULL DEFAULT 0,
  created_by integer REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS link_id integer REFERENCES lead_links(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS leads_link_idx ON leads (link_id);
INSERT INTO lead_sources (name) VALUES ('Facebook'), ('Instagram'), ('WhatsApp'), ('Google') ON CONFLICT (name) DO NOTHING;
