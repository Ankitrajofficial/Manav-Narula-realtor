-- Bank of Baroda joins the partner banks (home loans page and the homepage strip), after the existing ones.
INSERT INTO partner_banks (name, logo_url, tagline, sort_order)
SELECT 'Bank of Baroda', '/images/banks/bob.png', 'Rates on request', COALESCE((SELECT max(sort_order) FROM partner_banks), -1) + 1
WHERE NOT EXISTS (SELECT 1 FROM partner_banks WHERE name = 'Bank of Baroda');
