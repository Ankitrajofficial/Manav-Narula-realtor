-- Properties can carry their own master plan and floor plan images, shown in their own sections on the property page.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS master_plan text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_plan text;

UPDATE properties SET meta_title = COALESCE(meta_title, 'Jalandhar Heights IV | Luxury 3, 4 & 5 BHK Apartments | Premium Flats for Sale in Jalandhar')
WHERE slug = 'jalandhar-heights-iv';
