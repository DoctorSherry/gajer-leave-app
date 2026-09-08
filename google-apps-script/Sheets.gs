function ss() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sheet(name) {
  const s = ss().getSheetByName(name);
  if (!s) throw new Error('Missing sheet tab: ' + name);
  return s;
}

/** Reads a sheet into an array of plain objects keyed by header row. */
function sheetToObjects(name) {
  const s = sheet(name);
  const values = s.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1)
    .filter((row) => row.some((c) => c !== '' && c !== null))
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
}

/** Appends a plain object as a new row, matching the sheet's header order. */
function appendObject(name, obj) {
  const s = sheet(name);
  const headers = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
  const row = headers.map((h) => (obj[h] !== undefined ? obj[h] : ''));
  s.appendRow(row);
}

/** Updates the row whose `idField` matches `idValue` with the fields in `patch`. */
function updateRowById(name, idField, idValue, patch) {
  const s = sheet(name);
  const values = s.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf(idField);
  if (idCol === -1) throw new Error('No ' + idField + ' column in ' + name);

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) === String(idValue)) {
      Object.keys(patch).forEach((key) => {
        const col = headers.indexOf(key);
        if (col !== -1) s.getRange(r + 1, col + 1).setValue(patch[key]);
      });
      return true;
    }
  }
  throw new Error(idField + ' not found: ' + idValue);
}

function findRowById(name, idField, idValue) {
  return sheetToObjects(name).find((o) => String(o[idField]) === String(idValue));
}

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix) {
  return prefix + '_' + Utilities.getUuid().slice(0, 8);
}

function logAudit(actorEmail, action, leaveId, details) {
  appendObject('AuditLog', {
    Timestamp: nowIso(),
    Actor: actorEmail,
    Action: action,
    LeaveID: leaveId,
    Details: details || '',
  });
}
