-- Data entry records which developer project a prospect is interested in (AGI Infra, Mexmon Group, ...), like leads do.
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS project_id int REFERENCES projects(id) ON DELETE SET NULL;
