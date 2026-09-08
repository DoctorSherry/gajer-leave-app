import { dateRange } from '../utils'

const DAYS_AHEAD = 14

export default function CoverageTimeline({ leaves, holidays = [] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = dateRange(today, new Date(today.getTime() + (DAYS_AHEAD - 1) * 86400000))

  const active = leaves.filter((l) =>
    ['PendingApproval', 'Approved'].includes(l.approvalStatus) || l.proxyStatus === 'Pending'
  )
  const holidayByDate = new Map(holidays.map((h) => [h.date, h.name]))

  const todayISO = today.toISOString().slice(0, 10)

  return (
    <div className="coverage-timeline">
      <div className="timeline-grid">
        {days.map((day) => {
          const onLeave = active.filter((l) => day >= l.startDate && day <= l.endDate)
          const label = new Date(day).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
          const holidayName = holidayByDate.get(day)
          return (
            <div className="timeline-day" key={day}>
              <div className={`timeline-day-label ${day === todayISO ? 'today' : ''} ${holidayName ? 'holiday' : ''}`}>{label}</div>
              {holidayName && <div className="timeline-holiday-tag">{holidayName}</div>}
              {onLeave.length === 0 && <div className="timeline-empty">—</div>}
              {onLeave.map((l) => (
                <div key={l.id} className={`coverage-chip ${onLeave.length > 1 ? 'conflict' : ''}`}>
                  <span className="name">{l.employeeName.split(' ').slice(-1)[0]}</span>
                  <span className="proxy">
                    {l.approvalStatus === 'Approved' ? '→ ' : '(pending) → '}
                    {l.proxyName ? l.proxyName.split(' ').slice(-1)[0] : '—'}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
