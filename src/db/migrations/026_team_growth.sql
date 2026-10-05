-- Team growth: intern / employee / executive levels, stars awarded for sales, automatic lead batches and intern certificates.
-- Every statement is safe to re-run.

-- Level is a title inside the employee console; sign-in role stays 'employee' (or 'admin').
ALTER TABLE users ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'employee';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stars int NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS promoted_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_assign boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS star_awards (
  id serial PRIMARY KEY,
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  star int NOT NULL,
  sales_count int NOT NULL DEFAULT 0,
  awarded_by int REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS star_awards_user_idx ON star_awards(user_id);

-- One batch of leads handed out automatically. A person has at most one open batch at a time.
CREATE TABLE IF NOT EXISTS lead_batches (
  id serial PRIMARY KEY,
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id int REFERENCES tasks(id) ON DELETE SET NULL,
  size int NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS lead_batches_one_open_idx ON lead_batches(user_id) WHERE completed_at IS NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS batch_id int REFERENCES lead_batches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS leads_batch_idx ON leads(batch_id);

INSERT INTO settings (key, value) VALUES ('auto_assign', '{"enabled": false, "batch_size": 5}'::jsonb) ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS skills (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO skills (name) VALUES
  ('Client communication'), ('Lead follow-up'), ('Site visits'), ('Property documentation'), ('CRM and data entry'), ('Negotiation basics')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS certificates (
  id serial PRIMARY KEY,
  code text NOT NULL UNIQUE,
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Certificate of Internship',
  skills jsonb NOT NULL DEFAULT '[]',
  start_date date,
  end_date date,
  issue_date date NOT NULL DEFAULT current_date,
  remarks text,
  issued_by int REFERENCES users(id) ON DELETE SET NULL,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS certificates_user_idx ON certificates(user_id);
