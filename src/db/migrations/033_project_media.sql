-- Every project image with its alt text and the section it belongs to:
-- [{ "url": "/projects/<slug>/elevation-01.webp", "alt": "...", "kind": "elevation" }, ...]
-- kind: elevation (hero + gallery; the first is the cover), interior, gallery, floor-plan, master-plan, amenity, location-map.
-- Managed in Admin > Projects > Images; image, gallery, floor_plans and master_plan are kept in step with it.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]';
