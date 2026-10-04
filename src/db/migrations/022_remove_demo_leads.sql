-- Remove the demo CRM data created by the original seed: leads, prospects, tasks and sales for made-up people.
-- Matched on the seed's exact phone numbers, task titles and sale values, so real records are never touched.
-- Lead/prospect activities and task call-sheet rows go with them (ON DELETE CASCADE).
DELETE FROM sales WHERE (client_name, deal_value) IN (('Deepak Sharma', 9600000), ('Manpreet Gill', 11000000), ('Karan Bhatia', 22000));
DELETE FROM tasks WHERE title IN (
  'Collect valuation documents from Rakesh Verma', 'Confirm Sunday site visit for Gurdeep Dhillon', 'Follow up Pooja Khanna, no answer twice',
  'Send rent agreement draft to Simran Kaur', 'Update NRI prospect list with WhatsApp opt-in', 'Call back Harpreet Singh about the corner kothi');
DELETE FROM leads WHERE phone IN (
  '+919815012345', '+919872023456', '+919780034567', '+919646045678', '+919501056789', '+919417067890', '+919888078901',
  '+919814089012', '+919876090123', '+919779001234', '+919855012346', '+919592023457', '+919463034568', '+919357045679');
DELETE FROM prospects WHERE phone IN (
  '+919814100001', '+919814100002', '+919814100003', '+919814100004', '+919814100005', '+919814100006', '+919814100007', '+919814100008');

-- Real records start again from #1 (only when nothing is left in the table).
SELECT setval('leads_id_seq', 1, false) WHERE NOT EXISTS (SELECT 1 FROM leads);
SELECT setval('prospects_id_seq', 1, false) WHERE NOT EXISTS (SELECT 1 FROM prospects);
SELECT setval('tasks_id_seq', 1, false) WHERE NOT EXISTS (SELECT 1 FROM tasks);
SELECT setval('sales_id_seq', 1, false) WHERE NOT EXISTS (SELECT 1 FROM sales);
SELECT setval('lead_activities_id_seq', 1, false) WHERE NOT EXISTS (SELECT 1 FROM lead_activities);
