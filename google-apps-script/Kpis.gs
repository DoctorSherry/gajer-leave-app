function computeKpis() {
  const leaves = listLeaves();
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const pendingApprovalCount = leaves.filter((l) => l.approvalStatus === 'PendingApproval').length;
  const pendingProxyCount = leaves.filter((l) => l.approvalStatus === 'PendingProxy' && l.proxyStatus === 'Pending').length;

  const approvedThisMonth = leaves.filter((l) => {
    if (l.approvalStatus !== 'Approved' || !l.approvedAt) return false;
    const d = new Date(l.approvedAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const leaveDaysThisMonth = approvedThisMonth.reduce((sum, l) => sum + chargeableDays(l.startDate, l.endDate, l.halfDay), 0);

  const approvalTimes = leaves
    .filter((l) => l.approvalStatus === 'Approved' && l.approvedAt && l.createdAt)
    .map((l) => (new Date(l.approvedAt) - new Date(l.createdAt)) / 3600000);
  const avgApprovalHours = approvalTimes.length
    ? Math.round((approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length) * 10) / 10
    : null;

  const conflictDays = countConflictDays(leaves);

  const rejectedOrCancelled = leaves.filter((l) => ['Rejected', 'Cancelled'].includes(l.approvalStatus)).length;

  return {
    pendingApprovalCount,
    pendingProxyCount,
    approvedThisMonth: approvedThisMonth.length,
    leaveDaysThisMonth,
    avgApprovalHours,
    conflictDays,
    rejectedOrCancelled,
  };
}

/** Counts distinct calendar days on which 2+ people have overlapping active leave. */
function countConflictDays(leaves) {
  const active = leaves.filter((l) => ['PendingApproval', 'Approved', 'PendingProxy'].includes(l.approvalStatus));
  const dayCounts = {};
  active.forEach((l) => {
    let cur = new Date(l.startDate);
    const end = new Date(l.endDate);
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10);
      dayCounts[key] = (dayCounts[key] || 0) + 1;
      cur = new Date(cur.getTime() + 86400000);
    }
  });
  return Object.values(dayCounts).filter((n) => n >= 2).length;
}
