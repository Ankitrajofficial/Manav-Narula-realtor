-- Facebook / Instagram Lead Ads (instant forms). Meta POSTs a "leadgen" change to /api/leads/facebook for every form
-- submission; the change is saved here as-is BEFORE anything else happens, so a lead is never lost even if fetching its
-- details from the Graph API fails (it is retried on later deliveries and by /api/leads/facebook/sync). leadgen_id is
-- Meta's id for the submission, so a repeated delivery or a re-sync never creates the same lead twice.
CREATE TABLE IF NOT EXISTS facebook_leads (
  id serial PRIMARY KEY,
  leadgen_id text NOT NULL UNIQUE,
  page_id text,
  form_id text,
  ad_id text,
  change jsonb,
  detail jsonb,
  lead_id int REFERENCES leads(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  error text,
  attempts int NOT NULL DEFAULT 0,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX IF NOT EXISTS facebook_leads_status_idx ON facebook_leads (status, received_at);
INSERT INTO lead_sources (name) VALUES ('Facebook') ON CONFLICT (name) DO NOTHING;
INSERT INTO lead_sources (name) VALUES ('Instagram') ON CONFLICT (name) DO NOTHING;
