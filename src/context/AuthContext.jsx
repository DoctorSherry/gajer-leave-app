import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)
const STORAGE_KEY = 'gajer-leave-session'
const ALLOWED_DOMAIN = 'thegajerpractice.com'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const signInWithCredential = useCallback(async (credentialResponse) => {
    setError('')
    const idToken = credentialResponse.credential
    // quick client-side domain check for a fast UI response;
    // the Apps Script backend re-verifies the token server-side.
    const payload = JSON.parse(atob(idToken.split('.')[1]))
    if (payload.hd !== ALLOWED_DOMAIN && !payload.email?.endsWith('@' + ALLOWED_DOMAIN)) {
      setError(`Please sign in with your @${ALLOWED_DOMAIN} account.`)
      return
    }
    try {
      const employee = await api.login(idToken)
      setUser(employee)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employee))
    } catch (e) {
      setError(e.message || 'Sign-in failed.')
    }
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithCredential, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
