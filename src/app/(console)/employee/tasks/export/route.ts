import { blockedExport } from "@/lib/export-guard";
export const dynamic = "force-dynamic";
/** Employees cannot export or download. This URL stays only to refuse (403) and log the attempt. */
export async function GET(req: Request) { return blockedExport(req); }
