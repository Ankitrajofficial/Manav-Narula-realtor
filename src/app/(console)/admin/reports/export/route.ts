import { requireExporter } from "@/lib/export-guard";
import { csvResponse, toCsv } from "@/lib/csv";
import { buildPdf, pdfResponse } from "@/lib/pdf";
import { defaultRange, employeePerformance, funnel, leadsBySource, leadsByStatus, localityDemand } from "@/lib/queries/reports";
import { formatINR } from "@/lib/format";

type R = Record<string, unknown>;

export async function GET(req: Request) {
  const auth = await requireExporter(req); if (auth instanceof Response) return auth;
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const range = defaultRange(sp);
  const report = sp.report ?? "source";
  let title = "", rows: R[] = [], columns: { key: string; label: string; width: number; value?: (r: R) => unknown }[] = [];
  switch (report) {
    case "status":
      title = "Leads by status"; rows = await leadsByStatus(range);
      columns = [{ key: "label", label: "Status", width: 300 }, { key: "value", label: "Leads", width: 120 }];
      break;
    case "funnel":
      title = "Conversion funnel"; rows = await funnel(range);
      columns = [{ key: "label", label: "Stage", width: 300 }, { key: "value", label: "Leads", width: 120 }, { key: "pct", label: "% of new", width: 120, value: (r) => `${r.pct}%` }];
      break;
    case "employees":
      title = "Employee performance"; rows = await employeePerformance(range);
      columns = [{ key: "name", label: "Employee", width: 200 }, { key: "leads_handled", label: "Leads handled", width: 120 }, { key: "follow_ups", label: "Follow-ups done", width: 130 }, { key: "sales_count", label: "Sales closed", width: 110 }, { key: "sales_value", label: "Sales value", width: 140, value: (r) => formatINR(r.sales_value as number) }];
      break;
    case "localities":
      title = "Locality demand"; rows = await localityDemand(range);
      columns = [{ key: "label", label: "Locality", width: 260 }, { key: "leads", label: "Leads", width: 100 }, { key: "prospects", label: "Prospects", width: 100 }, { key: "value", label: "Total", width: 100 }];
      break;
    default:
      title = "Leads by source"; rows = await leadsBySource(range);
      columns = [{ key: "label", label: "Source", width: 300 }, { key: "value", label: "Leads", width: 120 }];
  }
  const stamp = `${range.from}-to-${range.to}`;
  if (sp.format === "pdf") {
    const pdf = buildPdf({
      title, subtitle: `Manav Narula Realtor · ${rows.length} rows`, meta: [`Dates: ${range.from} to ${range.to}`],
      table: { columns: columns.map((c) => ({ label: c.label, width: c.width })), rows: rows.map((r) => columns.map((c) => String(c.value ? c.value(r) : r[c.key] ?? ""))) },
    });
    return pdfResponse(pdf, `${report}-report-${stamp}.pdf`);
  }
  const csv = toCsv<R>(rows, columns.map((c) => ({ key: c.key, label: c.label, value: c.value })));
  return csvResponse(csv, `${report}-report-${stamp}.csv`);
}
