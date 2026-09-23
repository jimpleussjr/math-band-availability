var SHEET_NAME = "Availability";

function toDate_(iso) {
  var d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function rowValues_(headers, name, submittedAt, availability) {
  var values = new Array(headers.length).fill("");
  values[0] = submittedAt;
  values[1] = name;
  for (var i = 0; i < availability.length; i++) {
    var col = headers.indexOf(availability[i].slotLabel);
    if (col > 1) {
      values[col] = availability[i].category;
    }
  }
  return values;
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (!body.name || !body.availability || body.availability.length === 0) {
      return json_({ ok: false, error: "name and availability are required" });
    }

    var sheet = getSheet_();
    var headers = ["Timestamp", "Name"]
      .concat(body.availability.map(function (a) { return a.slotLabel; }));

    var lastRow = sheet.getLastRow();
    var existing = lastRow > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      : [];
    var missing = headers.filter(function (h) { return existing.indexOf(h) === -1; });
    if (existing.length === 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    } else if (missing.length > 0) {
      sheet.getRange(1, sheet.getLastColumn() + 1, 1, missing.length)
        .setValues([missing]);
    }

    var headersNow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nameCol = headersNow.indexOf("Name") + 1;

    var nameRows = sheet.getRange(2, nameCol, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
    var rowIndex = -1;
    for (var r = 0; r < nameRows.length; r++) {
      if (String(nameRows[r][0]).trim() === String(body.name).trim()) {
        rowIndex = r + 2;
        break;
      }
    }

    var values = rowValues_(headersNow, String(body.name).trim(), toDate_(body.submittedAt), body.availability);

    if (rowIndex === -1) {
      sheet.appendRow(values);
    } else {
      sheet.getRange(rowIndex, 1, 1, headersNow.length).setValues([values]);
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  var sheet = getSheet_();
  var data = sheet.getLastRow() > 0 ? sheet.getDataRange().getValues() : [["Timestamp", "Name"]];
  return json_({ ok: true, rows: data });
}