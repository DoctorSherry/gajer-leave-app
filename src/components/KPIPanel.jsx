export default function KPIPanel({ kpis }) {
  if (!kpis) return null

  const cards = [
    { label: 'Pending approval', value: kpis.pendingApprovalCount, sub: 'awaiting an admin' },
    { label: 'Awaiting proxy response', value: kpis.pendingProxyCount, sub: 'proxy hasn\u2019t confirmed' },
    { label: 'Approved — this month', value: kpis.approvedThisMonth, sub: `${kpis.leaveDaysThisMonth} leave-days total` },
    { label: 'Avg. approval time', value: kpis.avgApprovalHours != null ? `${kpis.avgApprovalHours}h` : '—', sub: 'request → decision' },
    { label: 'Overlapping leave days', value: kpis.conflictDays, sub: 'days with 2+ people out' },
    { label: 'Rejected / cancelled', value: kpis.rejectedOrCancelled, sub: 'all time' },
  ]

  return (
    <div className="grid-3">
      {cards.map((c) => (
        <div className="kpi-card" key={c.label}>
          <div className="kpi-value">{c.value ?? 0}</div>
          <div className="kpi-label">{c.label}</div>
          <div className="kpi-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
