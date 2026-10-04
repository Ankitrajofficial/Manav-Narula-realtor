-- AGI Sky Garden on G.T. Road, Jalandhar, featured fifth on the home page (after AGI Sky Villas). Price is on request.
INSERT INTO properties (slug, title, type, purpose, locality, city, price, area, area_unit, status, description, long_description, amenities, trust, nearby, featured, published, meta_title, master_plan, floor_plans, created_at, updated_at)
SELECT
  'agi-sky-garden',
  'AGI Sky Garden',
  'Apartment', 'Buy', 'GT Road', 'Jalandhar', 0, 820, 'sq.ft', 'New',
  '2 and 3 BHK apartments on G.T. Road across AGI Sky Garden I, II, III and AGI Maxima I and II, with 68% open area and a clubhouse.',
  'AGI Sky Garden is a thoughtfully planned residential development comprising AGI Sky Garden I, AGI Sky Garden II, AGI Sky Garden III, AGI Maxima I, and AGI Maxima II. Together, these developments offer a well-connected residential community with modern homes, lifestyle amenities, and everyday conveniences.

The combined development includes 2,518 residential units across the projects for which confirmed unit data has been provided. Designed to balance modern living with open surroundings, the overall development offers 68% open area.

## The developments

- AGI Sky Garden I — 1,274 units | 42% open area
- AGI Sky Garden II, AGI Maxima I and II — 572 units | 78% open area
- AGI Sky Garden III — 240 units | 80% open area

AGI Sky Garden offers thoughtfully designed 2 BHK and 3 BHK apartments, supported by modern infrastructure, recreational spaces, landscaped surroundings, and facilities designed for everyday comfort and convenience.

AGI Sky Garden brings together residential living and lifestyle convenience within a well-planned community. Residents have access to recreational, wellness, sports, and social spaces designed to support a comfortable and active lifestyle.

The development also integrates landscaped areas, walking spaces, community facilities, and essential conveniences, creating an environment where residents can enjoy everyday life within the community.

With a combination of modern residences, open spaces, security, and lifestyle amenities, AGI Sky Garden offers a well-rounded residential environment on G.T. Road, Jalandhar.

## Why choose AGI Sky Garden?

- A residential development comprising AGI Sky Garden I, II, III, and AGI Maxima I and II
- 2,518 confirmed residential units across the projects with available unit data
- 68% overall open area
- 2 BHK and 3 BHK apartments designed for modern living
- Landscaped surroundings and thoughtfully planned community spaces
- Lifestyle, recreational, and wellness amenities
- Security and infrastructure designed for everyday convenience
- Well-connected location on G.T. Road, Jalandhar

## Configurations

- 3 BHK – 1,300 sq. ft. (carpet area 960 sq. ft.)
- 3 BHK – 1,200 sq. ft. (carpet area 960 sq. ft.)
- 2 BHK – 880 sq. ft. (carpet area 640 sq. ft.)
- 2 BHK – 820 sq. ft. (carpet area 59 sq. m)

## Specifications

- Living / Dining / Passage: Acrylic emulsion paint walls, vitrified tile flooring, hardwood door frame with European-style flush door, UPVC windows.
- Master Bedroom: Vitrified tile flooring, acrylic emulsion paint walls & ceiling, hardwood door frame with flush door, UPVC windows.
- Bedrooms: Vitrified tile flooring, acrylic emulsion paint walls & ceiling, hardwood door frame with flush doors, UPVC windows.
- Kitchen: Modular kitchen setup with vitrified tile flooring, dado up to 2 ft above counter, acrylic emulsion paint walls, UPVC windows, granite countertop with stainless steel sink.
- Toilets: Ceramic tile flooring & dado, acrylic emulsion ceiling, hardwood door frame with flush doors, UPVC windows, branded CP fittings & sanitary ware.
- Balcony: Anti-skid ceramic floor tiles, weatherproof exterior paint, MS/SS railing.
- Lift Lobby: Imported marble/granite/vitrified tile flooring, decorative wall finishes, false ceiling with LED lights.
- Staircase: Granite/vitrified tile flooring, painted walls, MS/SS railing, ceiling with lighting.
- External Façade: Modern elevation with texture paint & weatherproof exterior finish.
- Electrical Works: Copper wiring with modular switches, concealed PVC conduits, adequate power points, TV & internet provision.
- Power Backup: 24×7 DG power backup for lifts and common areas.
- Security System: 2-tier security with CCTV surveillance, intercom & access control.
- Special Features: Earthquake-resistant RCC structure as per seismic zone norms, rainwater harvesting, and fire safety systems.',
  '["Opulent entrance lobby in each tower", "No-vehicle zone at ground level for safety and greenery", "Landscaped gardens and open spaces", "Scenic landscaping with water fountains and water bodies", "Lawns, green open areas, and walking paths", "Pergolas and relaxation zones for senior citizens", "Yoga and meditation zones", "24×7 two-tier security with CCTV surveillance", "Power backup for essential services", "PNG reticulated gas system", "Two-level basement parking and visitor parking", "Car washing area and cycle stand", "Electric golf carts for internal commuting", "Clubhouse with residents’ lounge and restaurant", "Banquet halls, conference room, and guest rooms", "Resto-bar and café", "Rooftop swimming pool and kids’ pool", "Indoor swimming pool", "Fully equipped gymnasium and open-air gym", "Spa, steam, sauna, and Jacuzzi", "Dispensary and doctor facility on campus", "Basketball, lawn tennis, and badminton courts", "Cricket practice nets", "Cycling and jogging track", "Mini golf putting area", "Billiards/snooker, carrom, chess, and card rooms", "Table tennis", "Dance and music room", "Open-air amphitheatre", "Children’s play areas with slides, swings, sand pits, and modern equipment", "Dedicated pet-friendly zone", "Shopping complex within the premises", "On-call housekeeping and laundry services"]'::jsonb,
  '["visit"]'::jsonb, '[]'::jsonb, true, true,
  'AGI Sky Garden Jalandhar',
  '/properties/agi-sky-garden/master-plan.jpg',
  '[{"url": "/properties/agi-sky-garden/floor-plan-3bhk-1300.jpg", "label": "3 BHK – 1,300 sq. ft."}, {"url": "/properties/agi-sky-garden/floor-plan-3bhk-1200.jpg", "label": "3 BHK – 1,200 sq. ft."}, {"url": "/properties/agi-sky-garden/floor-plan-2bhk-880.jpg", "label": "2 BHK – 880 sq. ft."}, {"url": "/properties/agi-sky-garden/floor-plan-2bhk-820.jpg", "label": "2 BHK – 820 sq. ft."}]'::jsonb,
  -- The home page orders featured listings newest first, so date this one just before AGI Sky Villas.
  COALESCE((SELECT updated_at FROM properties WHERE slug = 'agi-sky-villas'), now()) - interval '1 second',
  COALESCE((SELECT updated_at FROM properties WHERE slug = 'agi-sky-villas'), now()) - interval '1 second'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO property_images (property_id, url, sort_order, is_cover)
SELECT p.id, v.url, v.sort_order, v.sort_order = 0
FROM properties p, (VALUES ('/properties/agi-sky-garden/towers.webp', 0), ('/properties/agi-sky-garden/construction-aerial.webp', 1), ('/properties/agi-sky-garden/shopping-street.webp', 2), ('/properties/agi-sky-garden/garden-walkway.webp', 3), ('/properties/agi-sky-garden/towers-lawn.webp', 4)) AS v(url, sort_order)
WHERE p.slug = 'agi-sky-garden' AND NOT EXISTS (SELECT 1 FROM property_images i WHERE i.property_id = p.id);
