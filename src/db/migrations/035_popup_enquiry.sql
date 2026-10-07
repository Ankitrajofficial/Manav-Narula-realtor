-- Pop-ups can also be a plain enquiry form (lead collection), optionally about one project.
ALTER TABLE popups DROP CONSTRAINT IF EXISTS popups_kind_check;
ALTER TABLE popups ADD CONSTRAINT popups_kind_check CHECK (kind IN ('promo', 'consultation', 'enquiry'));
ALTER TABLE popups ADD COLUMN IF NOT EXISTS project_id integer REFERENCES projects(id) ON DELETE SET NULL;

-- Lead sources for the leads filter: enquiry pop-ups, and the project pages' enquiry form.
INSERT INTO lead_sources (name) VALUES ('popup_enquiry'), ('project_page') ON CONFLICT (name) DO NOTHING;
