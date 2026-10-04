-- Prestige by AGI (marketed as AGI Smart Homes-II): unit sizes and blocks from the developer's floor plans.
UPDATE properties SET
  area = 1000,
  long_description = replace(long_description, E'\n\n## Specifications', E'\n\n## Configurations\n\n- 2 BHK – 1,000 sq. ft. (carpet area 753 sq. ft.), Blocks E, F, G, H, M, N, O, P\n- 3 BHK – 1,300 sq. ft. (carpet area 960 sq. ft.), Blocks I, J, K, L, Q, R, S, T\n\n## Specifications'),
  description = '2 and 3 BHK apartments at AGI Urbana with four homes per floor, 88% open and green area, a clubhouse and two-tier 24×7 security.'
WHERE slug = 'prestige-by-agi' AND long_description NOT LIKE '%## Configurations%';
