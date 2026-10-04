-- Master plans and per-unit floor plans for Jalandhar Heights IV, Jalandhar Heights II and Prestige by AGI, from AGI Infra's project pages.
-- A property can now list several captioned floor plans; the single floor_plan field from the console is shown after them.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_plans jsonb NOT NULL DEFAULT '[]';

UPDATE properties SET
  master_plan = '/properties/jalandhar-heights-iv/master-plan.jpg',
  floor_plans = '[{"url": "/properties/jalandhar-heights-iv/floor-plan-3bhk.webp", "label": "3 BHK – 1,800 sq. ft., Blocks I, J, K, L"}, {"url": "/properties/jalandhar-heights-iv/floor-plan-4bhk.webp", "label": "4 BHK – 2,500 sq. ft., Blocks D, E, F"}, {"url": "/properties/jalandhar-heights-iv/floor-plan-4plus1bhk.webp", "label": "4+1 BHK – 2,800 sq. ft., Blocks C, G, H"}, {"url": "/properties/jalandhar-heights-iv/floor-plan-5plus1bhk.webp", "label": "5+1 BHK – 3,600 sq. ft., Blocks A, B"}]'::jsonb
WHERE slug = 'jalandhar-heights-iv';

UPDATE properties SET
  master_plan = '/properties/jalandhar-heights-ii/master-plan.webp',
  floor_plans = '[{"url": "/properties/jalandhar-heights-ii/floor-plan-2bhk.webp", "label": "2 BHK – 1,330 sq. ft., Blocks D, E, F"}, {"url": "/properties/jalandhar-heights-ii/floor-plan-3bhk.webp", "label": "3 BHK – 1,600 sq. ft., Blocks A, B, C, L, M, N"}, {"url": "/properties/jalandhar-heights-ii/floor-plan-4bhk-2400.webp", "label": "4 BHK – 2,400 sq. ft., Blocks G, H, I, J, K"}, {"url": "/properties/jalandhar-heights-ii/floor-plan-4bhk-2150.webp", "label": "4 BHK – 2,150 sq. ft., Blocks O, P, Q"}]'::jsonb
WHERE slug = 'jalandhar-heights-ii';

-- Prestige is 3 BHK only (towers A–F, four homes per floor). Migration 012 used AGI Smart Homes-II's sizes by mistake: replace them.
UPDATE properties SET
  master_plan = '/properties/prestige-by-agi/master-plan.jpg',
  floor_plans = '[{"url": "/properties/prestige-by-agi/floor-plan-3bhk.jpg", "label": "3 BHK – 1,300 sq. ft. (carpet area 960 sq. ft.)"}]'::jsonb,
  area = 1300,
  bhk = 3,
  long_description = replace(long_description, E'- 2 BHK – 1,000 sq. ft. (carpet area 753 sq. ft.), Blocks E, F, G, H, M, N, O, P\n- 3 BHK – 1,300 sq. ft. (carpet area 960 sq. ft.), Blocks I, J, K, L, Q, R, S, T', E'- 3 BHK – 1,300 sq. ft. (carpet area 960 sq. ft.), Towers A to F, four homes per floor'),
  description = '3 BHK apartments at AGI Urbana with four homes per floor, 88% open and green area, a clubhouse and two-tier 24×7 security.'
WHERE slug = 'prestige-by-agi';
