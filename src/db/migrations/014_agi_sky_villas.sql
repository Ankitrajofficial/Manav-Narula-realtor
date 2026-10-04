-- AGI Sky Villas on Pakhowal Road, Ludhiana, featured fourth on the home page (after Prestige by AGI). Price is on request.
-- First listing outside Jalandhar: Pakhowal Road joins the localities list under its own Ludhiana zone.
INSERT INTO localities (name, zone, sort_order) VALUES ('Pakhowal Road', 'Ludhiana', 70) ON CONFLICT (name) DO NOTHING;

INSERT INTO properties (slug, title, type, purpose, locality, city, price, area, area_unit, status, description, long_description, amenities, trust, nearby, featured, published, meta_title, master_plan, floor_plans, created_at, updated_at)
SELECT
  'agi-sky-villas',
  'AGI Sky Villas',
  'Apartment', 'Buy', 'Pakhowal Road', 'Ludhiana', 0, 2600, 'sq.ft', 'New',
  'RERA-approved 4 and 5 BHK apartments and penthouses on Pakhowal Road, with 80% open area, 3.6 m floor-to-floor height and 5-tier security.',
  'AGI Sky Villas is a RERA-approved luxury residential project in Ludhiana, located on the prime Pakhowal Road with direct connectivity to 200 Feet Road and easy two-way access from Phullanwal Chowk, ensuring seamless connectivity to major national highways.

The project offers premium 4 BHK and 5 BHK apartments in Ludhiana, along with exclusive penthouses. Featuring high-rise towers, expansive open green spaces, a 3.6-metre floor-to-floor height, and a 5-tier security system, AGI Sky Villas redefines luxury living.

Developed by AGI INFRA LIMITED, this landmark project is built to Seismic Zone V earthquake-resistant standards, ensuring a high level of structural safety. With multi-level parking, modular kitchens, electric chimneys, LPG pipeline supply, and uninterrupted power and water backup, residents enjoy modern conveniences in a secure environment.

These luxury apartments in Ludhiana are thoughtfully designed to provide maximum space, natural light, and ventilation, making them an ideal choice for homebuyers and investors.

AGI Sky Villas offers residents a blend of luxury and greenery. Buyers can choose from thoughtfully designed configurations to suit their lifestyle, while the project offers an exclusive clubhouse with a restaurant, banquet hall, gym, swimming pool, and indoor games, along with sports courts for squash, basketball, and badminton.

These thoughtfully designed flats on Pakhowal Road, Ludhiana, bring world-class living to one of the city’s well-connected locations.

Beyond luxury, AGI Sky Villas ensures wellness and community living with children’s play zones, jogging tracks lined with flowers and greenery, and on-campus healthcare facilities with a doctor on call. With breathtaking views, strong connectivity, and premium amenities, AGI Sky Villas is a destination for those seeking luxury flats and high-rise apartments in Ludhiana.

## Why choose AGI Sky Villas?

- Prime location on Pakhowal Road with convenient connectivity to 200 Feet Road and Phullanwal Chowk
- RERA-approved project by AGI INFRA LIMITED
- Luxury high-rise residences with spacious 4 BHK and 5 BHK apartments, along with penthouses
- World-class amenities, including a clubhouse, swimming pool, gym, sports courts, and kids’ play zones
- Safe and secure living with a 5-tier security system and earthquake-resistant design
- 80% open area
- Modern conveniences, including modular kitchens, LPG pipeline supply, multi-level parking, and 24×7 power and water backup

## Configurations

- 5 BHK – 5,200 sq. ft. super area (built-up 4,340, carpet 3,478 sq. ft.), Tower A
- 4 BHK – 4,000 sq. ft. super area (built-up 3,350, carpet 2,700 sq. ft.), Towers E, F, G, H, I, J
- 4 BHK – 3,500 sq. ft. super area (built-up 2,975, carpet 2,405 sq. ft.), Towers E, F, G, H, I, J
- 4 BHK – 2,600 sq. ft. super area (built-up 2,345, carpet 1,929 sq. ft.), Towers B, C, D
- 3.6 m floor-to-floor ceiling height

