import KPIPanel from './KPIPanel'
import CoverageTimeline from './CoverageTimeline'
import { initialsOf, fmtDate } from '../utils'

export default function Dashboard({ employees, leaves, kpis, holidays }) {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <KPIPanel kpis={kpis} />

      <div className="panel">
        <h2 className="panel-title">Next 14 days — who's out, who's covering</h2>
        <CoverageTimeline leaves={leaves} holidays={holidays} />
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2 className="panel-title">Leave balance by team member</h2>
          <table className="leave-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Days used this year</th>
                <th>Days remaining</th>
              </tr>
            </thead>
            <tbody>
              {employees.filter((d) => d.role !== 'admin' || d.leaveBalance != null).map((d) => (
                <tr key={d.email}>
                  <td>
                    <span className="avatar" style={{ marginRight: 8, width: 24, height: 24, fontSize: 10 }}>
                      {initialsOf(d.name)}
                    </span>
                    {d.name}
                    {d.title && <div className="title-sub">{d.title}</div>}
                  </td>
                  <td className="dates">{d.daysUsed ?? 0}</td>
                  <td className="dates">{d.leaveBalance != null ? d.leaveBalance - (d.daysUsed ?? 0) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h2 className="panel-title">Mandatory practice holidays</h2>
          <ul className="holiday-list">
            {(holidays || []).map((h) => (
              <li key={h.date} className={h.date < today ? 'hpast' : ''}>
                <span>{h.name}</span>
                <span className="hdate">{fmtDate(h.date)}</span>
              </li>
            ))}
            {(!holidays || holidays.length === 0) && <li className="muted">No holidays set up yet.</li>}
          </ul>
          <p className="muted" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
            Office is closed on these dates — they're never charged against anyone's leave balance.
          </p>
        </div>
      </div>
    </div>
  )
}
