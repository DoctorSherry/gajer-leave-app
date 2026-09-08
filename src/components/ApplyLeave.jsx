import { useMemo, useState } from 'react'
import { api } from '../api'
import { overlaps, fmtDate } from '../utils'

const LEAVE_TYPES = ['Planned Leave', 'Sick Leave', 'Emergency Leave']

export default function ApplyLeave({ employees, leaves, holidays, user, onDone, onError }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [halfDay, setHalfDay] = useState(false)
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0])
  const [proxyEmail, setProxyEmail] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const proxyOptions = employees.filter((d) => d.email !== user.email && d.role !== 'admin')

  const conflicts = useMemo(() => {
    if (!startDate || !endDate) return []
    return leaves.filter(
      (l) =>
        l.employeeEmail !== user.email &&
        ['PendingApproval', 'Approved'].includes(l.approvalStatus) &&
        overlaps(startDate, endDate, l.startDate, l.endDate)
    )
  }, [startDate, endDate, leaves, user.email])

  const holidaysInRange = useMemo(() => {
    if (!startDate || !endDate || !holidays) return []
    return holidays.filter((h) => h.date >= startDate && h.date <= endDate)
  }, [startDate, endDate, holidays])

  function onStartChange(v) {
    setStartDate(v)
    if (halfDay) setEndDate(v)
  }

  function onHalfDayChange(checked) {
    setHalfDay(checked)
    if (checked) setEndDate(startDate)
  }

  async function submit(e) {
    e.preventDefault()
    if (!startDate || (!halfDay && !endDate) || !proxyEmail) {
      onError('Please fill in dates and choose a covering colleague.')
      return
    }
    const effectiveEnd = halfDay ? startDate : endDate
    if (new Date(effectiveEnd) < new Date(startDate)) {
      onError('End date can’t be before the start date.')
      return
    }
    setSubmitting(true)
    try {
      const proxy = employees.find((d) => d.email === proxyEmail)
      await api.createLeave({
        employeeEmail: user.email,
        employeeName: user.name,
        startDate,
        endDate: effectiveEnd,
        leaveType,
        halfDay,
        reason,
        proxyEmail,
        proxyName: proxy?.name || '',
      })
      onDone(`Leave request sent — ${proxy?.name} will get an email to confirm as your proxy.`)
      setStartDate(''); setEndDate(''); setHalfDay(false); setProxyEmail(''); setReason('')
    } catch (err) {
      onError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel" style={{ maxWidth: 560 }}>
      <form onSubmit={submit}>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="start">Start date</label>
            <input id="start" type="date" value={startDate} onChange={(e) => onStartChange(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="end">End date</label>
            <input
              id="end"
              type="date"
              value={halfDay ? startDate : endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={halfDay}
              required={!halfDay}
            />
          </div>
        </div>

        <div className="checkbox-row">
          <input
            id="halfDay"
            type="checkbox"
            checked={halfDay}
            onChange={(e) => onHalfDayChange(e.target.checked)}
          />
          <label htmlFor="halfDay" style={{ display: 'inline', marginBottom: 0 }}>Half day (single date only)</label>
        </div>

        <div className="field">
          <label htmlFor="type">Leave type</label>
          <select id="type" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
            {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor="proxy">Covering colleague</label>
          <select id="proxy" value={proxyEmail} onChange={(e) => setProxyEmail(e.target.value)} required>
            <option value="">Select who will cover your responsibilities…</option>
            {proxyOptions.map((d) => (
              <option key={d.email} value={d.email}>{d.name}{d.title ? ` — ${d.title}` : ''}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="reason">Reason (optional, shown only to admins)</label>
          <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional context for the approver" />
        </div>

        {conflicts.length > 0 && (
          <div className="conflict-banner">
            ⚠ {conflicts.map((c) => c.employeeName).join(', ')} already {conflicts.length > 1 ? 'have' : 'has'} leave
            overlapping these dates ({fmtDate(conflicts[0].startDate)}–{fmtDate(conflicts[0].endDate)}). The practice
            admins and the other team member will be notified of the overlap when you submit.
          </div>
        )}

        {holidaysInRange.length > 0 && (
          <div className="holiday-banner">
            {holidaysInRange.map((h) => h.name).join(', ')} {holidaysInRange.length > 1 ? 'fall' : 'falls'} in this
            range — the office is already closed then, so {holidaysInRange.length > 1 ? "those days aren't" : "that day isn't"} charged against your balance.
          </div>
        )}

        <div className="form-actions" style={{ marginTop: 18 }}>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Submit leave request'}
          </button>
        </div>
      </form>
    </div>
  )
}
