-- AGI Sky Villas gallery: show-flat interiors from AGI Infra's project page, after the towers cover.
INSERT INTO property_images (property_id, url, sort_order, is_cover)
SELECT p.id, v.url, v.sort_order, false
FROM properties p, (VALUES ('/properties/agi-sky-villas/interior-lounge.webp', 1), ('/properties/agi-sky-villas/interior-bedroom.webp', 2), ('/properties/agi-sky-villas/interior-fireplace.webp', 3), ('/properties/agi-sky-villas/interior-living-dining.webp', 4)) AS v(url, sort_order)
WHERE p.slug = 'agi-sky-villas' AND NOT EXISTS (SELECT 1 FROM property_images i WHERE i.property_id = p.id AND i.url = v.url);
