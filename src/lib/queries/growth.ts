import "server-only";
import { randomInt } from "node:crypto";
import { one, q } from "@/lib/db";

export interface Growth { id: number; name: string; role: string; level: string; stars: number; promoted_at: Date | null; sales: number }
/** Stars, level and approved sales for one person. Only approved sales count towards stars. */
export const getGrowth = (userId: number) => one<Growth>(
  `SELECT u.id, u.name, u.role, u.level, u.stars, u.promoted_at,
     (SELECT count(*)::int FROM sales s WHERE s.employee_id = u.id AND s.status = 'Approved') AS sales
   FROM users u WHERE u.id = $1`,
  [userId],
);

export interface StarAward { id: number; star: number; sales_count: number; created_at: Date; awarded_by_name: string | null }
export const listStarAwards = (userId: number) => q<StarAward>("SELECT a.id, a.star, a.sales_count, a.created_at, u.name AS awarded_by_name FROM star_awards a LEFT JOIN users u ON u.id = a.awarded_by WHERE a.user_id = $1 ORDER BY a.star DESC, a.created_at DESC", [userId]);

export interface Skill { id: number; name: string; active: boolean; used: number }
export const listSkills = (activeOnly = false) => q<Skill>(
  `SELECT s.id, s.name, s.active, (SELECT count(*)::int FROM certificates c WHERE c.skills ? s.name) AS used FROM skills s ${activeOnly ? "WHERE s.active" : ""} ORDER BY s.name`,
);

export interface Certificate { id: number; code: string; user_id: number; user_name: string; user_level: string; title: string; skills: string[]; start_date: Date | null; end_date: Date | null; issue_date: Date; remarks: string | null; issued_by_name: string | null; revoked: boolean; created_at: Date }
const CERT = `SELECT c.*, u.name AS user_name, u.level AS user_level, i.name AS issued_by_name FROM certificates c JOIN users u ON u.id = c.user_id LEFT JOIN users i ON i.id = c.issued_by`;
export const listCertificates = (userId?: number) => q<Certificate>(`${CERT} ${userId ? "WHERE c.user_id = $1" : ""} ORDER BY c.issue_date DESC, c.id DESC`, userId ? [userId] : []);
export const getCertificate = (id: number) => one<Certificate>(`${CERT} WHERE c.id = $1`, [id]);

/** Interns who can be issued a certificate (people promoted since keep the ones they already have). */
export const listInterns = () => q<{ id: number; name: string; email: string }>("SELECT id, name, email FROM users WHERE role = 'employee' AND level = 'intern' AND status = 'active' ORDER BY name");

/** Certificate number like MNR-2026-4821, unique. */
export async function newCertificateCode(year: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = `MNR-${year}-${String(randomInt(1000, 10000))}`;
    if (!(await one("SELECT 1 FROM certificates WHERE code = $1", [code]))) return code;
  }
  return `MNR-${year}-${Date.now().toString().slice(-6)}`;
}
