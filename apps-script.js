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
  sheet.getRange(row, col).setValue(amount);

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
