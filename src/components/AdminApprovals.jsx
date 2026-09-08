import { useState } from 'react'
import { api } from '../api'
import { fmtDate, typeLabel } from '../utils'

export default function AdminApprovals({ leaves, user, onChanged, onError }) {
  const [busyId, setBusyId] = useState(null)
  const [noteDraftId, setNoteDraftId] = useState(null)
  const [noteText, setNoteText] = useState('')
  const pending = leaves
    .filter((l) => l.approvalStatus === 'PendingApproval')
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

  async function act(fn, id, ...args) {
    setBusyId(id)
    try {
      await fn(id, user.email, ...args)
      onChanged('Decision recorded and the team notified.')
    } catch (e) {
      onError(e.message)
    } finally {
      setBusyId(null)
      setNoteDraftId(null)
      setNoteText('')
    }
  }

  function startReject(id) {
    setNoteDraftId(id)
    setNoteText('')
  }

  if (pending.length === 0) {
    return <div className="panel"><div className="empty-state">Nothing waiting on you right now.</div></div>
  }

  return (
    <div className="panel">
      <table className="leave-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Dates</th>
            <th>Type</th>
            <th>Proxy (confirmed)</th>
            <th>Reason</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pending.map((l) => (
            <tr key={l.id}>
              <td>{l.employeeName}</td>
              <td className="dates">{fmtDate(l.startDate)} – {fmtDate(l.endDate)}</td>
              <td>{typeLabel(l)}</td>
              <td>{l.proxyName}</td>
              <td className="muted">{l.reason || '—'}</td>
              <td>
                {noteDraftId === l.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                    <input
                      type="text"
                      placeholder="Reason for rejecting (optional)"
                      value={noteText}
                      autoFocus
                      onChange={(e) => setNoteText(e.target.value)}
                      style={{ fontSize: 13, padding: '6px 9px' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={busyId === l.id}
                        onClick={() => act(api.rejectLeave, l.id, noteText.trim())}
                      >
                        Confirm reject
                      </button>
                      <button
                        className="btn btn-sm"
                        disabled={busyId === l.id}
                        onClick={() => { setNoteDraftId(null); setNoteText('') }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-approve btn-sm"
                      disabled={busyId === l.id}
                      onClick={() => act(api.approveLeave, l.id)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={busyId === l.id}
                      onClick={() => startReject(l.id)}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
