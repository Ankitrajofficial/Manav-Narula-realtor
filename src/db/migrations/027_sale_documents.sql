-- Several documents per sale (agreement, receipts, ID proofs, photos). sales.document_url stays as the first document so
-- exports keep a link; the full list lives here. Existing single agreements are copied in once.
CREATE TABLE IF NOT EXISTS sale_documents (
  id serial PRIMARY KEY,
  sale_id int NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  url text NOT NULL,
  name text NOT NULL DEFAULT 'Document',
  content_type text,
  size int,
  uploaded_by int REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sale_documents_sale_idx ON sale_documents(sale_id);

INSERT INTO sale_documents (sale_id, url, name, content_type, created_at)
SELECT s.id, s.document_url, 'Agreement', CASE WHEN s.document_url ILIKE '%.pdf' THEN 'application/pdf' ELSE 'image/' || lower(substring(s.document_url FROM '\.([a-z0-9]+)$')) END, s.created_at
FROM sales s
WHERE s.document_url IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sale_documents d WHERE d.sale_id = s.id AND d.url = s.document_url);
