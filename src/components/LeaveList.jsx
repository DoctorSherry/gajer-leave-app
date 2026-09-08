import { useState } from 'react'
import { api } from '../api'
import { fmtDate, statusMeta, typeLabel } from '../utils'

export default function LeaveList({ leaves, user, onChanged, onError }) {
  const [busyId, setBusyId] = useState(null)
  const sorted = [...leaves].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  async function cancel(id) {
    setBusyId(id)
    try {
      await api.cancelLeave(id, user.email)
      onChanged('Leave request cancelled.')
    } catch (e) {
      onError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  if (sorted.length === 0) {
    return <div className="panel"><div className="empty-state">No leave requests yet.</div></div>
  }

  return (
    <div className="panel">
      <table className="leave-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Dates</th>
            <th>Type</th>
            <th>Proxy</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((l) => {
            const meta = statusMeta(l)
            const canCancel =
              (l.employeeEmail === user.email || user.role === 'admin') &&
              !['Cancelled', 'Rejected'].includes(l.approvalStatus)
            return (
              <tr key={l.id}>
                <td>{l.employeeName}</td>
                <td className="dates">{fmtDate(l.startDate)} – {fmtDate(l.endDate)}</td>
                <td>{typeLabel(l)}</td>
                <td>
                  {l.proxyName}
                  {l.proxyStatus === 'Declined' && <div className="muted">declined proxy request</div>}
                </td>
                <td><span className={`pill ${meta.key}`}>{meta.label}</span></td>
                <td>
                  {canCancel && (
                    <button className="btn btn-ghost btn-sm" disabled={busyId === l.id} onClick={() => cancel(l.id)}>
                      {busyId === l.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
