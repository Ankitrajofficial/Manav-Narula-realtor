-- New admin sign-in emails; accounts, passwords and history are kept. On a brand-new database these rows do not exist
-- yet: the admins are then created from ADMIN_MANAV_EMAIL / ADMIN_KOMAL_EMAIL, which carry the same addresses.
UPDATE users SET email = 'realtormanavnarula@gmail.com' WHERE lower(email) = 'manav@manavnarularealtor.com' AND role = 'admin';
UPDATE users SET email = 'manavnarularealtor@gmail.com' WHERE lower(email) = 'komal@manavnarularealtor.com' AND role = 'admin';

-- Remove every employee account, including the demo ones; the admins add real employees from the console.
-- Their leads, tasks, prospects and sales stay and become unassigned (all user references are ON DELETE SET NULL).
DELETE FROM users WHERE role = 'employee';
