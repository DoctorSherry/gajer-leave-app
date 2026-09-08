/**
 * Run setupSheet() ONCE from the Apps Script editor (select it in the
 * function dropdown, click Run) to create the tabs and headers.
 * Then edit the Employees tab in the spreadsheet to confirm your real team
 * (emails especially — see the comment below) and the Holidays tab to
 * confirm this year's dates.
 */
function setupSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();

  createTabIfMissing(book, 'Employees', [
    'Email', 'Name', 'Role', 'Title', 'LeaveBalance',
  ]);
  const leaveHeaders = [
    'ID', 'EmployeeEmail', 'EmployeeName', 'StartDate', 'EndDate', 'LeaveType', 'HalfDay', 'Reason',
    'ProxyEmail', 'ProxyName', 'ProxyStatus', 'ProxyToken',
    'ApprovalStatus', 'CreatedAt', 'UpdatedAt', 'ApprovedBy', 'ApprovedAt', 'RejectNote',
  ];
  createTabIfMissing(book, 'LeaveRequests', leaveHeaders);
  // Force date-ish columns to plain text so Sheets never auto-converts
  // "2026-08-20" into a Date cell (which would break string comparisons
  // on the frontend). Applied to the first 2000 rows.
  const textCols = ['StartDate', 'EndDate', 'CreatedAt', 'UpdatedAt', 'ApprovedAt'];
  const leaveSheet = book.getSheetByName('LeaveRequests');
  textCols.forEach((col) => {
    const idx = leaveHeaders.indexOf(col) + 1;
    leaveSheet.getRange(1, idx, 2000, 1).setNumberFormat('@');
  });
  createTabIfMissing(book, 'AuditLog', [
    'Timestamp', 'Actor', 'Action', 'LeaveID', 'Details',
  ]);
  createTabIfMissing(book, 'Holidays', ['Date', 'Name']);
  const holidaySheet = book.getSheetByName('Holidays');
  holidaySheet.getRange(1, 1, 2000, 1).setNumberFormat('@'); // Date column as text, same reason as above

  const employeesSheet = book.getSheetByName('Employees');
  if (employeesSheet.getLastRow() < 2) {
    // Seeded from the roster you shared. IMPORTANT: every email below
    // except drgajer@ and patrick@ is a GUESS (firstname@thegajerpractice.com)
    // — nobody's real address was given for the rest of the team, and Google
    // Sign-In needs the exact real address to work. Double-check all of
    // these before deploying, especially:
    //   - Giuliani Gaitan vs Gianni Gaitan (giuliani@ / gianni@ — easy to
    //     mix up, confirm which is which)
    //   - Rachel (Vy) Nguyen — guessed as rachel@, but she may prefer vy@
    //   - "email@thegajerpractice.com" (second admin row) isn't a guess,
    //     it's a deliberate placeholder — swap in the real operations
    //     manager's name and address
    // LeaveBalance is left blank for everyone — set each person's real
    // number here once you have it (see PROJECTHANDOFF.md).
    // Two admins: Dr. Gajer, plus a second admin row below for whoever
    // manages operations. That second row uses a PLACEHOLDER email/name
    // ("email@thegajerpractice.com" / "Operations Manager") — replace
    // both with the real person's actual name and address before you
    // deploy, same as any other row here. Both admins approve/reject
    // leave and see the Approvals tab; neither applies for their own
    // leave through this app — it's for the rest of the team. Add more
    // admin rows the same way if that ever changes.
    employeesSheet.appendRow(['drgajer@thegajerpractice.com', 'Dr. Gajer', 'admin', 'CEO & Medical Director', '']);
    employeesSheet.appendRow(['email@thegajerpractice.com', 'Operations Manager', 'admin', 'Operations Manager', '']); // PLACEHOLDER — replace with real name/email
    employeesSheet.appendRow(['patrick@thegajerpractice.com', 'Patrick Gauthier', 'employee', 'Director of Operations & Clinical Supervisor, Medical & Hormones', '']);
    employeesSheet.appendRow(['michael@thegajerpractice.com', 'Michael Sampson', 'employee', 'Director of Patient Services & Clinical Supervisor, Weight Loss & Liposuction', '']);
    employeesSheet.appendRow(['tamar@thegajerpractice.com', 'Tamar Ann Dayian', 'employee', 'Nurse Practitioner', '']);
    employeesSheet.appendRow(['ruth@thegajerpractice.com', 'Ruth Vergara', 'employee', 'Medical Assistant & Health Counselor', '']);
    employeesSheet.appendRow(['giuliani@thegajerpractice.com', 'Giuliani Gaitan', 'employee', 'Medical Assistant & Health Counselor', '']);
    employeesSheet.appendRow(['troy@thegajerpractice.com', 'Troy Clark', 'employee', 'Medical Assistant & Health Counselor', '']);
    employeesSheet.appendRow(['kelly@thegajerpractice.com', 'Kelly Maley', 'employee', 'Patient Service Representative', '']);
    employeesSheet.appendRow(['rachel@thegajerpractice.com', 'Rachel (Vy) Nguyen', 'employee', 'Patient Service Representative', '']);
    employeesSheet.appendRow(['gianni@thegajerpractice.com', 'Gianni Gaitan', 'employee', 'Patient Service Representative', '']);
  }

  if (holidaySheet.getLastRow() < 2) {
    // 2026 dates for the six mandatory holidays — New Year's Day and
    // Independence Day and Christmas Day are fixed calendar dates every
    // year; Memorial Day, Labor Day, and Thanksgiving Day float and were
    // computed for 2026 specifically. Update this tab each new year.
    holidaySheet.appendRow(["2026-01-01", "New Year's Day"]);
    holidaySheet.appendRow(['2026-05-25', 'Memorial Day']);
    holidaySheet.appendRow(['2026-07-04', 'Independence Day']);
    holidaySheet.appendRow(['2026-09-07', 'Labor Day']);
    holidaySheet.appendRow(['2026-11-26', 'Thanksgiving Day']);
    holidaySheet.appendRow(['2026-12-25', 'Christmas Day']);
  }

  SpreadsheetApp.getUi().alert('Setup complete. Check the Employees tab (especially emails) and the Holidays tab.');
}

function createTabIfMissing(book, name, headers) {
  let s = book.getSheetByName(name);
  if (!s) s = book.insertSheet(name);
  if (s.getLastRow() === 0) {
    s.appendRow(headers);
    s.setFrozenRows(1);
    s.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
}
