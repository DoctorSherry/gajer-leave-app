function scriptWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

function sendPlainEmail(recipients, subject, body) {
  const to = recipients.filter(Boolean).join(',');
  if (!to) return;
  MailApp.sendEmail({ to, subject: '[Gajer Practice Leave] ' + subject, body });
}

function sendProxyRequestEmail({ id, token, employeeName, proxyEmail, proxyName, startDate, endDate, leaveType, halfDay, reason }) {
  const base = scriptWebAppUrl();
  const acceptUrl = `${base}?action=proxyRespond&id=${id}&token=${token}&response=accept`;
  const declineUrl = `${base}?action=proxyRespond&id=${id}&token=${token}&response=decline`;
  const when = halfDay ? `${fmtDate(startDate)} (half day)` : `${fmtDate(startDate)} – ${fmtDate(endDate)}`;

  const subject = `Proxy request: cover for ${employeeName}, ${when}`;
  const body =
`Hi ${proxyName},

${employeeName} has requested leave for ${when} (${leaveType}) and has ` +
`named you as the colleague who will cover their responsibilities during this time.

Please confirm whether you're able to cover:

Accept: ${acceptUrl}
Decline: ${declineUrl}

${reason ? 'Note from ' + employeeName + ': ' + reason + '\n\n' : ''}This request still needs final approval from a practice admin after you respond.

— The Gajer Practice Leave Roster`;

  sendPlainEmail([proxyEmail], subject, body);
}

function notifyConflict(newLeave, conflicts) {
  const names = conflicts.map((c) => `${c.employeeName} (${fmtDate(c.startDate)}–${fmtDate(c.endDate)})`).join(', ');
  const recipients = [...adminEmails(), ...conflicts.map((c) => c.employeeEmail)];
  sendPlainEmail(
    recipients,
    `Overlapping leave: ${newLeave.employeeName}, ${fmtDate(newLeave.startDate)}–${fmtDate(newLeave.endDate)}`,
    `${newLeave.employeeName} just requested leave for ${fmtDate(newLeave.startDate)} to ${fmtDate(newLeave.endDate)}, ` +
    `which overlaps with existing leave for: ${names}.\n\n` +
    `Flagging so staffing can be double-checked before this is approved.`
  );
}

/** Handles the Accept/Decline links clicked from the proxy request email. */
function handleProxyRespondLink(e) {
  const { id, token, response } = e.parameter;
  const leave = findRowById('LeaveRequests', 'ID', id);

  if (!leave || leave.ProxyToken !== token) {
    return htmlOut('This link is invalid or has expired.');
  }
  if (leave.ProxyStatus !== 'Pending') {
    return htmlOut(`This request was already marked "${leave.ProxyStatus}". No changes made.`);
  }

  if (response === 'accept') {
    updateRowById('LeaveRequests', 'ID', id, {
      ProxyStatus: 'Accepted', ApprovalStatus: 'PendingApproval', UpdatedAt: nowIso(),
    });
    logAudit(leave.ProxyEmail, 'ProxyAccept', id, '');
    sendPlainEmail(
      adminEmails(),
      `Ready for approval: ${leave.EmployeeName}, ${fmtDate(leave.StartDate)}–${fmtDate(leave.EndDate)}`,
      `${leave.ProxyName} accepted the proxy request for ${leave.EmployeeName}'s leave ` +
      `(${fmtDate(leave.StartDate)} to ${fmtDate(leave.EndDate)}). It now needs approval in the app.`
    );
    sendPlainEmail(
      [leave.EmployeeEmail],
      `${leave.ProxyName} accepted your proxy request`,
      `${leave.ProxyName} has agreed to cover for you from ${fmtDate(leave.StartDate)} to ${fmtDate(leave.EndDate)}. ` +
      `Your request has been sent for final approval.`
    );
    return htmlOut(`Thanks — you're confirmed as proxy for ${leave.EmployeeName} (${fmtDate(leave.StartDate)} to ${fmtDate(leave.EndDate)}). A practice admin has been notified for final approval.`);
  }

  if (response === 'decline') {
    updateRowById('LeaveRequests', 'ID', id, { ProxyStatus: 'Declined', UpdatedAt: nowIso() });
    logAudit(leave.ProxyEmail, 'ProxyDecline', id, '');
    sendPlainEmail(
      [leave.EmployeeEmail, ...adminEmails()],
      `${leave.ProxyName} declined your proxy request`,
      `${leave.ProxyName} isn't able to cover for you on ${fmtDate(leave.StartDate)} to ${fmtDate(leave.EndDate)}. ` +
      `Please open the app and submit a new request with a different proxy.`
    );
    return htmlOut(`Got it — you've declined this proxy request. ${leave.EmployeeName} and the practice admins have been notified.`);
  }

  return htmlOut('Unrecognized response.');
}

function htmlOut(message) {
  const html = `<!doctype html><html><head><meta charset="utf-8">
    <title>The Gajer Practice</title>
    <style>body{font-family:-apple-system,Arial,sans-serif;max-width:480px;margin:80px auto;padding:0 20px;color:#1B2A28;line-height:1.5}</style>
    </head><body><h2>The Gajer Practice</h2><p>${message}</p></body></html>`;
  return HtmlService.createHtmlOutput(html);
}