## Specifications

- Living / Dining / Family Lounge: Premium Botticino marble flooring, POP-painted walls, false ceiling with LED lights, veneered flush doors.
- Kitchen: Premium vitrified tile flooring, painted walls, false ceiling with LED lights.
- Bedrooms: Wooden flooring, POP-painted walls, false ceiling with LED lights, aluminium windows, wardrobe provision.
- Washrooms: Vitrified tile walls & flooring, false ceiling with LED lights, Jaquar/Grohe fittings, vanity with mirror & shower cabin.
- Servant Room: Vitrified tile flooring.
- Lifts: Three high-speed lifts with CCTV, intercom, power backup & safety features.
- Electrical Works: Concealed copper wiring, modular switches, LED lights, TV & telephone points, AC piping.
- Security System: Five-tier 24×7 security with CCTV surveillance.',
  '["80% open and green area", "Concrete structure conforming to Seismic Zone V", "Modular kitchen with electric chimney", "Earthquake-resistant design", "5-tier 24×7 security with panic buttons in all flats", "24×7 water and power supply with backup", "Fire sprinklers as per NBC norms throughout the basement", "24×7 ambulance service and first-aid room", "Ample visitor parking and two-level basement parking", "Electric golf carts for internal commuting", "Car washing area and cycle stand", "On-call housekeeping and laundry services", "Pet-friendly zone", "No-vehicle zone at ground level", "Opulent entrance lobby in each tower", "Rooftop swimming pool and kids’ pool", "Gym, spa, steam, sauna, and Jacuzzi", "Banquet halls, restaurant, resto-bar, and conference room", "Guest rooms for visitors", "Billiards/snooker room, carrom, chess, and card room", "Table tennis, dance, and music room", "Mini golf putting area and open-air amphitheatre", "Basketball, lawn tennis, and badminton courts", "Cricket practice nets", "Cycling and jogging track", "Open-air gym", "Kids’ play area with slides, swings, and sand pits", "Yoga and meditation zones", "Relaxation spaces for senior citizens", "Landscaped gardens, water bodies, and pergolas", "Quaint walking paths connecting natural spaces"]'::jsonb,
  '["visit"]'::jsonb, '[]'::jsonb, true, true,
  'AGI Sky Villas – Luxury 4 BHK, 5 BHK Flats & Penthouses on Pakhowal Road, Ludhiana',
  '/properties/agi-sky-villas/master-plan.webp',
  '[{"url": "/properties/agi-sky-villas/floor-plan-5bhk-5200.webp", "label": "5 BHK – 5,200 sq. ft."}, {"url": "/properties/agi-sky-villas/floor-plan-4bhk-4000.webp", "label": "4 BHK – 4,000 sq. ft."}, {"url": "/properties/agi-sky-villas/floor-plan-4bhk-3500.webp", "label": "4 BHK – 3,500 sq. ft."}, {"url": "/properties/agi-sky-villas/floor-plan-4bhk-2600.webp", "label": "4 BHK – 2,600 sq. ft."}]'::jsonb,
  -- The home page orders featured listings newest first, so date this one just before Prestige by AGI.
  COALESCE((SELECT updated_at FROM properties WHERE slug = 'prestige-by-agi'), now()) - interval '1 second',
  COALESCE((SELECT updated_at FROM properties WHERE slug = 'prestige-by-agi'), now()) - interval '1 second'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO property_images (property_id, url, sort_order, is_cover)
SELECT p.id, '/properties/agi-sky-villas/towers.webp', 0, true
FROM properties p
WHERE p.slug = 'agi-sky-villas' AND NOT EXISTS (SELECT 1 FROM property_images i WHERE i.property_id = p.id);
