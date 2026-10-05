-- The partner bank count changes from the admin panel, so banner copy no longer states a number.
-- Only the untouched seeded line is changed; anything an admin has rewritten is left alone.
UPDATE banners SET line = 'Sanction letters from our partner banks, usually within 7 working days.', updated_at = now()
WHERE line = 'Sanction letters from 4 partner banks, usually within 7 working days.';
UPDATE offers SET text = 'Sanction letters from our partner banks, usually within 7 working days.', updated_at = now()
WHERE text = 'Sanction letters from 4 partner banks, usually within 7 working days.';
