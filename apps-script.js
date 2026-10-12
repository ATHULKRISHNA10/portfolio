// ============================================================
// GOOGLE APPS SCRIPT — Credit Card Tracker API
// ============================================================
// Deploy this as a Web App in your Google Sheet:
// 1. Open your Google Sheet
// 2. Extensions → Apps Script
// 3. Paste this code (replace any existing code)
// 4. Click Deploy → New Deployment
// 5. Type: Web App
// 6. Execute as: Me
// 7. Who has access: Anyone
// 8. Click Deploy → Copy the URL
// 9. Paste the URL in your tracker.html
// ============================================================

const SHEET_NAME = 'card statements';
const SPREADSHEET_ID = '1AM7QapKSQx9ICGTdE7Fxy0RXs5gM8LT1oAwYlKig0_A';

// Card columns (D to L = columns 4 to 12)
const CARD_COL_START = 4; // Column D

// Month rows mapping (row numbers in the sheet)
// Adjust these if you add/remove rows above the data
const MONTH_ROWS = {
  'FEBRUARY_2026': 8,
  'MARCH_2026': 9,
  'APRIL_2026': 10,
  'MAY_2026': 11,
  'JUNE_2026': 12,
  'JULY_2026': 13,
  'AUGUST_2026': 14,
  'SEPTEMBER_2026': 15,
  'OCTOBER_2026': 16,
  'NOVEMBER_2026': 17,
  'DECEMBER_2026': 18,
  'JANUARY_2027': 19,
  'FEBRUARY_2027': 20,
  'MARCH_2027': 21,
  'APRIL_2027': 22,
  'MAY_2027': 23,
  'JUNE_2027': 24,
};

// Paid = dark green background, Unpaid = no background
const PAID_COLOR = '#93c47d';
const UNPAID_COLOR = '#d9ead3';
const TEXT_COLOR = '#9900ff';

// Handle CORS preflight
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Handle POST requests
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'togglePaid') {
      return togglePaid(data.month, data.year, data.cardIndex, data.paid);
    }

    if (action === 'updateAmount') {
      return updateAmount(data.month, data.year, data.cardIndex, data.amount);
    }

    // Earnings Bot mirror (token-protected) — see the block at the end of this file
    if (action === 'earningsSync') {
      return earningsSync(data);
    }

    return jsonResponse({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// Handle GET requests (for testing)
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getStatus') {
    return getPaymentStatus();
  }

  return jsonResponse({ success: true, message: 'Card Tracker API is running' });
}

// Toggle paid status (change cell background color)
function togglePaid(month, year, cardIndex, isPaid) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const key = month.toUpperCase() + '_' + year;
  const row = MONTH_ROWS[key];

  if (!row) {
    return jsonResponse({ success: false, error: 'Month not found: ' + key });
  }

  const col = CARD_COL_START + cardIndex;
  const cell = sheet.getRange(row, col);

  if (isPaid) {
    cell.setBackground(PAID_COLOR);
  } else {
    cell.setBackground(UNPAID_COLOR);
  }
  cell.setFontColor(TEXT_COLOR);

  return jsonResponse({
    success: true,
    month: month,
    year: year,
    cardIndex: cardIndex,
    paid: isPaid
  });
}

// Update amount in a cell
function updateAmount(month, year, cardIndex, amount) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const key = month.toUpperCase() + '_' + year;
  const row = MONTH_ROWS[key];

  if (!row) {
    return jsonResponse({ success: false, error: 'Month not found: ' + key });
  }

  const col = CARD_COL_START + cardIndex;
  const cell = sheet.getRange(row, col);
  cell.setValue(amount);
  cell.setFontColor(TEXT_COLOR);
  cell.setFontWeight('normal');

  return jsonResponse({
    success: true,
    month: month,
    year: year,
    cardIndex: cardIndex,
    amount: amount
  });
}

// Get payment status (cell background colors)
function getPaymentStatus() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const status = {};

  for (const [key, row] of Object.entries(MONTH_ROWS)) {
    const range = sheet.getRange(row, CARD_COL_START, 1, 9);
    const bgs = range.getBackgrounds()[0];
    const vals = range.getValues()[0];

    status[key] = bgs.map((bg, i) => ({
      paid: bg === '#93c47d',
      amount: vals[i] || 0
    }));
  }

  return jsonResponse({ success: true, status: status });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ============================================================
