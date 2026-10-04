/**
 * Website email sender (Google Apps Script), running on the business Gmail (realtormanavnarula@gmail.com).
 *
 * The website POSTs { to, subject, html, text, name } to MAIL_WEBHOOK_URL. Used today for employee sign-in details
 * (new account and password reset). Mail goes out from the Gmail account that deploys this script.
 *
 * Setup (signed in as realtormanavnarula@gmail.com):
 *  1. Go to https://script.google.com → New project. Name it "Website mail".
 *  2. Delete the sample code, paste this whole file, replace PASTE-YOUR-KEY-HERE with a long random key, Save.
 *  3. Run → choose "testSetup" → Run, and allow the permissions Google asks for (it sends one test email to you).
 *  4. Deploy → New deployment → gear icon → Web app. Execute as: Me. Who has access: Anyone. Deploy.
 *  5. Copy the Web app URL and add ?key=<your key> to the end. That full URL is MAIL_WEBHOOK_URL in Hostinger.
 *
 * Limits: a free Gmail account can send to about 100 recipients a day through Apps Script; Google Workspace about 1,500.
 * After editing this script, use Deploy → Manage deployments → edit → Version: New version, so the URL keeps working.
 */
const SECRET = "PASTE-YOUR-KEY-HERE";

function doPost(e) {
  if (!e || !e.parameter || e.parameter.key !== SECRET) return reply({ ok: false, error: "wrong key" });
  let m;
  try {
    m = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: "bad JSON" });
  }
  if (!m || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(m.to || ""))) return reply({ ok: false, error: "invalid recipient" });
  if (!m.subject || !(m.html || m.text)) return reply({ ok: false, error: "subject and body are required" });
  if (MailApp.getRemainingDailyQuota() < 1) return reply({ ok: false, error: "Gmail daily sending limit reached; try tomorrow" });
  try {
    MailApp.sendEmail({ to: m.to, subject: String(m.subject).slice(0, 250), body: m.text || "", htmlBody: m.html || undefined, name: m.name || undefined });
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err && err.message || err) });
  }
}

/** Opening the web app URL in a browser just confirms it is running. */
function doGet() {
  return reply({ ok: true, message: "Website mail sender is running.", remainingToday: MailApp.getRemainingDailyQuota() });
}

/** Run once from the editor: grants permissions and sends you a test email. */
function testSetup() {
  const me = Session.getActiveUser().getEmail();
  MailApp.sendEmail({ to: me, subject: "Website mail sender works", body: "The website can now send email from this account." });
  Logger.log("Test email sent to " + me + ". Remaining today: " + MailApp.getRemainingDailyQuota());
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
