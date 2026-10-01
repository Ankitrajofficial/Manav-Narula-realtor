import { exportRecords } from "@/components/console/RecordExport";
export const dynamic = "force-dynamic";
export async function GET(req: Request) { return exportRecords("lead", req, "employee"); }
