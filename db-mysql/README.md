# MySQL / MariaDB version of the database (for Hostinger)

Preparation for moving the database from Neon (PostgreSQL) to a Hostinger MySQL database.

| File | What it is | In git? |
|---|---|---|
| `schema.sql` | All 29 tables, keys and indexes in MySQL form | Yes |
| `data.sql` | Every row: properties, leads, users (password hashes), pop-ups, uploaded images | **No.** Private, git-ignored |

Both are generated from the live database, so regenerate them on the day of the move:

```
cd web && node scripts/export-mysql.mjs          # schema.sql + data.sql (reads DATABASE_URL from .env.local)
node scripts/export-mysql.mjs --schema           # schema.sql only
```

Import in Hostinger: Websites → Databases → Management → create a database and user, then phpMyAdmin →
select the database → Import `schema.sql`, then `data.sql`. Tested on MariaDB 10.11: both import cleanly and every
row count and value matches the PostgreSQL source.

**Not done yet:** the website code still speaks PostgreSQL (jsonb, ILIKE, RETURNING, ON CONFLICT...), so it cannot
use this database until its queries are ported to MySQL. Until then DATABASE_URL must keep pointing at Neon.
