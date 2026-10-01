-- Home page trust numbers and the founding year used in the tagline. Admin edits both under Settings.
INSERT INTO settings (key, value) VALUES
  ('trust_stats', '[
    {"value": "12", "suffix": "+", "label": "Years in Jalandhar", "link": null, "sort_order": 0, "is_active": true},
    {"value": "1500", "suffix": "+", "label": "Properties sold", "link": null, "sort_order": 1, "is_active": true},
    {"value": "20", "suffix": "+", "label": "Developer partners", "link": null, "sort_order": 2, "is_active": true},
    {"value": "2", "suffix": "+", "label": "Offices", "link": null, "sort_order": 3, "is_active": true},
    {"value": "4.8", "suffix": "★", "label": "Google rating", "link": "https://www.google.com/maps/search/?api=1&query=Manav+Narula+Realtor+Jalandhar", "sort_order": 4, "is_active": true},
    {"value": "30", "suffix": "+", "label": "Localities covered", "link": null, "sort_order": 5, "is_active": true}
  ]'::jsonb),
  ('founded_year', '2014'::jsonb)
  ON CONFLICT (key) DO NOTHING;
