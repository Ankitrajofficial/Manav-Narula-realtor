-- Developer projects, part 2: what the importer needs that the projects table did not hold yet, and the clean-up of the
-- demo property listings. Every statement is safe to re-run.

-- Floor plans per project ({url, label} items, as on property listings) so the AGI projects keep theirs.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS floor_plans jsonb NOT NULL DEFAULT '[]';
-- A short line per configuration, e.g. "Suits nuclear families".
ALTER TABLE project_configurations ADD COLUMN IF NOT EXISTS note text;

-- Mexmon Dreams-1 is on Sahibzada Ajit Singh Nagar Road. Added under Outskirts until its zone is confirmed in Settings.
INSERT INTO localities (name, zone, sort_order) VALUES ('Sahibzada Ajit Singh Nagar Road', 'Outskirts', 90) ON CONFLICT (name) DO NOTHING;

-- No fake listings: the 12 demo properties from the original seed go (images cascade; leads, sales and offers that pointed
-- at them keep their rows with property_id cleared). Matched on their exact seeded slugs only, the same list as 024.
DELETE FROM properties WHERE slug IN (
  '4-bhk-kothi-urban-estate-phase-2', '3-bhk-apartment-model-town', 'residential-plot-surya-enclave', 'showroom-gt-road',
  '3-bhk-kothi-rent-jalandhar-cantt', '2-bhk-apartment-paragpur', 'farmhouse-rama-mandi', '5-bhk-kothi-green-model-town',
  'office-space-mithapur', 'residential-plot-urban-estate-phase-1', '3-bhk-apartment-rent-maqsudan', '3-bhk-kothi-mithapur');
