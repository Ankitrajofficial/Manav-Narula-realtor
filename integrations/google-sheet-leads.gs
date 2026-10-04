/**
 * Website leads → Google Sheet (in the client's Google Drive).
 *
 * The website sends every new lead (website forms, leads added in the console, CSV imports) to CRM_WEBHOOK_URL
 * as JSON: { "leads": [ { id, created_at, name, phone, ... } ] }. This script appends each one as a row.
 *
 * Setup (signed in as the Drive folder's owner):
 *  1. In the Drive folder, New → Google Sheets. Name it e.g. "Website leads".
 *  2. In the sheet: Extensions → Apps Script. Delete the sample code, paste this whole file, Save.
 *  3. Deploy → New deployment → type "Web app". Execute as: Me. Who has access: Anyone. Deploy, allow access.
 *  4. Copy the Web app URL and add ?key=<SECRET below> to the end. That full URL is CRM_WEBHOOK_URL in Hostinger.
 *
 * Leads already in the sheet (same Lead ID) are skipped, so sending a lead twice never makes a duplicate row.
 */
// Replace with your own long random key, and keep it out of the public repository.
const SECRET = "PASTE-YOUR-KEY-HERE";

const COLUMNS = [
  ["Lead ID", (l) => l.id],
  ["Received", (l) => (l.created_at ? new Date(l.created_at) : "")],
  ["Name", (l) => l.name],
  ["Phone", (l) => (l.phone ? "'" + l.phone : "")],
  ["Email", (l) => l.email],
  ["Interest", (l) => l.interest],
  ["Budget", (l) => l.budget],
  ["Locality", (l) => l.locality],
  ["Property", (l) => l.property],
  ["Project", (l) => l.project],
  ["Source", (l) => l.source],
  ["Status", (l) => l.status],
  ["Notes", (l) => l.notes],
  ["Assigned to", (l) => l.assigned_to],
  ["Added by", (l) => l.added_by],
];

function doPost(e) {
  if (!e || !e.parameter || e.parameter.key !== SECRET) return reply({ ok: false, error: "wrong key" });
  let leads;
  try {
    leads = JSON.parse(e.postData.contents).leads || [];
  } catch (err) {
    return reply({ ok: false, error: "bad JSON" });
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS.map((c) => c[0]));
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
    }
    const last = sheet.getLastRow();
    const known = new Set(last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues().map((r) => String(r[0])) : []);
    const rows = leads.filter((l) => l && !known.has(String(l.id))).map((l) => COLUMNS.map((c) => (c[1](l) ?? "")));
    if (rows.length) sheet.getRange(last + 1, 1, rows.length, COLUMNS.length).setValues(rows);
    return reply({ ok: true, added: rows.length, skipped: leads.length - rows.length });
  } finally {
    lock.releaseLock();
  }
}

/** Opening the web app URL in a browser just confirms it is running. */
function doGet() {
  return reply({ ok: true, message: "Lead sheet webhook is running. The website POSTs leads here." });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
