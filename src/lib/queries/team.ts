import "server-only";
import { one, q } from "@/lib/db";

/** A person in "The team" on the About page (Admin → Team). */
export interface TeamMember { id: number; name: string; role: string | null; bio: string | null; photo: string | null; sort_order: number; active: boolean; updated_at: Date }
export interface TeamInput { name: string; role: string | null; bio: string | null; photo: string | null; active: boolean }

export const listTeam = () => q<TeamMember>("SELECT * FROM team_members ORDER BY sort_order, id");
/** Members shown on the website, in the admin's order. */
export const listActiveTeam = () => q<TeamMember>("SELECT * FROM team_members WHERE active ORDER BY sort_order, id");
export const getTeamMember = (id: number) => one<TeamMember>("SELECT * FROM team_members WHERE id = $1", [id]);

export async function saveTeamMember(id: number | null, t: TeamInput): Promise<number> {
  if (id) {
    await q("UPDATE team_members SET name=$1, role=$2, bio=$3, photo=$4, active=$5, updated_at=now() WHERE id=$6", [t.name, t.role, t.bio, t.photo, t.active, id]);
    return id;
  }
  const next = await one<{ n: number }>("SELECT COALESCE(max(sort_order), -1) + 1 AS n FROM team_members");
  return (await one<{ id: number }>("INSERT INTO team_members (name, role, bio, photo, active, sort_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id", [t.name, t.role, t.bio, t.photo, t.active, Number(next?.n ?? 0)]))!.id;
}

/** Moves a member one place up or down by swapping with the neighbour. */
export async function moveTeamMember(id: number, dir: -1 | 1) {
  const rows = await listTeam();
  const i = rows.findIndex((r) => r.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return;
  const order = rows.map((r) => r.id);
  [order[i], order[j]] = [order[j], order[i]];
  for (const [k, rid] of order.entries()) await q("UPDATE team_members SET sort_order = $1 WHERE id = $2", [k, rid]);
}
