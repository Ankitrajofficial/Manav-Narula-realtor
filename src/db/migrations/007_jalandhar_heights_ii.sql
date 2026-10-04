-- Jalandhar Heights II by AGI Infra, featured second on the home page (just behind Jalandhar Heights IV). Price is on request until the developer's price list is in.
INSERT INTO properties (slug, title, type, purpose, locality, city, price, area, area_unit, status, description, long_description, amenities, trust, nearby, featured, published, created_at, updated_at)
SELECT
  'jalandhar-heights-ii',
  'Jalandhar Heights II by AGI Infra',
  'Apartment', 'Buy', 'Jalandhar Heights', 'Jalandhar', 0, 1330, 'sq.ft', 'New',
  '2, 3 and 4 BHK apartments, 4+1 BHK residences at the Iconic Tower and penthouses, with 76% open area, a clubhouse and two-tier security.',
  'Jalandhar Heights II is one of the premium residential developments in Jalandhar, offering thoughtfully designed 2 BHK, 3 BHK, and 4 BHK apartments, along with the 4+1 BHK residences at the Iconic Tower and exclusive penthouses.

Located in a prime area of the city, this residential community combines modern architecture, lifestyle amenities, and everyday convenience. Designed to offer a comfortable and secure living environment, Jalandhar Heights II provides a range of residential configurations to suit different family requirements.

The project is thoughtfully planned with 76% open area, creating a balance between residential development, landscaped surroundings, and community spaces.

Every apartment is crafted with attention to detail, featuring a modular kitchen with an electric chimney, spacious balconies, premium fittings, and thoughtfully planned layouts. Built with an earthquake-resistant design, the towers are designed to provide durability and everyday comfort.

With multi-level and basement parking, the project offers convenient parking facilities for residents and visitors.

Jalandhar Heights II prioritizes safety and comfort with a two-tier security system, CCTV surveillance, and round-the-clock monitoring. The development also provides 24×7 power backup and water supply to support uninterrupted everyday living.

The community is enriched with lifestyle amenities, including a clubhouse, swimming pool, gym, and sports facilities. Recreational and convenience facilities within and around the development further contribute to a comfortable residential environment.

## Why choose Jalandhar Heights II?

- 2 BHK, 3 BHK and 4 BHK apartments, along with 4+1 BHK residences at the Iconic Tower
- Exclusive penthouse residences available outside Blocks A–F
- 76% open area
- Modern residential layouts designed for comfortable family living
- Clubhouse, swimming pool, gym, and sports facilities
- Two-tier security with CCTV surveillance
- Multi-level and basement parking facilities
- 24×7 power backup and water supply
- Landscaped surroundings and community spaces
- Well-connected location in Jalandhar

## Configurations

- 2 BHK – 1,330 sq. ft., Blocks D, E, F
- 3 BHK – 1,600 sq. ft., Blocks A, B, C, L, M, N
- 4 BHK – 2,400 sq. ft., Blocks G, H, I, J, K
- 4 BHK – 2,150 sq. ft., Blocks O, P, Q
- 4+1 BHK residences at the Iconic Tower
- Penthouse residences, excluding Blocks A–F

## Specifications

- Living, Dining & Passage: Vitrified tile flooring, acrylic emulsion-painted walls, oil-bound distemper ceiling, hardwood-frame doors, and UPVC windows.
- Master Bedroom & Other Bedrooms: Laminated wooden flooring, acrylic emulsion-painted walls, oil-bound distemper ceiling, hardwood-frame doors, and UPVC windows.
- Kitchen: Modular kitchen with premium fittings and chimney, vitrified tile flooring, ceramic tiles up to 2 feet above the counter, a granite or marble countertop with a double-bowl stainless-steel sink, and CP fittings (Jaquar or equivalent).
- Bathrooms: Ceramic tile flooring and walls up to 7 feet, hardwood-frame doors, UPVC windows, white chinaware fixtures, CP fittings, and hot and cold water provision.
- Balcony/Terrace: Anti-skid ceramic tile flooring, exterior-painted walls, and steel railings with toughened glass.
- Lift Lobby & Staircase: Granite or marble flooring, acrylic emulsion- or oil-bound distemper-painted walls, and steel railings in the staircase.
- Exterior Façade: Modern aesthetics with a blend of textured paints.
- Electrical: Copper wiring in concealed PVC conduits, with sufficient lighting and power points fitted with modular switches.
- Amenities: Clubhouse featuring a swimming pool, gym, health club, jogging track, children’s play area, tennis court, amphitheatre, landscaped gardens, a Seismic Zone-IV-compliant structure, and fire-fighting systems.',
  '["Two-tier security", "76% open and green area", "Modular kitchen with electric chimney", "Multi-level and basement parking", "Earthquake-resistant design", "24×7 water supply and power backup", "LPG supply via direct pipeline", "Banks, laundry, and convenience stores within the complex", "Clubhouse with a restaurant, banquet hall, gym, and swimming pool", "Multiple play areas for children", "Squash, basketball, and badminton courts", "On-campus healthcare facilities with a doctor available", "Flowers and plants along the jogging track", "A 5-screen multiplex and a shopping mall within walking distance", "Easy connectivity to the city centre"]'::jsonb,
  '["visit"]'::jsonb, '[]'::jsonb, true, true,
  -- The home page orders featured listings newest first, so date this one just before Jalandhar Heights IV.
  COALESCE((SELECT updated_at FROM properties WHERE slug = 'jalandhar-heights-iv'), now()) - interval '1 second',
  COALESCE((SELECT updated_at FROM properties WHERE slug = 'jalandhar-heights-iv'), now()) - interval '1 second'
ON CONFLICT (slug) DO NOTHING;
