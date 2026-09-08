/**
 * The Gajer Practice — Leave & Coverage Roster
 * Google Apps Script backend. Bound to a Google Sheet with tabs:
 * Employees, LeaveRequests, AuditLog, Holidays  (see Setup.gs -> setupSheet())
 *
 * Deploy: Extensions > Apps Script > Deploy > New deployment > Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Copy the /exec URL into the frontend's VITE_GAS_URL.
 */

const ALLOWED_DOMAIN = 'thegajerpractice.com';
const APP_URL = 'https://gajer-leave-app.netlify.app'; // <-- set after first Netlify deploy
// No shared default leave balance — each person's LeaveBalance is set
// individually in the Employees sheet (see Setup.gs / README).
// There's no single ADMIN_EMAIL constant — admins are whoever has Role
// "admin" in the Employees sheet (currently Dr. Gajer and the operations
// manager — see the placeholder row in Setup.gs), and all of them get
// approval/notification emails. See adminEmails() in Auth.gs. Add or
// remove admins by editing that column, no code change.

function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === 'proxyRespond') return handleProxyRespondLink(e);
    if (action === 'getEmployees') return jsonOut(ok(listEmployees()));
    if (action === 'getLeaves') return jsonOut(ok(listLeaves()));
    if (action === 'getKpis') return jsonOut(ok(computeKpis()));
    if (action === 'getHolidays') return jsonOut(ok(listHolidays()));
    return jsonOut(fail('Unknown action'));
  } catch (err) {
    return jsonOut(fail(err.message));
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    switch (action) {
      case 'login': return jsonOut(ok(handleLogin(body.idToken)));
      case 'createLeave': return jsonOut(ok(handleCreateLeave(body)));
      case 'cancelLeave': return jsonOut(ok(handleCancelLeave(body)));
      case 'approveLeave': return jsonOut(ok(handleApproveLeave(body)));
      case 'rejectLeave': return jsonOut(ok(handleRejectLeave(body)));
      default: return jsonOut(fail('Unknown action'));
    }
  } catch (err) {
    return jsonOut(fail(err.message));
  }
}

function ok(result) { return { ok: true, result }; }
function fail(error) { return { ok: false, error: String(error) }; }

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
