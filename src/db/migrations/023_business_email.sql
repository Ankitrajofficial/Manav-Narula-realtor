-- Public contact email is the business Gmail. Only replaces the old placeholder address, never an email an admin set.
UPDATE settings SET value = jsonb_set(value, '{email}', '"realtormanavnarula@gmail.com"'), updated_at = now()
WHERE key = 'business' AND value->>'email' = 'hello@manavnarularealtor.com';
UPDATE settings SET value = '"realtormanavnarula@gmail.com"'::jsonb, updated_at = now()
WHERE key = 'notification_email' AND value #>> '{}' = 'hello@manavnarularealtor.com';
