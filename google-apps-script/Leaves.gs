function listEmployees() {
  const employees = sheetToObjects('Employees');
  const leaves = sheetToObjects('LeaveRequests');
  const thisYear = new Date().getFullYear();

  return employees.map((d) => {
    const daysUsed = leaves
      .filter((l) => l.EmployeeEmail === d.Email && l.ApprovalStatus === 'Approved')
      .filter((l) => new Date(l.StartDate).getFullYear() === thisYear)
      .reduce((sum, l) => sum + chargeableDays(l.StartDate, l.EndDate, isHalfDay(l.HalfDay)), 0);

    return {
      email: d.Email,
      name: d.Name,
      role: d.Role || 'employee',
      title: d.Title || '',
      leaveBalance: d.LeaveBalance === '' ? null : Number(d.LeaveBalance),
      daysUsed,
      initials: initials(d.Name),
    };
  });
}

function listLeaves() {
  return sheetToObjects('LeaveRequests').map(rowToLeave).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function isHalfDay(v) {
  return v === true || v === 'TRUE' || v === 'true';
}

function rowToLeave(r) {
  return {
    id: r.ID,
    employeeEmail: r.EmployeeEmail,
    employeeName: r.EmployeeName,
    startDate: r.StartDate,
    endDate: r.EndDate,
    leaveType: r.LeaveType,
    halfDay: isHalfDay(r.HalfDay),
    reason: r.Reason,
    proxyEmail: r.ProxyEmail,
    proxyName: r.ProxyName,
    proxyStatus: r.ProxyStatus,
    approvalStatus: r.ApprovalStatus,
    createdAt: r.CreatedAt,
    updatedAt: r.UpdatedAt,
    approvedBy: r.ApprovedBy,
    approvedAt: r.ApprovedAt,
    rejectNote: r.RejectNote,
  };
}

function datesOverlap(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) <= new Date(bEnd) && new Date(bStart) <= new Date(aEnd);
}

function handleCreateLeave(body) {
  const { employeeEmail, employeeName, startDate, leaveType, reason, proxyEmail, proxyName } = body;
  const halfDay = !!body.halfDay;
  const endDate = halfDay ? startDate : body.endDate;
  if (!employeeEmail || !startDate || !endDate || !proxyEmail) throw new Error('Missing required fields');
  if (proxyEmail === employeeEmail) throw new Error('You can’t be your own proxy');

  const id = newId('LV');
  const token = Utilities.getUuid();
  const now = nowIso();

  appendObject('LeaveRequests', {
    ID: id,
    EmployeeEmail: employeeEmail,
    EmployeeName: employeeName,
    StartDate: startDate,
    EndDate: endDate,
    LeaveType: leaveType,
    HalfDay: halfDay,
    Reason: reason || '',
    ProxyEmail: proxyEmail,
    ProxyName: proxyName,
    ProxyStatus: 'Pending',
    ProxyToken: token,
    ApprovalStatus: 'PendingProxy',
    CreatedAt: now,
    UpdatedAt: now,
    ApprovedBy: '',
    ApprovedAt: '',
    RejectNote: '',
  });

  logAudit(employeeEmail, 'CreateLeave', id, `${startDate} to ${endDate}, proxy=${proxyName}`);

  // Conflict check: other active leaves overlapping these dates
  const conflicts = listLeaves().filter(
    (l) => l.id !== id &&
      l.employeeEmail !== employeeEmail &&
      ['PendingApproval', 'Approved', 'PendingProxy'].includes(l.approvalStatus) &&
      datesOverlap(startDate, endDate, l.startDate, l.endDate)
  );
  if (conflicts.length > 0) {
    notifyConflict({ id, employeeName, startDate, endDate }, conflicts);
  }

  sendProxyRequestEmail({ id, token, employeeName, proxyEmail, proxyName, startDate, endDate, leaveType, halfDay, reason });

  return { id };
}

function handleCancelLeave(body) {
  const { id, actorEmail } = body;
  const leave = findRowById('LeaveRequests', 'ID', id);
  if (!leave) throw new Error('Leave request not found');

  const employee = findRowById('Employees', 'Email', actorEmail);
  const isOwner = leave.EmployeeEmail === actorEmail;
  const isAdmin = employee && employee.Role === 'admin';
  if (!isOwner && !isAdmin) throw new Error('Not authorized to cancel this request');

  updateRowById('LeaveRequests', 'ID', id, { ApprovalStatus: 'Cancelled', UpdatedAt: nowIso() });
  logAudit(actorEmail, 'CancelLeave', id, '');

  sendPlainEmail(
    [leave.EmployeeEmail, leave.ProxyEmail, ...adminEmails()],
    `Leave cancelled: ${leave.EmployeeName} (${fmtDate(leave.StartDate)} – ${fmtDate(leave.EndDate)})`,
    `${leave.EmployeeName}'s leave request for ${fmtDate(leave.StartDate)} to ${fmtDate(leave.EndDate)} has been cancelled. ` +
    `${leave.ProxyName} is no longer needed as proxy for these dates.`
  );

  return { id };
}

function handleApproveLeave(body) {
  const { id, actorEmail } = body;
  assertAdmin(actorEmail);
  const leave = findRowById('LeaveRequests', 'ID', id);
  if (!leave) throw new Error('Leave request not found');
  if (leave.ProxyStatus !== 'Accepted') throw new Error('Proxy hasn’t confirmed yet');

  updateRowById('LeaveRequests', 'ID', id, {
    ApprovalStatus: 'Approved', ApprovedBy: actorEmail, ApprovedAt: nowIso(), UpdatedAt: nowIso(),
  });
  logAudit(actorEmail, 'ApproveLeave', id, '');

  sendPlainEmail(
    [leave.EmployeeEmail, leave.ProxyEmail],
    `Leave approved: ${fmtDate(leave.StartDate)} – ${fmtDate(leave.EndDate)}`,
    `${leave.EmployeeName}'s leave for ${fmtDate(leave.StartDate)} to ${fmtDate(leave.EndDate)} has been approved.\n` +
    `${leave.ProxyName} will be covering ${leave.EmployeeName}'s responsibilities during this time.`
  );

  return { id };
}

function handleRejectLeave(body) {
  const { id, actorEmail, note } = body;
  assertAdmin(actorEmail);
  const leave = findRowById('LeaveRequests', 'ID', id);
  if (!leave) throw new Error('Leave request not found');

  updateRowById('LeaveRequests', 'ID', id, {
    ApprovalStatus: 'Rejected', RejectNote: note || '', UpdatedAt: nowIso(),
  });
  logAudit(actorEmail, 'RejectLeave', id, note || '');

  sendPlainEmail(
    [leave.EmployeeEmail],
    `Leave request not approved: ${fmtDate(leave.StartDate)} – ${fmtDate(leave.EndDate)}`,
    `Your leave request for ${fmtDate(leave.StartDate)} to ${fmtDate(leave.EndDate)} was not approved.` +
    (note ? `\n\nNote: ${note}` : '')
  );

  return { id };
}

function assertAdmin(email) {
  const d = findRowById('Employees', 'Email', email);
  if (!d || d.Role !== 'admin') throw new Error('Only a practice admin can perform this action');
}
