CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  role text NOT NULL DEFAULT 'employee',
  status text NOT NULL DEFAULT 'active',
  password_hash text NOT NULL,
  must_reset boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS localities (id serial PRIMARY KEY, name text NOT NULL UNIQUE, sort_order int NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS tags (id serial PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS lead_sources (id serial PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS projects (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  developer text,
  locality text,
  status text NOT NULL DEFAULT 'Upcoming',
  image text,
  gallery jsonb NOT NULL DEFAULT '[]',
  starting_price text,
  possession text,
  key_facts jsonb NOT NULL DEFAULT '[]',
  amenities jsonb NOT NULL DEFAULT '[]',
  rera text,
  description text,
  brochure text,
  master_plan text,
  floor_plan text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS project_configurations (
  id serial PRIMARY KEY, project_id int NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type text NOT NULL, area text, price text, sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS project_milestones (
  id serial PRIMARY KEY, project_id int NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL, date date, done boolean NOT NULL DEFAULT false, sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS properties (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  type text NOT NULL,
  purpose text NOT NULL DEFAULT 'Buy',
  locality text,
  project_id int REFERENCES projects(id) ON DELETE SET NULL,
  price bigint NOT NULL DEFAULT 0,
  bhk int, baths int,
  area numeric, area_unit text NOT NULL DEFAULT 'sq.ft', super_area numeric,
  floor text, facing text, furnishing text, parking text, possession text,
  status text NOT NULL DEFAULT 'Ready',
  description text,
  long_description text,
  amenities jsonb NOT NULL DEFAULT '[]',
  trust jsonb NOT NULL DEFAULT '[]',
  rera text,
  nearby jsonb NOT NULL DEFAULT '[]',
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  meta_title text, meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS property_images (
  id serial PRIMARY KEY, property_id int NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url text NOT NULL, sort_order int NOT NULL DEFAULT 0, is_cover boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS leads (
  id serial PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  interest text,
  budget text,
  locality text,
  property_id int REFERENCES properties(id) ON DELETE SET NULL,
  project_id int REFERENCES projects(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'Website',
  status text NOT NULL DEFAULT 'New',
  assigned_to int REFERENCES users(id) ON DELETE SET NULL,
  created_by int REFERENCES users(id) ON DELETE SET NULL,
  notes text,
  tags jsonb NOT NULL DEFAULT '[]',
  whatsapp_opt_in boolean NOT NULL DEFAULT true,
  next_follow_up_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_phone_idx ON leads(phone);

CREATE TABLE IF NOT EXISTS prospects (
  id serial PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text,
  locality text,
  budget text,
  interest text,
  source text NOT NULL DEFAULT 'Data entry',
  tags jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'New',
  assigned_to int REFERENCES users(id) ON DELETE SET NULL,
  added_by int REFERENCES users(id) ON DELETE SET NULL,
  whatsapp_opt_in boolean NOT NULL DEFAULT false,
  notes text,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_activities (
  id serial PRIMARY KEY,
  lead_id int REFERENCES leads(id) ON DELETE CASCADE,
  prospect_id int REFERENCES prospects(id) ON DELETE CASCADE,
  user_id int REFERENCES users(id) ON DELETE SET NULL,
  type text NOT NULL,
  body text,
  from_status text, to_status text,
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lead_activities_lead_idx ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS lead_activities_prospect_idx ON lead_activities(prospect_id);

CREATE TABLE IF NOT EXISTS tasks (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text,
  lead_id int REFERENCES leads(id) ON DELETE SET NULL,
  prospect_id int REFERENCES prospects(id) ON DELETE SET NULL,
  assigned_to int REFERENCES users(id) ON DELETE SET NULL,
  created_by int REFERENCES users(id) ON DELETE SET NULL,
  due_date date,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS task_comments (
  id serial PRIMARY KEY, task_id int NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id int REFERENCES users(id) ON DELETE SET NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS banners (
  id serial PRIMARY KEY,
  "group" text NOT NULL DEFAULT 'carousel',
  image text,
  headline text NOT NULL,
  line text,
  cta_label text, cta_href text,
  active boolean NOT NULL DEFAULT true,
  start_date date, end_date date,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS offers (
  id serial PRIMARY KEY,
  title text NOT NULL,
  image text,
  text text,
  link text,
  property_id int REFERENCES properties(id) ON DELETE SET NULL,
  project_id int REFERENCES projects(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  start_date date, end_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS blog_posts (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text,
  author text,
  cover text,
  excerpt text,
  body text NOT NULL DEFAULT '',
  meta_title text, meta_description text,
  status text NOT NULL DEFAULT 'Draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sales (
  id serial PRIMARY KEY,
  sale_date date NOT NULL,
  lead_id int REFERENCES leads(id) ON DELETE SET NULL,
  prospect_id int REFERENCES prospects(id) ON DELETE SET NULL,
  property_id int REFERENCES properties(id) ON DELETE SET NULL,
  property_title text,
  client_name text,
  deal_value bigint NOT NULL DEFAULT 0,
  commission bigint NOT NULL DEFAULT 0,
  employee_id int REFERENCES users(id) ON DELETE SET NULL,
  notes text,
  document_url text,
  status text NOT NULL DEFAULT 'Pending approval',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_log (
  id serial PRIMARY KEY,
  user_id int REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at);

CREATE TABLE IF NOT EXISTS task_records (
  id serial PRIMARY KEY,
  task_id int NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  lead_id int REFERENCES leads(id) ON DELETE CASCADE,
  prospect_id int REFERENCES prospects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS task_records_task_idx ON task_records(task_id);
INSERT INTO task_records (task_id, lead_id) SELECT t.id, t.lead_id FROM tasks t WHERE t.lead_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM task_records r WHERE r.task_id = t.id AND r.lead_id = t.lead_id);
INSERT INTO task_records (task_id, prospect_id) SELECT t.id, t.prospect_id FROM tasks t WHERE t.prospect_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM task_records r WHERE r.task_id = t.id AND r.prospect_id = t.prospect_id);

CREATE TABLE IF NOT EXISTS campaigns (
  id serial PRIMARY KEY,
  name text NOT NULL,
  message text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text',
  template_name text,
  template_language text NOT NULL DEFAULT 'en',
  audience jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'Draft',
  scheduled_at timestamptz,
  started_at timestamptz,
  sent_at timestamptz,
  total int NOT NULL DEFAULT 0,
  sent_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  skipped_count int NOT NULL DEFAULT 0,
  created_by int REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS campaign_messages (
  id serial PRIMARY KEY,
  campaign_id int NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id int REFERENCES leads(id) ON DELETE SET NULL,
  prospect_id int REFERENCES prospects(id) ON DELETE SET NULL,
  phone text NOT NULL,
  name text,
  body text,
  status text NOT NULL DEFAULT 'Queued',
  provider_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS campaign_messages_campaign_idx ON campaign_messages(campaign_id);

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'none';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS media_filename text;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS window_start int NOT NULL DEFAULT 10;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS window_end int NOT NULL DEFAULT 19;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS daily_cap int NOT NULL DEFAULT 200;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS gap_seconds int NOT NULL DEFAULT 3;
CREATE TABLE IF NOT EXISTS campaign_templates (
  id serial PRIMARY KEY,
  name text NOT NULL,
  message text NOT NULL DEFAULT '',
  variants jsonb NOT NULL DEFAULT '[]',
  message_type text NOT NULL DEFAULT 'text',
  template_name text,
  template_language text NOT NULL DEFAULT 'en',
  media_type text NOT NULL DEFAULT 'none',
  media_url text,
  media_filename text,
  created_by int REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
