-- A campaign can be about one project: a lead gets the first message about a project only once, across all campaigns.
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS project_id integer REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS campaigns_project_idx ON campaigns (project_id);

-- Follow-ups (check-ins, acknowledgements) go to the leads who received the campaign; each lead gets each follow-up once.
CREATE TABLE IF NOT EXISTS campaign_followups (
  id serial PRIMARY KEY,
  campaign_id integer NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  template_name text,
  template_language text NOT NULL DEFAULT 'en',
  created_by integer REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE campaign_messages ADD COLUMN IF NOT EXISTS followup_id integer REFERENCES campaign_followups(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS campaign_messages_lead_idx ON campaign_messages (lead_id);
CREATE INDEX IF NOT EXISTS campaign_messages_followup_idx ON campaign_messages (followup_id);
