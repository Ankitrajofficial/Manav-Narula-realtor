-- The homepage "Featured properties" strip shows only real listings: the 12 demo properties from the original seed are
-- no longer featured (they stay published on the Properties page). An admin can feature them again from the console.
UPDATE properties SET featured = false
WHERE featured AND slug IN (
  '4-bhk-kothi-urban-estate-phase-2', '3-bhk-apartment-model-town', 'residential-plot-surya-enclave', 'showroom-gt-road',
  '3-bhk-kothi-rent-jalandhar-cantt', '2-bhk-apartment-paragpur', 'farmhouse-rama-mandi', '5-bhk-kothi-green-model-town',
  'office-space-mithapur', 'residential-plot-urban-estate-phase-1', '3-bhk-apartment-rent-maqsudan', '3-bhk-kothi-mithapur');
