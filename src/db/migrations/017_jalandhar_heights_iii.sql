-- Jalandhar Heights III in Pholriwal, featured sixth on the home page (after AGI Sky Garden). Price is on request.
INSERT INTO properties (slug, title, type, purpose, locality, street, city, price, area, area_unit, status, description, long_description, amenities, trust, nearby, featured, published, meta_title, master_plan, floor_plans, created_at, updated_at)
SELECT
  'jalandhar-heights-iii',
  'Jalandhar Heights III by AGI Infra',
  'Apartment', 'Buy', 'Jalandhar Heights', 'Pholriwal', 'Jalandhar', 0, 1720, 'sq.ft', 'New',
  '3 BHK, 4 BHK and duplex apartments in Pholriwal, built with Mivan technology, with 84% open and green area and two-tier 24×7 security.',
  'AGI INFRA LIMITED proudly introduces Jalandhar Heights III, an exclusive residential project offering ultra-luxury living with spacious 3 BHK (1,720 sq. ft.) and 4 BHK (2,800 sq. ft.) apartments, including elegant duplex units. Located in the serene and well-connected Pholriwal area of Jalandhar, this gated community combines modern architectural brilliance with lush greenery and world-class amenities for an unmatched lifestyle.

Choose from thoughtfully designed 3 BHK apartments in Blocks A, B, C, and D, or opt for the premium 4 BHK apartments located in Blocks F and H and duplex units in Blocks D-I to D-IV. Each residence features high-quality finishes such as modular kitchens with quartz tops, premium vitrified tiles, gypsum false ceilings with LED lights, UPVC windows with tempered glass and steel mesh, and fully furnished bedrooms with cupboards and dressing tables.

The bathrooms come with anti-skid vitrified tiles, glass shower cabins, branded fittings, and ventilators to provide a luxurious and comfortable living experience.

Jalandhar Heights III offers an impressive array of amenities, including a clubhouse, swimming pool, gymnasium, banquet hall, jogging track, and sports courts for basketball, badminton, and tennis. Safety is paramount, with a manned grand entrance, two-tier 24×7 security, CCTV surveillance at key points, and trained security personnel ensuring complete peace of mind. Multi-level basement parking and high-speed lifts equipped with CCTV and intercom further enhance the convenience and security of residents.

Located within a well-planned township, Jalandhar Heights III is surrounded by lush landscaping and ornamental gardens, creating a tranquil living environment. Residents enjoy a reliable 24-hour water supply, power backup, and excellent infrastructure support. The project also features community spaces, a vibrant marketplace, and nearby entertainment options, making it an ideal home for families seeking premium living in Jalandhar.

Discover the perfect place to call home at Jalandhar Heights III—where luxury, safety, and convenience come together seamlessly. Whether you desire a spacious 3 BHK apartment or a lavish 4 BHK apartment or duplex, this project is thoughtfully designed to meet your every need with style and sophistication. Invest in a premium lifestyle within one of Jalandhar’s most sought-after residential communities.

## Why choose Jalandhar Heights III?

- 3 BHK, 4 BHK and Duplex apartments designed for modern living
- Built with advanced Mivan construction technology, ensuring strength and durability
- World-class amenities, including a clubhouse, swimming pool, gym, banquet hall and sports courts
- 24×7 manned security with CCTV surveillance and a secure grand entrance for complete peace of mind
- Prime location in Pholriwal, with excellent connectivity to schools, hospitals and markets
- 84% open and green area
- High-speed lifts with intercom and power backup for convenience and safety
- Gated community offering a serene, secure and premium lifestyle

## Configurations

- 3 BHK – 1,720 sq. ft. (carpet area 1,435 sq. ft.), Blocks A, B, C, D
- 4 BHK – 2,800 sq. ft. (carpet area 2,410 sq. ft.), Blocks F, H
- Duplex – 4,200 sq. ft. (carpet area 3,378 sq. ft.), Blocks D-I, D-II, D-III, D-IV

## Specifications

- Living / Dining / Family Lounge: Premium vitrified tile flooring, painted walls, gypsum false ceiling with LED lights, and high-quality doors.
- Bedrooms: Premium flooring, painted walls, gypsum false ceiling with LED lights, UPVC windows with tempered glass and steel mesh, with cupboards and dressing table provision.
- Kitchen: Modular kitchen with quartz countertop, premium fittings, vitrified tile flooring, and modern electrical provisions.
- Washrooms: Anti-skid vitrified tile flooring, premium wall tiles, branded fittings, glass shower cabin, and proper ventilation.
- Electrical Works: Concealed copper wiring, modular switches, LED lights, TV and telephone points, and AC provision.
- Lifts: High-speed lifts with CCTV surveillance, intercom, power backup, and safety features.
- Security System: Two-tier, 24×7 manned security with CCTV surveillance at key locations and a secure grand entrance.
- Structure: Advanced Mivan construction technology with an earthquake-resistant structural design.',
  '["2-tier security", "84% open and green area", "High-rise towers with penthouses available in the 3 BHK and 4 BHK configurations", "Modular kitchen with electric chimney", "Multi-level parking space", "Earthquake-resistant design", "24×7 water and power backup", "LPG supply via direct pipeline", "Banks, laundry and convenience stores within the complex", "Clubhouse with a restaurant, banquet hall, gym and swimming pool", "Multiple play areas for kids", "Squash, basketball and badminton courts", "On-campus healthcare facilities with a doctor available", "A variety of flowers and plants along the jogging track", "A 5-screen multiplex and a shopping mall within walking distance"]'::jsonb,
  '["visit"]'::jsonb, '[]'::jsonb, true, true,
  'Luxury 3, 4 BHK and Duplex Apartments Jalandhar Heights III: Experience Elegance and Comfort',
  '/properties/jalandhar-heights-iii/master-plan.jpg',
  '[{"url": "/properties/jalandhar-heights-iii/floor-plan-3bhk.webp", "label": "3 BHK – 1,720 sq. ft., Blocks A, B, C, D"}, {"url": "/properties/jalandhar-heights-iii/floor-plan-4bhk.webp", "label": "4 BHK – 2,800 sq. ft., Blocks F, H"}, {"url": "/properties/jalandhar-heights-iii/floor-plan-duplex.webp", "label": "Duplex – 4,200 sq. ft., Blocks D-I, D-II, D-III, D-IV"}]'::jsonb,
  -- The home page orders featured listings newest first, so date this one just before AGI Sky Garden.
  COALESCE((SELECT updated_at FROM properties WHERE slug = 'agi-sky-garden'), now()) - interval '1 second',
  COALESCE((SELECT updated_at FROM properties WHERE slug = 'agi-sky-garden'), now()) - interval '1 second'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO property_images (property_id, url, sort_order, is_cover)
SELECT p.id, v.url, v.sort_order, v.sort_order = 0
FROM properties p, (VALUES ('/properties/jalandhar-heights-iii/towers.webp', 0), ('/properties/jalandhar-heights-iii/family-lounge.webp', 1), ('/properties/jalandhar-heights-iii/entrance-lobby.webp', 2), ('/properties/jalandhar-heights-iii/upper-lounge-bar.webp', 3), ('/properties/jalandhar-heights-iii/balcony.webp', 4)) AS v(url, sort_order)
WHERE p.slug = 'jalandhar-heights-iii' AND NOT EXISTS (SELECT 1 FROM property_images i WHERE i.property_id = p.id);
