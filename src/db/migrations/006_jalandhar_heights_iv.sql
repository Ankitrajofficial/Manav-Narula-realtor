-- Jalandhar Heights IV by AGI Infra, featured first on the home page. Price is on request until the developer's price list is in.
INSERT INTO properties (slug, title, type, purpose, locality, city, price, area, area_unit, status, description, long_description, amenities, trust, nearby, featured, published)
VALUES (
  'jalandhar-heights-iv',
  'Jalandhar Heights IV by AGI Infra',
  'Apartment', 'Buy', 'Jalandhar Heights', 'Jalandhar', 0, 1800, 'sq.ft', 'New',
  '3 BHK, 4 BHK, 4+1 BHK and 5+1 BHK apartments in AGI Infra’s RERA-approved township, with 83% open and green area and 30+ amenities.',
  'Jalandhar Heights IV is the proud new chapter in AGI INFRA LIMITED’s landmark township in Jalandhar. This premium residential community is designed for families who aspire to a life of elegance, comfort, and modernity. Offering a choice of 3 BHK, 4 BHK, 4+1 BHK, and 5+1 BHK apartments, the project combines state-of-the-art architecture with expansive landscaped green spaces, setting the stage for world-class living at one of the city’s most desirable addresses.

Every detail at Jalandhar Heights IV reflects meticulous planning and superior craftsmanship. The towers feature grand entrance lobbies, thoughtfully designed layouts with excellent cross-ventilation, and modern construction powered by aluminium formwork shuttering for enhanced safety and longevity. From spacious balconies that connect residents with lush surroundings to efficient floor plans that maximize natural light, these residences offer a perfect harmony of form and function.

The project is enriched with over 30 lifestyle amenities that redefine community living. Residents can enjoy beautifully landscaped gardens, sports facilities such as basketball, tennis, and badminton courts, along with walking trails, dedicated play zones, and an exclusive clubhouse. Convenience is seamlessly integrated through features like high-speed elevators, two-level basement car parking, 24-hour power backup, and a two-tier advanced security system—ensuring comfort, safety, and peace of mind every day.

Beyond the extensive amenities within the community, Jalandhar Heights IV enjoys a thoughtfully planned location surrounded by lifestyle conveniences such as malls, high-street retail, multiplexes, and premium social spaces. Designed as a modern urban haven, it strikes the perfect balance between tranquil green living and effortless access to the vibrant pulse of the city.

As the fourth legacy of Jalandhar Heights, this project proudly carries forward AGI INFRA LIMITED’s tradition of redefining luxury living. It is a home that inspires calm, community, and contentment—a sanctuary where families can grow, connect, and celebrate life. With lush green surroundings, graceful architecture, and a secure environment, Jalandhar Heights IV is more than just a residence, it is a luxury lifestyle destination that truly unravels the art of living.

## Why choose Jalandhar Heights IV?

- 3 BHK, 4 BHK, 4+1 BHK, and 5+1 BHK apartments
- RERA-approved project by AGI INFRA LIMITED, trusted for quality construction and timely delivery
- World-class amenities, including a clubhouse, swimming pool, gymnasium, sports courts, and kids’ play zones
- Safe and secure living with 5-tier security, panic buttons, and earthquake-resistant design
- 83% open area
- Modern conveniences, including modular kitchens, LPG pipeline, multi-level parking, and 24×7 power backup

## Configurations

- 3 BHK apartments – 1,800 sq. ft. (carpet area 1,485 sq. ft.), Blocks I, J, K, L
- 4 BHK apartments – 2,500 sq. ft. (carpet area 1,972 sq. ft.), Blocks D, E, F
- 4+1 BHK apartments – 2,800 sq. ft. (carpet area 2,258 sq. ft.), Blocks C, G, H
- 5+1 BHK apartments – 3,600 sq. ft. (carpet area 2,927 sq. ft.), Blocks A, B
- 3.6 m floor-to-floor ceiling height

## Specifications

- Living / Dining / Family Lounge: Premium Botticino marble flooring, POP-painted walls, false ceiling with LED lights, and veneered flush doors.
- Kitchen: Premium vitrified tile flooring, painted walls, and false ceiling with LED lights.
- Bedrooms: Wooden flooring, POP-painted walls, false ceiling with LED lights, aluminium windows, and wardrobe provision.
- Washrooms: Vitrified tile flooring and walls, false ceiling with LED lights, Jaquar/Grohe fittings, vanity with mirror, and shower cabin.
- Servant Room: Vitrified tile flooring.
- Lifts: Three high-speed lifts with CCTV, intercom, power backup, and safety features.
- Electrical Works: Concealed copper wiring, modular switches, LED lights, TV and telephone points, and AC piping.
- Security System: Five-tier, 24×7 security with CCTV surveillance.',
  '["83% open and green area", "Concrete structure conforming to Seismic Zone V", "Earthquake-resistant design", "Modular kitchen with electric chimney", "5-tier 24×7 security with panic buttons in all flats", "24×7 water and power supply with backup", "Fire sprinklers as per NBC norms throughout the entire basement", "24×7 ambulance service and first-aid room", "Ample visitor parking and two-level basement parking", "Electric golf carts for internal commuting", "Car washing area and cycle stand", "On-call housekeeping and laundry services", "Pet-friendly zone", "No-vehicle zone at ground level", "Opulent entrance lobby in each tower", "Rooftop swimming pool and kids’ pool", "Spa, steam, sauna, and Jacuzzi", "Banquet halls, restaurant, resto-bar, and conference room", "Guest rooms for visitors", "Billiards/snooker room, carrom, chess, and card room", "Table tennis, dance, and music room", "Mini golf putting and open-air amphitheatre", "Basketball, lawn tennis, and badminton courts", "Cricket practice nets", "Cycling and jogging track", "Open-air gym", "Kids’ play area with slides, swings, and sand pits", "Yoga and meditation zones", "Relaxation spaces for senior citizens", "Landscaped gardens, water bodies, and divine pergolas", "Quaint walking paths connecting natural spaces"]'::jsonb,
  '["visit"]'::jsonb, '[]'::jsonb, true, true
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO property_images (property_id, url, sort_order, is_cover)
SELECT p.id, v.url, v.sort_order, v.sort_order = 0
FROM properties p, (VALUES ('/properties/jalandhar-heights-iv/aerial.png', 0), ('/properties/jalandhar-heights-iv/towers.webp', 1), ('/properties/jalandhar-heights-iv/garden.webp', 2)) AS v(url, sort_order)
WHERE p.slug = 'jalandhar-heights-iv' AND NOT EXISTS (SELECT 1 FROM property_images i WHERE i.property_id = p.id);
