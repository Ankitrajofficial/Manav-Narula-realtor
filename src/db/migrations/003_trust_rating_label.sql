-- Shorter label for the Google rating trust number (only if it still has the original text).
UPDATE settings SET value = (
  SELECT jsonb_agg(CASE WHEN s->>'label' = 'Google rating (21 reviews)' THEN jsonb_set(s, '{label}', '"Google rating"') ELSE s END ORDER BY ord)
  FROM jsonb_array_elements(value) WITH ORDINALITY AS t(s, ord)
), updated_at = now() WHERE key = 'trust_stats' AND value::text LIKE '%Google rating (21 reviews)%';
