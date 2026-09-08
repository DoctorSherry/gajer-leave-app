export function fmtDate(d) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function dateRange(start, end) {
  const out = []
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    out.push(new Date(cur).toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

export function statusMeta(leave) {
  switch (leave.approvalStatus) {
    case 'Cancelled':
      return { key: 'cancelled', label: 'Cancelled' }
    case 'Rejected':
      return { key: 'rejected', label: 'Rejected' }
    case 'Approved':
      return { key: 'approved', label: 'Approved' }
    case 'PendingApproval':
      return { key: 'pending-approval', label: 'Awaiting approval' }
    default:
      if (leave.proxyStatus === 'Declined') return { key: 'declined', label: 'Proxy declined' }
      return { key: 'pending-proxy', label: 'Awaiting proxy' }
  }
}

export function initialsOf(name = '') {
  const parts = name.replace(/\(.*?\)/g, '').trim().split(' ').filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) <= new Date(bEnd) && new Date(bStart) <= new Date(aEnd)
}

// Leave days actually charged against a balance: a half-day request is
// always 0.5; a full-day request counts every day in range except
// mandatory practice holidays (office is already closed, so it isn't
// "spent" leave). `holidays` is the array returned by api.getHolidays().
export function chargeableDays(start, end, halfDay, holidays = []) {
  if (halfDay) return 0.5
  const holidaySet = new Set(holidays.map((h) => h.date))
  let n = 0
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    const key = cur.toISOString().slice(0, 10)
    if (!holidaySet.has(key)) n++
    cur.setDate(cur.getDate() + 1)
  }
  return n
}

export function typeLabel(leave) {
  return leave.leaveType + (leave.halfDay ? ' · Half day' : '')
}
