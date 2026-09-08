const GAS_URL = import.meta.env.VITE_GAS_URL

if (!GAS_URL) {
  // eslint-disable-next-line no-console
  console.warn('VITE_GAS_URL is not set. Add it to your .env / Netlify env vars.')
}

async function get(action, params = {}) {
  const url = new URL(GAS_URL)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { method: 'GET' })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Request failed')
  return data.result
}

async function post(action, body = {}) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    // text/plain avoids a CORS preflight against the Apps Script endpoint
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...body }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Request failed')
  return data.result
}

export const api = {
  login: (idToken) => post('login', { idToken }),
  getEmployees: () => get('getEmployees'),
  getLeaves: () => get('getLeaves'),
  getKpis: () => get('getKpis'),
  getHolidays: () => get('getHolidays'),
  createLeave: (payload) => post('createLeave', payload),
  cancelLeave: (id, actorEmail) => post('cancelLeave', { id, actorEmail }),
  approveLeave: (id, actorEmail) => post('approveLeave', { id, actorEmail }),
  rejectLeave: (id, actorEmail, note) => post('rejectLeave', { id, actorEmail, note }),
}
