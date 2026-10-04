-- Jalandhar Heights II: pool-side photo as the thumbnail, and its page title.
INSERT INTO property_images (property_id, url, sort_order, is_cover)
SELECT p.id, '/properties/jalandhar-heights-ii/pool.jpeg', 0, true
FROM properties p
WHERE p.slug = 'jalandhar-heights-ii' AND NOT EXISTS (SELECT 1 FROM property_images i WHERE i.property_id = p.id);

UPDATE properties SET meta_title = COALESCE(meta_title, '3, 4 & 5 BHK Luxury Apartments and Penthouses at Jalandhar Heights – II')
WHERE slug = 'jalandhar-heights-ii';
