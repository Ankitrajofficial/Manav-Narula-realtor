-- Jalandhar Heights II gallery: entrance plaza, show-flat interiors and the entrance road, after the pool-side cover.
INSERT INTO property_images (property_id, url, sort_order, is_cover)
SELECT p.id, v.url, v.sort_order, false
FROM properties p, (VALUES ('/properties/jalandhar-heights-ii/entrance-plaza.webp', 1), ('/properties/jalandhar-heights-ii/interior-foyer.webp', 2), ('/properties/jalandhar-heights-ii/interior-living.webp', 3), ('/properties/jalandhar-heights-ii/entrance-road.webp', 4)) AS v(url, sort_order)
WHERE p.slug = 'jalandhar-heights-ii' AND NOT EXISTS (SELECT 1 FROM property_images i WHERE i.property_id = p.id AND i.url = v.url);
