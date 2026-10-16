-- Staff sign in with a 6-digit PIN instead of a password. Existing accounts keep their password until they sign in once
-- and set a PIN (pin_set). Wrong PINs lock the account for a while (failed_logins, locked_until). Employees reset a
-- forgotten PIN themselves with a one-time code emailed through the Google Apps Script mail sender (pin_reset_codes).
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_set boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_logins int NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until timestamptz;

CREATE TABLE IF NOT EXISTS pin_reset_codes (
  id serial PRIMARY KEY,
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pin_reset_codes_user_idx ON pin_reset_codes (user_id, created_at DESC);
