-- Prestige by AGI at AGI Urbana, featured third on the home page (after Jalandhar Heights IV and II). Price, sizes and BHK types are on request until the developer's details are in.
INSERT INTO properties (slug, title, type, purpose, locality, street, city, price, area, area_unit, status, description, long_description, amenities, trust, nearby, featured, published, created_at, updated_at)
SELECT
  'prestige-by-agi',
  'Prestige by AGI',
  'Apartment', 'Buy', 'Jalandhar Heights', 'AGI Urbana', 'Jalandhar', 0, NULL, 'sq.ft', 'New',
  '713 apartments at AGI Urbana with four homes per floor, 88% open and green area, a clubhouse and two-tier 24×7 security.',
  'At Prestige, a home is more than just a physical structure—it is a space to grow, create memories, and build a secure future. Every aspect of the project has been carefully envisioned to meet the evolving expectations of today’s families, with a strong emphasis on quality construction, efficient planning, and a peaceful community environment. The result is a residential experience designed to deliver long-term value without compromising on affordability.

Each residence is intelligently designed to offer more usable space, abundant natural light, and superior ventilation. With four units on each floor, homes benefit from excellent cross-ventilation and enhanced privacy, ensuring a bright, airy, and comfortable living environment throughout the day. The use of aluminium formwork enhances structural strength, precision, and finish, contributing to durability and consistent construction quality across the project.

Prestige by AGI is enriched with amenities designed to elevate everyday living. High-speed lifts provide seamless vertical mobility, while two-level basement parking offers organized parking space. Lush green surroundings create a refreshing environment and encourage a healthier, more relaxed lifestyle, while the thoughtfully planned layout promotes a strong sense of community living.

Safety, security, and essential services are integral to life at Prestige. The project features two-tier 24×7 security, a reliable 24-hour water supply, and provision for power backup to support uninterrupted everyday living. Fire safety systems are implemented in accordance with NBC norms, while additional services such as 24×7 ambulance availability and round-the-clock LPG gas supply are designed to provide residents with greater peace of mind.

Strategically located at AGI Urbana, Prestige enjoys excellent connectivity and proximity to nearby malls and multiplexes, offering residents easy access to shopping, entertainment, and daily conveniences—all while maintaining a calm and serene residential setting.

Designed and constructed to meet Seismic Zone V standards, Prestige by AGI is not just a place to live, but a secure investment for the future. Whether you are starting a family, upgrading your lifestyle, or planning for long-term growth, Prestige is a home where comfort, safety, and thoughtful design come together seamlessly—today and for years to come.

## Why choose Prestige by AGI?

- Prime location near schools, colleges, hospitals, and shopping
- 713 spacious units with customizable interiors
- Elite community of educationists, doctors, corporate officials, businessmen, and NRIs
- World-class amenities, including a clubhouse, restaurant, bar, swimming pool, gym, and sports facilities
- Eco-friendly design with open green spaces adhering to government standards
- Modern infrastructure with modular kitchens, UPVC doors and windows, and 24×7 power and water supply
- 24×7 two-tier security, basement parking, on-call doctor, and ambulance service

## Specifications

- Dining / Common Area / Drawing Room / Kitchen: Flooring – Premium Vitrified Tiles (4 ft. × 2 ft.) | Walls – Plastic Paint | Ceiling – Gypsum Board False Ceiling with Standard LED Lighting
- Master Bedroom & Other Bedrooms: Flooring – Premium Wooden Flooring / Tile Flooring | Walls – Plastic Paint | Ceiling – Gypsum Board False Ceiling with Standard LED Lighting
- Washrooms: Flooring – Anti-skid Premium Vitrified Tiles (2 ft. × 2 ft.) | Walls – Premium Vitrified Tiles (4 ft. × 2 ft.) up to 7 ft. Height | Ceiling – Gypsum / PVC Ceiling | CP Fittings – Jaquar / Grohe / Equivalent | Sanitaryware – Premium Quality White Chinaware | Fixtures – Vanity Unit with Half-Glass Shower Partition
- Doors & Windows: Entrance Door – Flush Door with Mica Finish | Internal Doors – Flush Doors with Mica Finish | Windows – UPVC Windows with Mesh
- Electrical: Telephone / Data – Telephone Cable & Internet Wiring Pre-installed in All Rooms | Switches – Havells / Schneider / Legrand / Equivalent
- Balcony: Flooring – Anti-skid Vitrified Tiles | Walls – Waterproof Plastic Paint | Railing – Stainless Steel / MS Railing
- Wardrobe: Provision – Wardrobe Space Provided (No Woodwork Included)',
  '["2-tier security", "88% open and green area", "Modular kitchen with electric chimney", "Multi-level parking space", "Earthquake-resistant design", "24×7 water and power backup", "LPG supply via direct pipeline", "Banks, laundry, and convenience stores within the complex", "Clubhouse with a restaurant, banquet hall, gym, and swimming pool", "Multiple play areas for kids", "Squash, basketball, and badminton courts", "On-campus healthcare facilities with a doctor available", "A variety of flowers and plants along the jogging track", "Easy connectivity to the city centre"]'::jsonb,
  '["visit"]'::jsonb, '[]'::jsonb, true, true,
  -- The home page orders featured listings newest first, so date this one just before Jalandhar Heights II.
  COALESCE((SELECT updated_at FROM properties WHERE slug = 'jalandhar-heights-ii'), now()) - interval '1 second',
  COALESCE((SELECT updated_at FROM properties WHERE slug = 'jalandhar-heights-ii'), now()) - interval '1 second'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO property_images (property_id, url, sort_order, is_cover)
SELECT p.id, '/properties/prestige-by-agi/towers.jpg', 0, true
FROM properties p
WHERE p.slug = 'prestige-by-agi' AND NOT EXISTS (SELECT 1 FROM property_images i WHERE i.property_id = p.id);
