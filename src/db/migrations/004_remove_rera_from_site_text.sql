-- The website no longer mentions RERA. Update the seeded hero banner line that did.
UPDATE banners SET line = replace(line, 'RERA-registered advice', 'honest advice') WHERE line LIKE '%RERA-registered advice%';
