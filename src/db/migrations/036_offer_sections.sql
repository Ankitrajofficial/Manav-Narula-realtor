-- Offers belong to a section: property offers (Properties page and home page) or home-loan offers (Home Loans page).
ALTER TABLE offers ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'property';
ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_section_check;
ALTER TABLE offers ADD CONSTRAINT offers_section_check CHECK (section IN ('property', 'home_loan'));
UPDATE offers SET section = 'home_loan' WHERE section = 'property' AND (link = '/home-loans' OR title ILIKE '%home loan%');
