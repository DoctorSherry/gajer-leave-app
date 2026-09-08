const GAS_URL = import.meta.env.VITE_GAS_URL

if (!GAS_URL) {
  // eslint-disable-next-line no-console
  console.warn('VITE_GAS_URL is not set. Add it to your .env / Netlify env vars.')
}

// Google's servers occasionally return a transient error (a blip, not a real
// failure) instead of our JSON. Rather than surface a raw parsing error, we
// quietly retry once before giving the user a plain-language message.
const FRIENDLY_RETRY_ERROR = "That didn't go through — the connection to Google had a brief hiccup. Please try again."

async function parseResponse(res) {
  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('__TRANSIENT__')
  }
  if (!data.ok) throw new Error(data.error || 'Request failed')
  return data.result
}

async function withRetry(doRequest) {
  try {
    const res = await doRequest()
    return await parseResponse(res)
  } catch (e) {
    if (e.message !== '__TRANSIENT__') throw e
    // One quiet retry after a short pause, then a friendly message if it still fails.
    await new Promise((r) => setTimeout(r, 800))
    try {
      const res = await doRequest()
      return await parseResponse(res)
    } catch {
      throw new Error(FRIENDLY_RETRY_ERROR)
    }
  }
}

async function get(action, params = {}) {
  const url = new URL(GAS_URL)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return withRetry(() => fetch(url.toString(), { method: 'GET' }))
}

async function post(action, body = {}) {
  return withRetry(() => fetch(GAS_URL, {
    method: 'POST',
    // text/plain avoids a CORS preflight against the Apps Script endpoint
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...body }),
  }))
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
