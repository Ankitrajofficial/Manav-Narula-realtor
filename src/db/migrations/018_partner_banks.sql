-- Home loans page: the five real partner banks, with logos, replace the "Partner Bank 1–4" placeholders.
DELETE FROM partner_banks WHERE name LIKE 'Partner Bank %' AND logo_url IS NULL;

INSERT INTO partner_banks (name, logo_url, tagline, sort_order)
SELECT v.name, v.logo_url, 'Rates on request', v.sort_order
FROM (VALUES ('HDFC Bank', '/images/banks/hdfc.png', 0), ('Punjab National Bank', '/images/banks/pnb.png', 1), ('State Bank of India', '/images/banks/sbi.png', 2), ('ICICI Bank', '/images/banks/icici.png', 3), ('Axis Bank', '/images/banks/axis.png', 4)) AS v(name, logo_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM partner_banks b WHERE b.name = v.name);
