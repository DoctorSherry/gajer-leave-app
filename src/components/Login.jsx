import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signInWithCredential, error } = useAuth()
  const btnRef = useRef(null)

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!window.google || !clientId) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: signInWithCredential,
      hd: 'thegajerpractice.com',
    })
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      width: 260,
    })
  }, [signInWithCredential])

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand">
          The Gajer Practice
          <span>LEAVE &amp; COVERAGE ROSTER</span>
        </div>
        <p className="login-hint">
          Sign in with your @thegajerpractice.com Google account to apply
          for leave, assign a proxy, or review approvals.
        </p>
        <div id="google-signin-btn" ref={btnRef} />
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  )
}
