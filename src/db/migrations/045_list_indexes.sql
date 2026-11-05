-- The dashboard and the list pages filter on these columns; without indexes each page reads the whole table as data grows.
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads(created_at);
CREATE INDEX IF NOT EXISTS leads_assigned_idx ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_follow_up_idx ON leads(next_follow_up_at);
CREATE INDEX IF NOT EXISTS prospects_assigned_idx ON prospects(assigned_to);
CREATE INDEX IF NOT EXISTS prospects_status_idx ON prospects(status);
CREATE INDEX IF NOT EXISTS prospects_follow_up_idx ON prospects(next_follow_up_at);
CREATE INDEX IF NOT EXISTS tasks_assigned_idx ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS sales_date_idx ON sales(sale_date);
CREATE INDEX IF NOT EXISTS sales_status_idx ON sales(status);