// Earnings Bot → "Earnings" tab  (block added to the Card Tracker script)
// ============================================================
// This block lives inside the existing Card Tracker Apps Script
// (LEARNINGS/about_me/apps-script.js), which already serves the sheet as a
// web app. One script can only have one doPost, so the tracker's doPost
// routes action "earningsSync" here; the tracker's own actions are untouched.
//
// Everything is written to ONE tab named "Earnings" (created if missing),
// stacked as sections. The tab is a read-only mirror of the bot's database:
// it is fully rewritten on every sync, so don't type into it.
//
// One-time setup:
//  1. Paste the full apps-script.js (tracker + this block) into the sheet's
//     Apps Script editor, replacing the old code → Save.
//  2. Run `setupEarnings` once (function dropdown → Run). The Execution log
//     prints SHEETS_TOKEN. Copy it.
//  3. Deploy → Manage deployments → ✏️ Edit the existing Web app deployment →
//     Version: "New version" → Deploy. The URL stays the same, so the card
//     tracker keeps working.
//  4. Bot environment (.env, Railway, GitHub secrets):
//       SHEETS_WEBAPP_URL = that same /exec URL
//       SHEETS_TOKEN      = the token from step 2
// ============================================================

const EARNINGS_TAB = 'Earnings';
const EARNINGS_ORDER = ['Summary', 'Positions', 'Watchlist', 'Paper', 'Trades', 'Equity', 'Paper trades'];

function setupEarnings() {
  const props = PropertiesService.getScriptProperties();
  let token = props.getProperty('EARNINGS_TOKEN');
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('EARNINGS_TOKEN', token);
  }
  Logger.log('SHEETS_TOKEN=' + token);
}

function earningsSync(data) {
  const token = PropertiesService.getScriptProperties().getProperty('EARNINGS_TOKEN');
  if (!token || data.token !== token) return jsonResponse({ success: false, ok: false, error: 'unauthorized' });
  if (!data.tables || typeof data.tables !== 'object') return jsonResponse({ success: false, ok: false, error: 'no tables' });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return jsonResponse({ success: false, ok: false, error: 'busy' });
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(EARNINGS_TAB) || ss.insertSheet(EARNINGS_TAB);
    sh.clear();
    const names = EARNINGS_ORDER.filter((n) => data.tables[n])
      .concat(Object.keys(data.tables).filter((n) => EARNINGS_ORDER.indexOf(n) < 0));

    sh.getRange(1, 1).setValue('Earnings Bot — read-only mirror, rewritten on every sync. Synced ' +
      Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm') + ' IST')
      .setFontWeight('bold').setFontSize(12);

    let row = 3, width = 1;
    const counts = {};
    names.forEach((name) => {
      const rows = data.tables[name] || [];
      counts[name] = Math.max(0, rows.length - 1);
      sh.getRange(row, 1).setValue(name).setFontWeight('bold').setFontSize(11).setFontColor('#0A6B49');
      row += 1;
      if (!rows.length) { row += 1; return; }
      const w = Math.max.apply(null, rows.map((r) => r.length));
      width = Math.max(width, w);
      const grid = rows.map((r) => r.concat(Array(w - r.length).fill('')));
      sh.getRange(row, 1, grid.length, w).setValues(grid);
      sh.getRange(row, 1, 1, w).setFontWeight('bold').setBackground('#0A110E').setFontColor('#FFFFFF');
      if (grid.length > 1) {
        rows[0].forEach((h, c) => {
          const col = sh.getRange(row + 1, c + 1, grid.length - 1, 1);
          if (/\$/.test(h)) col.setNumberFormat('$#,##0.00;[Red]-$#,##0.00');
          else if (/%/.test(h)) col.setNumberFormat('0.0;[Red]-0.0');
        });
      }
      row += grid.length + 2;
    });
    sh.autoResizeColumns(1, width);
    return jsonResponse({ success: true, ok: true, tab: EARNINGS_TAB, tabs: counts, url: ss.getUrl() });
  } finally {
    lock.releaseLock();
  }
}
