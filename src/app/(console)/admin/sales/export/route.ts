import { requireUser } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { buildPdf, pdfResponse } from "@/lib/pdf";
import { listSales, type SaleRow } from "@/lib/queries/sales";
import { listEmployees } from "@/lib/queries/common";
import { formatINR, formatShortDate } from "@/lib/format";

export async function GET(req: Request) {
  await requireUser("admin");
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const data = await listSales(sp, { all: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const client = (s: SaleRow) => s.client_name ?? s.lead_name ?? s.prospect_name ?? "";
  const property = (s: SaleRow) => s.property_title ?? s.property_name ?? "";
  if (sp.format === "pdf") {
    const employees = await listEmployees(false);
    const meta: string[] = [];
    if (sp.employee) meta.push(`Employee: ${employees.find((u) => String(u.id) === sp.employee)?.name ?? sp.employee}`);
    if (sp.status) meta.push(`Status: ${sp.status}`);
    if (data.from || data.to) meta.push(`Dates: ${data.from ?? "start"} to ${data.to ?? "today"}`);
    if (sp.q) meta.push(`Search: ${sp.q}`);
    const pdf = buildPdf({
      title: "Sales report",
      subtitle: `${data.total} sales · total ${formatINR(data.totalValue)} · commission ${formatINR(data.totalCommission)}`,
      meta,
      table: {
        columns: [{ label: "Date", width: 70 }, { label: "Client", width: 140 }, { label: "Property", width: 200 }, { label: "Deal value", width: 95 }, { label: "Commission", width: 90 }, { label: "Employee", width: 110 }, { label: "Status", width: 65 }],
        rows: data.rows.map((s) => [formatShortDate(s.sale_date), client(s), property(s), formatINR(s.deal_value), formatINR(s.commission), s.employee_name ?? "", s.status]),
      },
      footer: `Total: ${formatINR(data.totalValue)} across ${data.total} sales; commission ${formatINR(data.totalCommission)}`,
    });
    return pdfResponse(pdf, `sales-${stamp}.pdf`);
  }
  const csv = toCsv<SaleRow>(data.rows, [
    { key: "id", label: "ID" },
    { key: "sale_date", label: "Date", value: (s) => formatShortDate(s.sale_date) },
    { key: "client", label: "Client", value: client },
    { key: "property", label: "Property", value: property },
    { key: "deal_value", label: "Deal value (₹)", value: (s) => Number(s.deal_value) },
    { key: "commission", label: "Commission (₹)", value: (s) => Number(s.commission) },
    { key: "employee_name", label: "Employee" },
    { key: "status", label: "Status" },
    { key: "notes", label: "Notes" },
    { key: "document_url", label: "Document" },
  ]);
  return csvResponse(csv, `sales-${stamp}.csv`);
}
