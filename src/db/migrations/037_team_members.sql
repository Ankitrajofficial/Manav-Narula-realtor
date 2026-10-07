-- "The team" on the About page, managed in Admin → Team. Starts empty, so the section stays hidden until members are added.
CREATE TABLE IF NOT EXISTS team_members (
  id serial PRIMARY KEY,
  name text NOT NULL,
  role text,
  bio text,
  photo text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
