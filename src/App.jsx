import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { api } from './api'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import ApplyLeave from './components/ApplyLeave'
import LeaveList from './components/LeaveList'
import AdminApprovals from './components/AdminApprovals'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'apply', label: 'Apply for leave' },
  { id: 'all', label: 'All leave requests' },
]

export default function App() {
  const { user, loading, signOut } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [employees, setEmployees] = useState([])
  const [leaves, setLeaves] = useState([])
  const [kpis, setKpis] = useState(null)
  const [holidays, setHolidays] = useState([])
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  const refresh = useCallback(async () => {
    setBusy(true)
    try {
      const [e, l, k, h] = await Promise.all([
        api.getEmployees(),
        api.getLeaves(),
        api.getKpis(),
        api.getHolidays(),
      ])
      setEmployees(e)
      setLeaves(l)
      setKpis(k)
      setHolidays(h)
    } catch (e) {
      setToast({ type: 'error', text: e.message })
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    if (user) refresh()
  }, [user, refresh])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  if (loading) return null
  if (!user) return <Login />

  const isAdmin = user.role === 'admin'
  const tabs = isAdmin ? [...TABS, { id: 'approvals', label: 'Approvals' }] : TABS

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          The Gajer Practice
          <span>LEAVE &amp; COVERAGE ROSTER</span>
        </div>
        <nav className="nav">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`nav-item ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === 'approvals' && kpis?.pendingApprovalCount > 0 && (
                <> &nbsp;·&nbsp;{kpis.pendingApprovalCount}</>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          Signed in as {user.name}
          <br />
          <button onClick={signOut}>Sign out</button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1 className="page-title">{tabs.find((t) => t.id === tab)?.label}</h1>
            <p className="page-subtitle">
              {tab === 'dashboard' && 'Who is out, who is covering, and what needs your attention.'}
              {tab === 'apply' && 'Pick your dates and a covering colleague — they will get an email to confirm.'}
              {tab === 'all' && 'Every leave request across the practice.'}
              {tab === 'approvals' && 'Final sign-off on proxy-confirmed leave requests.'}
            </p>
          </div>
          <div className="who">
            <span className="avatar">{user.initials}</span>
            {busy && <span className="spinner-line">syncing…</span>}
          </div>
        </div>

        {tab === 'dashboard' && (
          <Dashboard employees={employees} leaves={leaves} kpis={kpis} holidays={holidays} />
        )}
        {tab === 'apply' && (
          <ApplyLeave
            employees={employees}
            leaves={leaves}
            holidays={holidays}
            user={user}
            onDone={(msg) => { setToast({ type: 'ok', text: msg }); refresh() }}
            onError={(msg) => setToast({ type: 'error', text: msg })}
          />
        )}
        {tab === 'all' && (
          <LeaveList
            leaves={leaves}
            user={user}
            onChanged={(msg) => { setToast({ type: 'ok', text: msg }); refresh() }}
            onError={(msg) => setToast({ type: 'error', text: msg })}
          />
        )}
        {tab === 'approvals' && isAdmin && (
          <AdminApprovals
            leaves={leaves}
            user={user}
            onChanged={(msg) => { setToast({ type: 'ok', text: msg }); refresh() }}
            onError={(msg) => setToast({ type: 'error', text: msg })}
          />
        )}
      </main>

      {toast && <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>{toast.text}</div>}
    </div>
  )
}
