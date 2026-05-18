/**
 * Mock PeopleSoft Integration Broker — bound to THIS spreadsheet.
 * Deploy: Deploy → New deployment → Web app → Execute as Me → Anyone can access
 *
 * Node client calls:
 *   GET  ?path=employees&limit=50&offset=0
 *   GET  ?path=employees/count
 *   GET  ?path=employee/100001
 *   POST ?path=employees          (JSON body)
 *   PUT  ?path=employee/100001    (JSON body)
 *   DELETE ?path=employee/100001
 */

const HEADERS = [
  "emplid", "effdt", "effseq", "name", "email",
  "department", "position", "salary", "manager_emplid",
];

function doGet(e) {
  const path = (e.parameter.path || "employees").replace(/^\//, "");
  if (path === "employees/count") {
    return json({ status: "success", total: countEmployees() });
  }
  if (path === "employees") {
    const limit = parseInt(e.parameter.limit || "50", 10);
    const offset = parseInt(e.parameter.offset || "0", 10);
    const rows = listEmployees(limit, offset);
    return json({
      status: "success",
      rowCount: rows.length,
      total: countEmployees(),
      offset: offset,
      rows: rows,
    });
  }
  const match = path.match(/^employee\/(.+)$/);
  if (match) {
    const row = getEmployee(match[1]);
    if (!row) return json({ error: "Not found" }, 404);
    return json(row);
  }
  return json({ error: "Unknown path", path: path }, 404);
}

function doPost(e) {
  const path = (e.parameter.path || "employees").replace(/^\//, "");
  const method = (e.parameter._method || "POST").toUpperCase();
  const body = JSON.parse(e.postData.contents || "{}");

  if (method === "PUT") {
    const match = path.match(/^employee\/(.+)$/);
    if (!match) return json({ error: "PUT path" }, 404);
    const row = updateEmployee(match[1], body);
    if (!row) return json({ error: "Not found" }, 404);
    return json(row);
  }

  if (method === "DELETE") {
    const match = path.match(/^employee\/(.+)$/);
    if (!match) return json({ error: "DELETE path" }, 404);
    const ok = deleteEmployee(match[1]);
    return json({ status: "success", deleted: ok });
  }

  if (path === "employees") {
    const row = createEmployee(body);
    return json(row);
  }
  return json({ error: "POST not supported for path" }, 404);
}

function doPut(e) {
  const path = (e.parameter.path || "").replace(/^\//, "");
  const match = path.match(/^employee\/(.+)$/);
  if (!match) return json({ error: "PUT path" }, 404);
  const body = JSON.parse(e.postData.contents || "{}");
  const row = updateEmployee(match[1], body);
  if (!row) return json({ error: "Not found" }, 404);
  return json(row);
}

function doDelete(e) {
  const path = (e.parameter.path || "").replace(/^\//, "");
  const match = path.match(/^employee\/(.+)$/);
  if (!match) return json({ error: "DELETE path" }, 404);
  const ok = deleteEmployee(match[1]);
  return json({ status: "success", deleted: ok });
}

function json(obj, code) {
  code = code || 200;
  return ContentService.createTextOutput(JSON.stringify(obj, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

function readAllRows() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(function (h) { return String(h).trim().toLowerCase(); });
  const rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = data[i][c];
    }
    if (obj.emplid) rows.push(obj);
  }
  return rows;
}

function toPsRow(obj) {
  return {
    EMPLID: String(obj.emplid),
    NAME: String(obj.name || ""),
    EMAIL_ADDR: obj.email ? String(obj.email) : "",
    DEPTID: obj.department ? String(obj.department) : "",
    MANAGER_ID: obj.manager_emplid ? String(obj.manager_emplid) : "",
    EFFDT: String(obj.effdt || ""),
    POSITION: String(obj.position || ""),
  };
}

function countEmployees() {
  var emplids = {};
  readAllRows().forEach(function (r) { emplids[r.emplid] = true; });
  return Object.keys(emplids).length;
}

function listEmployees(limit, offset) {
  var all = readAllRows();
  var byEmplid = {};
  all.forEach(function (r) {
    var id = String(r.emplid);
    if (!byEmplid[id]) byEmplid[id] = r;
  });
  var list = Object.keys(byEmplid).sort().map(function (id) { return toPsRow(byEmplid[id]); });
  return list.slice(offset, offset + limit);
}

function getEmployee(emplid) {
  var rows = readAllRows().filter(function (r) { return String(r.emplid) === String(emplid); });
  if (!rows.length) return null;
  return toPsRow(rows[rows.length - 1]);
}

function createEmployee(body) {
  var sheet = getSheet();
  sheet.appendRow([
    body.emplid || nextEmplid(),
    body.effdt || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    0,
    body.name || body.NAME || "",
    body.email || body.EMAIL_ADDR || "",
    body.department || body.DEPTID || "",
    body.position || body.POSITION || "Employee",
    body.salary || 0,
    body.managerEmplid || body.MANAGER_ID || "",
  ]);
  return getEmployee(body.emplid || sheet.getRange(sheet.getLastRow(), 1).getValue());
}

function updateEmployee(emplid, body) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === String(emplid)) {
      if (body.name != null) sheet.getRange(i + 1, 4).setValue(body.name);
      if (body.email != null) sheet.getRange(i + 1, 5).setValue(body.email);
      if (body.department != null) sheet.getRange(i + 1, 6).setValue(body.department);
      if (body.position != null) sheet.getRange(i + 1, 7).setValue(body.position);
      if (body.salary != null) sheet.getRange(i + 1, 8).setValue(body.salary);
      if (body.managerEmplid != null) sheet.getRange(i + 1, 9).setValue(body.managerEmplid);
      return getEmployee(emplid);
    }
  }
  return null;
}

function deleteEmployee(emplid) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === String(emplid)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function nextEmplid() {
  var max = 100000;
  readAllRows().forEach(function (r) {
    var n = parseInt(r.emplid, 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return String(max + 1);
}
