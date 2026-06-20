/**
 * John & Marlena — RSVP receiver
 * Paste this into Extensions → Apps Script of your Google Sheet,
 * then Deploy → New deployment → Web app (see README).
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('RSVPs') || ss.insertSheet('RSVPs');

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Guest 1', 'Guest 2', 'Guest 3', 'Total Guests']);
    }

    var p = (e && e.parameter) ? e.parameter : {};
    var g1 = (p.guest1 || '').trim();
    var g2 = (p.guest2 || '').trim();
    var g3 = (p.guest3 || '').trim();
    var total = [g1, g2, g3].filter(function (g) { return g; }).length;

    sheet.appendRow([new Date(), g1, g2, g3, total]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the /exec URL in a browser to confirm it's live.
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'RSVP endpoint is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
