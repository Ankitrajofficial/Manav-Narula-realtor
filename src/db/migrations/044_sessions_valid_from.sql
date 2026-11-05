-- Cookies issued before this moment stop working: set on log out and whenever a PIN changes.
ALTER TABLE users ADD COLUMN IF NOT EXISTS sessions_valid_from timestamptz;
