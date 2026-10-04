-- Keep the six AGI projects first on the home page, in this order, on every database. The home page lists featured
-- properties newest first, and on a brand-new database the demo listings are created within the same seconds as these,
-- so date them just after the newest listing instead of relying on one-second steps.
UPDATE properties p SET updated_at = base.t - v.n * interval '1 second'
FROM (SELECT GREATEST(now(), max(updated_at)) + interval '10 seconds' AS t FROM properties) base,
  (VALUES ('jalandhar-heights-iv', 0), ('jalandhar-heights-ii', 1), ('prestige-by-agi', 2), ('agi-sky-villas', 3), ('agi-sky-garden', 4), ('jalandhar-heights-iii', 5)) AS v(slug, n)
WHERE p.slug = v.slug;
