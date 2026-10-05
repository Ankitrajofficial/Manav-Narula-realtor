-- Interns, employees and executives write blog posts from their own portal. Each post links to its writer, whose
-- passport-size photo, name and designation show on the website. Admin posts keep author_id empty.
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_id int REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS blog_posts_author_idx ON blog_posts(author_id);
