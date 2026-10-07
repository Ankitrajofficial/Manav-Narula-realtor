-- Developers as their own records; projects link to one by developer_id (projects.developer keeps the name for display).
CREATE TABLE IF NOT EXISTS developers (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  website text,
  -- We never show a developer's logo unless they have given written permission.
  logo_permission boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO developers (name, slug, website, description) VALUES
  ('Mexmon Group', 'mexmon-group', 'https://mexmongroup.com', 'Jalandhar developer behind Mexmon Dreams, Mexmon Dreams-1, Mexmon Highstreet and Mexmon Palm City: apartments, plots, villas and SCOs, mostly on and around 66 Feet Road.'),
  ('AGI Infra', 'agi-infra', 'https://www.agiinfra.com', 'Developer of the Jalandhar Heights series, AGI Sky Garden, Prestige by AGI and AGI Sky Villas in Jalandhar and Ludhiana.')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS developer_id integer REFERENCES developers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS projects_developer_id_idx ON projects (developer_id);

UPDATE projects p SET developer_id = d.id FROM developers d
WHERE p.developer_id IS NULL AND (lower(p.developer) = lower(d.name) OR (d.slug = 'mexmon-group' AND p.slug LIKE 'mexmon-%') OR (d.slug = 'agi-infra' AND p.slug LIKE 'agi-%'));

UPDATE projects p SET developer = d.name FROM developers d WHERE p.developer_id = d.id AND p.developer IS DISTINCT FROM d.name;

-- Unit types shown as tabs on the project page and as their own SEO pages (/projects/<slug>/<unit slug>).
ALTER TABLE projects ADD COLUMN IF NOT EXISTS units jsonb NOT NULL DEFAULT '[]';

-- Images supplied by the developer stay hidden until we have their written permission; this switch shows them all.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS show_developer_images boolean NOT NULL DEFAULT false;
