-- Prospects were merged into leads. This keeps which prospect a lead came from, so old links and notifications still open the right record.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS merged_from_prospect_id int;
CREATE INDEX IF NOT EXISTS leads_merged_from_idx ON leads(merged_from_prospect_id);
