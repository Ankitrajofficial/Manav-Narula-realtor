-- Developer projects (Mexmon Group, AGI Infra) that Manav Narula Realtor markets. Extends the existing projects table;
-- existing columns keep their names (rera = project RERA no., published, brochure, gallery + image as cover).
-- Every statement is safe to re-run.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT 'Jalandhar';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS size_range text;
-- Whole rupees. Empty means the website shows "Price on request"; only the admin console sets it.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS price_from bigint;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location_highlights jsonb NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS featured_order int;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS seo_description text;
-- Our own page copy: short highlight points and questions/answers, written in our voice.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS faqs jsonb NOT NULL DEFAULT '[]';
-- Import bookkeeping: where the facts came from, the raw facts last imported, and the fields an admin has edited
-- (a re-import never overwrites those).
ALTER TABLE projects ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS source_facts jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS edited_fields jsonb NOT NULL DEFAULT '[]';
CREATE INDEX IF NOT EXISTS projects_developer_idx ON projects(developer);
CREATE INDEX IF NOT EXISTS projects_published_idx ON projects(published, featured);

-- No fake listings: the three demo projects from the original seed go. Matched on their exact seeded slugs only.
-- Properties and leads that pointed at them keep their rows (project_id is set to NULL by the foreign keys).
DELETE FROM projects WHERE slug IN ('narula-greens-paragpur', 'cantt-view-residency', 'surya-enclave-plots-phase-3');

-- The agent RERA number PBRERA-JAL-AGT-2024-0119 was never confirmed. Clear it wherever it was stored; the agent RERA
-- field stays in Settings, empty and not shown on the website.
UPDATE settings SET value = jsonb_set(value, '{rera}', '""'::jsonb), updated_at = now()
WHERE key = 'business' AND value->>'rera' = 'PBRERA-JAL-AGT-2024-0119';
UPDATE properties SET rera = NULL, updated_at = now() WHERE rera = 'PBRERA-JAL-AGT-2024-0119';
